from flask import Blueprint, jsonify, request
from database import get_db_connection
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/dashboard', methods=['GET'])
def get_analytics():
    user_id = request.args.get('userId')
    conn = get_db_connection()

    try:
        # ---------------------------------------------------------
        # 1. REAL CONSUMPTION VELOCITY (Time Series Analysis)
        # ---------------------------------------------------------
        # Groups consumption by Month to show usage trends over time
        trend_query = """
            SELECT strftime('%m', consumption_date) as month_num, 
                   COUNT(*) as usage_count 
            FROM consumption_logs 
            WHERE user_id = ? 
            GROUP BY month_num 
            ORDER BY month_num ASC
        """
        trend_rows = conn.execute(trend_query, (user_id,)).fetchall()
        
        # Helper to convert "01" -> "Jan" for the chart
        month_map = {"01":"Jan", "02":"Feb", "03":"Mar", "04":"Apr", 
                     "05":"May", "06":"Jun", "07":"Jul", "08":"Aug", 
                     "09":"Sep", "10":"Oct", "11":"Nov", "12":"Dec"}
        
        consumption_trend = []
        for row in trend_rows:
            m_key = row['month_num']
            consumption_trend.append({
                "month": month_map.get(m_key, m_key),
                "items": row['usage_count']
            })

        # ---------------------------------------------------------
        # 2. REAL HIGH-FREQUENCY ITEMS (Frequency Distribution)
        # ---------------------------------------------------------
        # Identifies the "Top 5" most consumed products (Pareto Analysis)
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
        # 3. DIETARY COMPOSITION (Cluster Analysis)
        # ---------------------------------------------------------
        # Maps existing inventory to Nutritional Clusters
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

        # Format for Radar Chart
        radar_data = [
            {"subject": k, "A": v, "fullMark": 100} for k, v in macros.items() if v > 0
        ]

        # ---------------------------------------------------------
        # 4. SMART INSIGHTS ENGINE
        # ---------------------------------------------------------
        insights = []
        
        # Insight 1: Most Used Item
        if top_items:
            most_used = top_items[0]['name']
            insights.append(f"🔥 Your most consumed item is '{most_used}'. Recommendation: Buy this in bulk to save costs.")
        
        # Insight 2: Health Check
        total_stock = sum(macros.values())
        if total_stock > 0:
            junk_pct = (macros['Junk'] / total_stock)
            if junk_pct > 0.4:
                insights.append(f"🚨 Processed food makes up {int(junk_pct*100)}% of your stock. Recommendation: Increase Vitamins group.")
            if macros['Vitamins'] == 0:
                insights.append("🥦 No fresh produce detected. Suggestion: Restock Fruits & Vegetables.")

        # Insight 3: Activity Level
        if not consumption_trend:
            insights.append("📉 No consumption data yet. Start using your inventory to see trends here.")

        return jsonify({
            "success": True,
            "consumption_trend": consumption_trend,
            "top_items": top_items,
            "dietaryComposition": radar_data,
            "insights": insights
        })

    except Exception as e:
        print(f"Analytics Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()