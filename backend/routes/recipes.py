from flask import Blueprint, jsonify, request
import json
import os
from database import get_db_connection

recipes_bp = Blueprint('recipes', __name__)

def load_recipes():
    """Load recipes from the JSON file."""
    path = os.path.join(os.path.dirname(__file__), '../data/recipes.json')
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def normalize_text(text):
    """
    DS Preprocessing: Cleans text for better matching.
    1. Lowercase
    2. Remove text inside brackets (e.g., 'Wheat Flour (Atta)' -> 'wheat flour')
    3. Remove trailing 's' or 'es' for simple singularization (naive stemming)
    """
    if not text: return ""
    
    # Remove brackets
    if '(' in text:
        text = text.split('(')[0]
    
    text = text.strip().lower()
    
    # Naive singularization (remove 's' at end if len > 3)
    if text.endswith('s') and len(text) > 3:
        text = text[:-1]
    if text.endswith('e') and len(text) > 3: # Handle 'potatoes' -> 'potatoe' edge case roughly
        text = text[:-1]
        
    return text

@recipes_bp.route('/recommend-recipes', methods=['GET'])
def recommend_recipes():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"success": False, "message": "User ID required"}), 400

    conn = get_db_connection()
    # Fetch ONLY items with quantity > 0 (Active Inventory)
    inventory_rows = conn.execute(
        "SELECT item_name FROM products WHERE user_id = ? AND current_quantity > 0", 
        (user_id,)
    ).fetchall()
    conn.close()

    # 1. Build Inventory Vector (Set of normalized names)
    inventory_set = set()
    for row in inventory_rows:
        norm_name = normalize_text(row['item_name'])
        inventory_set.add(norm_name)

    recipes = load_recipes()
    recommendations = []

    # 2. Score Recipes
    for recipe in recipes:
        recipe_ingredients = set()
        matched_ingredients = []
        missing_ingredients = []

        for ing in recipe['ingredients']:
            norm_ing = normalize_text(ing)
            recipe_ingredients.add(norm_ing)
            
            # Check for partial match (e.g. "daal" inside "daal masoor")
            # or exact match in our normalized set
            match_found = False
            
            # Direct check
            if norm_ing in inventory_set:
                match_found = True
            else:
                # Fuzzy check: is the recipe ingredient a substring of any inventory item?
                # e.g., Recipe needs "daal", user has "daal chana" -> Match
                for inv_item in inventory_set:
                    if norm_ing in inv_item or inv_item in norm_ing:
                        match_found = True
                        break
            
            if match_found:
                matched_ingredients.append(ing)
            else:
                missing_ingredients.append(ing)

      # 3. Calculate Score (Percentage Match)
        total_required = len(recipe_ingredients)
        if total_required == 0: continue
        
        match_count = len(matched_ingredients)
        score = (match_count / total_required) * 100

        # --- DS TECHNIQUE: THRESHOLD FILTERING ---
        # Only accept high-confidence matches (> 70%)
        if score >= 70:  
            recommendations.append({
                "id": recipe['id'],
                "name": recipe['name'],
                "score": round(score),
                "matchCount": match_count,
                "totalCount": total_required,
                "missing": missing_ingredients,
                "ingredients": recipe['ingredients'], # <--- ADD THIS LINE
                "difficulty": recipe['difficulty'],
                "cuisine": recipe['cuisine']
            })

    # 4. Sort by highest score first
    recommendations.sort(key=lambda x: x['score'], reverse=True)

    return jsonify({"success": True, "recommendations": recommendations})