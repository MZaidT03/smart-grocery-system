import sqlite3
from datetime import datetime, timedelta
import random

DB_NAME = "grocery.db"

# --- THE PATTERNS TO TEACH ---
# The AI will learn: "If I buy X, I usually need Y and Z"
SHOPPING_PATTERNS = [
    {
        "name": "Chai Time (Tea Break)",
        "items": ["Tapal Danedar", "Sugar", "Olpers Milk", "Cake Rusk"],
        "frequency": 25  # Happened 25 times in history
    },
    {
        "name": "Desi Breakfast",
        "items": ["Bread (Large)", "Eggs (Dozen)", "Butter (Salted)", "Fruit Jam"],
        "frequency": 30
    },
    {
        "name": "Pasta Night",
        "items": ["Bake Parlor Macaroni", "Ketchup", "Mayonnaise", "Chicken Boneless"],
        "frequency": 15
    },
    {
        "name": "Biryani Weekend",
        "items": ["Basmati Rice", "Shan Biryani Masala", "Yogurt", "Chicken Meat"],
        "frequency": 12
    },
    {
        "name": "Cleaning Supplies",
        "items": ["Dish Wash Bar", "Sponge Scotch Brite", "Surface Cleaner"],
        "frequency": 10
    }
]

def get_or_create_product(cursor, user_id, item_name):
    """Finds a product ID or creates it if it doesn't exist."""
    cursor.execute("SELECT product_id FROM products WHERE item_name = ? AND user_id = ?", (item_name, user_id))
    row = cursor.fetchone()
    
    if row:
        return row[0]
    
    # Auto-categorize for realism
    cat = "Other"
    unit = "pcs"
    if "Milk" in item_name or "Yogurt" in item_name: cat = "Dairy"; unit = "liters"
    elif "Rice" in item_name or "Sugar" in item_name: cat = "Staples"; unit = "kg"
    elif "Chicken" in item_name or "Meat" in item_name: cat = "Meat"; unit = "kg"
    elif "Bread" in item_name or "Rusk" in item_name: cat = "Bakery"; unit = "pkt"
    elif "Cleaner" in item_name or "Wash" in item_name: cat = "Household"; unit = "pcs"
    elif "Tea" in item_name or "Tapal" in item_name: cat = "Beverages"; unit = "box"
    
    cursor.execute("""
        INSERT INTO products (user_id, item_name, consumption_unit, category, current_quantity, is_active)
        VALUES (?, ?, ?, ?, 5, 1)
    """, (user_id, item_name, unit, cat))
    return cursor.lastrowid

def seed_patterns():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    print("🧠 Training AI with Complex Lifestyle Patterns...")

    # 1. Get Target User (ForecastTest)
    user = cursor.execute("SELECT user_id FROM users WHERE username='ForecastTest'").fetchone()
    if not user:
        print("❌ User 'ForecastTest' not found. Please create it first.")
        return
    user_id = user[0]

    total_logs = 0
    today = datetime.now()

    # 2. Loop through patterns
    for pattern in SHOPPING_PATTERNS:
        print(f"   👉 Teaching pattern: {pattern['name']}...")
        
        # Ensure all items exist and get IDs
        item_ids = [get_or_create_product(cursor, user_id, name) for name in pattern['items']]

        # Inject History
        for i in range(pattern['frequency']):
            # Pick a random date in the last 6 months
            days_ago = random.randint(1, 180)
            # Use 10:00 AM to ensure they fall in the same "Shopping Basket"
            event_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d 10:00:00")

            # Log ALL items in this pattern on the SAME DATE
            for pid in item_ids:
                # Randomize quantity slightly
                qty = round(random.uniform(0.5, 2.0), 1)
                cursor.execute("""
                    INSERT INTO consumption_logs (product_id, user_id, consumed_quantity, consumption_date)
                    VALUES (?, ?, ?, ?)
                """, (pid, user_id, qty, event_date))
                total_logs += 1

    conn.commit()
    conn.close()
    print(f"\n✅ Training Complete! Injected {total_logs} logs.")
    print("💡 Now go to Shopping List and try adding 'Tapal Danedar' or 'Basmati Rice'!")

if __name__ == "__main__":
    seed_patterns()