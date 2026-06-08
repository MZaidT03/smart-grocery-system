import os
import re
import json
import requests
from flask import Blueprint, request, jsonify
from database import get_db_connection

ai_bp = Blueprint('ai', __name__)

def call_groq_api(contents, groq_key):
    # Translate Gemini format to OpenAI/Groq format
    messages = []
    for content in contents:
        role = content.get('role', 'user')
        if role == 'model':
            role = 'assistant'
        text = content['parts'][0]['text']
        messages.append({"role": role, "content": text})
        
    api_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.7
    }
    
    res = requests.post(api_url, json=payload, headers=headers, timeout=30)
    res_data = res.json()
    
    if res.status_code == 200 and 'choices' in res_data:
        return res_data['choices'][0]['message']['content'], None
    else:
        return None, res_data

def is_recipe_question(question):
    q_lower = question.lower()
    recipe_keywords = [
        'recipe', 'cook', 'make', 'dish', 'meal', 'prepare',
        'breakfast', 'lunch', 'dinner', 'snack', 'dessert',
        'what can i make', 'what can i cook', 'from my inventory',
        'from my pantry', 'using my items'
    ]
    return any(kw in q_lower for kw in recipe_keywords)

def extract_mentioned_ingredients(question):
    q_lower = question.lower()
    ingredients_map = {
        'milk': 'milk',
        'cocoa powder': 'cocoa powder',
        'coco powder': 'cocoa powder',
        'chocolate': 'chocolate',
        'sugar': 'sugar',
        'rice': 'rice',
        'flour': 'flour',
        'egg': 'egg',
        'eggs': 'egg',
        'bread': 'bread',
        'butter': 'butter',
        'oil': 'oil',
        'cooking oil': 'oil',
        'chicken': 'chicken',
        'potato': 'potato',
        'onion': 'onion',
        'tomato': 'tomato',
        'tea': 'tea',
        'coffee': 'coffee',
        'banana': 'banana',
        'apple': 'apple',
        'yogurt': 'yogurt',
        'curd': 'curd',
        'cream': 'cream',
        'cheese': 'cheese',
        'pasta': 'pasta',
        'noodles': 'noodles',
        'salt': 'salt',
        'pepper': 'pepper',
        'masala': 'masala',
        'daal': 'lentils',
        'lentils': 'lentils',
        'atta': 'flour',
        'wheat flour': 'flour',
        'besan': 'gram flour',
        'garlic': 'garlic',
        'ginger': 'ginger',
        'chilli': 'chilli',
        'green chilli': 'green chilli',
        'red chilli': 'red chilli',
        'turmeric': 'turmeric',
        'haldi': 'turmeric',
        'coriander': 'coriander',
        'dhania': 'coriander',
        'cumin': 'cumin',
        'zeera': 'cumin',
        'garam masala': 'garam masala',
        'mozzarella': 'cheese',
        'ketchup': 'ketchup',
        'mayonnaise': 'mayonnaise'
    }
    found = set()
    for kw, normal_name in ingredients_map.items():
        if kw in q_lower:
            found.add(normal_name)
    return list(found)

