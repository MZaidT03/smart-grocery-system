# pyrefly: ignore [missing-import]
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from database import get_db_connection
from utils import safe_float
# 👇👇👇 IMPORT FOR BUDGET GUARD 👇👇👇
from services.budget import log_expense

inventory_bp = Blueprint('inventory', __name__)

# --- HELPER: AUTO-LEARN TO CATALOG ---
def update_master_catalog(conn, name, category, unit):
    """
    Silently adds a new item to the global autocomplete catalog 
    if it doesn't exist yet, using SAFE DEFAULTS for required fields.
    """
    try:
        conn.execute("""
            INSERT INTO product_catalog (
                item_name, 
                category, 
                consumption_unit, 
                daily_consumption_per_person, 
                diet_type, 
                default_shelf_life, 
                default_usage_freq_days
            )
            SELECT ?, ?, ?, 0.1, 'Non-Vegan', 14, 7
            WHERE NOT EXISTS (SELECT 1 FROM product_catalog WHERE item_name = ?)
        """, (name, category, unit, name))
    except Exception as e:
        print(f"⚠️ Catalog Auto-Update Failed: {e}")

# --- HELPER: ADD NOTIFICATION ---
def log_notification(conn, user_id, title, message, type="info", created_at=None):
    try:
        if created_at:
            conn.execute("INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?)",
                         (user_id, title, message, type, created_at))
        else:
            conn.execute("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
                         (user_id, title, message, type))
    except Exception as e:
        print(f"Notification Error: {e}")

# --- HELPER: SYNC TOTAL QUANTITY ---
def sync_product_total(conn, product_id):
    conn.execute("""
        UPDATE products 
        SET current_quantity = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM product_batches 
            WHERE product_id = ?
        ) 
        WHERE product_id = ?
    """, (product_id, product_id))

# --- HELPER: FIFO CONSUMPTION ---
def consume_fifo(conn, product_id, amount_needed):
    batches = conn.execute("""
        SELECT batch_id, quantity FROM product_batches 
        WHERE product_id = ? AND quantity > 0 
        ORDER BY expiry_date ASC
    """, (product_id,)).fetchall()

    amount_left_to_consume = amount_needed
    
    for batch in batches:
        if amount_left_to_consume <= 0: break
        
        b_id = batch['batch_id']
        b_qty = batch['quantity']
        
        if b_qty <= amount_left_to_consume:
            conn.execute("DELETE FROM product_batches WHERE batch_id = ?", (b_id,))
            amount_left_to_consume -= b_qty
        else:
            conn.execute("UPDATE product_batches SET quantity = quantity - ? WHERE batch_id = ?", 
                         (amount_left_to_consume, b_id))
            amount_left_to_consume = 0
            
    return amount_needed - amount_left_to_consume

