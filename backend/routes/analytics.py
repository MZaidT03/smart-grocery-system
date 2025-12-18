from flask import Blueprint, jsonify, request
from database import get_db_connection

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/dashboard', methods=['GET'])
def get_analytics():
    # We use query param ?userId=1 to match the frontend call
    user_id = request.args.get('userId')
    conn = get_db_connection()

    try:
        # 1. SPENDING TRENDS (Last 6 Months)
        # Fetches the fake monthly spending data we generated
        spending_data = conn.execute("""
            SELECT month_str, total_spent 
            FROM spending_logs 
            ORDER BY month_str ASC 
            LIMIT 6
        """).fetchall()

        # 2. DIETARY BREAKDOWN (Pie Chart Data)
        # Counts items by Category (e.g., 5 Snacks, 3 Vegetables)
        cat_data = conn.execute("""
            SELECT category, COUNT(*) as count 
            FROM products 
            WHERE user_id = ? AND current_quantity > 0
            GROUP BY category
        """, (user_id,)).fetchall()

        # Counts items by Diet Type (e.g., 10 Veg, 4 Non-Veg)
        # This gives a high-level view of the user's stock
        diet_data = conn.execute("""
            SELECT 
                CASE 
                    WHEN lower(item_name) LIKE '%chicken%' OR lower(item_name) LIKE '%beef%' OR lower(item_name) LIKE '%mutton%' THEN 'Non-Veg'
                    WHEN lower(item_name) LIKE '%egg%' OR lower(item_name) LIKE '%milk%' THEN 'Non-Veg'
                    ELSE 'Veg'
                END as diet_group,
                COUNT(*) as count
            FROM products
            WHERE user_id = ? AND current_quantity > 0
            GROUP BY diet_group
        """, (user_id,)).fetchall()

        # 3. INFLATION TRACKER (Price History)
        # Calculates the % increase between the oldest and newest price record
        inflation_data = []
        
        # Get list of items that have price history
        items = conn.execute("SELECT DISTINCT item_name FROM price_history").fetchall()
        
        for item in items:
            name = item[0]
            # Fetch all price points for this item sorted by date
            prices = conn.execute("""
                SELECT price FROM price_history 
                WHERE item_name = ? 
                ORDER BY date ASC
            """, (name,)).fetchall()
            
            # We need at least 2 data points to calculate change
            if len(prices) >= 2:
                oldest_price = prices[0][0]
                newest_price = prices[-1][0]
                
                # Calculate Percentage Change
                if oldest_price > 0:
                    pct_change = ((newest_price - oldest_price) / oldest_price) * 100
                else:
                    pct_change = 0

                # Only include items that have increased in price (Inflation)
                if pct_change > 0: 
                    inflation_data.append({
                        "name": name,
                        "old_price": oldest_price,
                        "new_price": newest_price,
                        "change": round(pct_change, 1)
                    })
        
        # Sort by highest inflation first
        inflation_data.sort(key=lambda x: x['change'], reverse=True)

        return jsonify({
            "success": True,
            "spending": [dict(row) for row in spending_data],
            "categories": [dict(row) for row in cat_data],
            "diet": [dict(row) for row in diet_data],
            "inflation": inflation_data[:5] # Return only top 5 highest increases
        })

    except Exception as e:
        print("Analytics Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()