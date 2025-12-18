from flask import Blueprint, request, jsonify
from datetime import datetime
from database import get_db_connection
from utils import safe_float

inventory_bp = Blueprint('inventory', __name__)

def apply_auto_consumption(user_id):
    conn = get_db_connection()
    try:
        products = conn.execute("""
            SELECT product_id, current_quantity, usage_freq_qty, usage_freq_days, last_auto_check 
            FROM products WHERE user_id = ? AND is_active = 1
        """, (user_id,)).fetchall()

        now = datetime.now()
        
        for p in products:
            last_check_str = p['last_auto_check']
            if not last_check_str:
                last_check = now
            else:
                try:
                    last_check = datetime.strptime(str(last_check_str).split('.')[0], "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    last_check = now

            delta = now - last_check
            days_passed = delta.days

            if days_passed >= 1:
                if p['usage_freq_days'] > 0:
                    daily_rate = p['usage_freq_qty'] / p['usage_freq_days']
                else:
                    daily_rate = 0

                consumed_amount = daily_rate * days_passed

                if consumed_amount > 0 and p['current_quantity'] > 0:
                    actual_consumption = min(consumed_amount, p['current_quantity'])
                    
                    conn.execute("UPDATE products SET current_quantity = current_quantity - ?, last_auto_check = ? WHERE product_id = ?", 
                                (actual_consumption, now, p['product_id']))

                    conn.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, date('now'))", 
                                (p['product_id'], user_id, actual_consumption))

                    conn.execute("""
                        INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed)
                        VALUES (?, ?, date('now'), ?)
                        ON CONFLICT(product_id, summary_date) DO UPDATE SET total_consumed = total_consumed + excluded.total_consumed
                    """, (p['product_id'], user_id, actual_consumption))

        conn.commit()
    except Exception as e:
        print(f"Auto-consumption error: {e}")
        conn.rollback()
    finally:
        conn.close()

@inventory_bp.route('/products', methods=['GET', 'POST'])
def manage_products():
    conn = get_db_connection()
    
    if request.method == 'GET':
        uid = request.args.get("userId")
        # Call auto-consumption if needed
        # if uid: apply_auto_consumption(uid) 

        try:
            # Fetch products including PRICE
            query = """
                SELECT p.product_id as id, p.item_name as name, p.consumption_unit as unit, p.current_quantity as quantity,
                    p.category, p.usage_freq_qty, p.usage_freq_days, p.price,
                    COALESCE((SELECT AVG(avg_consumption_rate) FROM consumption_summary cs 
                         WHERE cs.product_id = p.product_id AND cs.summary_date >= date('now', '-30 days')), 0) as historical_daily_rate
                FROM products p WHERE p.user_id = ? AND p.is_active = 1 ORDER BY p.updated_at DESC
            """
            rows = conn.execute(query, (uid,)).fetchall()
            
            results = []
            for r in rows:
                d = dict(r)
                # ... (Keep your existing math logic for daily rates) ...
                manual_qty = safe_float(d.get('usage_freq_qty'), 1)
                manual_days = safe_float(d.get('usage_freq_days'), 1)
                manual_daily_rate = manual_qty / manual_days if manual_days > 0 else 0
                historical_rate = safe_float(d.get('historical_daily_rate'), 0)
                
                if manual_days > 1 or manual_qty != 1: effective_rate = manual_daily_rate
                elif historical_rate > 0: effective_rate = historical_rate
                else: effective_rate = manual_daily_rate

                qty = max(0, safe_float(d['quantity']))
                d['quantity'] = qty
                d['days_left'] = round(qty / effective_rate, 1) if effective_rate > 0 else 999
                d['effective_daily_rate'] = effective_rate
                d['price'] = safe_float(d.get('price'), 0) # Ensure price is sent

                results.append(d)

            return jsonify(results)
        finally:
            conn.close()

    if request.method == 'POST':
        d = request.json
        freq_qty = safe_float(d.get('usageQty', 1))
        freq_days = safe_float(d.get('usageDays', 1))
        price = safe_float(d.get('price'), 0) # <--- NEW INPUT
        
        try:
            # 1. Insert Product with Price
            conn.execute("""
                INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, usage_freq_qty, usage_freq_days, price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, item_name, consumption_unit) DO UPDATE SET
                current_quantity = current_quantity + excluded.current_quantity,
                price = excluded.price, -- Update price on re-add
                usage_freq_qty = excluded.usage_freq_qty, usage_freq_days = excluded.usage_freq_days,
                category = excluded.category, is_active = 1, updated_at = CURRENT_TIMESTAMP
            """, (d['userId'], d['name'], d['unit'], d['quantity'], d['quantity'], d.get('category', 'Other'), freq_qty, freq_days, price))
            
            # 2. Log Price History for Inflation Tracker
            if price > 0:
                conn.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, date('now'))", (d['name'], price))

            conn.commit()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            conn.close()