# --- ROBUST AUTO CONSUMPTION ---
def apply_auto_consumption(user_id):
    conn = get_db_connection()
    try:
        last_run_row = conn.execute("""
            SELECT MAX(created_at) as last_date 
            FROM notifications 
            WHERE user_id = ? AND title = 'System Check'
        """, (user_id,)).fetchone()

        now = datetime.now()
        today_date = now.date()

        if last_run_row and last_run_row['last_date']:
            try:
                last_run_str = str(last_run_row['last_date']).split(' ')[0]
                last_run_date = datetime.strptime(last_run_str, '%Y-%m-%d').date()
            except:
                last_run_date = today_date - timedelta(days=1)
        else:
            last_run_date = today_date - timedelta(days=1)

        current_processing_date = last_run_date + timedelta(days=1)

        while current_processing_date <= today_date:
            products = conn.execute("""
                SELECT product_id, item_name, consumption_unit, current_quantity, usage_freq_qty, usage_freq_days 
                FROM products WHERE user_id = ? AND is_active = 1
            """, (user_id,)).fetchall()

            daily_logs = []

            for p in products:
                if p['usage_freq_days'] > 0:
                    daily_rate = p['usage_freq_qty'] / p['usage_freq_days']
                else:
                    daily_rate = 0

                if daily_rate > 0 and p['current_quantity'] > 0:
                    actual_consumed = consume_fifo(conn, p['product_id'], daily_rate)
                    
                    if actual_consumed > 0:
                        sync_product_total(conn, p['product_id'])
                        conn.execute("""
                            INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) 
                            VALUES (?, ?, ?, ?)
                        """, (p['product_id'], user_id, actual_consumed, current_processing_date))
                        
                        conn.execute("""
                            INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed)
                            VALUES (?, ?, ?, ?)
                            ON CONFLICT(product_id, summary_date) DO UPDATE SET total_consumed = total_consumed + excluded.total_consumed
                        """, (p['product_id'], user_id, current_processing_date, actual_consumed))

                        daily_logs.append(f"{round(actual_consumed, 2)} {p['consumption_unit']} of {p['item_name']}")

            past_timestamp = f"{current_processing_date.strftime('%Y-%m-%d')} 09:00:00"
            if daily_logs:
                if len(daily_logs) > 2:
                    msg = f"Automatically consumed {len(daily_logs)} items..."
                else:
                    msg = "Automatically consumed " + ", ".join(daily_logs)
                
                log_notification(conn, user_id, "Auto Consumption", msg, "info", past_timestamp)

            log_notification(conn, user_id, "System Check", "Daily processing complete", "system", past_timestamp)
            current_processing_date += timedelta(days=1)

        conn.commit()
    except Exception as e:
        print(f"Auto-consumption error: {e}")
        conn.rollback()
    finally:
        conn.close()

