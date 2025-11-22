import sqlite3
import random
from datetime import datetime, timedelta

DB_NAME = "grocery.db"

def seed_data():
    print(f"🔌 Connecting to database: {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # 1. Ensure User ID 1 exists
    user_id = 1
    user = c.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,)).fetchone()
    
    if not user:
        print("👤 Creating Admin User...")
        c.execute("INSERT OR IGNORE INTO users (user_id, username, password_hash, email) VALUES (?, ?, ?, ?)", 
                  (1, "admin", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", "admin@example.com"))
        conn.commit()

    # ---------------------------------------------------------
    # 2. Define Products to Seed
    # Format: (Name, Unit, Category, Initial_Qty, Approx_Daily_Consumption)
    # ---------------------------------------------------------
    products_data = [
        ("Milk (Tetra Pack)", "liters", "Dairy", 12.0, 0.8),
        ("Wheat Flour (Atta)", "kg", "Staples", 20.0, 0.5),   # FIXED ORDER
        ("Basmati Rice", "kg", "Staples", 10.0, 0.3),         # FIXED ORDER
        ("Eggs", "dozen", "Dairy", 4.0, 0.2),
        ("Cooking Oil", "liters", "Oil & Ghee", 5.0, 0.15),
        ("Potatoes", "kg", "Vegetables", 5.0, 0.3),
        ("Onions", "kg", "Vegetables", 4.0, 0.2),
        ("Tomatoes", "kg", "Vegetables", 3.0, 0.25),
        ("Chicken Breast", "kg", "Meat", 5.0, 0.6),
        ("Tea Leaves", "kg", "Beverages", 1.0, 0.05),
        ("Sugar", "kg", "Staples", 3.0, 0.1),
        ("Red Chili Powder", "kg", "Spices", 0.5, 0.01),
        ("Salt", "kg", "Spices", 1.0, 0.02),
        ("Dish Soap", "liters", "Other", 2.0, 0.05),
        ("Bread (Large)", "packet", "Bakery", 3.0, 0.3),
    ]

    print("🧹 Cleaning old data for User 1...")
    c.execute("DELETE FROM products WHERE user_id = ?", (user_id,))
    c.execute("DELETE FROM consumption_logs WHERE user_id = ?", (user_id,))
    c.execute("DELETE FROM consumption_summary WHERE user_id = ?", (user_id,))

    print("📦 Seeding Products & Generating 30-Day History...")
    
    count_products = 0
    count_logs = 0

    for name, unit, category, init_qty, daily_usage in products_data:
        # --- A. Insert Product into 'products' table ---
        # We set current_quantity slightly lower than initial to simulate usage
        current_qty = max(0, init_qty - (daily_usage * 5)) 
        
        c.execute("""
            INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, min_threshold, category, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (user_id, name, unit, current_qty, init_qty, 2.0, category))
        
        product_id = c.lastrowid
        count_products += 1

        # --- B. Generate 30 Days of Consumption History ---
        today = datetime.now()
        
        for i in range(30):
            day_date = today - timedelta(days=(30 - i))
            date_str = day_date.strftime("%Y-%m-%d")

            # Add randomness to daily usage (+/- 40%)
            variance = random.uniform(0.6, 1.4)
            consumed_amount = round(daily_usage * variance, 2)

            # Randomly skip some days (people don't use everything every day)
            if random.random() > 0.2: 
                c.execute("""
                    INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date)
                    VALUES (?, ?, ?, ?)
                """, (product_id, user_id, consumed_amount, date_str))

                c.execute("""
                    INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed, avg_consumption_rate, days_in_period)
                    VALUES (?, ?, ?, ?, ?, 1)
                """, (product_id, user_id, date_str, consumed_amount, consumed_amount))
                
                count_logs += 1

    conn.commit()
    conn.close()
    print("------------------------------------------------")
    print(f"✅ Success!")
    print(f"   - Products Created: {count_products}")
    print(f"   - Consumption Logs Generated: {count_logs}")
    print("------------------------------------------------")
    print("📊 Dashboard is now ready with analytics data.")

if __name__ == "__main__":
    seed_data()