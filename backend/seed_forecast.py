import sqlite3
import random
from datetime import datetime, timedelta
import hashlib

DB_NAME = "grocery.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def seed_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    print("🚀 Starting Forecast Simulation Setup...")

    # 1. Create Dummy User
    username = "ForecastTest"
    email = "forecast@test.com"
    password = hash_password("123")
    
    # Check if exists
    cursor.execute("SELECT user_id FROM users WHERE username = ?", (username,))
    existing = cursor.fetchone()
    
    if existing:
        user_id = existing['user_id']
        print(f"ℹ️ User '{username}' already exists (ID: {user_id}). Cleaning old data...")
        # Clear old logs for a fresh start
        cursor.execute("DELETE FROM consumption_logs WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM products WHERE user_id = ?", (user_id,))
    else:
        cursor.execute("INSERT INTO users (username, email, password_hash, household_size) VALUES (?, ?, ?, ?)", 
                       (username, email, password, 4))
        user_id = cursor.lastrowid
        print(f"✅ Created User: {username} (ID: {user_id})")

    # 2. Define Products with Patterns
    products = [
        {
            "name": "Fresh Milk", "unit": "liters", "category": "Dairy", 
            "current": 5.0, "base_usage": 1.5, "variance": 0.5, "pattern": "daily"
        },
        {
            "name": "Eggs (Dozen)", "unit": "eggs", "category": "Dairy", 
            "current": 12, "base_usage": 3, "variance": 2, "pattern": "weekend_spike"
        },
        {
            "name": "Sugar", "unit": "kg", "category": "Staples", 
            "current": 2.5, "base_usage": 0.1, "variance": 0.05, "pattern": "random_spikes"
        }
    ]

    # 3. Insert Products & Generate 60 Days of History
    today = datetime.now()

    for p in products:
        # Create Product
        cursor.execute("""
            INSERT INTO products (user_id, item_name, consumption_unit, category, current_quantity, price, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        """, (user_id, p['name'], p['unit'], p['category'], p['current'], random.randint(100, 500)))
        product_id = cursor.lastrowid
        
        print(f"   Generating 60 days of data for: {p['name']}...")

        # Generate Logs (Going back 60 days)
        logs = []
        for i in range(60, 0, -1):
            date_val = today - timedelta(days=i)
            day_name = date_val.strftime("%A") # Monday, Tuesday...
            
            qty = p['base_usage']

            # --- APPLY PATTERNS ---
            if p['pattern'] == 'daily':
                # Random noise +/- variance
                qty += random.uniform(-p['variance'], p['variance'])
            
            elif p['pattern'] == 'weekend_spike':
                # Eat double on weekends
                if day_name in ['Saturday', 'Sunday']:
                    qty += p['variance']
                else:
                    qty -= 0.5 # Less on weekdays
            
            elif p['pattern'] == 'random_spikes':
                # Mostly low, but random baking day every ~10 days
                if random.random() > 0.9: 
                    qty += 1.0 # Big spike
                else:
                    qty = max(0.05, qty + random.uniform(-0.02, 0.02))

            # Ensure no negatives
            final_qty = max(0.1, round(qty, 2))
            
            # --- IMPORTANT: USING CORRECT COLUMN NAMES ---
            logs.append((product_id, user_id, final_qty, date_val.strftime("%Y-%m-%d %H:%M:%S")))

        # Bulk Insert
        cursor.executemany("""
            INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date)
            VALUES (?, ?, ?, ?)
        """, logs)

    conn.commit()
    conn.close()
    print("\n🎉 Success! Dummy data loaded.")
    print(f"👉 Login with: {username} / 123")

if __name__ == "__main__":
    seed_data()