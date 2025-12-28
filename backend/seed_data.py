import sqlite3
import random
import hashlib
from datetime import datetime, timedelta

DB_NAME = "grocery.db"

# --- CONFIGURATION ---
DAYS_OF_HISTORY = 180  # 6 Months of data
USERS_TO_CREATE = [
    {"user": "ZaidTahir", "pass": "admin123", "role": "Developer", "size": 1},
    {"user": "ChefGordon", "pass": "cook123", "role": "Chef", "size": 4},
    {"user": "MomKitchen", "pass": "mom123", "role": "Family", "size": 5},
    {"user": "FitnessFreak", "pass": "gym123", "role": "Athlete", "size": 1},
    {"user": "BusyStudent", "pass": "study123", "role": "Student", "size": 1},
    {"user": "CafeOwner", "pass": "coffee123", "role": "Business", "size": 10},
    {"user": "VeganLife", "pass": "green123", "role": "Vegan", "size": 2},
    {"user": "BBQKing", "pass": "meat123", "role": "Foodie", "size": 3},
    {"user": "SweetTooth", "pass": "sugar123", "role": "Baker", "size": 2},
    {"user": "TechBro", "pass": "code123", "role": "Single", "size": 1},
]

# --- PRODUCT CATALOG (Templates) ---
CATALOG = [
    # Dairy & Breakfast
    {"name": "Fresh Milk", "unit": "liters", "cat": "Dairy", "price": 220, "pattern": "weekend_spike"},
    {"name": "Eggs (Dozen)", "unit": "eggs", "cat": "Dairy", "price": 350, "pattern": "weekend_spike"},
    {"name": "Greek Yogurt", "unit": "cups", "cat": "Dairy", "price": 150, "pattern": "daily"},
    {"name": "Cheddar Cheese", "unit": "kg", "cat": "Dairy", "price": 1200, "pattern": "random"},
    {"name": "Butter (Salted)", "unit": "blocks", "cat": "Dairy", "price": 450, "pattern": "low_freq"},
    
    # Staples
    {"name": "Basmati Rice", "unit": "kg", "cat": "Staples", "price": 380, "pattern": "weekly"},
    {"name": "Wheat Flour", "unit": "kg", "cat": "Staples", "price": 180, "pattern": "weekly"},
    {"name": "Sugar", "unit": "kg", "cat": "Staples", "price": 160, "pattern": "random"},
    {"name": "Lentils (Daal)", "unit": "kg", "cat": "Staples", "price": 280, "pattern": "biweekly"},
    {"name": "Cooking Oil", "unit": "liters", "cat": "Oil & Ghee", "price": 550, "pattern": "biweekly"},

    # Proteins
    {"name": "Chicken Breast", "unit": "kg", "cat": "Meat", "price": 850, "pattern": "weekend_spike"},
    {"name": "Ground Beef", "unit": "kg", "cat": "Meat", "price": 1100, "pattern": "weekend_spike"},
    {"name": "Fish Fillet", "unit": "kg", "cat": "Seafood", "price": 1500, "pattern": "low_freq"},
    
    # Fruits & Veg
    {"name": "Bananas (Doz)", "unit": "dozen", "cat": "Fruits", "price": 150, "pattern": "daily"},
    {"name": "Apples", "unit": "kg", "cat": "Fruits", "price": 250, "pattern": "daily"},
    {"name": "Potatoes", "unit": "kg", "cat": "Vegetables", "price": 80, "pattern": "weekly"},
    {"name": "Onions", "unit": "kg", "cat": "Vegetables", "price": 120, "pattern": "weekly"},
    {"name": "Tomatoes", "unit": "kg", "cat": "Vegetables", "price": 150, "pattern": "daily"},
    
    # Snacks & Misc
    {"name": "Coffee Beans", "unit": "kg", "cat": "Beverages", "price": 2500, "pattern": "daily"},
    {"name": "Chocolate Bar", "unit": "bars", "cat": "Snacks", "price": 100, "pattern": "random_spikes"},
    {"name": "Soda Cans", "unit": "cans", "cat": "Beverages", "price": 80, "pattern": "weekend_spike"},
    {"name": "Spices Mix", "unit": "packets", "cat": "Condiments", "price": 120, "pattern": "low_freq"},
]