# --- MANAGE PRODUCTS (GET & ADD) ---
@inventory_bp.route('/products', methods=['GET', 'POST'])
def manage_products():
    conn = get_db_connection()
    
    if request.method == 'GET':
        uid = request.args.get("userId")
        if uid: apply_auto_consumption(uid) 

        try:
            query = """
                SELECT p.product_id as id, p.item_name as name, p.consumption_unit as unit, 
                       p.current_quantity as quantity, p.category, p.usage_freq_qty, 
                       p.usage_freq_days, p.price,
                       (SELECT MIN(expiry_date) FROM product_batches pb WHERE pb.product_id = p.product_id AND pb.quantity > 0) as next_expiry,
                       COALESCE((SELECT AVG(avg_consumption_rate) FROM consumption_summary cs 
                         WHERE cs.product_id = p.product_id AND cs.summary_date >= date('now', '-30 days')), 0) as historical_daily_rate
                FROM products p 
                WHERE p.user_id = ? AND p.is_active = 1 
                ORDER BY p.updated_at DESC
            """
            rows = conn.execute(query, (uid,)).fetchall()
            results = []
            now_date = datetime.now().date()

            for r in rows:
                d = dict(r)
                manual_qty = safe_float(d.get('usage_freq_qty'), 1)
                manual_days = safe_float(d.get('usage_freq_days'), 1)
                manual_daily_rate = manual_qty / manual_days if manual_days > 0 else 0
                historical_rate = safe_float(d.get('historical_daily_rate'), 0)
                
                if manual_days > 1 or manual_qty != 1: effective_rate = manual_daily_rate
                elif historical_rate > 0: effective_rate = historical_rate
                else: effective_rate = manual_daily_rate

                if effective_rate > 0:
                    d['days_left'] = round(d['quantity'] / effective_rate, 1)
                else:
                    d['days_left'] = -1 
                
                d['effective_daily_rate'] = effective_rate
                d['price'] = safe_float(d.get('price'), 0)
                d['expiry_days'] = 999 

                if d['next_expiry']:
                    try:
                        exp_date = datetime.strptime(str(d['next_expiry']), "%Y-%m-%d").date()
                        delta = (exp_date - now_date).days
                        d['expiry_days'] = delta
                    except:
                        pass 
                results.append(d)

            return jsonify(results)
        finally:
            conn.close()

    if request.method == 'POST':
        d = request.json
        freq_qty = safe_float(d.get('usageQty', 1))
        freq_days = safe_float(d.get('usageDays', 1))
        price = safe_float(d.get('price'), 0)
        shelf_life_days = safe_float(d.get('shelfLife', 7))
        expiry_date = (datetime.now() + timedelta(days=shelf_life_days)).strftime('%Y-%m-%d')
        
        try:
            cursor = conn.execute("""
                INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, usage_freq_qty, usage_freq_days, price)
                VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?)
                ON CONFLICT(user_id, item_name, consumption_unit) DO UPDATE SET
                price = excluded.price,
                usage_freq_qty = excluded.usage_freq_qty, usage_freq_days = excluded.usage_freq_days,
                category = excluded.category, is_active = 1, updated_at = CURRENT_TIMESTAMP
                RETURNING product_id
            """, (d['userId'], d['name'], d['unit'], d.get('category', 'Other'), freq_qty, freq_days, price))
            
            row = cursor.fetchone()
            if row: pid = row['product_id']
            else: pid = conn.execute("SELECT product_id FROM products WHERE user_id=? AND item_name=? AND consumption_unit=?", 
                                    (d['userId'], d['name'], d['unit'])).fetchone()['product_id']

            conn.execute("INSERT INTO product_batches (product_id, quantity, expiry_date) VALUES (?, ?, ?)", (pid, d['quantity'], expiry_date))
            sync_product_total(conn, pid)
            if price > 0: conn.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, date('now'))", (d['name'], price))
            
            # 1. AUTO-LEARN
            update_master_catalog(conn, d['name'], d.get('category', 'Other'), d['unit'])

            # 👇👇👇 2. LOG EXPENSE (FIXED) 👇👇👇
            total_cost = safe_float(d.get('quantity'), 0) * price
            if total_cost > 0:
                log_expense(d['userId'], total_cost, d.get('category', 'Other'), f"Added {d['name']} manually", conn)
            # 👆👆👆 -------------------------------- 👆👆👆

            log_notification(conn, d['userId'], "Stock Added", f"Added {d['quantity']} {d['unit']} of {d['name']} (Exp: {expiry_date})", "success")
            conn.commit()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            conn.close()

@inventory_bp.route('/products/<int:pid>/price', methods=['PUT'])
def update_price(pid):
    d = request.json
    new_price = safe_float(d.get('price'), 0)
    item_name = d.get('name')
    conn = get_db_connection()
    try:
        user_row = conn.execute("SELECT user_id, current_quantity, price, category FROM products WHERE product_id = ?", (pid,)).fetchone()
        conn.execute("UPDATE products SET price = ? WHERE product_id = ?", (new_price, pid))
        conn.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, date('now'))", (item_name, new_price))
        if user_row: 
            old_price = safe_float(user_row['price'], 0)
            qty = safe_float(user_row['current_quantity'], 0)
            diff = new_price - old_price
            if diff > 0 and qty > 0:
                log_expense(user_row['user_id'], diff * qty, user_row['category'] or 'Other', f"Price manually updated for {item_name}", conn)

            log_notification(conn, user_row['user_id'], "Price Updated", f"Updated price of {item_name} to Rs {new_price}", "info")
        conn.commit()
        return jsonify({"success": True})
    finally:
        conn.close()

