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
# AL-FATAH SHOPIFY SEARCH API
# -------------------------------
SEARCH_API = "https://alfatah.pk/search/suggest.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
}

# -------------------------------
# FETCH PRICE FROM AL-FATAH
# -------------------------------
def get_alfatah_price(item_name):
    search_term = item_name.split("(")[0].strip()

    params = {
        "q": search_term,
        "resources[type]": "product",
        "resources[limit]": 1
    }

    try:
        response = requests.get(
            "https://alfatah.pk/search/suggest.json",
            params=params,
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10
        )

        if response.status_code != 200:
            return None

        data = response.json()

        products = (
            data.get("resources", {})
                .get("results", {})
                .get("products", [])
        )

        if not products:
            return None

        price_raw = products[0].get("price")

        if price_raw is None:
            return None

        # ✅ CORRECT: price is already in PKR
        price = float(price_raw)

        return price

    except Exception as e:
        print(f"   ⚠️ Error: {e}")
        return None

    search_term = item_name.split("(")[0].strip()

    params = {
        "q": search_term,
        "resources[type]": "product",
        "resources[limit]": 1
    }

    try:
        response = requests.get(
            "https://alfatah.pk/search/suggest.json",
            params=params,
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10
        )

        if response.status_code != 200:
            return None

        data = response.json()

        products = (
            data.get("resources", {})
                .get("results", {})
                .get("products", [])
        )

        if not products:
            return None

        price_raw = products[0].get("price")

        if not price_raw:
            return None

        # ✅ FIX: convert string → float
        price = float(price_raw) / 100

        return price

    except Exception as e:
        print(f"   ⚠️ Error: {e}")
        return None

    """
    Search product using Shopify JSON API and return price (float).
    """

    # Clean name (remove brackets)
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

        products = (
            data
            .get("resources", {})
            .get("results", {})
            .get("products", [])
        )

        if not products:
            return None

        # Shopify stores price in paisa (cents)
        price = products[0].get("price")

        if price is None:
            return None

        return price / 100

    except Exception as e:
        print(f"   ⚠️ Error: {e}")
        return None

# -------------------------------
# MAIN SCRAPER LOGIC
# -------------------------------
def run_scraper():
    print(f"\n🔄 Starting Al-Fatah Price Scraper")
    print(f"🗄 Database: {DB_NAME}")

    if not os.path.exists(DB_NAME):
        print("❌ Database not found!")
        return

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    today = datetime.now().strftime("%Y-%m-%d")

    try:
        items = c.execute(
            "SELECT item_name FROM products"
        ).fetchall()
    except sqlite3.OperationalError:
        print("❌ 'products' table not found")
        return

    print(f"📦 Found {len(items)} items\n")

    found_count = 0

    for (item_name,) in items:
        time.sleep(random.uniform(0.8, 1.8))

        print(f"🔎 Searching: {item_name}...", end=" ", flush=True)

        price = get_alfatah_price(item_name)

        if price:
            print(f"✅ Rs {price:.2f}")
            found_count += 1

            # Update product price
            c.execute(
                "UPDATE products SET price = ? WHERE item_name = ?",
                (price, item_name)
            )

            # Insert price history
            exists = c.execute(
                "SELECT id FROM price_history WHERE item_name = ? AND date = ?",
                (item_name, today)
            ).fetchone()

            if not exists:
                c.execute(
                    """
                    INSERT INTO price_history (item_name, price, date)
                    VALUES (?, ?, ?)
                    """,
                    (item_name, price, today)
                )
        else:
            print("❌ Not found")

    conn.commit()
    conn.close()

    print(f"\n✅ Scraping complete — Updated {found_count} items")

# -------------------------------
# ENTRY POINT
# -------------------------------
if __name__ == "__main__":
    run_scraper()
