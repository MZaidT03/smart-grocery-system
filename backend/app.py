#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime, timedelta
import csv
import os

# ==========================================
# CONFIGURATION
# ==========================================
app = Flask(__name__)
CORS(app)

DB_NAME = "grocery.db"
DEFAULT_CATALOG_CSV = "pakistani_grocery_dataset.csv"

# ==========================================
# DATABASE & HELPERS
# ==========================================

def get_db_connection():
    conn = sqlite3.connect(DB_NAME, detect_types=sqlite3.PARSE_DECLTYPES|sqlite3.PARSE_COLNAMES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def safe_float(val, default=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("PRAGMA foreign_keys = ON;")

    # 1. USERS
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    email TEXT UNIQUE,
                    household_size INTEGER DEFAULT 1,
                    diet_preference TEXT DEFAULT 'Non-Vegan',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')

    # 2. PRODUCTS (Inventory)
    c.execute('''CREATE TABLE IF NOT EXISTS products (
                    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    consumption_unit TEXT NOT NULL,
                    current_quantity REAL NOT NULL DEFAULT 0,
                    initial_quantity REAL NOT NULL DEFAULT 0,
                    min_threshold REAL DEFAULT 0,
                    category TEXT DEFAULT 'Other',
                    is_active INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    UNIQUE(user_id, item_name, consumption_unit)
                )''')

    # 3. CONSUMPTION LOGS
    c.execute('''CREATE TABLE IF NOT EXISTS consumption_logs (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    consumed_quantity REAL NOT NULL,
                    consumption_date DATE NOT NULL,
                    consumption_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )''')

    # 4. CONSUMPTION SUMMARY
    c.execute('''CREATE TABLE IF NOT EXISTS consumption_summary (
                    summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    summary_date DATE NOT NULL,
                    total_consumed REAL NOT NULL,
                    avg_consumption_rate REAL,
                    days_in_period INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
                    UNIQUE(product_id, summary_date)
                )''')

    # 5. SHOPPING LISTS
    c.execute('''CREATE TABLE IF NOT EXISTS shopping_lists (
                    list_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    list_name TEXT NOT NULL,
                    num_members INTEGER NOT NULL,
                    diet_type TEXT NOT NULL,
                    num_days INTEGER NOT NULL,
                    is_confirmed INTEGER DEFAULT 0,
                    created_from TEXT DEFAULT 'scratch',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    confirmed_at TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )''')

    # 6. SHOPPING LIST ITEMS
    c.execute('''CREATE TABLE IF NOT EXISTS shopping_list_items (
                    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    list_id INTEGER NOT NULL,
                    product_id INTEGER,
                    item_name TEXT NOT NULL,
                    consumption_unit TEXT NOT NULL,
                    suggested_quantity REAL NOT NULL,
                    adjusted_quantity REAL NOT NULL,
                    current_stock REAL DEFAULT 0,
                    category TEXT,
                    diet_type TEXT,
                    is_deleted INTEGER DEFAULT 0,
                    notes TEXT,
                    FOREIGN KEY (list_id) REFERENCES shopping_lists(list_id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
                )''')

    # 7. PRODUCT CATALOG
    c.execute('''CREATE TABLE IF NOT EXISTS product_catalog (
                    catalog_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_name TEXT NOT NULL,
                    daily_consumption_per_person REAL NOT NULL,
                    consumption_unit TEXT NOT NULL,
                    category TEXT NOT NULL,
                    diet_type TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(item_name, consumption_unit)
                )''')
    
    conn.commit()
    conn.close()

init_db()

# ==========================================
# AUTHENTICATION
# ==========================================

@app.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    email = (data.get("email") or "").strip()
    
    if not username or not password: return jsonify({"success": False, "message": "Missing credentials"}), 400
    hashed = hash_password(password)
    
    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)", (username, hashed, email))
        conn.commit()
        user_row = conn.execute("SELECT user_id FROM users WHERE username = ?", (username,)).fetchone()
        return jsonify({"success": True, "userId": user_row['user_id']})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "User exists"}), 409
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username=? AND password_hash=?", 
                       (data.get("username"), hash_password(data.get("password")))).fetchone()
    conn.close()
    if not user: return jsonify({"success": False}), 401
    return jsonify({"success": True, "userId": user['user_id'], "username": user['username']})

# ==========================================
# ONBOARDING (StarterList.jsx Support)
# ==========================================

@app.route('/onboarding/preferences', methods=['POST'])
def save_preferences():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute("UPDATE users SET household_size = ?, diet_preference = ? WHERE user_id = ?", 
                     (data.get("householdSize"), data.get("dietType"), data.get("userId")))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/onboarding/generate-list', methods=['POST'])
