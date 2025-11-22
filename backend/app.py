from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DB_NAME = "grocery.db"

# ------------------ INIT DATABASE (FIXED SCHEMA) ------------------
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # Enable Foreign Keys
    c.execute("PRAGMA foreign_keys = ON;")

    # 1. USERS TABLE
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    email TEXT UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')

    # 2. PRODUCTS TABLE
    c.execute('''CREATE TABLE IF NOT EXISTS products (
                    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    consumption_unit TEXT NOT NULL,
                    current_quantity REAL NOT NULL DEFAULT 0,
                    initial_quantity REAL NOT NULL DEFAULT 0,
                    min_threshold REAL DEFAULT 0,
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

    # 4. CONSUMPTION SUMMARY (For fast analytics)
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

    # 5. ARCHIVE TABLE (For old logs)
    c.execute('''CREATE TABLE IF NOT EXISTS consumption_logs_archive (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    consumed_quantity REAL NOT NULL,
                    consumption_date DATE NOT NULL,
                    consumption_timestamp TIMESTAMP,
                    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')

    # CREATE INDEXES FOR PERFORMANCE
    c.execute("CREATE INDEX IF NOT EXISTS idx_products_user_active ON products(user_id, is_active)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_products_user_name ON products(user_id, item_name)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_logs_product_date ON consumption_logs(product_id, consumption_date)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_logs_user_date ON consumption_logs(user_id, consumption_date)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_logs_date ON consumption_logs(consumption_date)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_summary_product_date ON consumption_summary(product_id, summary_date)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_summary_user ON consumption_summary(user_id)")

    # Trigger for auto-updating product timestamp
    c.execute('''CREATE TRIGGER IF NOT EXISTS update_product_timestamp 
                 AFTER UPDATE ON products
                 BEGIN
                    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE product_id = OLD.product_id;
                 END;''')

    # Trigger for auto-updating user timestamp
    c.execute('''CREATE TRIGGER IF NOT EXISTS update_user_timestamp 
                 AFTER UPDATE ON users
                 BEGIN
                    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = OLD.user_id;
                 END;''')

    conn.commit()
    conn.close()

init_db()


# ------------------ HELPERS ------------------

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


# ------------------ AUTH ROUTES ------------------

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    email = data.get("email", "").strip()

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    hashed = hash_password(password)
    conn = get_db_connection()
    c = conn.cursor()

    try:
        c.execute("INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)", 
                  (username, hashed, email if email else None))
        conn.commit()
        user_id = c.lastrowid
        return jsonify({"success": True, "message": "User registered!", "userId": user_id})
    except sqlite3.IntegrityError as e:
        if "username" in str(e):
            return jsonify({"success": False, "message": "Username already exists"}), 409
        elif "email" in str(e):
            return jsonify({"success": False, "message": "Email already exists"}), 409
        else:
            return jsonify({"success": False, "message": "Registration failed"}), 409
    finally:
        conn.close()


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400

    hashed = hash_password(password)
    conn = get_db_connection()
    c = conn.cursor()

    user = c.execute("SELECT * FROM users WHERE username=? AND password_hash=?", 
                     (username, hashed)).fetchone()
    conn.close()

    if not user:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401

    return jsonify({
        "success": True, 
        "username": username, 
        "userId": user['user_id'],
        "email": user['email']
    })


# ------------------ PRODUCT ROUTES ------------------

@app.route('/products', methods=['GET'])
def get_products():
    user_id = request.args.get("userId")
    
    if not user_id:
        return jsonify({"success": False, "message": "userId required"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    # Get products with latest consumption rate from last 30 days
    query = """
        SELECT 
            p.product_id as id,
            p.item_name as name,
            p.consumption_unit as unit,
            p.current_quantity as quantity,
            p.initial_quantity,
            p.min_threshold,
            p.user_id,
            p.created_at,
            COALESCE(
                (SELECT AVG(avg_consumption_rate) 
                 FROM consumption_summary cs 
                 WHERE cs.product_id = p.product_id 
                 AND cs.summary_date >= date('now', '-30 days')
                ), 0) as latest_consumption_rate,
            CASE 
                WHEN COALESCE(
                    (SELECT AVG(avg_consumption_rate) 
                     FROM consumption_summary cs 
                     WHERE cs.product_id = p.product_id 
                     AND cs.summary_date >= date('now', '-30 days')
                    ), 0) > 0 
                THEN ROUND(p.current_quantity / COALESCE(
                    (SELECT AVG(avg_consumption_rate) 
                     FROM consumption_summary cs 
                     WHERE cs.product_id = p.product_id 
                     AND cs.summary_date >= date('now', '-30 days')
                    ), 1), 2)
                ELSE NULL
            END as days_left
        FROM products p
        WHERE p.user_id = ? AND p.is_active = 1
        ORDER BY p.updated_at DESC
    """
    
    rows = c.execute(query, (user_id,)).fetchall()
    conn.close()

    return jsonify([dict(r) for r in rows])


@app.route('/products', methods=['POST'])
def add_product():
    data = request.json
    
    user_id = data.get("userId")
    item_name = data.get("name", "").strip()
    unit = data.get("unit", "").strip()
    
    if not user_id or not item_name or not unit:
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    # Validate and parse quantity
    try:
        qty = float(data.get("quantity", 0))
        if qty < 0:
            return jsonify({"success": False, "message": "Quantity cannot be negative"}), 400
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid quantity format"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    try:
        # UPSERT: Insert new or update existing product
        c.execute("""
            INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity) 
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, item_name, consumption_unit) 
            DO UPDATE SET 
                current_quantity = current_quantity + excluded.current_quantity,
                initial_quantity = initial_quantity + excluded.current_quantity,
                is_active = 1,
                updated_at = CURRENT_TIMESTAMP
        """, (user_id, item_name, unit, qty, qty))

        conn.commit()
        
        # Get the product_id (either newly inserted or updated)
        product = c.execute("""
            SELECT product_id, current_quantity 
            FROM products 
            WHERE user_id=? AND item_name=? AND consumption_unit=?
        """, (user_id, item_name, unit)).fetchone()
        
        return jsonify({
            "success": True, 
            "message": "Product added/updated successfully!",
            "productId": product['product_id'],
            "newQuantity": product['current_quantity']
        })

    except Exception as e:
        conn.rollback()
        print("Error adding product:", e)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update product quantity directly"""
    data = request.json
    new_quantity = data.get("quantity")
    
    if new_quantity is None:
        return jsonify({"success": False, "message": "Quantity required"}), 400
    
    try:
        new_quantity = float(new_quantity)
        if new_quantity < 0:
            return jsonify({"success": False, "message": "Quantity cannot be negative"}), 400
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid quantity"}), 400
    
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute("UPDATE products SET current_quantity = ? WHERE product_id = ?", 
              (new_quantity, product_id))
    
    if c.rowcount == 0:
        conn.close()
        return jsonify({"success": False, "message": "Product not found"}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Product updated!"})


@app.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db_connection()
    c = conn.cursor()
    
    # Soft delete (recommended) - just mark as inactive
    c.execute("UPDATE products SET is_active = 0 WHERE product_id = ?", (product_id,))
    
    # Hard delete (uncomment if you prefer)
    # c.execute("DELETE FROM products WHERE product_id=?", (product_id,))
    
    if c.rowcount == 0:
        conn.close()
        return jsonify({"success": False, "message": "Product not found"}), 404
    
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Product deleted!"})


# ------------------ CONSUMPTION ROUTES ------------------

@app.route('/consume', methods=['POST'])
def consume():
    data = request.json
    
    product_id = data.get("productId")
    user_id = data.get("userId")
    used_qty = data.get("amount") or data.get("quantity")

    if not product_id or not user_id or not used_qty:
        return jsonify({"success": False, "message": "Missing required data"}), 400

    try:
        used_qty = float(used_qty)
        if used_qty <= 0:
            return jsonify({"success": False, "message": "Quantity must be positive"}), 400
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid quantity format"}), 400

    today = datetime.now().strftime("%Y-%m-%d")

    conn = get_db_connection()
    c = conn.cursor()

    try:
        # Check if product exists and has enough stock
        product = c.execute("""
            SELECT current_quantity, item_name 
            FROM products 
            WHERE product_id = ? AND user_id = ?
        """, (product_id, user_id)).fetchone()
        
        if not product:
            return jsonify({"success": False, "message": "Product not found"}), 404
        
        if product['current_quantity'] < used_qty:
            return jsonify({
                "success": False, 
                "message": f"Insufficient stock. Available: {product['current_quantity']}"
            }), 400

        # 1. Log the consumption
        c.execute("""
            INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) 
            VALUES (?, ?, ?, ?)
        """, (product_id, user_id, used_qty, today))

        # 2. Update current quantity in Products table
        c.execute("""
            UPDATE products 
            SET current_quantity = current_quantity - ? 
            WHERE product_id = ?
        """, (used_qty, product_id))

        # 3. Update Consumption Summary (aggregate daily consumption)
        c.execute("""
            INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed, avg_consumption_rate)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(product_id, summary_date)
            DO UPDATE SET 
                total_consumed = total_consumed + ?,
                avg_consumption_rate = total_consumed + ?
        """, (product_id, user_id, today, used_qty, used_qty, used_qty, used_qty))

        conn.commit()
        
        # Get updated quantity
        new_qty = c.execute("SELECT current_quantity FROM products WHERE product_id = ?", 
                           (product_id,)).fetchone()
        
        return jsonify({
            "success": True, 
            "message": "Consumption logged successfully!",
            "remainingQuantity": new_qty['current_quantity']
        })

    except Exception as e:
        conn.rollback()
        print("Error logging consumption:", e)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/consumption/<int:product_id>', methods=['GET'])
def get_logs(product_id):
    """Get consumption logs for a specific product"""
    limit = request.args.get("limit", 30)  # Default last 30 logs
    
    conn = get_db_connection()
    c = conn.cursor()

    logs = c.execute("""
        SELECT 
            log_id as id, 
            consumed_quantity as quantity_used, 
            consumption_date as date,
            consumption_timestamp as timestamp
        FROM consumption_logs 
        WHERE product_id = ? 
        ORDER BY consumption_date DESC, consumption_timestamp DESC
        LIMIT ?
    """, (product_id, limit)).fetchall()

    conn.close()

    return jsonify([dict(l) for l in logs])


@app.route('/analytics/<int:user_id>', methods=['GET'])
def get_analytics(user_id):
    """Get consumption analytics for user"""
    days = request.args.get("days", 30)
    
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get daily consumption trend
    trend = c.execute("""
        SELECT 
            summary_date as date,
            SUM(total_consumed) as total_consumption
        FROM consumption_summary
        WHERE user_id = ? 
        AND summary_date >= date('now', '-' || ? || ' days')
        GROUP BY summary_date
        ORDER BY summary_date ASC
    """, (user_id, days)).fetchall()
    
    # Get top consumed products
    top_products = c.execute("""
        SELECT 
            p.item_name as name,
            p.consumption_unit as unit,
            SUM(cs.total_consumed) as total
        FROM consumption_summary cs
        JOIN products p ON cs.product_id = p.product_id
        WHERE cs.user_id = ?
        AND cs.summary_date >= date('now', '-' || ? || ' days')
        GROUP BY p.product_id, p.item_name, p.consumption_unit
        ORDER BY total DESC
        LIMIT 10
    """, (user_id, days)).fetchall()
    
    conn.close()
    
    return jsonify({
        "trend": [dict(t) for t in trend],
        "topProducts": [dict(p) for p in top_products]
    })


# ------------------ MAINTENANCE ROUTES ------------------

@app.route('/admin/archive-logs', methods=['POST'])
def archive_old_logs():
    """Archive logs older than 6 months"""
    six_months_ago = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
    
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # Copy to archive
        c.execute("""
            INSERT INTO consumption_logs_archive 
            (product_id, user_id, consumed_quantity, consumption_date, consumption_timestamp)
            SELECT product_id, user_id, consumed_quantity, consumption_date, consumption_timestamp
            FROM consumption_logs 
            WHERE consumption_date < ?
        """, (six_months_ago,))
        
        archived = c.rowcount
        
        # Delete from main table
        c.execute("DELETE FROM consumption_logs WHERE consumption_date < ?", (six_months_ago,))
        
        conn.commit()
        
        return jsonify({
            "success": True, 
            "message": f"Archived {archived} logs older than 6 months"
        })
    
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@app.route('/admin/cleanup-logs', methods=['POST'])
def cleanup_old_logs():
    """Delete logs older than 1 year (keep summaries)"""
    one_year_ago = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute("DELETE FROM consumption_logs WHERE consumption_date < ?", (one_year_ago,))
    deleted = c.rowcount
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True, 
        "message": f"Deleted {deleted} logs older than 1 year"
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        user_count = c.execute("SELECT COUNT(*) as count FROM users").fetchone()['count']
        product_count = c.execute("SELECT COUNT(*) as count FROM products WHERE is_active = 1").fetchone()['count']
        log_count = c.execute("SELECT COUNT(*) as count FROM consumption_logs").fetchone()['count']
        
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "users": user_count,
            "active_products": product_count,
            "consumption_logs": log_count
        })
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


if __name__ == '__main__':
    print("🚀 Starting Grocery Management System...")
    print("📊 Database:", DB_NAME)
    print("🔧 Server running on http://localhost:5000")
    app.run(debug=True, port=5000)