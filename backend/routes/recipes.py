from flask import Blueprint, jsonify, request # pyright: ignore[reportMissingImports]
import json
import os
from database import get_db_connection
from services.ml_engine import HybridRecommender

recipes_bp = Blueprint('recipes', __name__)


# Initialize the ML Engine once at startup
RECIPES_PATH = os.path.join(os.path.dirname(__file__), '../data/recipes.json')
recommender = HybridRecommender(RECIPES_PATH)

@recipes_bp.route('/recommend-recipes', methods=['GET'])
def recommend_recipes():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"success": False, "message": "User ID required"}), 400

    conn = get_db_connection()
    # Fetch ONLY active items with quantity > 0
    inventory_rows = conn.execute(
        "SELECT item_name FROM products WHERE user_id = ? AND current_quantity > 0 AND is_active = 1", 
        (user_id,)
    ).fetchall()
    conn.close()

    # 1. Build Inventory List
    inventory = [row['item_name'] for row in inventory_rows]

    # 2. Get recommendations from the Hybrid ML Engine
    try:
        recommendations = recommender.get_recommendations(user_id, inventory)
        return jsonify({"success": True, "recommendations": recommendations})
    except Exception as e:
        print(f"ML Recommendation Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500