def get_db():
    return sqlite3.connect(DB_NAME)

def hash_pass(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_logs(product_id, user_id, pattern, base_qty, cursor):
    """Generates 180 days of realistic history based on pattern"""
    today = datetime.now()
    logs = []

    for i in range(DAYS_OF_HISTORY, 0, -1):
        date_val = today - timedelta(days=i)
        day_name = date_val.strftime("%A")
        
        qty = 0
        
        # --- PATTERN LOGIC ---
        if pattern == "daily":
            # Consistent usage (e.g., Milk, Coffee)
            qty = max(0.1, random.gauss(base_qty, base_qty * 0.2))
            
        elif pattern == "weekend_spike":
            # Higher on Sat/Sun (e.g., Meat, Eggs, Soda)
            if day_name in ["Saturday", "Sunday"]:
                qty = max(0.5, random.gauss(base_qty * 2.0, base_qty * 0.3))
            else:
                qty = max(0, random.gauss(base_qty * 0.5, base_qty * 0.2))
                
        elif pattern == "weekly":
            # Once a week (e.g., Rice, Flour)
            if day_name == "Monday": # Shopping day usage
                qty = max(1.0, random.gauss(base_qty * 3, base_qty * 0.5))
            else:
                qty = random.uniform(0, base_qty * 0.2) # Leftovers
                
        elif pattern == "random_spikes":
            # Random parties (e.g., Sugar, Chocolate)
            if random.random() > 0.9: # 10% chance
                qty = base_qty * 5.0 # HUGE SPIKE
            else:
                qty = random.uniform(0, base_qty * 0.5)

        elif pattern == "low_freq":
            # Rarely used (e.g., Butter, Spices)
            if random.random() > 0.8:
                qty = base_qty
            else:
                qty = 0

        # Don't log if 0 consumption
        if qty > 0.05:
            # Round nicely
            final_qty = round(qty, 2)
            logs.append((product_id, user_id, final_qty, date_val.strftime("%Y-%m-%d %H:%M:%S")))
            
    return logs

def seed_big_data():
    conn = get_db()
    cursor = conn.cursor()
    print("🚀 Starting BIG DATA Seeding...")

    # 1. Clean Slate (Optional: Remove if you want to keep old data)
    cursor.execute("DELETE FROM consumption_logs")
    cursor.execute("DELETE FROM products")
    cursor.execute("DELETE FROM users")
    print("🧹 Cleared old data.")

    total_logs = 0

    # 2. Loop Users
    for u in USERS_TO_CREATE:
        email = f"{u['user'].lower()}@example.com"
        
        # Create User
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, household_size) 
            VALUES (?, ?, ?, ?)
        """, (u['user'], email, hash_pass(u['pass']), u['size']))
        user_id = cursor.lastrowid
        
        print(f"👤 Created User: {u['user']} (ID: {user_id})")

        # 3. Assign Products (Random Selection of 15-20 items from catalog)
        # We scale base usage by household size
        user_catalog = random.sample(CATALOG, k=random.randint(15, 20))
        
        for item in user_catalog:
            # Scale usage by family size
            base_usage = random.uniform(0.5, 2.0) * (u['size'] / 2.0)
            
            # Create Product
            cursor.execute("""
                INSERT INTO products (user_id, item_name, consumption_unit, category, current_quantity, price, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (user_id, item['name'], item['unit'], item['cat'], round(base_usage * 5, 2), item['price']))
            product_id = cursor.lastrowid
            
            # 4. Generate History
            logs = generate_logs(product_id, user_id, item['pattern'], base_usage, cursor)
            
            if logs:
                cursor.executemany("""
                    INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date)
                    VALUES (?, ?, ?, ?)
                """, logs)
                total_logs += len(logs)

    conn.commit()
    conn.close()
    
    print("\n" + "="*40)
    print(f"🎉 SUCCESS! Database Seeded.")
    print(f"📊 Total Users: {len(USERS_TO_CREATE)}")
    print(f"📈 Total Logs: {total_logs}")
    print("="*40)
    print("🔑 CREDENTIALS:")
    for u in USERS_TO_CREATE:
        print(f"   User: {u['user']:<15} Pass: {u['pass']}")
    print("="*40)

if __name__ == "__main__":
    seed_big_data()