def handle_local_queries(question, inventory, products):
    q_lower = question.lower().strip()
    
    # 0. Greetings & Goodbyes
    if q_lower in ["hi", "hello", "hey", "greetings", "hi there", "hello there"]:
        return "Hello! I am your Smart Grocer Assistant. How can I help you today?"
    if q_lower in ["bye", "goodbye", "see ya", "exit", "quit", "stop"]:
        return "Goodbye! Have a great day!"
        
    # 0.5 Low Stock & Watch List
    if any(phrase in q_lower for phrase in ["low item", "low stock", "running out", "running low", "low in pantry", "low inventory", "on low"]):
        low_items = [i['name'] for i in inventory if i.get('days_left', -1) != -1 and i['days_left'] < 3]
        if low_items:
            return f"You have {len(low_items)} items running critically low: {', '.join(low_items)}."
        return "Great news! You don't have any items running low right now."

    if any(phrase in q_lower for phrase in ["watch", "on watch", "watch list"]):
        watch_items = [i['name'] for i in inventory if i.get('days_left', -1) != -1 and 3 <= i.get('days_left', -1) < 7]
        if watch_items:
            return f"You have {len(watch_items)} items on your watch list: {', '.join(watch_items)}."
        return "You don't have any items currently on the watch list."
    
    # 1. Most expensive item
    if any(phrase in q_lower for phrase in ["most expensive", "expensive item", "highest price"]):
        if not inventory:
            return "Your inventory is currently empty, so I can't find the most expensive item!"
        
        valid_items = [i for i in inventory if isinstance(i.get('price'), (int, float))]
        if not valid_items:
            return "I couldn't find price information for the items in your inventory."
            
        most_expensive = max(valid_items, key=lambda x: x['price'])
        return f"Sure! Looking at your inventory, the most expensive item is {most_expensive['name']} priced at Rs. {most_expensive['price']}."
        
    # 2. Total items check
    if any(phrase in q_lower for phrase in ["total inventory items", "how many items", "total items", "number of items"]):
        return f"You currently have {len(inventory)} different items in your pantry."

    # 3. Specific product lookup & Consumption Log lookup
    for item in inventory:
        item_name = item['name'].lower()
        if item_name in q_lower:
            qty_rounded = round(item.get('quantity', 0), 2)
            # Check if asking for consumption log
            if any(phrase in q_lower for phrase in ["consumption log", "consumption of", "consumption rate", "how much do i consume", "average log", "log for"]):
                hist = item.get('historical_rate', 0)
                man_qty = item.get('manual_qty', 1)
                man_days = item.get('manual_days', 1)
                
                if hist > 0:
                    return f"According to your logs, you consume an average of {round(hist, 2)} {item['unit']} of {item['name']} per logged day."
                else:
                    return f"I don't have enough logged consumption data for {item['name']} yet, but based on your manual settings, your current rate is {man_qty} {item['unit']} every {man_days} days."
            
            # Check if asking for price or general stock
            if any(phrase in q_lower for phrase in ["do i have", "i have", "is there", "stock", "quantity", "how many", "price", "how much", "show me", "tell me", "check", "in inventory", "in pantry", "my inventory"]):
                price_str = f"Rs. {item['price']}" if isinstance(item.get('price'), (int, float)) else "Unknown"
                return f"Yes! You have {item['name']} in your inventory.\n\nCurrently in stock: {qty_rounded} {item['unit']} at {price_str}."

    # 4. Fallback for very short queries that just mention the item name
    if len(q_lower.split()) <= 6:
        for item in inventory:
            if item['name'].lower() in q_lower:
                qty_rounded = round(item.get('quantity', 0), 2)
                
                # Check again if it was a short query about consumption
                if any(phrase in q_lower for phrase in ["consumption", "rate", "log"]):
                    hist = item.get('historical_rate', 0)
                    man_qty = item.get('manual_qty', 1)
                    man_days = item.get('manual_days', 1)
                    
                    if hist > 0:
                        return f"According to your logs, you consume an average of {round(hist, 2)} {item['unit']} of {item['name']} per logged day."
                    else:
                        return f"I don't have enough logged consumption data for {item['name']} yet, but based on your manual settings, your current rate is {man_qty} {item['unit']} every {man_days} days."
                        
                price_str = f"Rs. {item['price']}" if isinstance(item.get('price'), (int, float)) else "Unknown"
                return f"You have {item['name']} in your inventory.\n\nCurrently in stock: {qty_rounded} {item['unit']} at {price_str}."

    # 5. Handle items not in inventory
    # If the user asks if they have something, and we reached here, it means it's not in the inventory.
    # We use 'products' (which are matching market items) to confirm what they are asking about.
    if any(phrase in q_lower for phrase in ["do i have", "i have", "is there", "stock", "quantity", "in inventory", "in pantry", "my inventory"]):
        # Make sure they actually asked about a specific item, not a general query that already bypassed
        if products and len(q_lower.split()) <= 10:
            market_item_name = products[0]['name']
            return f"You do not currently have {market_item_name} in your inventory."
        
        # If no market product matched either, but it's a short query, just give a generic local response.
        if len(q_lower.split()) <= 6:
            return "I couldn't find that item in your inventory."

    return None

