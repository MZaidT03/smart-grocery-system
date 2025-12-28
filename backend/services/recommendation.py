import sqlite3
import pandas as pd
from collections import Counter
from itertools import combinations
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_NAME = os.path.join(BASE_DIR, "grocery.db")

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def get_market_basket_recommendations(target_item_name, limit=3):
    """
    Analyzes consumption history to find items frequently consumed together 
    on the same day (simulating a 'Basket').
    """
    conn = get_db_connection()
    recommendations = []

    try:
        # --- FIX: Added 'consumption_logs.' before user_id to resolve ambiguity ---
        query = """
            SELECT consumption_logs.user_id, date(consumption_date) as date, products.item_name 
            FROM consumption_logs 
            JOIN products ON consumption_logs.product_id = products.product_id
        """
        df = pd.read_sql(query, conn)
        
        if df.empty: return []

        # 2. Group items into baskets
        # Result: [{'Bread', 'Eggs', 'Milk'}, {'Sugar', 'Tea'}, ...]
        baskets = df.groupby(['user_id', 'date'])['item_name'].apply(set).tolist()

        # 3. Find baskets that contain our Target Item
        # We search case-insensitively just to be safe
        relevant_baskets = [b for b in baskets if any(target_item_name.lower() in i.lower() for i in b)]
        
        if not relevant_baskets:
            return []

        # 4. Count co-occurring items
        co_occurrences = Counter()
        
        for basket in relevant_baskets:
            for item in basket:
                # Don't recommend the target item itself
                if item.lower() != target_item_name.lower():
                    co_occurrences[item] += 1

        # 5. Calculate "Confidence" (Probability)
        total_appearances = len(relevant_baskets)
        
        # Get top N results
        for item, count in co_occurrences.most_common(limit):
            confidence = (count / total_appearances) * 100
            
            # Only recommend if confidence is significant (> 10%)
            if confidence > 10:
                recommendations.append({
                    "item": item,
                    "confidence": round(confidence, 1),
                    "reason": f"Bought together in {count} transactions"
                })

    except Exception as e:
        print(f"Market Basket Error: {e}")
    finally:
        conn.close()

    return recommendations
    """
    Analyzes consumption history to find items frequently consumed together 
    on the same day (simulating a 'Basket').
    """
    conn = get_db_connection()
    recommendations = []

    try:
        # 1. Get all consumption logs
        # We group by User and Date to define a "Basket" (things consumed together)
        query = """
            SELECT user_id, date(consumption_date) as date, item_name 
            FROM consumption_logs 
            JOIN products ON consumption_logs.product_id = products.product_id
        """
        df = pd.read_sql(query, conn)
        
        if df.empty: return []

        # 2. Group items into baskets
        # Result: [{'Bread', 'Eggs', 'Milk'}, {'Sugar', 'Tea'}, ...]
        baskets = df.groupby(['user_id', 'date'])['item_name'].apply(set).tolist()

        # 3. Find baskets that contain our Target Item
        relevant_baskets = [b for b in baskets if target_item_name in b]
        
        if not relevant_baskets:
            return []

        # 4. Count co-occurring items
        # If basket is {'Bread', 'Eggs'} and target is 'Bread', we count 'Eggs'.
        co_occurrences = Counter()
        
        for basket in relevant_baskets:
            for item in basket:
                if item != target_item_name: # Don't recommend the item itself
                    co_occurrences[item] += 1

        # 5. Calculate "Confidence" (Probability)
        # Confidence = (Times A and B together) / (Times A appeared)
        total_appearances = len(relevant_baskets)
        
        # Get top N results
        for item, count in co_occurrences.most_common(limit):
            confidence = (count / total_appearances) * 100
            
            # Only recommend if confidence is significant (> 20%)
            if confidence > 20:
                recommendations.append({
                    "item": item,
                    "confidence": round(confidence, 1),
                    "reason": f"Bought together in {count} transactions"
                })

    except Exception as e:
        print(f"Market Basket Error: {e}")
    finally:
        conn.close()

    return recommendations