import sqlite3
from datetime import datetime, timedelta
from database import get_db_connection
from utils import hash_password

def seed_database():
    print("🌱 Seeding Database with Test Data...")
    conn = get_db_connection()
    c = conn.cursor()

    # ==========================================
    # 1. CREATE TEST USER
    # ==========================================
    username = "testuser"
    password = "password123"
    email = "test@example.com"
    
    # Check if exists, else create
    user = c.execute("SELECT user_id FROM users WHERE username=?", (username,)).fetchone()
    if user:
        user_id = user['user_id']
        print(f"   ℹ️  User '{username}' already exists (ID: {user_id})")
        
        # CLEAR OLD DATA for this user to ensure a fresh test
        print("   🧹 Cleaning old data for testuser...")
        c.execute("DELETE FROM consumption_logs WHERE user_id=?", (user_id,))
        c.execute("DELETE FROM consumption_summary WHERE user_id=?", (user_id,))
        c.execute("DELETE FROM products WHERE user_id=?", (user_id,))
    else:
        print(f"   👤 Creating new user '{username}'...")
        c.execute("INSERT INTO users (username, password_hash, email, household_size, diet_preference) VALUES (?, ?, ?, ?, ?)",
                  (username, hash_password(password), email, 4, 'Non-Veg'))
        user_id = c.lastrowid

    # ==========================================
    # 2. POPULATE CATALOG (Subset)
    # ==========================================
    catalog_items = [
        ("Milk", 0.25, "liters", "Dairy", "Veg"),
        ("Basmati Rice", 0.1, "kg", "Grains", "Vegan"),
        ("Chicken Breast", 0.15, "kg", "Meat", "Non-Veg"),
        ("Eggs", 1.0, "qty", "Dairy", "Non-Veg"), # 1 egg per person
        ("Sugar", 0.05, "kg", "Pantry", "Vegan")
    ]
    
    print("   📚 Seeding Catalog...")
    for name, rate, unit, cat, diet in catalog_items:
        c.execute("""
            INSERT INTO product_catalog (item_name, daily_consumption_per_person, consumption_unit, category, diet_type)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(item_name, consumption_unit) DO NOTHING
        """, (name, rate, unit, cat, diet))

    # ==========================================
    # 3. INSERT PRODUCTS (Inventory)
    # ==========================================
    # We will simulate that we bought these 10 days ago.
    print("   📦 Adding Products to Inventory...")
    
    products = [
        # Name, Unit, Initial Qty, Category, Freq Qty, Freq Days
        ("Milk", "liters", 20.0, "Dairy", 2.0, 1),      # High usage: 2L every 1 day
        ("Basmati Rice", "kg", 10.0, "Grains", 0.5, 1), # Moderate usage: 0.5kg/day
        ("Chicken Breast", "kg", 5.0, "Meat", 1.0, 3),  # Occasional: 1kg every 3 days
        ("Eggs", "qty", 30.0, "Dairy", 4.0, 1),         # Consistent: 4 eggs/day
    ]
    
    product_ids = {}

    for name, unit, init_qty, cat, f_qty, f_days in products:
        c.execute("""
            INSERT INTO products (user_id, item_name, consumption_unit, current_quantity, initial_quantity, category, usage_freq_qty, usage_freq_days, last_auto_check)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, name, unit, init_qty, init_qty, cat, f_qty, f_days, datetime.now() - timedelta(days=10)))
        product_ids[name] = c.lastrowid

    # ==========================================
    # 4. SIMULATE CONSUMPTION HISTORY (Last 10 Days)
    # ==========================================
    print("   📉 Simulating Consumption Logs & Analytics...")
    
    today = datetime.now()

    # SCENARIO A: MILK (Consistent Usage - Same every day)
    # Consumed 2 Liters every day for the last 10 days
    p_id = product_ids["Milk"]
    for i in range(10):
        day_date = today - timedelta(days=10-i)
        qty = 2.0
        
        # Log
        c.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)",
                  (p_id, user_id, qty, day_date.date()))
        # Summary
        c.execute("INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed) VALUES (?, ?, ?, ?)",
                  (p_id, user_id, day_date.date(), qty))
        # Update Stock
        c.execute("UPDATE products SET current_quantity = current_quantity - ? WHERE product_id=?", (qty, p_id))

    # SCENARIO B: CHICKEN (Variable Usage - Spikes on specific days)
    # Cooked 1.5kg on Day 1, Day 4, and Day 8 only.
    p_id = product_ids["Chicken Breast"]
    cooking_days = [1, 4, 8] # Days ago
    
    for days_ago in cooking_days:
        day_date = today - timedelta(days=days_ago)
        qty = 1.5
        
        c.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)",
                  (p_id, user_id, qty, day_date.date()))
        c.execute("INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed) VALUES (?, ?, ?, ?)",
                  (p_id, user_id, day_date.date(), qty))
        c.execute("UPDATE products SET current_quantity = current_quantity - ? WHERE product_id=?", (qty, p_id))

    # SCENARIO C: EGGS (Changing Usage - Weekend Breakfast)
    # 2 eggs on weekdays, 6 eggs on weekends
    p_id = product_ids["Eggs"]
    for i in range(10):
        day_date = today - timedelta(days=10-i)
        is_weekend = day_date.weekday() >= 5 # 5=Sat, 6=Sun
        qty = 6.0 if is_weekend else 2.0
        
        c.execute("INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date) VALUES (?, ?, ?, ?)",
                  (p_id, user_id, qty, day_date.date()))
        c.execute("INSERT INTO consumption_summary (product_id, user_id, summary_date, total_consumed) VALUES (?, ?, ?, ?)",
                  (p_id, user_id, day_date.date(), qty))
        c.execute("UPDATE products SET current_quantity = current_quantity - ? WHERE product_id=?", (qty, p_id))

    conn.commit()
    conn.close()
    print("✅ Database Seeded Successfully!")
    print(f"👉 Login with: {username} / {password}")

if __name__ == "__main__":
    seed_database()