import sqlite3
import random
from datetime import datetime, timedelta
import sys
import os

# Ensure we can import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from utils import hash_password
except ImportError:
    # Fallback if utils.py isn't found/configured yet
    import hashlib
    def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()

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
    
    try:
        conn.execute(
            """INSERT OR REPLACE INTO users (user_id, username, email, password_hash, household_size, diet_preference) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (USER_ID, USERNAME, EMAIL, real_hash, 4, "Non-Veg")
        )
    except Exception as e:
        print(f"   ⚠️ User Seed Error: {e}")

def seed_products_and_batches(conn):
    print("📦 Seeding Inventory & Batches (FIFO)...")
    
    # Check if batches table exists, create if not (safety check)
    conn.execute("""CREATE TABLE IF NOT EXISTS product_batches (
                    batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER,
                    quantity REAL,
                    expiry_date DATE,
                    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(product_id) REFERENCES products(product_id)
                )""")

    # Clear old data
    conn.execute("DELETE FROM product_batches WHERE product_id IN (SELECT product_id FROM products WHERE user_id=?)", (USER_ID,))
    conn.execute("DELETE FROM products WHERE user_id=?", (USER_ID,))

    # Data Structure: 
    # (Name, Unit, TotalQty, Category, Price, FreqQty, FreqDays, [Batch_Days_From_Now_List])
    # Batch List: [2, 10] means Batch 1 expires in 2 days, Batch 2 in 10 days.
    
    products = [
        # --- HIGH VALUE (Class A) ---
        ("Super Basmati Rice", "kg", 20.0, "Staples", 350, 5, 30, [180]), # 6 months exp
        ("Olive Oil (Imported)", "liters", 3.0, "Oil & Ghee", 2500, 0.5, 30, [365]),
        ("Frozen Prawns", "packet", 4.0, "Seafood", 1800, 1, 14, [60]),
        
        # --- MEDIUM VALUE (Class B) ---
        ("Chicken Breast", "kg", 5.0, "Meat", 850, 2, 7, [4]), # Expiring soon
        ("Cooking Oil", "liters", 10.0, "Oil & Ghee", 550, 3, 30, [90, 120]), # 2 Batches
        ("Tea (Danedar)", "packet", 2.0, "Beverages", 1400, 1, 30, [300]),
        ("Milk Pack", "liters", 12.0, "Dairy", 280, 2, 1, [5, 15, 30]), # 3 Batches (FIFO test)
        
        # --- LOW VALUE / HIGH FREQ (Class C) ---
        ("Dawn Bread Large", "packet", 2.0, "Bakery", 220, 1, 3, [3]), # Alert!
        ("Eggs (Dozen)", "dozen", 3.0, "Dairy", 350, 1, 4, [10]),
        ("Bananas", "dozen", 2.0, "Fruits", 150, 1, 3, [2]), # Critical Alert
        ("Tomatoes", "kg", 3.0, "Vegetables", 180, 1, 7, [5]),
        ("Lays Masala", "packet", 15.0, "Snacks", 100, 2, 5, [60]),
        ("Coke 1.5L", "bottle", 6.0, "Beverages", 160, 2, 7, [90]),
        ("Yogurt", "kg", 2.0, "Dairy", 240, 0.5, 1, [-1]), # EXPIRED ITEM (Test Red Alert)
    ]

    product_map = {} 

    for name, unit, total_qty, cat, price, f_qty, f_days, batch_days in products:
        # 1. Insert Product
        cursor = conn.execute(
            """INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, price, usage_freq_qty, usage_freq_days, is_active) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
               RETURNING product_id""",
            (USER_ID, name, unit, total_qty, total_qty, cat, price, f_qty, f_days)
        )
        pid = cursor.fetchone()[0]
        product_map[name] = pid

        # 2. Insert Batches
        # Distribute total quantity across batches evenly for simplicity
        qty_per_batch = total_qty / len(batch_days)
        today = datetime.now()
        
        for days in batch_days:
            exp_date = (today + timedelta(days=days)).strftime("%Y-%m-%d")
            conn.execute(
                "INSERT INTO product_batches (product_id, quantity, expiry_date) VALUES (?, ?, ?)",
                (pid, qty_per_batch, exp_date)
            )
    
    return product_map

def seed_consumption_logs(conn, product_map):
    print("📊 Generating Seasonal Consumption Trends...")
    conn.execute("DELETE FROM consumption_logs WHERE user_id = ?", (USER_ID,))
    
    today = datetime.now()
    
    # 1. Simulate "Winter" (Dec/Jan) - High usage of Coffee, Soup (Simulated via existing items)
    # We will fake High usage of "Chicken" and "Eggs" in winter
    winter_items = ["Chicken Breast", "Eggs (Dozen)", "Tea (Danedar)"]
    
    # 2. Simulate "Summer" (Jun/Jul) - High usage of Drinks
    summer_items = ["Coke 1.5L", "Yogurt", "Milk Pack"]

    # Generate logs for last 12 months
    for i in range(365):
        date_obj = today - timedelta(days=i)
        date_str = date_obj.strftime("%Y-%m-%d %H:%M:%S")
        month = date_obj.month
        
        # Determine active season items
        active_items = []
        if month in [12, 1, 2]: # Winter
            active_items = winter_items
        elif month in [6, 7, 8]: # Summer
            active_items = summer_items
        else:
            active_items = ["Dawn Bread Large", "Super Basmati Rice"] # Normal

        # 30% chance to consume an item on any given day
        if random.random() < 0.3:
            item_name = random.choice(active_items)
            pid = product_map.get(item_name)
            if pid:
                qty = random.uniform(1.0, 3.0)
                conn.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)",
                             (pid, USER_ID, qty, date_str))

def seed_consumption_summary(conn):
    print("🧠 Syncing Analytics Data...")
    conn.execute("DELETE FROM consumption_summary WHERE user_id = ?", (USER_ID,))
    
    conn.execute("""
        INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed, avg_consumption_rate)
        SELECT product_id, user_id, date(consumption_date), SUM(consumed_quantity), SUM(consumed_quantity)
        FROM consumption_logs
        WHERE user_id = ?
        GROUP BY product_id, date(consumption_date)
    """, (USER_ID,))

def seed_price_history(conn):
    print("📈 Generating Inflation Data...")
    conn.execute("DELETE FROM price_history")
    
    today = datetime.now()
    items = [
        ("Cooking Oil", 450, 550), # Price rose from 450 to 550
        ("Milk Pack", 220, 280),
        ("Eggs (Dozen)", 250, 350),
        ("Super Basmati Rice", 300, 350)
    ]

    for name, start_price, end_price in items:
        # Generate 6 data points over 6 months
        for i in range(6):
            date_str = (today - timedelta(days=30 * (5-i))).strftime("%Y-%m-%d")
            # Linear interpolation of price
            price = start_price + ((end_price - start_price) / 5) * i
            conn.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, ?)",
                         (name, price, date_str))

def seed_main():
    try:
        conn = get_db()
        seed_user(conn)
        p_map = seed_products_and_batches(conn) # Now handles batches!
        seed_consumption_logs(conn, p_map)      # Now handles seasons!
        seed_consumption_summary(conn)
        seed_price_history(conn)
        
        conn.commit()
        print("\n✅ FULL SYSTEM SEED COMPLETE!")
        print("   - Expiry Batches: Created (Check 'Yogurt' for expired alert)")
        print("   - Seasonal Trends: Generated (Winter vs Summer patterns)")
        print("   - ABC Analysis: Data ready (High Value: Rice/Oil)")
        print(f"👉 Login with: {USERNAME} / {RAW_PASSWORD}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    seed_main()