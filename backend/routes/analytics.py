from flask import Blueprint, jsonify, request
from database import get_db_connection
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)

# --- HELPER: Inferred Diet Logic (For Inventory Report) ---
def infer_diet_type(category):
    category = category.capitalize()
    if category in ["Meat", "Fish", "Seafood"]: return "Non-Veg"
    if category in ["Dairy", "Eggs", "Honey"]: return "Vegetarian"
    return "Vegan" # Fruits, Veg, Grains, Staples

# --- HELPER: Get Season from Month (For Seasonal Trends) ---
def get_season(month_num):
    # Based on standard Northern Hemisphere/PK seasons
    m = int(month_num)
    if m in [12, 1, 2]: return "Winter"
    if m in [3, 4]: return "Spring"
    if m in [5, 6, 7, 8, 9]: return "Summer"
    return "Autumn" # 10, 11

@analytics_bp.route('/analytics/inventory-report', methods=['GET'])
def get_inventory_report():
    """
    Returns data for the Smart Inventory Report Page:
    1. ABC Analysis (Class A/B/C)
    2. Tree Map Data (Category Value)
    3. Diet Clusters
    """
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"success": False, "message": "User ID required"}), 400

    conn = get_db_connection()
    try:
        # Fetch Products
        products = conn.execute("""
            SELECT item_name as name, category, current_quantity as quantity, price, consumption_unit as unit 
            FROM products 
            WHERE user_id = ? AND is_active = 1
        """, (user_id,)).fetchall()
        
        products_list = [dict(row) for row in products]

        if not products_list:
            return jsonify({
                "success": True, 
                "treeMapData": [], 
                "abcData": [], 
                "dietData": {"Vegan": [], "Vegetarian": [], "Non-Veg": []}
            })

        # --- DS LOGIC 1: ABC ANALYSIS ---
        for p in products_list:
            p['stockValue'] = (p['price'] or 0) * (p['quantity'] or 0)

        # Sort High to Low
        sorted_products = sorted(products_list, key=lambda x: x['stockValue'], reverse=True)
        total_val = sum(p['stockValue'] for p in sorted_products)

        accumulated = 0
        abc_data = []
        
        for p in sorted_products:
            accumulated += p['stockValue']
            pct = (accumulated / total_val) * 100 if total_val > 0 else 0
            
            if pct <= 75: grade = 'A'
            elif pct <= 95: grade = 'B'
            else: grade = 'C'
            
            p['grade'] = grade
            abc_data.append(p)

        # --- DS LOGIC 2: TREE MAP ---
        cat_map = {}
        for p in products_list:
            c = p['category'] or "Other"
            if c not in cat_map: cat_map[c] = {"name": c, "value": 0, "items": []}
            
            cat_map[c]['value'] += p['stockValue']
            cat_map[c]['items'].append(p)
        
        tree_map_data = sorted(list(cat_map.values()), key=lambda x: x['value'], reverse=True)

        # --- DS LOGIC 3: DIET CLUSTERS ---
        diet_data = {"Vegan": [], "Vegetarian": [], "Non-Veg": []}
        for p in products_list:
            d_type = infer_diet_type(p['category'])
            if d_type in diet_data:
                diet_data[d_type].append(p)

        return jsonify({
            "success": True,
            "abcData": abc_data,
            "treeMapData": tree_map_data,
            "dietData": diet_data
        })

    except Exception as e:
        print(f"Report Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()


@analytics_bp.route('/analytics/dashboard', methods=['GET'])
def get_analytics():
    """
    Returns data for the Main Analytics Dashboard:
    1. Consumption Trend (Line Chart)
    2. Seasonal Trends (Bar Chart) - NEW
    3. Top Items (Bar Chart)
    4. Diet Composition (Radar Chart)
    5. Insights Text
    """
    user_id = request.args.get('userId')
    conn = get_db_connection()

    try:
        # ---------------------------------------------------------
        # 1. CONSUMPTION VELOCITY (Time Series)
        # ---------------------------------------------------------
        trend_query = """
            SELECT strftime('%m', consumption_date) as month_num, 
                   COUNT(*) as usage_count 
            FROM consumption_logs 
            WHERE user_id = ? 
            GROUP BY month_num 
            ORDER BY month_num ASC
        """
        trend_rows = conn.execute(trend_query, (user_id,)).fetchall()
        
        month_map = {"01":"Jan", "02":"Feb", "03":"Mar", "04":"Apr", 
                     "05":"May", "06":"Jun", "07":"Jul", "08":"Aug", 
                     "09":"Sep", "10":"Oct", "11":"Nov", "12":"Dec"}
        
        consumption_trend = []
        
        # --- NEW: SEASONAL AGGREGATION BUCKETS ---
        seasons = {"Winter": 0, "Spring": 0, "Summer": 0, "Autumn": 0}

        for row in trend_rows:
            m_key = row['month_num']
            count = row['usage_count']

            # Add to Consumption Trend
            consumption_trend.append({
                "month": month_map.get(m_key, m_key),
                "items": count
            })

            # Add to Seasonal Bucket
            s_name = get_season(m_key)
            seasons[s_name] += count
        
        # Format for Bar Chart (Remove empty seasons if preferred, or keep all)
        seasonal_trends = [{"name": k, "value": v} for k, v in seasons.items() if v > 0]

        # ---------------------------------------------------------
        # 2. TOP ITEMS (Pareto)
        # ---------------------------------------------------------
        top_query = """
            SELECT p.item_name, COUNT(cl.log_id) as freq
            FROM consumption_logs cl
            JOIN products p ON cl.product_id = p.product_id
            WHERE cl.user_id = ?
            GROUP BY p.item_name
            ORDER BY freq DESC
            LIMIT 5
        """
        top_rows = conn.execute(top_query, (user_id,)).fetchall()
        top_items = [{"name": row['item_name'], "count": row['freq']} for row in top_rows]

        # ---------------------------------------------------------
        # 3. DIETARY COMPOSITION (Cluster)
        # ---------------------------------------------------------
        inventory = conn.execute("SELECT category, current_quantity FROM products WHERE user_id = ?", (user_id,)).fetchall()
        
        macros = {"Proteins": 0, "Carbs": 0, "Fats": 0, "Vitamins": 0, "Junk": 0}
        
        for item in inventory:
            cat = item['category']
            qty = item['current_quantity']
            
            if cat in ['Meat', 'Pulses', 'Dairy']: macros['Proteins'] += qty
            elif cat in ['Staples', 'Bakery']: macros['Carbs'] += qty
            elif cat in ['Oil & Ghee']: macros['Fats'] += qty
            elif cat in ['Vegetables', 'Fruits']: macros['Vitamins'] += qty
            elif cat in ['Snacks', 'Beverages', 'Condiments']: macros['Junk'] += qty

        radar_data = [
            {"subject": k, "A": v, "fullMark": 100} for k, v in macros.items() if v > 0
        ]

        # ---------------------------------------------------------
        # 4. SMART INSIGHTS ENGINE
        # ---------------------------------------------------------
        insights = []
        
        # Insight: Seasonal
        if seasonal_trends:
            top_season = max(seasonal_trends, key=lambda x: x['value'])
            insights.append(f"📅 Seasonal Analysis: Your peak consumption is in {top_season['name']}.")

        # Insight: Most Used
        if top_items:
            most_used = top_items[0]['name']
            insights.append(f"🔥 Most consumed item: '{most_used}'. Recommendation: Buy in bulk.")
        
        # Insight: Health
        total_stock = sum(macros.values())
        if total_stock > 0:
            junk_pct = (macros['Junk'] / total_stock)
            if junk_pct > 0.4:
                insights.append(f"🚨 Processed food is {int(junk_pct*100)}% of stock. Recommendation: Increase Vitamins.")

        return jsonify({
            "success": True,
            "consumption_trend": consumption_trend,
            "seasonal_trends": seasonal_trends, # <--- NEW FIELD
            "top_items": top_items,
            "dietaryComposition": radar_data,
            "insights": insights
        })

    except Exception as e:
        print(f"Analytics Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()