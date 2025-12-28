import requests
import sqlite3
from datetime import datetime
import time
import random
import os

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

    params = {
        "q": search_term,
        "resources[type]": "product",
        "resources[limit]": 1
    }

    try:
        response = requests.get(
            SEARCH_API,
            params=params,
            headers=HEADERS,
            timeout=10
        )

        if response.status_code != 200:
            return None

        data = response.json()
        products = (data.get("resources", {}).get("results", {}).get("products", []))

        if not products:
            return None

        price_raw = products[0].get("price") 

        if price_raw is None:
            return None

        # --- FIX: REMOVED THE '/ 100' DIVISION ---
        # Al-Fatah returns "170.00" for Rs 170, not "17000" cents.
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
            items = c.execute("SELECT item_name FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchall()
        else:
            items = c.execute("SELECT item_name FROM products WHERE is_active = 1").fetchall()
    except:
        return 0

    print(f"📦 Found {len(items)} items to scan for User ID: {user_id if user_id else 'ALL'}\n")

    updated_count = 0

    for (item_name,) in items:
        # Rate limit
        time.sleep(random.uniform(0.5, 1.5))

        print(f"🔎 Scanning: {item_name}...", end=" ", flush=True)

        price = get_alfatah_price(item_name)

        if price:
            print(f"✅ Rs {price:.2f}")
            updated_count += 1

            # Update Price
            c.execute("UPDATE products SET price = ? WHERE item_name = ?", (price, item_name))

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

if __name__ == "__main__":
    update_market_prices()