# --- NEW: UPDATE PRICE ENDPOINT ---
@inventory_bp.route('/products/<int:pid>/price', methods=['PUT'])
def update_price(pid):
    d = request.json
    new_price = safe_float(d.get('price'), 0)
    item_name = d.get('name')
    
    conn = get_db_connection()
    try:
        # Update current price
        conn.execute("UPDATE products SET price = ? WHERE product_id = ?", (new_price, pid))
        
        # Add to history for inflation tracking
        conn.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, date('now'))", (item_name, new_price))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()
    conn = get_db_connection()
    
    if request.method == 'GET':
        uid = request.args.get("userId")
        if uid: apply_auto_consumption(uid)

        try:
            # --- FIX: Added 'p.price' to SELECT query ---
            query = """
                SELECT p.product_id as id, p.item_name as name, p.consumption_unit as unit, p.current_quantity as quantity,
                    p.category, p.usage_freq_qty, p.usage_freq_days, p.price, 
                    COALESCE((SELECT AVG(avg_consumption_rate) FROM consumption_summary cs 
                         WHERE cs.product_id = p.product_id AND cs.summary_date >= date('now', '-30 days')), 0) as historical_daily_rate
                FROM products p WHERE p.user_id = ? AND p.is_active = 1 ORDER BY p.updated_at DESC
            """
            rows = conn.execute(query, (uid,)).fetchall()
            
            results = []
            for r in rows:
                d = dict(r)
                manual_qty = safe_float(d.get('usage_freq_qty'), 1)
                manual_days = safe_float(d.get('usage_freq_days'), 1)
                manual_daily_rate = manual_qty / manual_days if manual_days > 0 else 0
                historical_rate = safe_float(d.get('historical_daily_rate'), 0)

                if manual_days > 1 or manual_qty != 1: effective_rate = manual_daily_rate
                elif historical_rate > 0: effective_rate = historical_rate
                else: effective_rate = manual_daily_rate

                qty = max(0, safe_float(d['quantity'])) 
                d['quantity'] = qty                     
                d['days_left'] = round(qty / effective_rate, 1) if effective_rate > 0 else 999
                d['effective_daily_rate'] = effective_rate
                
                # --- FIX: Ensure price is sent (Default to 0 if None) ---
                d['price'] = safe_float(d.get('price'), 0)

                results.append(d)

            return jsonify(results)
        except Exception as e:
            print(f"Error fetching products: {e}")
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            conn.close()

    if request.method == 'POST':
        d = request.json
        freq_qty = safe_float(d.get('usageQty', 1))
        freq_days = safe_float(d.get('usageDays', 1))
        try:
            # --- FIX: Added 'price' to INSERT query (Default 0) ---
            conn.execute("""
                INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, usage_freq_qty, usage_freq_days, price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, item_name, consumption_unit) DO UPDATE SET
                current_quantity = current_quantity + excluded.current_quantity,
                usage_freq_qty = excluded.usage_freq_qty, usage_freq_days = excluded.usage_freq_days,
                category = excluded.category, is_active = 1, updated_at = CURRENT_TIMESTAMP
            """, (d['userId'], d['name'], d['unit'], d['quantity'], d['quantity'], d.get('category', 'Other'), freq_qty, freq_days, 0))
            
            conn.commit()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            conn.close()

@inventory_bp.route('/products/<int:pid>', methods=['DELETE'])
def delete_product_by_id(pid):
    conn = get_db_connection()
    try:
        conn.execute("UPDATE products SET is_active = 0 WHERE product_id = ?", (pid,))
        conn.commit()
        return jsonify({"success": True})
    finally:
        conn.close()

@inventory_bp.route('/consume', methods=['POST'])
def consume():
    d = request.json
    conn = get_db_connection()
    try:
        new_qty_rate = d.get('newRateQty')
        new_days_rate = d.get('newRateDays')
        
        update_sql = "UPDATE products SET current_quantity = MAX(0, current_quantity - ?), last_auto_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP"
        params = [d['amount']]

        if new_qty_rate is not None and new_days_rate is not None:
            update_sql += ", usage_freq_qty = ?, usage_freq_days = ?"
            params.extend([new_qty_rate, new_days_rate])
            
        update_sql += " WHERE product_id = ?"
        params.append(d['productId'])

        conn.execute(update_sql, params)
        
        # Log History
        conn.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, date('now'))",
                    (d['productId'], d['userId'], d['amount']))
        
        # Update Summary
        conn.execute("""
            INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed, avg_consumption_rate)
            VALUES (?, ?, date('now'), ?, ?)
            ON CONFLICT(product_id, summary_date) DO UPDATE SET 
            total_consumed = total_consumed + excluded.total_consumed,
            avg_consumption_rate = (total_consumed + excluded.total_consumed)
        """, (d['productId'], d['userId'], d['amount'], d['amount']))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@inventory_bp.route('/catalog', methods=['GET'])
def get_catalog():
    conn = get_db_connection()
    try:
        items = conn.execute("SELECT item_name, consumption_unit, category, daily_consumption_per_person FROM product_catalog ORDER BY item_name ASC").fetchall()
        return jsonify([dict(i) for i in items])
    finally:
        conn.close()