def generate_onboarding_list():
    """Legacy endpoint support for StarterList.jsx"""
    data = request.json
    user_id = data.get("userId")
    
    conn = get_db_connection()
    user = conn.execute("SELECT household_size, diet_preference FROM users WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    
    if not user: return jsonify({"success": False, "message": "User not found"}), 404

    payload = {
        "userId": user_id,
        "numMembers": user['household_size'],
        "dietType": user['diet_preference'],
        "numDays": 30,
        "listName": f"Starter List - {datetime.now().strftime('%Y-%m-%d')}",
        "useExistingStock": False
    }
    
    return generate_shopping_list_logic(payload)

# ==========================================
# SHOPPING LIST GENERATION (CORE)
# ==========================================

@app.route('/shopping-list/generate', methods=['POST'])
def generate_shopping_list_endpoint():
    return generate_shopping_list_logic(request.json)

def generate_shopping_list_logic(data):
    """Shared logic for all list generation"""
    user_id = data.get("userId")
    num_days = safe_float(data.get("numDays", 7))
    num_members = safe_float(data.get("numMembers", 1))
    diet_type = data.get("dietType", "Veg")
    list_name = data.get("listName", f"List - {datetime.now().strftime('%Y-%m-%d')}")
    use_existing_stock = data.get("useExistingStock", False)

    conn = get_db_connection()
    c = conn.cursor()

    try:
        c.execute("""
            INSERT INTO shopping_lists (user_id, list_name, num_members, diet_type, num_days, created_from)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, list_name, num_members, diet_type, num_days, 'restock' if use_existing_stock else 'scratch'))
        list_id = c.lastrowid

        query = "SELECT * FROM product_catalog"
        params = []
        if diet_type == 'Vegan':
            query += " WHERE diet_type = 'Vegan'"
        elif diet_type == 'Veg':
            query += " WHERE diet_type IN ('Vegan', 'Veg')"
        
        catalog = c.execute(query, params).fetchall()

        stock_map = {}
        if use_existing_stock:
            inv = c.execute("SELECT item_name, current_quantity FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchall()
            for row in inv:
                stock_map[row['item_name'].lower()] = row['current_quantity']

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

            c.execute("""
                INSERT INTO shopping_list_items 
                (list_id, item_name, consumption_unit, suggested_quantity, adjusted_quantity, current_stock, category, diet_type)
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

# ==========================================
# SHOPPING LIST CRUD (Unified)
# ==========================================

@app.route('/shopping-list/<int:list_id>', methods=['GET'])
def get_list(list_id):
    conn = get_db_connection()
    c = conn.cursor()
    
    l_info = c.execute("SELECT * FROM shopping_lists WHERE list_id = ?", (list_id,)).fetchone()
    if not l_info: return jsonify({"success": False}), 404
    
    items = c.execute("""
        SELECT item_id, item_name, category, adjusted_quantity, adjusted_quantity as final_quantity, consumption_unit as unit, current_stock,
               CASE WHEN is_deleted = 1 THEN 0 ELSE 1 END as is_selected 
        FROM shopping_list_items 
        WHERE list_id = ? AND is_deleted = 0 
        ORDER BY category
    """, (list_id,)).fetchall()
    
    conn.close()
    return jsonify({
        "success": True, 
        "list": dict(l_info), 
        "items": [dict(i) for i in items]
    })

@app.route('/shopping-list/items/<int:item_id>', methods=['PUT', 'DELETE'])
@app.route('/shopping-list/item/<int:item_id>', methods=['PUT', 'DELETE'])
def manage_list_item(item_id):
    conn = get_db_connection()
    
    if request.method == 'DELETE':
        conn.execute("UPDATE shopping_list_items SET is_deleted = 1 WHERE item_id = ?", (item_id,))
        
    elif request.method == 'PUT':
        data = request.json
        if 'adjustedQuantity' in data:
            conn.execute("UPDATE shopping_list_items SET adjusted_quantity = ? WHERE item_id = ?", (data['adjustedQuantity'], item_id))
        if 'quantity' in data:
            conn.execute("UPDATE shopping_list_items SET adjusted_quantity = ? WHERE item_id = ?", (data['quantity'], item_id))
        if 'isSelected' in data:
            is_deleted = 0 if data['isSelected'] else 1
            conn.execute("UPDATE shopping_list_items SET is_deleted = ? WHERE item_id = ?", (is_deleted, item_id))
            
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/shopping-list/<int:list_id>/items', methods=['POST'])
@app.route('/shopping-list/<int:list_id>/item', methods=['POST'])
def add_item_to_list(list_id):
    data = request.json
    name = data.get('itemName') or data.get('name')
    unit = data.get('unit', 'kg')
    qty = safe_float(data.get('quantity', 1))
    
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO shopping_list_items (list_id, item_name, consumption_unit, suggested_quantity, adjusted_quantity, category)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (list_id, name, unit, qty, qty, data.get('category', 'Custom')))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/shopping-list/<int:list_id>/confirm', methods=['POST'])
def confirm_list(list_id):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        row = c.execute("SELECT user_id FROM shopping_lists WHERE list_id = ?", (list_id,)).fetchone()
        if not row: return jsonify({"success": False}), 404
        user_id = row['user_id']

        items = c.execute("SELECT * FROM shopping_list_items WHERE list_id = ? AND is_deleted = 0", (list_id,)).fetchall()
        
        for item in items:
            qty = safe_float(item['adjusted_quantity'])
            if qty <= 0: continue
            
            c.execute("""
                INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, item_name, consumption_unit) DO UPDATE SET
                current_quantity = current_quantity + excluded.current_quantity,
                initial_quantity = initial_quantity + excluded.current_quantity,
                is_active = 1,
                updated_at = CURRENT_TIMESTAMP
            """, (user_id, item['item_name'], item['consumption_unit'], qty, qty, item.get('category', 'Other')))
        
        c.execute("UPDATE shopping_lists SET is_confirmed = 1, confirmed_at = CURRENT_TIMESTAMP WHERE list_id = ?", (list_id,))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

# ==========================================
# PRODUCTS & CONSUMPTION
# ==========================================

@app.route('/products', methods=['GET', 'POST', 'DELETE'])
def manage_products():
    conn = get_db_connection()
    
    if request.method == 'GET':
        uid = request.args.get("userId")
        try:
            query = """
                SELECT 
                    p.product_id as id,
                    p.item_name as name,
                    p.consumption_unit as unit,
                    p.current_quantity as quantity,
                    p.category,
                    COALESCE(
                        (SELECT AVG(avg_consumption_rate) 
                         FROM consumption_summary cs 
                         WHERE cs.product_id = p.product_id 
                         AND cs.summary_date >= date('now', '-30 days')
                        ), 0) as effective_daily_rate
                FROM products p
                WHERE p.user_id = ? AND p.is_active = 1
                ORDER BY p.updated_at DESC
            """
            rows = conn.execute(query, (uid,)).fetchall()
            conn.close()

            results = []
            for r in rows:
                d = dict(r)
                rate = d['effective_daily_rate']
                qty = d['quantity']
                
                if rate > 0:
                    d['days_left'] = round(qty / rate, 1)
                else:
                    d['days_left'] = 999 
                
                results.append(d)

            return jsonify(results)

        except Exception as e:
            conn.close()
            return jsonify({"success": False, "message": str(e)}), 500

    if request.method == 'POST':
        d = request.json
        try:
            conn.execute("""
                INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, item_name, consumption_unit) DO UPDATE SET
                current_quantity = current_quantity + excluded.current_quantity,
                is_active = 1
            """, (d['userId'], d['name'], d['unit'], d['quantity'], d['quantity'], d.get('category', 'Other')))
            conn.commit()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            conn.close()
            
    return jsonify({"success": False})

@app.route('/products/<int:pid>', methods=['DELETE'])
def delete_product_by_id(pid):
    conn = get_db_connection()
    conn.execute("UPDATE products SET is_active = 0 WHERE product_id = ?", (pid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/consume', methods=['POST'])
def consume():
    d = request.json
    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?,?,?, date('now'))",
                    (d['productId'], d['userId'], d['amount']))
        conn.execute("UPDATE products SET current_quantity = current_quantity - ? WHERE product_id = ?", 
                    (d['amount'], d['productId']))
        
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
        return jsonify({"success": False, "message": str(e)})
    finally:
        conn.close()

# ==========================================
# ANALYTICS (Restored!)
# ==========================================

@app.route('/analytics/<int:user_id>', methods=['GET'])
def get_analytics(user_id):
    days = int(request.args.get("days", 30))
    conn = get_db_connection()
    c = conn.cursor()
    
    # Trend Data
    trend = c.execute("""
        SELECT summary_date as date, SUM(total_consumed) as total_consumption
        FROM consumption_summary
        WHERE user_id = ? AND summary_date >= date('now', '-' || ? || ' days')
        GROUP BY summary_date ORDER BY summary_date ASC
    """, (user_id, days)).fetchall()
    
    # Top Products
    top = c.execute("""
        SELECT p.item_name as name, p.consumption_unit as unit, SUM(cs.total_consumed) as total
        FROM consumption_summary cs
        JOIN products p ON cs.product_id = p.product_id
        WHERE cs.user_id = ? AND cs.summary_date >= date('now', '-' || ? || ' days')
        GROUP BY p.product_id, p.item_name, p.consumption_unit
        ORDER BY total DESC LIMIT 5
    """, (user_id, days)).fetchall()
    
    conn.close()
    return jsonify({"trend": [dict(t) for t in trend], "topProducts": [dict(p) for p in top]})

# ==========================================
# ADMIN
# ==========================================

@app.route('/admin/load-catalog', methods=['POST'])
def load_catalog():
    if not os.path.exists(DEFAULT_CATALOG_CSV):
        return jsonify({"success": False, "message": "CSV missing"}), 404
        
    conn = get_db_connection()
    try:
        with open(DEFAULT_CATALOG_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for r in reader:
                conn.execute("""
                    INSERT INTO product_catalog (item_name, daily_consumption_per_person, consumption_unit, category, diet_type)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(item_name, consumption_unit) DO UPDATE SET daily_consumption_per_person = excluded.daily_consumption_per_person
                """, (r['name'], float(r['consumption']), r['unit'], r['category'], r['diet_type']))
                count += 1
        conn.commit()
        return jsonify({"success": True, "message": f"Loaded {count} items"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    print(f"🚀 Grocery Backend Running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)