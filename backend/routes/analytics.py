from flask import Blueprint, jsonify, request
from database import get_db_connection
import os
import sys

# Add the parent directory to sys.path to ensure module discovery
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Attempt to import the scraper service
try:
    from services.scraper import run_scraper
except ImportError as e:
    print(f"⚠️ Warning: Scraper service could not be imported. Live updates will fail. Error: {e}")
    run_scraper = None

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/dashboard', methods=['GET'])
def get_analytics():
    user_id = request.args.get('userId')
    conn = get_db_connection()

    try:
        # 1. SPENDING TRENDS (Last 6 Months)
        spending_data = conn.execute("""
            SELECT month_str, total_spent 
            FROM spending_logs 
            ORDER BY month_str ASC 
            LIMIT 6
        """).fetchall()

        # 2. DIETARY BREAKDOWN (Category Count)
        cat_data = conn.execute("""
            SELECT category, COUNT(*) as count 
            FROM products 
            WHERE user_id = ? AND current_quantity > 0
            GROUP BY category
        """, (user_id,)).fetchall()

        # 3. INFLATION TRACKER (Top 5 Price Increases)
        inflation_data = []
        items = conn.execute("SELECT DISTINCT item_name FROM price_history").fetchall()
        
        for (item_name,) in items:
            prices = conn.execute("""
                SELECT price FROM price_history 
                WHERE item_name = ? 
                ORDER BY date ASC
            """, (item_name,)).fetchall()
            
            if len(prices) >= 2:
                oldest_price = prices[0][0]
                newest_price = prices[-1][0]
                
                # Calculate % Change
                if oldest_price > 0:
                    pct_change = ((newest_price - oldest_price) / oldest_price) * 100
                else:
                    pct_change = 0

                if pct_change > 0: 
                    inflation_data.append({
                        "name": item_name,
                        "old_price": oldest_price,
                        "new_price": newest_price,
                        "change": round(pct_change, 1)
                    })
        
        inflation_data.sort(key=lambda x: x['change'], reverse=True)

        return jsonify({
            "success": True,
            "spending": [dict(row) for row in spending_data],
            "categories": [dict(row) for row in cat_data],
            "inflation": inflation_data[:5]
        })

    except Exception as e:
        print("Analytics Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

# --- NEW ENDPOINT FOR LIVE SCRAPING ---
@analytics_bp.route('/analytics/fetch-live-prices', methods=['POST'])
def fetch_live_prices():
    """
    Triggers the Al-Fatah scraper to update prices in real-time.
    """
    if not run_scraper:
        return jsonify({"success": False, "message": "Scraper service is not available."}), 500

    try:
        # This calls the run_scraper() function from services/scraper.py
        run_scraper()
        return jsonify({
            "success": True, 
            "message": "Market prices updated successfully from Al-Fatah!"
        })
    except Exception as e:
        print(f"Scraper Error: {e}")
        return jsonify({"success": False, "message": f"Scraping failed: {str(e)}"}), 500