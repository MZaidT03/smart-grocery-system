from flask import Blueprint, jsonify
import sqlite3
import os
import random
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

def get_db_path():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, 'grocery.db')

@admin_bp.route('/complex-analytics', methods=['GET'])
def get_complex_analytics():
    # This route simulates running advanced Python DS libraries (Pandas/Scikit-Learn)
    # returning processed insights for the frontend.
    
    # 1. INFLATION TRACKER (Time Series)
    days = [(datetime.now() - timedelta(days=i)).strftime('%a') for i in range(6, -1, -1)]
    inflation_data = []
    base_prices = {"Rice": 280, "Chicken": 650, "Oil": 580}
    
    for day in days:
        day_stat = {"day": day}
        for item, price in base_prices.items():
            # Add volatility and a slight upward trend (inflation)
            volatility = random.randint(-10, 25)
            day_stat[item] = price + volatility
        inflation_data.append(day_stat)

    # 2. SHOPPER ARCHETYPES (Radar Chart)
    # Compares average behavior of different diet groups
    # Scale: 0-100 for normalization
    radar_data = [
        {"subject": "Avg Spend", "Standard": 80, "Vegan": 120, "Keto": 140, "fullMark": 150},
        {"subject": "Health Score", "Standard": 60, "Vegan": 95, "Keto": 85, "fullMark": 150},
        {"subject": "Visit Freq", "Standard": 90, "Vegan": 70, "Keto": 50, "fullMark": 150},
        {"subject": "Bulk Buying", "Standard": 50, "Vegan": 40, "Keto": 90, "fullMark": 150},
        {"subject": "Variety", "Standard": 60, "Vegan": 90, "Keto": 40, "fullMark": 150},
    ]

    # 3. INVENTORY RISK MATRIX (Scatter Plot)
    # Plots items on: X=Consumption Velocity, Y=Current Stock
    # Helps identify "Overstock" (High Stock, Low Use) vs "Critical" (Low Stock, High Use)
    scatter_data = []
    items = ['Milk', 'Eggs', 'Bread', 'Rice', 'Apples', 'Chicken', 'Yogurt', 'Soda', 'Chips', 'Soap']
    
    for item in items:
        velocity = random.randint(10, 100) # Units used per month
        stock = random.randint(5, 150)     # Units in stock
        
        # Simple Clustering Logic for Color
        status = "Healthy"
        if stock < 20 and velocity > 60: status = "Critical" # Red
        elif stock > 100 and velocity < 30: status = "Overstock" # Blue
        elif stock > 100 and velocity > 80: status = "High Volume" # Green
        
        scatter_data.append({
            "name": item,
            "velocity": velocity,
            "stock": stock,
            "status": status,
            "z": random.randint(100, 500) # Bubble size (e.g., Price or Total Value)
        })

    return jsonify({
        "inflation_data": inflation_data,
        "radar_data": radar_data,
        "scatter_data": scatter_data
    })

# Keep the stats route for the top cards
@admin_bp.route('/dashboard-stats', methods=['GET'])
def get_admin_stats():
    conn = None
    try:
        conn = sqlite3.connect(get_db_path(), timeout=10)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        total_users = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        try: total_items = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        except: total_items = 0
        try: active_lists = cursor.execute("SELECT COUNT(*) FROM shopping_lists WHERE status='active'").fetchone()[0]
        except: active_lists = 0

        # Demand Forecast (Bar Chart)
        forecast_data = []
        try:
            demand = cursor.execute("""
                SELECT item_name, COUNT(*) as total_qty FROM shopping_list_items 
                GROUP BY item_name ORDER BY total_qty DESC LIMIT 5
            """).fetchall()
            forecast_data = [{"name": row['item_name'], "demand": row['total_qty']} for row in demand]
        except: pass

        return jsonify({
            "total_users": total_users,
            "total_items": total_items,
            "active_lists": active_lists,
            "demand_forecast": forecast_data
        })
    except Exception as e:
        print(f"Stats Error: {e}")
        return jsonify({}), 500
    finally:
        if conn: conn.close()