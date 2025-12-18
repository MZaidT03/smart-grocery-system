import sqlite3

DB_NAME = "grocery.db"

def fix_products_table():
    print(f"🔧 Connecting to {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # 1. Drop the old table (Warning: This clears current inventory)
    print("⚠️  Dropping old 'products' table...")
    c.execute("DROP TABLE IF EXISTS products")

    # 2. Create the new table with the correct UNIQUE constraint
    print("✨ Creating new 'products' table with ON CONFLICT support...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS products (
            product_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            consumption_unit TEXT NOT NULL,
            category TEXT,
            current_quantity REAL DEFAULT 0,
            initial_quantity REAL DEFAULT 0,
            usage_freq_qty REAL,
            usage_freq_days REAL,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- THIS IS THE MISSING PART THAT CAUSED THE 500 ERROR:
            UNIQUE(user_id, item_name, consumption_unit)
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Schema fixed! You can now confirm your shopping list.")

if __name__ == "__main__":
    fix_products_table()