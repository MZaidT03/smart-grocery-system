import sqlite3

DB_NAME = "grocery.db"

def setup_price_tables():
    print(f"🔧 Connecting to {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # 1. Add 'price' column to 'products' if it doesn't exist
    try:
        c.execute("ALTER TABLE products ADD COLUMN price REAL DEFAULT 0")
        print("✅ Added 'price' column to products table.")
    except sqlite3.OperationalError:
        print("ℹ️ 'price' column already exists in products.")

    # 2. Create 'price_history' table
    c.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT,
            price REAL,
            date DATE
        )
    """)
    print("✅ Created 'price_history' table.")

    conn.commit()
    conn.close()
    print("🚀 Database ready for scraping.")

if __name__ == "__main__":
    setup_price_tables()