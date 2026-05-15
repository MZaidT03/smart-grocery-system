from flask import Blueprint, request, jsonify 
from datetime import datetime, timedelta
from database import get_db_connection
from utils import safe_float
from services.recommendation import get_market_basket_recommendations
# 👇 NEW IMPORT
from services.budget import log_expense

shopping_bp = Blueprint('shopping', __name__)

# --- HELPER: AUTO-LEARN TO CATALOG ---
def update_master_catalog(conn, name, category, unit):
    try:
        conn.execute("""
            INSERT INTO product_catalog (
                item_name, category, consumption_unit, daily_consumption_per_person, 
                diet_type, default_shelf_life, default_usage_freq_days
            )
            SELECT ?, ?, ?, 0.1, 'Non-Vegan', 14, 7
            WHERE NOT EXISTS (SELECT 1 FROM product_catalog WHERE item_name = ?)
        """, (name, category, unit, name))
    except Exception as e:
        print(f"⚠️ Catalog Auto-Update Failed: {e}")

# --- OTHER HELPERS ---
def generate_shopping_list_logic(data):
    # ... (Keep this function EXACTLY as it was in your code) ...
    # (For brevity, I am skipping the repeat, but assume your existing code is here)
    user_id = data.get("userId")
    num_days = safe_float(data.get("numDays", 7))
    num_members = safe_float(data.get("numMembers", 1))
    diet_input = data.get("dietType", "") 
    list_name = data.get("listName", f"List - {datetime.now().strftime('%Y-%m-%d')}")
    mode_refill = data.get("useExistingStock", False)
    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO shopping_lists (user_id, list_name, num_members, diet_type, num_days, created_from) VALUES (?, ?, ?, ?, ?, ?)", 
                     (user_id, list_name, num_members, diet_input, num_days, 'refill' if mode_refill else 'catalog'))
        list_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        count = 0
        if mode_refill:
            products = conn.execute("SELECT item_name, consumption_unit, current_quantity, category, usage_freq_qty, usage_freq_days FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchall()
            for p in products:
                u_qty = safe_float(p['usage_freq_qty'])
                u_days = safe_float(p['usage_freq_days'])
                if u_days <= 0: u_days = 7
                daily_burn = u_qty / u_days
                total_needed = daily_burn * num_days
                current = safe_float(p['current_quantity'])
                if current < total_needed:
                    to_buy = max(0.5, round((total_needed - current) * 2) / 2)
                    conn.execute("INSERT INTO shopping_list_items (list_id, item_name, consumption_unit, suggested_quantity, adjusted_quantity, current_stock, category, diet_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (list_id, p['item_name'], p['consumption_unit'], total_needed, to_buy, current, p['category'], 'Custom'))
                    count += 1
        else:
            d_type = diet_input.lower()
            query = "SELECT * FROM product_catalog WHERE 1=1"
            params = []
            if 'vegan' in d_type: 
                query += " AND diet_type = 'Vegan'"
            elif 'veg' in d_type and 'non' not in d_type: 
                query += " AND diet_type IN ('Vegan', 'Veg')"
            
            categories = data.get("categories", [])
            if categories:
                placeholders = ', '.join('?' * len(categories))
                query += f" AND category IN ({placeholders})"
                params.extend(categories)

            catalog = conn.execute(query, params).fetchall()
            stock_map = {}
            inv = conn.execute("SELECT item_name, current_quantity FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchall()
            for row in inv: stock_map[row['item_name'].lower()] = safe_float(row['current_quantity'])
            for item in catalog:
                daily = safe_float(item['daily_consumption_per_person'])
                needed = daily * num_members * num_days
                if needed < 0.1: continue
                curr = stock_map.get(item['item_name'].lower(), 0)
                if curr >= needed: continue 
                to_buy = max(0.5, round((needed - curr) * 2) / 2)
                conn.execute("INSERT INTO shopping_list_items (list_id, item_name, consumption_unit, suggested_quantity, adjusted_quantity, current_stock, category, diet_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (list_id, item['item_name'], item['consumption_unit'], needed, to_buy, curr, item['category'], item['diet_type']))
                count += 1
        conn.commit()
        return jsonify({"success": True, "listId": list_id, "count": count})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

# --- ROUTES ---

@shopping_bp.route('/onboarding/preferences', methods=['POST'])
def save_preferences():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute("UPDATE users SET household_size = ?, diet_preference = ? WHERE user_id = ?", 
                     (data.get("householdSize"), data.get("dietType"), data.get("userId")))
        conn.commit()
        return jsonify({"success": True})
    finally:
        conn.close()

@shopping_bp.route('/onboarding/generate-list', methods=['POST'])
def generate_onboarding_list():
    data = request.json
    user_id = data.get("userId")
    conn = get_db_connection()
    user = conn.execute("SELECT household_size, diet_preference FROM users WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    if not user: return jsonify({"success": False, "message": "User not found"}), 404
    return generate_shopping_list_logic({
        "userId": user_id, "numMembers": user['household_size'],
        "dietType": user['diet_preference'], "numDays": 30,
        "listName": f"Starter List - {datetime.now().strftime('%Y-%m-%d')}", "useExistingStock": False
    })

@shopping_bp.route('/shopping-list/generate', methods=['POST'])
def generate_shopping_list_endpoint():
    return generate_shopping_list_logic(request.json)

@shopping_bp.route('/shopping-list/<int:list_id>', methods=['GET'])
def get_list(list_id):
    conn = get_db_connection()
    try:
        l_info = conn.execute("SELECT * FROM shopping_lists WHERE list_id = ?", (list_id,)).fetchone()
        if not l_info: return jsonify({"success": False}), 404
        items = conn.execute("SELECT sli.*, CASE WHEN sli.is_deleted = 1 THEN 0 ELSE 1 END as is_selected FROM shopping_list_items sli WHERE sli.list_id = ? AND sli.is_deleted = 0 ORDER BY sli.category, sli.item_name", (list_id,)).fetchall()
        return jsonify({"success": True, "list": dict(l_info), "items": [dict(i) for i in items]})
    finally:
        conn.close()

@shopping_bp.route('/shopping-list/items/<int:item_id>', methods=['PUT', 'DELETE'])
def manage_list_item(item_id):
    conn = get_db_connection()
    try:
        if request.method == 'DELETE':
            conn.execute("UPDATE shopping_list_items SET is_deleted = 1 WHERE item_id = ?", (item_id,))
        elif request.method == 'PUT':
            d = request.json
            if 'adjustedQuantity' in d: conn.execute("UPDATE shopping_list_items SET adjusted_quantity = ? WHERE item_id = ?", (d['adjustedQuantity'], item_id))
            if 'isSelected' in d: conn.execute("UPDATE shopping_list_items SET is_deleted = ? WHERE item_id = ?", (0 if d['isSelected'] else 1, item_id))
        conn.commit()
        return jsonify({"success": True})
    finally:
        conn.close()

@shopping_bp.route('/shopping-list/<int:list_id>/items', methods=['POST'])
def add_item_to_list(list_id):
    data = request.json
    name = (data.get('itemName') or data.get('name')).strip()
    unit = data.get('unit', 'kg')
    qty = safe_float(data.get('quantity', 1))
    cat = data.get('category', 'Custom')
    conn = get_db_connection()
    try:
        ci = conn.execute("SELECT consumption_unit, category FROM product_catalog WHERE item_name = ? COLLATE NOCASE", (name,)).fetchone()
        if ci:
            cat = ci['category']
            unit = ci['consumption_unit']
        update_master_catalog(conn, data['itemName'], data.get('category', 'Other'), data.get('unit', 'pcs'))
        conn.execute("INSERT INTO shopping_list_items (list_id, item_name, consumption_unit, suggested_quantity, adjusted_quantity, category) VALUES (?, ?, ?, ?, ?, ?)", (list_id, name, unit, qty, qty, cat))
        conn.commit()
        return jsonify({"success": True})
    finally:
        conn.close()

# --- CONFIRM LIST (UPDATED FOR BUDGET) ---
@shopping_bp.route('/shopping-list/<int:list_id>/confirm', methods=['POST'])
def confirm_list(list_id):
    conn = get_db_connection()
    try:
        data = request.json or {}
        user_items = data.get('items')
        
        list_info = conn.execute("SELECT user_id, num_members FROM shopping_lists WHERE list_id = ?", (list_id,)).fetchone()
        if not list_info: return jsonify({"success": False, "message": "List not found"}), 404

        if not user_items:
            db_items = conn.execute("SELECT * FROM shopping_list_items WHERE list_id = ? AND is_deleted = 0", (list_id,)).fetchall()
            items_to_process = [dict(row) for row in db_items]
        else:
            items_to_process = user_items

        count = 0
        total_spent = 0  # Track total cost

        for item in items_to_process:
            qty = safe_float(item.get('qty') or item.get('adjusted_quantity'))
            if qty <= 0: continue
            
            name = item.get('name') or item.get('item_name')
            unit = item.get('unit') or item.get('consumption_unit')
            category_val = item.get('category', 'Other')
            
            # 1. Price
            price_paid = safe_float(item.get('price'), 0)
            
            # 👇👇👇 TRACK TOTAL SPENT 👇👇👇
            total_spent += price_paid 
            
            unit_price = price_paid / qty if qty > 0 and price_paid > 0 else 0
            
            # 2. Shelf Life & Usage Rate (Same as before)
            user_shelf_life = safe_float(item.get('shelfLife'), 0)
            expiry_days = int(user_shelf_life) if user_shelf_life > 0 else 30
            user_u_qty = safe_float(item.get('usageQty'), 0)
            user_u_period = safe_float(item.get('usagePeriod'), 0)
            if user_u_qty > 0 and user_u_period > 0:
                u_qty, u_days = user_u_qty, user_u_period
            else:
                cat_entry = conn.execute("SELECT default_freq_qty, default_freq_days FROM product_catalog WHERE item_name = ? COLLATE NOCASE", (name,)).fetchone()
                if cat_entry:
                    u_qty = safe_float(cat_entry['default_freq_qty']) * list_info['num_members']
                    u_days = safe_float(cat_entry['default_freq_days'])
                else:
                    u_qty, u_days = 1.0, 7.0

            # 3. Upsert Product (Same as before)
            existing = conn.execute("SELECT product_id, current_quantity, price FROM products WHERE user_id=? AND item_name=?", (list_info['user_id'], name)).fetchone()
            if existing:
                pid = existing['product_id']
                old_val = existing['current_quantity'] * existing['price']
                new_val = price_paid
                new_total_qty = existing['current_quantity'] + qty
                new_avg_price = (old_val + new_val) / new_total_qty if new_total_qty > 0 else unit_price
                usage_update_sql = ""
                usage_params = []
                if user_u_qty > 0: 
                    usage_update_sql = ", usage_freq_qty = ?, usage_freq_days = ?"
                    usage_params = [u_qty, u_days]
                conn.execute(f"""UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP {usage_update_sql} WHERE product_id = ?""", (new_avg_price, *usage_params, pid))
            else:
                cursor = conn.execute("""INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, usage_freq_qty, usage_freq_days, price, is_active) VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?, 1) RETURNING product_id""", 
                                      (list_info['user_id'], name, unit, category_val, u_qty, u_days, unit_price))
                pid = cursor.fetchone()['product_id']

            # 4. Insert Batch
            exp_date = (datetime.now() + timedelta(days=expiry_days)).strftime('%Y-%m-%d')
            conn.execute("INSERT INTO product_batches (product_id, quantity, expiry_date) VALUES (?, ?, ?)", (pid, qty, exp_date))
            
            # 5. Sync
            conn.execute("UPDATE products SET current_quantity = (SELECT SUM(quantity) FROM product_batches WHERE product_id=?) WHERE product_id=?", (pid, pid))
            if unit_price > 0:
                conn.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, date('now'))", (name, unit_price))
            
            # 👇👇👇 LOG EXPENSE PER ITEM 👇👇👇
            if price_paid > 0:
                log_expense(list_info['user_id'], price_paid, category_val, f"Bought {name} via Shopping List", conn)
            # 👆👆👆 ----------------------- 👆👆👆

            count += 1
        
        # --- 6. CREATE NOTIFICATION ---
        if count > 0:
            notif_msg = f"Shopping complete: {count} items added to inventory. Total Cost: Rs {total_spent}."
            conn.execute("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)", 
                         (list_info['user_id'], "Stock Updated", notif_msg, "success"))

        conn.execute("UPDATE shopping_lists SET is_confirmed = 1, confirmed_at = CURRENT_TIMESTAMP WHERE list_id = ?", (list_id,))
        conn.commit()
        return jsonify({"success": True, "count": count})

    except Exception as e:
        conn.rollback()
        print("Confirm Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@shopping_bp.route('/shopping/suggest', methods=['GET'])
def suggest_items():
    item_name = request.args.get('item')
    if not item_name: return jsonify([])
    suggestions = get_market_basket_recommendations(item_name)
    return jsonify(suggestions)