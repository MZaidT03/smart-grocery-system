import sqlite3
from datetime import datetime, timedelta

def seed_manual_logs(user_id=16):
    conn = sqlite3.connect('grocery.db')
    cursor = conn.cursor()

    # Let's get the products for the user. If they only have Cake and Milk, we'll use them.
    # We will simulate consuming them together for the past 5 days.
    
    dates = [
        '2026-05-17',
        '2026-05-18',
        '2026-05-19',
        '2026-05-20',
        '2026-05-21'
    ]

    print(f"Seeding manual consumption logs for user {user_id}...")

    # Product IDs based on your previous screenshot/DB
    # Cake: 410, Fresh Milk: 411
    basket = [(410, 0.5), (411, 1.0)]

    try:
        for d in dates:
            for product_id, qty in basket:
                cursor.execute("""
                    INSERT INTO manual_consumption_logs 
                    (product_id, user_id, consumed_quantity, consumption_date)
                    VALUES (?, ?, ?, ?)
                """, (product_id, user_id, qty, d))
                print(f"Added Product {product_id} on {d}")
        
        conn.commit()
        print("Success! Added 5 days of manual consumption history.")
        print("Apriori will now recognize the pattern: Cake <-> Fresh Milk")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    seed_manual_logs()
