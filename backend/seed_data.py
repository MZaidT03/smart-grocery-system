import sqlite3
import random
from datetime import datetime, timedelta
import sys
import os

# Ensure we can import from utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils import hash_password

# Configuration
DB_NAME = "grocery.db"
USER_ID = 3
USERNAME = "TestUser"
EMAIL = "test@demo.com"
RAW_PASSWORD = "password123" 

def get_db():
    return sqlite3.connect(DB_NAME)

def seed_user(conn):
    print(f"👤 Fixing Test User (ID: {USER_ID})...")
    real_hash = hash_password(RAW_PASSWORD)
    
    # FIX: Using 'diet_preference' based on your schema
    try:
        conn.execute(
            """INSERT OR REPLACE INTO users (user_id, username, email, password_hash, household_size, diet_preference) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (USER_ID, USERNAME, EMAIL, real_hash, 4, "Non-Veg")
        )
    except Exception as e:
        print(f"   ⚠️ User Seed Error: {e}")

def seed_products(conn):
    print("📦 Seeding Inventory Products...")
    products = [
        ("Super Basmati Rice", "kg", 10.0, "Staples", 350, 5, 30),
        ("Wheat Flour (Atta)", "kg", 20.0, "Staples", 180, 10, 30),
        ("Dawn Bread Large", "packet", 2.0, "Bakery", 220, 1, 3),
        ("Chicken Breast", "kg", 5.0, "Meat", 850, 2, 7),
        ("Eggs (Dozen)", "dozen", 3.0, "Dairy", 320, 1, 4),
        ("Daal Chana", "kg", 4.0, "Pulses", 280, 1, 15),
        ("Milk Pack", "liters", 12.0, "Dairy", 260, 2, 1),
        ("Cooking Oil", "liters", 5.0, "Oil & Ghee", 550, 3, 30),
        ("Bananas", "dozen", 2.0, "Fruits", 150, 1, 3),
        ("Onions", "kg", 5.0, "Vegetables", 120, 2, 10),
        ("Tomatoes", "kg", 3.0, "Vegetables", 180, 1, 7),
        ("Lays Masala", "packet", 15.0, "Snacks", 100, 2, 5),
        ("Coke 1.5L", "bottle", 6.0, "Beverages", 160, 2, 7),
        ("Ketchup", "bottle", 1.0, "Condiments", 450, 1, 30)
    ]

    product_map = {} 

    for name, unit, qty, cat, price, f_qty, f_days in products:
        cursor = conn.execute(
            """INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, price, usage_freq_qty, usage_freq_days, is_active) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
               ON CONFLICT(user_id, item_name, consumption_unit) DO UPDATE SET 
               current_quantity = ?, price = ?
               RETURNING product_id""",
            (USER_ID, name, unit, qty, qty, cat, price, f_qty, f_days, qty, price)
        )
        pid = cursor.fetchone()[0]
        product_map[name] = pid
    
    return product_map

def seed_consumption_logs(conn, product_map):
    print("📊 Generating 6 Months of Consumption History...")
    conn.execute("DELETE FROM consumption_logs WHERE user_id = ?", (USER_ID,))
    
    today = datetime.now()
    
    # 1. High Frequency Items
    for item in ["Milk Pack", "Eggs (Dozen)", "Dawn Bread Large", "Coke 1.5L"]:
        pid = product_map.get(item)
        if not pid: continue
        for _ in range(25):
            days_ago = random.randint(1, 90)
            date_str = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")
            conn.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)",
                         (pid, USER_ID, random.uniform(0.5, 2.0), date_str))

    # 2. Velocity Trend Data
    for i in range(6):
        month_offset = 5 - i 
        num_logs = 10 + (i * 5) 
        for _ in range(num_logs):
            rand_prod = random.choice(list(product_map.values()))
            days_ago = (month_offset * 30) + random.randint(1, 28)
            date_str = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")
            conn.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)",
                         (rand_prod, USER_ID, random.uniform(0.1, 1.5), date_str))

def seed_consumption_summary(conn):
    print("🧠 Syncing Smart Prediction Data (Consumption Summary)...")
    conn.execute("DELETE FROM consumption_summary WHERE user_id = ?", (USER_ID,))
    
    conn.execute("""
        INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed, avg_consumption_rate)
        SELECT product_id, user_id, date(consumption_date), SUM(consumed_quantity), SUM(consumed_quantity)
        FROM consumption_logs
        WHERE user_id = ?
        GROUP BY product_id, date(consumption_date)
    """, (USER_ID,))

def seed_spending_logs(conn):
    print("💰 Generating Spending Logs...")
    
    # FIX: Drop and Recreate Table to ensure 'user_id' column exists
    conn.execute("DROP TABLE IF EXISTS spending_logs")
    conn.execute("""
        CREATE TABLE spending_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            month_str TEXT,
            total_spent REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    today = datetime.now()
    for i in range(6):
        month_date = today - timedelta(days=30 * (5-i))
        month_str = month_date.strftime("%b") # Jan, Feb...
        
        # Increasing spending trend
        spent = 5000 + (i * 1500) + random.randint(-500, 500)
        
        conn.execute("INSERT INTO spending_logs (user_id, month_str, total_spent) VALUES (?, ?, ?)",
                     (USER_ID, month_str, spent))

def seed_price_history(conn, product_map):
    print("📈 Generating Price History (Inflation Data)...")
    conn.execute("DELETE FROM price_history WHERE item_name IN (SELECT item_name FROM products WHERE user_id=?)", (USER_ID,))
    
    today = datetime.now()
    
    # Create history for a few key items
    for item_name in ["Milk Pack", "Cooking Oil", "Chicken Breast", "Eggs (Dozen)"]:
        base_price = 200 # Dummy base
        for i in range(3):
            # Create a price from 3 months ago, 2 months ago, etc.
            past_date = (today - timedelta(days=30 * (3-i))).strftime("%Y-%m-%d")
            # Price increases slightly each month
            hist_price = base_price + (i * 20) 
            conn.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, ?)",
                         (item_name, hist_price, past_date))

def seed_main():
    try:
        conn = get_db()
        seed_user(conn)
        p_map = seed_products(conn)
        seed_consumption_logs(conn, p_map)
        seed_consumption_summary(conn)
        seed_spending_logs(conn)        
        seed_price_history(conn, p_map)
        
        conn.commit()
        print("\n✅ FULL SYSTEM SEED COMPLETE!")
        print(f"👉 Login with: {USERNAME} / {RAW_PASSWORD}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_main()