@inventory_bp.route('/products/<int:pid>/restock', methods=['POST', 'OPTIONS'])
def restock_product(pid):
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    data = request.json
    user_id = data.get('userId')
    conn = get_db_connection()
    try:
        product = conn.execute("SELECT item_name, category, consumption_unit, current_quantity, price FROM products WHERE product_id = ?", (pid,)).fetchone()
        if not product: return jsonify({'error': 'Product not found'}), 404
        current_qty = safe_float(product['current_quantity'], 0)
        current_unit_price = safe_float(product['price'], 0)
        added_qty = safe_float(data.get('added_quantity', 0))
        restock_unit_price = safe_float(data.get('new_price', 0))
        expiry_input = data.get('new_expiry_days')
        expiry_days = safe_float(expiry_input, 999) if expiry_input else 999
        new_expiry_date = (datetime.now() + timedelta(days=expiry_days)).strftime('%Y-%m-%d')
        old_total_value = current_qty * current_unit_price
        new_batch_value = added_qty * restock_unit_price
        new_total_qty = current_qty + added_qty
        if new_total_qty > 0:
            final_weighted_price = round((old_total_value + new_batch_value) / new_total_qty, 2)
        else:
            final_weighted_price = restock_unit_price
        conn.execute("INSERT INTO product_batches (product_id, quantity, expiry_date) VALUES (?, ?, ?)", (pid, added_qty, new_expiry_date))
        conn.execute("UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?", (final_weighted_price, pid))
        conn.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, date('now'))", (product['item_name'], final_weighted_price))
        sync_product_total(conn, pid)
        msg = f"Restocked {added_qty} {product['consumption_unit']} of {product['item_name']} @ Rs {restock_unit_price}"
        
        # LOG EXPENSE
        total_cost = added_qty * restock_unit_price
        if user_id and total_cost > 0:
            log_expense(user_id, total_cost, product['category'] or 'Groceries', f"Restocked {product['item_name']}", conn)

        if user_id: log_notification(conn, user_id, "Stock Refilled", msg, "success")
        conn.commit()
        new_total = conn.execute("SELECT current_quantity FROM products WHERE product_id=?", (pid,)).fetchone()['current_quantity']
        return jsonify({'success': True, 'message': 'Restocked successfully', 'new_quantity': new_total, 'new_avg_price': final_weighted_price})
    except Exception as e:
        conn.rollback()
        print(f"Restock Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@inventory_bp.route('/products/<int:pid>', methods=['DELETE'])
def delete_product_by_id(pid):
    conn = get_db_connection()
    try:
        prod = conn.execute("SELECT user_id, item_name FROM products WHERE product_id = ?", (pid,)).fetchone()
        conn.execute("UPDATE products SET is_active = 0 WHERE product_id = ?", (pid,))
        if prod: log_notification(conn, prod['user_id'], "Item Removed", f"Removed {prod['item_name']} from inventory", "warning")
        conn.commit()
        return jsonify({"success": True})
    finally:
        conn.close()

@inventory_bp.route('/products/<int:pid>', methods=['PUT', 'OPTIONS'])
def update_product_by_id(pid):
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    data = request.json
    conn = get_db_connection()
    try:
        prod = conn.execute("SELECT user_id FROM products WHERE product_id = ?", (pid,)).fetchone()
        if not prod:
            return jsonify({"success": False, "error": "Product not found"}), 404
            
        update_fields = []
        params = []
        
        if 'name' in data:
            update_fields.append("item_name = ?")
            params.append(data['name'])
        if 'category' in data:
            update_fields.append("category = ?")
            params.append(data['category'])
        if 'unit' in data:
            update_fields.append("consumption_unit = ?")
            params.append(data['unit'])
        if 'usageQty' in data:
            update_fields.append("usage_freq_qty = ?")
            params.append(safe_float(data['usageQty'], 1))
        if 'usageDays' in data:
            update_fields.append("usage_freq_days = ?")
            params.append(safe_float(data['usageDays'], 1))
            
        if not update_fields:
            return jsonify({"success": True})
            
        params.append(pid)
        
        query = f"UPDATE products SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?"
        conn.execute(query, tuple(params))
        conn.commit()
        
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        error_msg = str(e)
        if "UNIQUE constraint failed" in error_msg:
            return jsonify({"success": False, "error": "An item with this name and unit already exists in your inventory."}), 400
        return jsonify({"success": False, "error": error_msg}), 500
    finally:
        conn.close()

@inventory_bp.route('/consume', methods=['POST'])
def consume():
    d = request.json
    amount = float(d['amount'])
    pid = d['productId']
    user_id = d['userId']
    conn = get_db_connection()
    try:
        prod = conn.execute("SELECT item_name, consumption_unit FROM products WHERE product_id = ?", (pid,)).fetchone()
        new_qty_rate = d.get('newRateQty')
        new_days_rate = d.get('newRateDays')
        if new_qty_rate is not None and new_days_rate is not None:
             conn.execute("UPDATE products SET usage_freq_qty = ?, usage_freq_days = ? WHERE product_id = ?", (new_qty_rate, new_days_rate, pid))
        actual_consumed = consume_fifo(conn, pid, amount)
        sync_product_total(conn, pid)
        conn.execute("UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE product_id = ?", (pid,))
        conn.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, date('now'))", (pid, user_id, actual_consumed))
        conn.execute("INSERT INTO manual_consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, date('now'))", (pid, user_id, actual_consumed))
        conn.execute("""
            INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed)
            VALUES (?, ?, date('now'), ?)
            ON CONFLICT(product_id, summary_date) DO UPDATE SET total_consumed = total_consumed + excluded.total_consumed
        """, (pid, user_id, actual_consumed))
        if prod: log_notification(conn, user_id, "Manual Consumption", f"Consumed {actual_consumed} {prod['consumption_unit']} of {prod['item_name']}", "info")
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

