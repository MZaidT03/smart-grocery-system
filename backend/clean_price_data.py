import sqlite3
import pandas as pd
import numpy as np
import os

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "grocery.db")
CSV_OUTPUT = os.path.join(BASE_DIR, "cleaned_prices.csv")

def clean_and_export():
    print(f"🧹 Connecting to {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)

    # 1. LOAD DATA INTO PANDAS (The DS way to handle large data)
    # We fetch from 'price_history' because that's where all your raw scrapes are
    try:
        df = pd.read_sql_query("SELECT item_name, price, date FROM price_history", conn)
    except Exception as e:
        print(f"❌ Error reading data: {e}")
        return

    print(f"📦 Loaded {len(df)} raw price records.")

    # 2. DEFINE CLEANING FUNCTION (IQR Method)
    def get_mid_price(group):
        prices = group['price'].values
        
        # If we have enough data, filter outliers
        if len(prices) >= 3:
            q1 = np.percentile(prices, 25)
            q3 = np.percentile(prices, 75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            # Filter: Keep prices within bounds
            valid_prices = prices[(prices >= lower_bound) & (prices <= upper_bound)]
            
            # If filtering removed everything (rare), revert to original
            if len(valid_prices) == 0:
                valid_prices = prices
        else:
            valid_prices = prices

        # Return the Median (Mid-Price)
        return round(np.median(valid_prices), 2)

    # 3. AGGREGATE DATA
    print("⚙️ Processing & removing outliers...")
    
    # Group by Item Name and apply our cleaning function
    cleaned_df = df.groupby('item_name').apply(
        lambda x: pd.Series({
            'mid_price': get_mid_price(x),
            'data_points': len(x),
            'last_updated': x['date'].max()
        })
    ).reset_index()

    print(f"✨ Consolidated into {len(cleaned_df)} unique items.")

    # 4. EXPORT TO CSV
    cleaned_df.to_csv(CSV_OUTPUT, index=False)
    print(f"📄 Saved clean data to: {CSV_OUTPUT}")

    # 5. UPDATE MAIN DATABASE ('products' table)
    # We update the main product list with these new "Official Mid-Prices"
    print("💾 Updating 'products' table with official mid-prices...")
    
    c = conn.cursor()
    update_count = 0
    
    for index, row in cleaned_df.iterrows():
        name = row['item_name']
        price = row['mid_price']
        
        # Update price in products table
        c.execute("UPDATE products SET price = ? WHERE item_name = ?", (price, name))
        update_count += c.rowcount
        
    conn.commit()
    conn.close()
    print(f"✅ Success! Updated {update_count} products in the database.")

if __name__ == "__main__":
    clean_and_export()