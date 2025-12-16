# routes/shopping.py
from flask import Blueprint, request, jsonify
from datetime import datetime
from database import get_db_connection
from utils import safe_float

shopping_bp = Blueprint('shopping', __name__)

# --- HELPERS ---
def generate_shopping_list_logic(data):
    user_id = data.get("userId")
    num_days = safe_float(data.get("numDays", 7))
    num_members = safe_float(data.get("numMembers", 1))
    diet_type = data.get("dietType", "Veg")
    list_name = data.get("listName", f"List - {datetime.now().strftime('%Y-%m-%d')}")
    use_existing_stock = data.get("useExistingStock", False)

    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO shopping_lists (user_id, list_name, num_members, diet_type, num_days, created_from) VALUES (?, ?, ?, ?, ?, ?)", 
                     (user_id, list_name, num_members, diet_type, num_days, 'restock' if use_existing_stock else 'scratch'))
        list_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        query = "SELECT * FROM product_catalog"
        if diet_type == 'Vegan': query += " WHERE diet_type = 'Vegan'"
        elif diet_type == 'Veg': query += " WHERE diet_type IN ('Vegan', 'Veg')"
        
        catalog = conn.execute(query).fetchall()
        stock_map = {}
        if use_existing_stock:
            inv = conn.execute("SELECT item_name, current_quantity FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchall()
            for row in inv: stock_map[row['item_name'].lower()] = row['current_quantity']

        count = 0
        for item in catalog:
            daily_need = safe_float(item['daily_consumption_per_person'])
            total_needed = daily_need * num_members * num_days
            current_stock = stock_map.get(item['item_name'].lower(), 0)
            
            if use_existing_stock:
                if current_stock >= total_needed: continue
                to_buy = total_needed - current_stock
            else:
                to_buy = total_needed

            adjusted_qty = max(0.5, round(to_buy * 2) / 2)
            conn.execute("""
                INSERT INTO shopping_list_items (list_id, item_name, consumption_unit, suggested_quantity, adjusted_quantity, current_stock, category, diet_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (list_id, item['item_name'], item['consumption_unit'], total_needed, adjusted_qty, current_stock, item['category'], item['diet_type']))
            count += 1

        conn.commit()
        return jsonify({"success": True, "listId": list_id, "count": count, "itemsCount": count})
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

    payload = {
        "userId": user_id, "numMembers": user['household_size'],
        "dietType": user['diet_preference'], "numDays": 30,
        "listName": f"Starter List - {datetime.now().strftime('%Y-%m-%d')}", "useExistingStock": False
    }
    return generate_shopping_list_logic(payload)

@shopping_bp.route('/shopping-list/generate', methods=['POST'])
def generate_shopping_list_endpoint():
    return generate_shopping_list_logic(request.json)

@shopping_bp.route('/shopping-list/<int:list_id>', methods=['GET'])
def get_list(list_id):
    conn = get_db_connection()
    l_info = conn.execute("SELECT * FROM shopping_lists WHERE list_id = ?", (list_id,)).fetchone()
    if not l_info: return jsonify({"success": False}), 404
    
    items = conn.execute("""
        SELECT sli.item_id, sli.item_name, sli.category, sli.adjusted_quantity, sli.adjusted_quantity as final_quantity, 
            sli.consumption_unit as unit, sli.current_stock,
            CASE WHEN sli.is_deleted = 1 THEN 0 ELSE 1 END as is_selected, pc.daily_consumption_per_person
        FROM shopping_list_items sli
        LEFT JOIN product_catalog pc ON sli.item_name = pc.item_name
        WHERE sli.list_id = ? AND sli.is_deleted = 0 ORDER BY sli.category
    """, (list_id,)).fetchall()
    conn.close()
    return jsonify({"success": True, "list": dict(l_info), "items": [dict(i) for i in items]})

@shopping_bp.route('/shopping-list/items/<int:item_id>', methods=['PUT', 'DELETE'])
def manage_list_item(item_id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("UPDATE shopping_list_items SET is_deleted = 1 WHERE item_id = ?", (item_id,))
    elif request.method == 'PUT':
        data = request.json
        if 'adjustedQuantity' in data:
            conn.execute("UPDATE shopping_list_items SET adjusted_quantity = ? WHERE item_id = ?", (data['adjustedQuantity'], item_id))
        if 'isSelected' in data:
            conn.execute("UPDATE shopping_list_items SET is_deleted = ? WHERE item_id = ?", (0 if data['isSelected'] else 1, item_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@shopping_bp.route('/shopping-list/<int:list_id>/items', methods=['POST'])
def add_item_to_list(list_id):
    data = request.json
    name = (data.get('itemName') or data.get('name')).strip()
    unit = data.get('unit', 'kg')
    user_qty = safe_float(data.get('quantity', 1))
    
    conn = get_db_connection()
    try:
        list_info = conn.execute("SELECT num_members, num_days FROM shopping_lists WHERE list_id = ?", (list_id,)).fetchone()
        catalog_item = conn.execute("SELECT daily_consumption_per_person, consumption_unit, category FROM product_catalog WHERE item_name = ? COLLATE NOCASE", (name,)).fetchone()

        final_qty = user_qty
        category = data.get('category', 'Custom')

        if catalog_item:
            calculated_need = safe_float(catalog_item['daily_consumption_per_person']) * list_info['num_members'] * list_info['num_days']
            final_qty = max(0.5, round(calculated_need * 2) / 2)
            category = catalog_item['category']
            unit = catalog_item['consumption_unit']

        conn.execute("INSERT INTO shopping_list_items (list_id, item_name, consumption_unit, suggested_quantity, adjusted_quantity, category) VALUES (?, ?, ?, ?, ?, ?)", 
                     (list_id, name, unit, final_qty, final_qty, category))
        conn.commit()
        return jsonify({"success": True, "message": "Item added", "newQty": final_qty})
    finally:
        conn.close()

@shopping_bp.route('/shopping-list/<int:list_id>/confirm', methods=['POST'])
def confirm_list(list_id):
    conn = get_db_connection()
    try:
        list_info = conn.execute("SELECT user_id, num_members FROM shopping_lists WHERE list_id = ?", (list_id,)).fetchone()
        items = conn.execute("SELECT * FROM shopping_list_items WHERE list_id = ? AND is_deleted = 0", (list_id,)).fetchall()
        
        count = 0
        for item in items:
            qty = safe_float(item['adjusted_quantity'])
            if qty <= 0: continue
            
            cat_entry = conn.execute("SELECT daily_consumption_per_person FROM product_catalog WHERE item_name = ? COLLATE NOCASE", (item['item_name'],)).fetchone()
            usage_qty = safe_float(cat_entry['daily_consumption_per_person']) * list_info['num_members'] if cat_entry else 1.0
            usage_days = 1

            conn.execute("""
                INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, usage_freq_qty, usage_freq_days, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(user_id, item_name, consumption_unit) DO UPDATE SET
                    current_quantity = current_quantity + excluded.current_quantity,
                    initial_quantity = initial_quantity + excluded.current_quantity,
                    usage_freq_qty = excluded.usage_freq_qty, usage_freq_days = excluded.usage_freq_days,
                    category = excluded.category, is_active = 1, updated_at = CURRENT_TIMESTAMP
            """, (list_info['user_id'], item['item_name'], item['consumption_unit'], qty, qty, item.get('category', 'Other'), usage_qty, usage_days))
            count += 1
        
        conn.execute("UPDATE shopping_lists SET is_confirmed = 1, confirmed_at = CURRENT_TIMESTAMP WHERE list_id = ?", (list_id,))
        conn.commit()
        return jsonify({"success": True, "message": f"Inventory updated with {count} items"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()