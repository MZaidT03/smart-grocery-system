import sqlite3
from datetime import datetime, timedelta
import random

DB_NAME = 'grocery.db'

def seed_comprehensive_data(user_id=16):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    print(f"🔧 Seeding comprehensive data for User {user_id}...")

    # 1. Define 10 specific items
    items = [
        ("Fresh Milk", "Liters", "Dairy"),
        ("Eggs", "Dozen", "Dairy"),
        ("Bread", "Pack", "Bakery"),
        ("Butter", "Pack", "Dairy"),
        ("Coffee", "Jar", "Beverages"),
        ("Tea", "Pack", "Beverages"),
        ("Sugar", "Kg", "Staples"),
        ("Apples", "Kg", "Fruits"),
        ("Bananas", "Dozen", "Fruits"),
        ("Chicken", "Kg", "Meat")
    ]

    product_ids = {}

    # Insert items into products if they don't exist
    for name, unit, category in items:
        # Check if exists
        c.execute("SELECT product_id FROM products WHERE user_id=? AND item_name=?", (user_id, name))
        row = c.fetchone()
        if row:
            product_ids[name] = row[0]
        else:
            c.execute("""
                INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, usage_freq_qty, usage_freq_days, price, is_active) 
                VALUES (?, ?, ?, 10.0, 10.0, ?, 1.0, 7.0, 0.0, 1)
            """, (user_id, name, unit, category))
            product_ids[name] = c.lastrowid

    print("✅ Created 10 products.")

    # 2. Seed `manual_consumption_logs` for Pattern Testing (Market Basket)
    # We will simulate 10 days of consumption.
    # Pattern 1: Bread + Butter + Eggs
    # Pattern 2: Coffee + Sugar
    
    dates_for_patterns = [(datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d") for d in range(1, 11)]
    
    c.execute("DELETE FROM manual_consumption_logs WHERE user_id=?", (user_id,))
    
    for d in dates_for_patterns:
        # Breakfast combo
        c.execute("INSERT INTO manual_consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)", (product_ids["Bread"], user_id, 1, d))
        c.execute("INSERT INTO manual_consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)", (product_ids["Butter"], user_id, 0.1, d))
        c.execute("INSERT INTO manual_consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)", (product_ids["Eggs"], user_id, 0.2, d))
        
        # Beverage combo (Only on even days)
        if int(d[-1]) % 2 == 0:
            c.execute("INSERT INTO manual_consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)", (product_ids["Coffee"], user_id, 0.05, d))
            c.execute("INSERT INTO manual_consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)", (product_ids["Sugar"], user_id, 0.1, d))

    print("✅ Seeded Manual Consumption Logs (Bread+Butter+Eggs, Coffee+Sugar).")

    # 3. Seed `consumption_logs` for Prophet Forecasting for ALL 10 products
    # We need at least 14 days. We will generate 30 days of data.
    
    c.execute("DELETE FROM consumption_logs WHERE user_id=?", (user_id,))
    
    for d in range(30, 0, -1):
        target_date = datetime.now() - timedelta(days=d)
        date_str = target_date.strftime("%Y-%m-%d")
        weekday = target_date.weekday()
        
        for name, unit, category in items:
            pid = product_ids[name]
            
            # Generate different patterns based on item name
            if name in ["Fresh Milk", "Eggs", "Bread", "Butter"]:
                # High weekend usage
                qty = random.uniform(1.5, 2.5) if weekday >= 5 else random.uniform(0.3, 0.8)
            elif name in ["Coffee", "Tea", "Sugar"]:
                # Steady daily usage
                qty = random.uniform(0.1, 0.2)
            elif name in ["Apples", "Bananas"]:
                # Weekly grocery run spike (e.g. bought/consumed a lot on Mondays)
                qty = random.uniform(3.0, 5.0) if weekday == 0 else random.uniform(0.5, 1.0)
            elif name == "Chicken":
                # Only consumed on weekends
                qty = random.uniform(1.0, 2.0) if weekday >= 5 else 0.0
            else:
                qty = random.uniform(0.5, 1.5)
                
            # Insert if qty > 0 to simulate realistic missing days
            if qty > 0.05:
                c.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)", 
                          (pid, user_id, round(qty, 2), date_str))

    conn.commit()
    conn.close()
    print("✅ Seeded Consumption Logs for Forecasting for ALL 10 products.")
    print(f"🎉 All done! You can now test Prophet on all 10 products.")

if __name__ == "__main__":
    seed_comprehensive_data()