@inventory_bp.route('/products/<int:pid>/batches', methods=['GET'])
def get_product_batches(pid):
    conn = get_db_connection()
    try:
        batches = conn.execute("SELECT batch_id, quantity, expiry_date FROM product_batches WHERE product_id = ? AND quantity > 0 ORDER BY expiry_date ASC", (pid,)).fetchall()
        return jsonify([dict(b) for b in batches])
    finally:
        conn.close()
    
@inventory_bp.route('/batches/<int:batch_id>', methods=['PUT'])
def update_batch(batch_id):
    data = request.json
    conn = get_db_connection()
    try:
        new_days = data.get('days')
        if new_days is not None:
            new_days = float(new_days)
            new_expiry_date = (datetime.now() + timedelta(days=new_days)).strftime('%Y-%m-%d')
            conn.execute("UPDATE product_batches SET expiry_date = ? WHERE batch_id = ?", (new_expiry_date, batch_id))
        new_qty = data.get('quantity')
        if new_qty is not None:
            conn.execute("UPDATE product_batches SET quantity = ? WHERE batch_id = ?", (float(new_qty), batch_id))
            row = conn.execute("SELECT product_id FROM product_batches WHERE batch_id=?", (batch_id,)).fetchone()
            if row: sync_product_total(conn, row['product_id'])
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@inventory_bp.route('/products/<int:pid>/expiry', methods=['PUT'])
def update_expiry(pid):
    data = request.json
    days = safe_float(data.get('days'), 7)
    conn = get_db_connection()
    try:
        new_expiry_date = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
        batch_count = conn.execute("SELECT COUNT(*) FROM product_batches WHERE product_id = ?", (pid,)).fetchone()[0]
        if batch_count > 0:
            conn.execute("UPDATE product_batches SET expiry_date = ? WHERE product_id = ? AND quantity > 0", (new_expiry_date, pid))
        else:
            prod = conn.execute("SELECT current_quantity FROM products WHERE product_id = ?", (pid,)).fetchone()
            if prod and prod['current_quantity'] > 0:
                conn.execute("INSERT INTO product_batches (product_id, quantity, expiry_date) VALUES (?, ?, ?)", (pid, prod['current_quantity'], new_expiry_date))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()