def fetch_relevant_products(question, user_id=None):
    """
    Heuristic-based simple retrieval:
    - Budget: "under 500", "within 1000", "budget 2000"
    - Category: matches common grocery categories
    - Cheapest: "cheapest", "lowest price", "affordable"
    - Alternative: "alternative to", "cheaper than"
    - General: fallback to product names
    """
    q_lower = question.lower()
    conn = get_db_connection()
    products = []
    
    try:
        # 1. Detect Budget
        budget_match = re.search(r'(?:under|within|budget|rs\.?|rs)\s*(\d+)', q_lower)
        budget = int(budget_match.group(1)) if budget_match else None
        
        # 2. Detect "Cheapest" or "Alternative"
        is_cheapest = any(word in q_lower for word in ['cheapest', 'lowest price', 'affordable', 'cheaper'])
        
        # 3. Detect Keywords (Categories or Items)
        keywords = ['milk', 'dairy', 'snack', 'breakfast', 'rice', 'oil', 'cooking oil', 
                    'tea', 'sugar', 'drink', 'biscuit', 'detergent', 'cleaning', 'surf']
        
        found_keywords = [kw for kw in keywords if kw in q_lower]
        
        # Build SQL Query dynamically based on heuristics
        base_query = """
            SELECT p.item_name, p.category, ph.price 
            FROM product_catalog p
            LEFT JOIN (
                SELECT item_name, price 
                FROM price_history 
                GROUP BY item_name 
                HAVING MAX(date)
            ) ph ON p.item_name = ph.item_name
            WHERE 1=1
        """
        
        params = []
        
        # Add keyword filter
        if found_keywords:
            like_clauses = " OR ".join(["p.category LIKE ? OR p.item_name LIKE ?"] * len(found_keywords))
            base_query += f" AND ({like_clauses})"
            for kw in found_keywords:
                params.extend([f"%{kw}%", f"%{kw}%"])
                
        # Add budget filter
        if budget:
            base_query += " AND ph.price <= ?"
            params.append(budget)
            
        # Order by price if "cheapest" is asked
        if is_cheapest:
            base_query += " ORDER BY ph.price ASC"
        else:
            base_query += " ORDER BY RANDOM()" # Mix it up for general queries
            
        base_query += " LIMIT 10"
        
        rows = conn.execute(base_query, params).fetchall()
        
        for row in rows:
            products.append({
                "name": row['item_name'],
                "category": row['category'],
                "price": row['price'] if row['price'] else "Unknown"
            })
            
    except Exception as e:
        print(f"Retrieval Error: {e}")
    finally:
        conn.close()
        
    inventory = []
    if user_id:
        try:
            conn = get_db_connection()
            query = """
                SELECT p.item_name, p.current_quantity, p.consumption_unit, p.usage_freq_qty, p.usage_freq_days,
                       COALESCE(NULLIF(p.price, 0), ph.price) as price,
                       COALESCE((SELECT AVG(avg_consumption_rate) FROM consumption_summary cs 
                         WHERE cs.product_id = p.product_id AND cs.summary_date >= date('now', '-30 days')), 0) as historical_daily_rate
                FROM products p
                LEFT JOIN (
                    SELECT item_name, price 
                    FROM price_history 
                    GROUP BY item_name 
                    HAVING MAX(date)
                ) ph ON p.item_name = ph.item_name
                WHERE p.user_id = ? AND p.is_active = 1
            """
            rows = conn.execute(query, (user_id,)).fetchall()
            for row in rows:
                qty = float(row['current_quantity']) if row['current_quantity'] is not None else 0
                manual_qty = float(row['usage_freq_qty']) if row['usage_freq_qty'] is not None else 1
                manual_days = float(row['usage_freq_days']) if row['usage_freq_days'] is not None else 1
                manual_daily_rate = manual_qty / manual_days if manual_days > 0 else 0
                historical_rate = float(row['historical_daily_rate']) if row['historical_daily_rate'] is not None else 0
                
                if manual_days > 1 or manual_qty != 1: 
                    effective_rate = manual_daily_rate
                elif historical_rate > 0: 
                    effective_rate = historical_rate
                else: 
                    effective_rate = manual_daily_rate
                    
                days_left = qty / effective_rate if effective_rate > 0 else -1

                inventory.append({
                    "name": row['item_name'],
                    "quantity": qty,
                    "unit": row['consumption_unit'],
                    "price": row['price'] if row['price'] else "Unknown",
                    "days_left": days_left,
                    "manual_qty": manual_qty,
                    "manual_days": manual_days,
                    "historical_rate": historical_rate
                })
        except Exception as e:
            print(f"Inventory Retrieval Error: {e}")
        finally:
            conn.close()
            
    return products, inventory

