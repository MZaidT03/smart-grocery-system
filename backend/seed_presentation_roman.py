import sqlite3
import random
from datetime import datetime, timedelta
import sys

# Import the hash function to create a valid login
from utils import hash_password

DB_NAME = 'grocery.db'

def seed_roman_presentation():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    username = "Roman"
    password = "123456"

    print(f"🔧 Starting Presentation Seeding for user '{username}'...")

    # 1. CLEANUP EXISITNG ROMAN ACCOUNT
    c.execute("SELECT user_id FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    if row:
        user_id = row[0]
        print(f"🧹 Found existing '{username}' (ID: {user_id}). Wiping their old data...")
        c.execute("DELETE FROM products WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM consumption_logs WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM manual_consumption_logs WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM consumption_summary WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM budget_expenses WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM users WHERE user_id = ?", (user_id,))
    
    # 2. CREATE ROMAN ACCOUNT
    hashed_pw = hash_password(password)
    c.execute("""
        INSERT INTO users (username, password_hash, email, household_size, diet_preference)
        VALUES (?, ?, ?, ?, ?)
    """, (username, hashed_pw, f"{username.lower()}@example.com", 4, "Non-Veg"))
    user_id = c.lastrowid
    print(f"✅ Created User '{username}' with ID: {user_id}")

    # 3. DEFINE 50 PRODUCTS
    # Format: Name, Unit, Category, Base Price, Pattern Type ('daily', 'weekend', 'weekly', 'rare')
    raw_products = [
        ("Fresh Milk", "Liters", "Dairy", 250, "daily"),
        ("Eggs", "Dozen", "Dairy", 300, "weekend"),
        ("Bread", "Pack", "Bakery", 120, "daily"),
        ("Butter", "Pack", "Dairy", 400, "weekly"),
        ("Cheese Slice", "Pack", "Dairy", 600, "weekend"),
        ("Yogurt", "Kg", "Dairy", 200, "daily"),
        
        ("Chicken Breast", "Kg", "Meat", 850, "weekend"),
        ("Beef Mince", "Kg", "Meat", 1200, "weekly"),
        ("Fish Fillet", "Kg", "Meat", 1500, "rare"),
        ("Mutton", "Kg", "Meat", 2200, "rare"),

        ("Apples", "Kg", "Produce", 350, "daily"),
        ("Bananas", "Dozen", "Produce", 150, "daily"),
        ("Oranges", "Kg", "Produce", 250, "weekly"),
        ("Grapes", "Kg", "Produce", 400, "weekend"),
        ("Mangoes", "Kg", "Produce", 300, "rare"),
        
        ("Onions", "Kg", "Produce", 80, "daily"),
        ("Tomatoes", "Kg", "Produce", 120, "daily"),
        ("Potatoes", "Kg", "Produce", 70, "daily"),
        ("Garlic", "Kg", "Produce", 600, "weekly"),
        ("Ginger", "Kg", "Produce", 800, "weekly"),
        ("Spinach", "Bundle", "Produce", 50, "weekend"),
        ("Carrots", "Kg", "Produce", 100, "weekly"),

        ("Basmati Rice", "Kg", "Pantry", 400, "daily"),
        ("Wheat Flour", "Kg", "Pantry", 150, "daily"),
        ("Cooking Oil", "Liters", "Pantry", 500, "weekly"),
        ("Sugar", "Kg", "Pantry", 140, "daily"),
        ("Salt", "Pack", "Pantry", 50, "rare"),
        ("Lentils (Daal)", "Kg", "Pantry", 300, "weekly"),
        ("Chickpeas", "Kg", "Pantry", 450, "weekly"),
        ("Red Chili Powder", "Pack", "Pantry", 200, "rare"),
        ("Turmeric Powder", "Pack", "Pantry", 180, "rare"),
        ("Coriander Powder", "Pack", "Pantry", 150, "rare"),
        ("Pasta", "Pack", "Pantry", 250, "weekend"),
        ("Ketchup", "Bottle", "Pantry", 400, "weekly"),
        ("Mayonnaise", "Jar", "Pantry", 450, "weekly"),

        ("Tea Leaves", "Pack", "Beverages", 500, "daily"),
        ("Coffee", "Jar", "Beverages", 1200, "daily"),
        ("Green Tea", "Box", "Beverages", 300, "daily"),
        ("Juice Box", "Liters", "Beverages", 250, "weekend"),
        ("Soda", "Bottle", "Beverages", 150, "weekend"),

        ("Biscuits", "Pack", "Snacks", 100, "daily"),
        ("Potato Chips", "Pack", "Snacks", 80, "weekend"),
        ("Chocolates", "Bar", "Snacks", 200, "weekend"),
        ("Mixed Nuts", "Pack", "Snacks", 1500, "weekly"),
        
        ("Dish Soap", "Bottle", "Household", 300, "rare"),
        ("Laundry Detergent", "Kg", "Household", 800, "rare"),
        ("Toilet Paper", "Rolls", "Household", 600, "weekly"),
        ("Shampoo", "Bottle", "Household", 700, "rare"),
        ("Toothpaste", "Tube", "Household", 250, "rare"),
        ("Trash Bags", "Pack", "Household", 350, "rare")
    ]

    product_metadata = {}
    print(f"📦 Adding {len(raw_products)} products to Inventory...")

    for name, unit, category, price, pattern in raw_products:
        # Generate some realistic current stock based on pattern
        if pattern == 'daily':
            current_qty = random.uniform(2.0, 10.0)
            freq_qty = 1.0
            freq_days = 1.0
        elif pattern == 'weekend':
            current_qty = random.uniform(1.0, 5.0)
            freq_qty = 2.0
            freq_days = 7.0
        elif pattern == 'weekly':
            current_qty = random.uniform(0.5, 3.0)
            freq_qty = 1.0
            freq_days = 7.0
        else: # rare
            current_qty = random.uniform(0.5, 2.0)
            freq_qty = 1.0
            freq_days = 30.0

        c.execute("""
            INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, usage_freq_qty, usage_freq_days, price, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (user_id, name, unit, round(current_qty, 2), round(current_qty, 2), category, freq_qty, freq_days, price))
        
        pid = c.lastrowid
        product_metadata[pid] = {"name": name, "pattern": pattern, "price": price}

        # Insert a batch so expiry features work
        exp_days = random.randint(10, 60)
        exp_date = (datetime(2026, 5, 31) + timedelta(days=exp_days)).strftime("%Y-%m-%d")
        c.execute("INSERT INTO product_batches (product_id, quantity, expiry_date) VALUES (?, ?, ?)", (pid, round(current_qty, 2), exp_date))

    # 4. GENERATE 60 DAYS OF CONSUMPTION LOGS (ENDING 2026-05-31)
    print("📈 Generating 2 months of consumption history leading up to 31 May 2026...")
    end_date = datetime(2026, 5, 31)
    
    for day_offset in range(60, -1, -1):
        target_date = end_date - timedelta(days=day_offset)
        date_str = target_date.strftime("%Y-%m-%d")
        weekday = target_date.weekday() # 0 = Monday, 6 = Sunday

        for pid, meta in product_metadata.items():
            pattern = meta["pattern"]
            qty_consumed = 0.0

            # Realism logic for Prophet forecasting
            if pattern == "daily":
                # Consume everyday, with slight random variance
                qty_consumed = random.uniform(0.5, 1.5)
            elif pattern == "weekend":
                # Spikes heavily on Friday/Saturday/Sunday
                if weekday >= 4:
                    qty_consumed = random.uniform(1.0, 3.0)
                else:
                    # Occasional small consumption
                    qty_consumed = random.uniform(0.0, 0.5) if random.random() > 0.7 else 0.0
            elif pattern == "weekly":
                # One big consumption day per week, e.g. Wednesdays
                if weekday == 2:
                    qty_consumed = random.uniform(1.0, 2.0)
                else:
                    qty_consumed = random.uniform(0.0, 0.2) if random.random() > 0.8 else 0.0
            elif pattern == "rare":
                # Very rare consumption (e.g. household items)
                if random.random() > 0.9:
                    qty_consumed = random.uniform(0.5, 1.0)
            
            # 10% chance of adding to manual_consumption_logs to seed "Patterns" tab
            if qty_consumed > 0.1:
                qty_consumed = round(qty_consumed, 2)
                
                # Main log
                c.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)", 
                          (pid, user_id, qty_consumed, date_str))
                
                # Summary aggregation (used by Prophet)
                c.execute("""
                    INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(product_id, summary_date) DO UPDATE SET total_consumed = total_consumed + excluded.total_consumed
                """, (pid, user_id, date_str, qty_consumed))

                # Add some to manual log for Market Basket association rules
                if random.random() > 0.8:
                    c.execute("INSERT INTO manual_consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)", 
                              (pid, user_id, qty_consumed, date_str))

    conn.commit()
    conn.close()
    print("✅ Successfully injected historical logs.")
    print("\n🎉 Presentation Seeding Complete!")
    print(f"You can now login with Username: {username} | Password: {password}")

if __name__ == "__main__":
    seed_roman_presentation()
