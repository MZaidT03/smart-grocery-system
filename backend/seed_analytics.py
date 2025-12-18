import sqlite3
import random
from datetime import datetime, timedelta

DB_NAME = "grocery.db"

def seed_analytics_data():
    print(f"📊 Connecting to {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # 1. Add 'price' column to products if not exists
    try:
        c.execute("ALTER TABLE products ADD COLUMN price REAL DEFAULT 0")
        print("✅ Added 'price' column to products table.")
    except sqlite3.OperationalError:
        print("ℹ️ 'price' column already exists.")

    # 2. Create 'price_history' table for Inflation Tracker
    c.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT,
            price REAL,
            date DATE
        )
    """)
    
    # 3. Create 'spending_logs' table for Monthly Trends
    c.execute("""
        CREATE TABLE IF NOT EXISTS spending_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month_str TEXT, -- e.g., "2025-10"
            total_spent REAL
        )
    """)

    print("⚙️ Generating realistic fake data for analytics...")

    # --- FIX: Changed 'quantity' to 'current_quantity' ---
    try:
        products = c.execute("SELECT item_name, current_quantity, usage_freq_qty, usage_freq_days FROM products").fetchall()
    except sqlite3.OperationalError as e:
        print(f"❌ Error reading products: {e}")
        return

    # Base prices (approximate PKR)
    base_prices = {
        "milk": 280, "bread": 180, "eggs": 40, "chicken": 700, "rice": 350,
        "oil": 550, "tea": 1400, "sugar": 160, "onion": 120, "potato": 90,
        "tomato": 150, "beef": 1200, "mutton": 2200, "shampoo": 600
    }

    total_monthly_spend = {} 
    today = datetime.now()

    for prod in products:
        name = prod[0]
        # Find a base price match or default to 200
        price = 200
        for key, val in base_prices.items():
            if key in name.lower():
                price = val
                break
        
        # Update current price in DB
        c.execute("UPDATE products SET price = ? WHERE item_name = ?", (price, name))

        # --- GENERATE 6 MONTHS OF PRICE HISTORY (INFLATION) ---
        for i in range(6, -1, -1):
            month_date = today - timedelta(days=30 * i)
            month_str = month_date.strftime("%Y-%m")
            
            # Fluctuate price slightly + Inflation trend
            historical_price = price * (0.85 + (0.02 * (6 - i)) + (random.uniform(-0.05, 0.05)))
            historical_price = round(historical_price)

            c.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, ?)", 
                      (name, historical_price, month_date.strftime("%Y-%m-%d")))

            # Calculate estimated monthly spend
            if prod[3] and prod[3] > 0: # Avoid div by zero
                daily_usage = prod[2] / prod[3]
                monthly_cost = daily_usage * 30 * historical_price
                
                total_monthly_spend[month_str] = total_monthly_spend.get(month_str, 0) + monthly_cost

    # 4. Insert aggregated spending logs
    c.execute("DELETE FROM spending_logs") # Clear old seeds
    for month, total in total_monthly_spend.items():
        # Add some random noise
        final_total = total * random.uniform(0.9, 1.1)
        c.execute("INSERT INTO spending_logs (month_str, total_spent) VALUES (?, ?)", (month, round(final_total)))

    conn.commit()
    conn.close()
    print("✅ Success! Database seeded with Analytics data.")

if __name__ == "__main__":
    seed_analytics_data()