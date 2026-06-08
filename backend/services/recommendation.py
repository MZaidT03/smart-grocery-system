import sqlite3
import pandas as pd
# pyrefly: ignore [missing-import]
from efficient_apriori import apriori
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_NAME = os.path.join(BASE_DIR, "grocery.db")

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def extract_recommendations_from_baskets(baskets, target_item_name, conn, limit=5):
    if len(baskets) < 2:
        return []

    # Adjust min_support based on typical sparse grocery data
    # For personal data, we might need lower min_support because there are fewer baskets
    itemsets, rules = apriori(baskets, min_support=0.01, min_confidence=0.5)

    target_lower = target_item_name.lower()
    matched_rules = []

    for rule in rules:
        lhs_lower = [item.lower() for item in rule.lhs]
        # Restrict to rules where the target item is the ONLY condition.
        # Otherwise, highly specific rules (e.g. Bread + Cola + Soap -> Shampoo)
        # get wrongly recommended just because Bread was added!
        if len(lhs_lower) == 1 and target_lower in lhs_lower:
            matched_rules.append(rule)

    matched_rules = sorted(matched_rules, key=lambda r: r.confidence, reverse=True)
    
    recommendations = []
    seen = set()
    for rule in matched_rules:
        for rhs_item in rule.rhs:
            if rhs_item.lower() not in seen:
                seen.add(rhs_item.lower())
                
                cat_info = conn.execute("SELECT category, consumption_unit FROM product_catalog WHERE item_name = ? COLLATE NOCASE", (rhs_item,)).fetchone()
                cat = cat_info['category'] if cat_info else "Other"
                unit = cat_info['consumption_unit'] if cat_info else "kg"

                recommendations.append({
                    "item_name": rhs_item,
                    "category": cat,
                    "consumption_unit": unit,
                    "confidence": round(rule.confidence * 100, 1),
                    "reason": f"Bought together (Lift: {round(rule.lift, 2)})"
                })
                
                if len(recommendations) >= limit:
                    break
        if len(recommendations) >= limit:
            break
            
    return recommendations

def get_market_basket_recommendations(target_item_name, user_id=None, limit=5):
    """
    Analyzes consumption history to find items frequently consumed together 
    using efficient-apriori Association Rule Mining on manual_consumption_logs.
    First tries personalized patterns, then falls back to global.
    """
    conn = get_db_connection()
    recommendations = []

    try:
        if user_id:
            # Try personalized baskets first
            query_personal = """
                SELECT manual_consumption_logs.user_id, date(consumption_date) as date, products.item_name 
                FROM manual_consumption_logs 
                JOIN products ON manual_consumption_logs.product_id = products.product_id
                WHERE manual_consumption_logs.user_id = ?
            """
            df_personal = pd.read_sql(query_personal, conn, params=(user_id,))
            
            if not df_personal.empty:
                baskets_personal = df_personal.groupby(['user_id', 'date'])['item_name'].apply(tuple).tolist()
                recommendations = extract_recommendations_from_baskets(baskets_personal, target_item_name, conn, limit)
        
        # Fall back to global baskets if no personal recommendations
        if not recommendations:
            query_global = """
                SELECT manual_consumption_logs.user_id, date(consumption_date) as date, products.item_name 
                FROM manual_consumption_logs 
                JOIN products ON manual_consumption_logs.product_id = products.product_id
            """
            df_global = pd.read_sql(query_global, conn)
            
            if not df_global.empty:
                baskets_global = df_global.groupby(['user_id', 'date'])['item_name'].apply(tuple).tolist()
                recommendations = extract_recommendations_from_baskets(baskets_global, target_item_name, conn, limit)
                # Indicate these are global patterns
                for rec in recommendations:
                    rec["reason"] += " [Global Pattern]"

    except Exception as e:
        print(f"Market Basket Error: {e}")
    finally:
        conn.close()

    return recommendations