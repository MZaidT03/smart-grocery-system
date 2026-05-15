from flask import Blueprint, request, jsonify
from database import get_db_connection
from services.analytics import get_consumption_forecast, detect_anomaly
from services.scraper import update_market_prices, preview_market_prices, save_market_prices
from services.analytics import get_ai_learning_status # <--- Import the new function

analytics_bp = Blueprint('analytics', __name__)

# --- HELPER: Inferred Diet Logic (For Inventory Report) ---
def infer_diet_type(category):
    category = (category or "").capitalize()
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

# ---------------------------------------------------------
# ROUTE 1: INVENTORY REPORT (ABC Analysis & Tree Map)
# ---------------------------------------------------------
@analytics_bp.route('/analytics/inventory-report', methods=['GET'])
def get_inventory_report():
    """
    Returns data for the Smart Inventory Report Page:
    1. ABC Analysis (Class A/B/C) based on Stock Value.
    2. Tree Map Data (Visualizing value by category).
    3. Diet Clusters.
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
        # Formula: Value = Price * Quantity
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
            
            # Pareto Principle (80/15/5 rule simplified to 75/95/100)
            if pct <= 75: grade = 'A'      # High Value
            elif pct <= 95: grade = 'B'    # Medium Value
            else: grade = 'C'              # Low Value
            
            p['grade'] = grade
            abc_data.append(p)

        # --- DS LOGIC 2: TREE MAP PREP ---
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

# ---------------------------------------------------------
# ROUTE 2: MAIN DASHBOARD ANALYTICS
# ---------------------------------------------------------
@analytics_bp.route('/analytics/dashboard', methods=['GET'])
def get_analytics():
    """
    Returns data for the Main Analytics Dashboard:
    1. Consumption Trend (Line Chart)
    2. Seasonal Trends (Bar Chart)
    3. Top Items (Bar Chart)
    4. Diet Composition (Radar Chart)
    5. AI Insights Text
    """
    user_id = request.args.get('userId')
    conn = get_db_connection()

    try:
        # 1. CONSUMPTION VELOCITY
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
        seasons = {"Winter": 0, "Spring": 0, "Summer": 0, "Autumn": 0}

        for row in trend_rows:
            m_key = row['month_num']
            count = row['usage_count']

            # Line Chart Data
            consumption_trend.append({
                "month": month_map.get(m_key, m_key),
                "items": count
            })

            # Seasonal Bucket Logic
            s_name = get_season(m_key)
            seasons[s_name] += count
        
        seasonal_trends = [{"name": k, "value": v} for k, v in seasons.items() if v > 0]

        # 2. TOP ITEMS (Pareto)
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

        # 3. DIETARY COMPOSITION (Radar)
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

        # 4. SMART INSIGHTS ENGINE
        insights = []
        if seasonal_trends:
            top_season = max(seasonal_trends, key=lambda x: x['value'])
            insights.append(f"📅 Seasonal Analysis: Your peak consumption is in {top_season['name']}.")
        
        if top_items:
            most_used = top_items[0]['name']
            insights.append(f"🔥 Most consumed item: '{most_used}'. Recommendation: Buy in bulk.")
        
        total_stock = sum(macros.values())
        if total_stock > 0:
            junk_pct = (macros['Junk'] / total_stock)
            if junk_pct > 0.4:
                insights.append(f"🚨 Processed food is {int(junk_pct*100)}% of stock. Recommendation: Increase Vitamins.")

        return jsonify({
            "success": True,
            "consumption_trend": consumption_trend,
            "seasonal_trends": seasonal_trends,
            "top_items": top_items,
            "dietaryComposition": radar_data,
            "insights": insights
        })

    except Exception as e:
        print(f"Analytics Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

# ---------------------------------------------------------
# ROUTE 3: PREDICTIVE FORECAST (ARIMA/WMA)
# ---------------------------------------------------------
# In backend/routes/analytics.py

@analytics_bp.route('/analytics/forecast/<int:product_id>', methods=['GET'])
def product_forecast(product_id):
    conn = get_db_connection()
    try:
        # 1. Fetch Logs (Using correct column names)
        logs = conn.execute("""
            SELECT date(consumption_date) as date, SUM(consumed_quantity) as quantity 
            FROM consumption_logs 
            WHERE product_id = ? 
            GROUP BY date(consumption_date)
            ORDER BY date(consumption_date) ASC
        """, (product_id,)).fetchall()

        log_data = [{'date': row['date'], 'quantity': row['quantity']} for row in logs]

        # 2. Run New DS Engine
        forecast = get_consumption_forecast(log_data)
        
        # 3. Fetch Product
        product = conn.execute("SELECT item_name, current_quantity, consumption_unit FROM products WHERE product_id = ?", (product_id,)).fetchone()
        
        if not product:
            return jsonify({"success": False, "message": "Product not found"}), 404

        current_stock = product['current_quantity']
        
        # Default values
        wma_usage = 0
        seasonal_points = []
        
        if forecast:
            wma_usage = forecast['wma_daily_usage']
            seasonal_points = forecast['seasonal_prediction']

        # Calc days left based on WMA (safer for run-out dates)
        days_left = 999
        if wma_usage > 0:
            days_left = current_stock / wma_usage

        return jsonify({
            "success": True,
            "product": {
                "id": product_id,
                "name": product['item_name'],
                "unit": product['consumption_unit'],
                "stock": current_stock
            },
            "history": log_data,
            "forecast": {
                "daily_usage": wma_usage,         # Single number for flat line
                "seasonal_points": seasonal_points, # List of 7 numbers for wavy line
                "method": forecast['method'] if forecast else "No Data"
            },
            "smart_days_left": round(days_left, 1)
        })

    except Exception as e:
        print(f"Forecast Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()
# In backend/routes/analytics.py

@analytics_bp.route('/analytics/fetch-live-prices', methods=['POST'])
def fetch_live_prices():
    try:
        # 1. Get User ID from the request
        # The frontend uses POST, but doesn't send a body yet. 
        # We can grab it from query params OR defaults.
        # Ideally, update frontend to send JSON body: { userId: 123 }
        
        data = request.get_json() or {}
        user_id = data.get('userId') 
        
        # 2. Call scraper with specific User ID
        count = update_market_prices(user_id=user_id)
        
        return jsonify({
            "success": True, 
            "message": f"Successfully updated prices for {count} items."
        })
    except Exception as e:
        print(f"Scraper Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@analytics_bp.route('/analytics/fetch-live-prices-preview', methods=['POST'])
def fetch_live_prices_preview():
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        item_ids = data.get('itemIds')
        zero_price_only = data.get('zeroPriceOnly', False)
        
        results = preview_market_prices(user_id=user_id, item_ids=item_ids, zero_price_only=zero_price_only)
        
        return jsonify({
            "success": True, 
            "results": results
        })
    except Exception as e:
        print(f"Preview Scraper Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@analytics_bp.route('/analytics/save-live-prices', methods=['POST'])
def save_live_prices():
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        updates = data.get('updates', [])
        
        if not user_id or not updates:
            return jsonify({"success": False, "message": "userId and updates are required."}), 400
            
        count = save_market_prices(user_id=user_id, updates=updates)
        
        return jsonify({
            "success": True, 
            "message": f"Successfully saved prices for {count} items."
        })
    except Exception as e:
        print(f"Save Scraper Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500



@analytics_bp.route('/analytics/status', methods=['GET'])
def ai_status():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"success": False}), 400
    
    stats = get_ai_learning_status(user_id)
    return jsonify({"success": True, "stats": stats})