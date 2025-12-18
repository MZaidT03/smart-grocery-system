import sqlite3
import random
from datetime import datetime, timedelta

DB_NAME = "grocery.db"

def recalculate_spending_history():
    print("📉 Regenerating Spending History using REAL prices...")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # 1. Clear old fake spending logs
    c.execute("DELETE FROM spending_logs")

    # 2. Get all products with their REAL price
    products = c.execute("SELECT item_name, price, usage_freq_qty, usage_freq_days FROM products WHERE price > 0").fetchall()

    if not products:
        print("⚠️ No priced products found. Run 'clean_data.py' first.")
        return

    # 3. Simulate last 6 months
    today = datetime.now()
    history_data = {} # "2025-08": 45000

    for i in range(5, -1, -1):
        month_date = today - timedelta(days=30 * i)
        month_str = month_date.strftime("%Y-%m")
        
        monthly_total = 0

        for (name, price, qty, days) in products:
            if days and days > 0:
                # Calculate Daily Cost: (Qty / Days) * Price
                daily_cost = (qty / days) * price
                
                # Monthly Cost = Daily * 30
                monthly_item_cost = daily_cost * 30
                
                # Add slight variation per month (e.g. bought more/less)
                variation = random.uniform(0.9, 1.1) 
                
                # Add Inflation backcast: Prices were likely 2% cheaper each month back
                inflation_factor = 1.0 - (0.02 * i) 
                
                monthly_total += (monthly_item_cost * variation * inflation_factor)

        history_data[month_str] = round(monthly_total)

    # 4. Save to Database
    for month, total in history_data.items():
        c.execute("INSERT INTO spending_logs (month_str, total_spent) VALUES (?, ?)", (month, total))
        print(f"   📅 {month}: Estimated Spending = Rs {total:,}")

    conn.commit()
    conn.close()
    print("✅ Analytics fixed! Spending Chart now reflects real market rates.")

if __name__ == "__main__":
    recalculate_spending_history()