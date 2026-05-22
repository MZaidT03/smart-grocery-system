import requests
import sqlite3
from datetime import datetime
import time
import random
import os
from services.budget import log_expense

# -------------------------------
# DATABASE CONFIG
# -------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_NAME = os.path.join(BASE_DIR, "grocery.db")

# -------------------------------
# AL-FATAH SEARCH API
# -------------------------------
SEARCH_API = "https://alfatah.pk/search/suggest.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
}

def get_alfatah_price(item_name):
    """
    Search product using Shopify JSON API and return price (float).
    """
    # Clean name (remove brackets like '(500g)')
    search_term = item_name.split("(")[0].strip()

    import subprocess
    import json
    import urllib.parse
    
    url = f"https://alfatah.pk/search/suggest.json?q={urllib.parse.quote(search_term)}&resources%5Btype%5D=product&resources%5Blimit%5D=1"

    try:
        result = subprocess.run([
            "curl", "-s", "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", url
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            return None
            
        data = json.loads(result.stdout)
        products = data.get("resources", {}).get("results", {}).get("products", [])

        if not products:
            return None

        price_raw = products[0].get("price") 

        if price_raw is None:
            return None

        price = float(price_raw) 
        return price

    except Exception as e:
        print(f"   ⚠️ Error searching '{item_name}': {e}")
        return None

def update_market_prices(user_id=None):
    """
    Updates product prices. 
    If user_id is provided, ONLY updates that user's items.
    """
    print(f"\n🔄 Starting Al-Fatah Price Scraper...")
    
    if not os.path.exists(DB_NAME):
        print("❌ Database not found!")
        return 0

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    today = datetime.now().strftime("%Y-%m-%d")

    # --- FIX: FILTER BY USER ID IF PROVIDED ---
    try:
        if user_id:
            items = c.execute("SELECT product_id, item_name, current_quantity, price, category, user_id FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchall()
        else:
            items = c.execute("SELECT product_id, item_name, current_quantity, price, category, user_id FROM products WHERE is_active = 1").fetchall()
    except:
        return 0

    print(f"📦 Found {len(items)} items to scan for User ID: {user_id if user_id else 'ALL'}\n")

    updated_count = 0

    for (pid, item_name, qty, old_price, category, u_id) in items:
        # Rate limit
        time.sleep(random.uniform(0.5, 1.5))

        print(f"🔎 Scanning: {item_name}...", end=" ", flush=True)

        price = get_alfatah_price(item_name)

        if price:
            print(f"✅ Rs {price:.2f}")
            updated_count += 1
            
            old_price_val = float(old_price) if old_price else 0.0
            qty_val = float(qty) if qty else 0.0
            diff = price - old_price_val

            # Update Price
            c.execute("UPDATE products SET price = ? WHERE product_id = ?", (price, pid))
            
            # Log Expense if price increased and we have stock
            if diff > 0 and qty_val > 0 and u_id:
                total_diff = diff * qty_val
                log_expense(u_id, total_diff, category or 'Other', f"Market price fetched for {item_name}", conn)

            # Add History
            exists = c.execute(
                "SELECT id FROM price_history WHERE item_name = ? AND date = ?", 
                (item_name, today)
            ).fetchone()

            if not exists:
                c.execute(
                    "INSERT INTO price_history (item_name, price, date) VALUES (?, ?, ?)",
                    (item_name, price, today)
                )
        else:
            print("❌ Not found")

    conn.commit()
    conn.close()
    return updated_count

def preview_market_prices(user_id=None, item_ids=None, zero_price_only=False):
    if not os.path.exists(DB_NAME):
        return []

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    query = "SELECT product_id, item_name, current_quantity, price, category, user_id FROM products WHERE is_active = 1"
    params = []

    if user_id:
        query += " AND user_id = ?"
        params.append(user_id)
    
    if item_ids:
        placeholders = ','.join('?' * len(item_ids))
        query += f" AND product_id IN ({placeholders})"
        params.extend(item_ids)

    if zero_price_only:
        query += " AND (price IS NULL OR price = 0)"

    items = c.execute(query, params).fetchall()
    conn.close()

    results = []
    for (pid, item_name, qty, old_price, category, u_id) in items:
        time.sleep(random.uniform(0.5, 1.5))
        price = get_alfatah_price(item_name)
        if price is not None:
            results.append({
                "product_id": pid,
                "item_name": item_name,
                "old_price": old_price or 0,
                "new_price": price,
                "quantity": qty or 0,
                "category": category,
            })

    return results

def save_market_prices(user_id, updates):
    if not os.path.exists(DB_NAME):
        return 0
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")

    count = 0
    for update in updates:
        pid = update.get("product_id")
        new_price = float(update.get("new_price", 0))
        
        row = c.execute("SELECT item_name, current_quantity, price, category FROM products WHERE product_id = ? AND user_id = ?", (pid, user_id)).fetchone()
        if not row:
            continue
        
        item_name, qty, old_price, category = row
        old_price_val = float(old_price) if old_price else 0.0
        qty_val = float(qty) if qty else 0.0
        diff = new_price - old_price_val

        c.execute("UPDATE products SET price = ? WHERE product_id = ?", (new_price, pid))
        
        if diff > 0 and qty_val > 0:
            total_diff = diff * qty_val
            log_expense(user_id, total_diff, category or 'Other', f"Market price fetched for {item_name}", conn)

        exists = c.execute("SELECT id FROM price_history WHERE item_name = ? AND date = ?", (item_name, today)).fetchone()
        if not exists:
            c.execute("INSERT INTO price_history (item_name, price, date) VALUES (?, ?, ?)", (item_name, new_price, today))
        
        count += 1

    conn.commit()
    conn.close()
    return count

if __name__ == "__main__":
    update_market_prices()