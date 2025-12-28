import sqlite3
from config import DB_NAME

def get_db_connection():
    conn = sqlite3.connect(DB_NAME, detect_types=sqlite3.PARSE_DECLTYPES|sqlite3.PARSE_COLNAMES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    print(f"🔧 Connecting to {DB_NAME}...")
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

    # 2. PRODUCTS (Inventory) - Now includes price in definition
    c.execute('''CREATE TABLE IF NOT EXISTS products (
                    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    consumption_unit TEXT NOT NULL,
                    current_quantity REAL NOT NULL DEFAULT 0,
                    initial_quantity REAL NOT NULL DEFAULT 0,
                    usage_freq_qty REAL DEFAULT 1, 
                    usage_freq_days INTEGER DEFAULT 1,
                    min_threshold REAL DEFAULT 0,
                    category TEXT DEFAULT 'Other',
                    is_active INTEGER DEFAULT 1,
                    price REAL DEFAULT 0,
                    last_auto_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
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

    # 8. PRODUCT BATCHES
    c.execute("""CREATE TABLE IF NOT EXISTS product_batches (
                    batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER,
                    quantity REAL,
                    expiry_date DATE,
                    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(product_id) REFERENCES products(product_id)
                )""")

    # 9. PRICE HISTORY
    c.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT,
            price REAL,
            date DATE
        )
    """)

    # --- MIGRATION CHECK ---
    # Attempt to add 'price' column if it was missing in an old database version
    try:
        c.execute("ALTER TABLE products ADD COLUMN price REAL DEFAULT 0")
        print("✅ Added 'price' column to products table (Migration).")
    except sqlite3.OperationalError:
        # This error means the column likely already exists, which is fine
        pass

    conn.commit()
    conn.close()
    print("✅ Database schema initialized successfully.")

if __name__ == "__main__":
    init_db()