def generate_fallback_response(products, inventory, recipe_mode=False, mentioned_ingredients=None):
    if not products and not inventory:
        return "Sorry, I could not find matching products in the catalog or your pantry."
        
    if recipe_mode:
        response = "I found these items you can use:\n"
        used_items = []
        if inventory:
            used_items.extend([i['name'] for i in inventory])
        if mentioned_ingredients:
            used_items.extend(mentioned_ingredients)
            
        # De-duplicate
        used_items = list(set(used_items))
        
        for item in used_items[:10]: # Limit to 10 for fallback display
            response += f"- {item}\n"
            
        response += "\nAI recipe generation is currently unavailable (likely high demand), but you can try asking again in a minute!"
        return response
        
    response = "The AI is currently unavailable (likely high demand). "
    if products:
        response += "Here are some market products related to your query:\n"
        for p in products:
            price_str = f"Rs. {p['price']}" if p['price'] != "Unknown" else "Price Unknown"
            response += f"- {p['name']} ({price_str})\n"
            
    if inventory:
        response += f"\n(Note: You have {len(inventory)} items in your pantry. Try asking again in a minute for AI recipes!)"
        
    return response

@ai_bp.route('/ask', methods=['POST', 'OPTIONS'])
def ask_assistant():
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    data = request.json
    question = data.get('question', '').strip()
    user_id = data.get('userId')
    history = data.get('history', [])
    
    if not question:
        return jsonify({"success": False, "error": "Question is required."}), 400
        
    products, inventory = fetch_relevant_products(question, user_id)
    recipe_mode = is_recipe_question(question)
    mentioned_ingredients = extract_mentioned_ingredients(question)
    
    # Check local handler first for simple queries (non-recipe)
    if not recipe_mode:
        local_response = handle_local_queries(question, inventory, products)
        if local_response:
            return jsonify({
                "success": True,
                "answer": local_response,
                "products": products,
                "inventory": inventory,
                "mentionedIngredients": mentioned_ingredients,
                "recipeMode": recipe_mode,
                "mode": "local (Rule-based)"
            })
    
    gemini_key = os.environ.get("GEMINI_API_KEY")
    
    # Use fallback if no key exists
    if not gemini_key:
        fallback_answer = generate_fallback_response(products, inventory, recipe_mode, mentioned_ingredients)
        return jsonify({
            "success": True, 
            "answer": fallback_answer,
            "products": products,
            "inventory": inventory,
            "mentionedIngredients": mentioned_ingredients,
            "recipeMode": recipe_mode,
            "mode": "fallback"
        })
        
    # Call Gemini REST API
    if recipe_mode:
        prompt = f"""You are Smart Grocer Recipe Assistant.

The user is asking for recipe or cooking help.

Use ONLY:
1. User's pantry/inventory items
2. Ingredients directly mentioned in the user question
3. Available market products only as optional extra suggestions

Rules:
- Do NOT invent that the user owns ingredients not present in pantry or mentioned by the user.
- Do NOT invent product prices.
- If important ingredients are missing, mention them clearly under Missing / optional items.
- Keep recipe simple, practical, and suitable for a normal home kitchen.
- Prefer Pakistani/Asian grocery style when suitable.
- Use short steps.
- Do not give medical/diet claims.
- If pantry is empty and no ingredients are mentioned, ask the user to add pantry items or mention ingredients.
- If the recipe uses market products, clearly label them as optional items to buy.

CRITICAL INSTRUCTION:
- Basic Urdu and Roman Urdu are allowed.
- If the user's input is completely irrelevant to groceries, food, or assistant duties, or if it is just random gibberish/keyboard mashing, politely apologize, state that you can only help with grocery and pantry queries, and do not provide any recipe or product data.
- If the user asks generally (e.g. "What can I cook?"), DO NOT give a full recipe immediately! 
Instead, provide 2-3 short, appealing recipe TITLES based on their inventory, and ask them to pick one.
Once the user picks an option (or if they ask for a specific recipe initially), then provide the full recipe.

User question:
{question}

Ingredients mentioned in question:
{json.dumps(mentioned_ingredients, indent=2)}

User's Pantry Items:
{json.dumps(inventory, indent=2)}

Available Market Products:
{json.dumps(products, indent=2)}

Answer format:
Recipe Name:
Ingredients I can use:
Missing / optional items:
Steps:
Estimated time:
Short tip:

Now write the answer."""
    else:
        prompt = f"""You are Smart Grocer Assistant.
Answer the user using ONLY the provided product data.
Do not invent products, prices, discounts, or stock.
If products are missing, politely say that no matching product was found.
Keep the answer short, useful, and friendly.
Use Pakistani Rupees as Rs.
Suggest best choices based on price and relevance.
IMPORTANT: Distinguish between "Available Market Products" and "User's Pantry Items (Inventory)". If the user asks about their own inventory or pantry, ONLY look at "User's Pantry Items".

CRITICAL RULES:
- Basic Urdu and Roman Urdu are allowed.
- If the user's input is completely irrelevant to groceries, food, or assistant duties, or if it is just random gibberish/keyboard mashing, politely apologize, state that you can only help with grocery and pantry queries, and do not provide any product data.

User question:
{question}

Available Market Products (from the global store):
{json.dumps(products, indent=2)}

User's Pantry Items / Inventory (Items the user currently owns, includes average daily consumption logs):
{json.dumps(inventory, indent=2)}

Now write the answer."""

    api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    
    try:
        contents = []
        # Keep only the last 4 messages to prevent token limits
        for h in history[-4:]:
            # Skip the hardcoded greeting from frontend
            if h.get('role') == 'model' and h.get('text', '').startswith("Hi! I'm your Smart Grocer Assistant."):
                continue
            contents.append({
                "role": h['role'],
                "parts": [{"text": h['text']}]
            })
            
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })
        
        payload = {
            "contents": contents
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": gemini_key
        }
        
        res = requests.post(api_url, json=payload, headers=headers, timeout=30)
        res_data = res.json()
        
        if res.status_code == 200 and 'candidates' in res_data:
            answer = res_data['candidates'][0]['content']['parts'][0]['text']
            return jsonify({
                "success": True,
                "answer": answer,
                "products": products,
                "inventory": inventory,
                "mentionedIngredients": mentioned_ingredients,
                "recipeMode": recipe_mode,
                "mode": "ai (Gemini)"
            })
        else:
            print("Gemini API Error:", res_data)
            # Try Groq Fallback
            groq_key = os.environ.get("GROQ_API_KEY")
            if groq_key:
                print("Attempting Groq Fallback...")
                groq_answer, groq_err = call_groq_api(contents, groq_key)
                if groq_answer:
                    return jsonify({
                        "success": True,
                        "answer": groq_answer,
                        "products": products,
                        "inventory": inventory,
                        "mentionedIngredients": mentioned_ingredients,
                        "recipeMode": recipe_mode,
                        "mode": "ai (Groq Fallback)"
                    })
                else:
                    print("Groq API Error:", groq_err)
            
            fallback_answer = generate_fallback_response(products, inventory, recipe_mode, mentioned_ingredients)
            return jsonify({
                "success": True,
                "answer": fallback_answer,
                "products": products,
                "inventory": inventory,
                "mentionedIngredients": mentioned_ingredients,
                "recipeMode": recipe_mode,
                "mode": "fallback",
                "debug_error": str(res_data)
            })
            
    except Exception as e:
        print("Gemini Request Exception:", e)
        # Try Groq Fallback
        groq_key = os.environ.get("GROQ_API_KEY")
        if groq_key:
            print("Attempting Groq Fallback...")
            try:
                groq_answer, groq_err = call_groq_api(contents, groq_key)
                if groq_answer:
                    return jsonify({
                        "success": True,
                        "answer": groq_answer,
                        "products": products,
                        "inventory": inventory,
                        "mentionedIngredients": mentioned_ingredients,
                        "recipeMode": recipe_mode,
                        "mode": "ai (Groq Fallback)"
                    })
                else:
                    print("Groq API Error:", groq_err)
            except Exception as groq_e:
                print("Groq Request Exception:", groq_e)

        fallback_answer = generate_fallback_response(products, inventory, recipe_mode, mentioned_ingredients)
        return jsonify({
            "success": True,
            "answer": fallback_answer,
            "products": products,
            "inventory": inventory,
            "mentionedIngredients": mentioned_ingredients,
            "recipeMode": recipe_mode,
            "mode": "fallback",
            "debug_error": str(e)
        })
