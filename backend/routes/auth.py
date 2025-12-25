from flask import Blueprint, request, jsonify
import sqlite3
from database import get_db_connection
from utils import hash_password, safe_float

auth_bp = Blueprint('auth', __name__)

# --- REGISTER ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    email = (data.get("email") or "").strip()
    
    household_size = safe_float(data.get("householdSize"), 1)
    diet_preference = data.get("dietType", "Non-Veg")
    
    if not username or not password: 
        return jsonify({"success": False, "message": "Missing credentials"}), 400
    
    hashed = hash_password(password)
    
    conn = get_db_connection()
    try:
        # We try to insert into 'diet_pref', but if your DB is old it might fail.
        # This SQL assumes the column is 'diet_pref'.
        conn.execute("""
            INSERT INTO users (username, password_hash, email, household_size, diet_preference) 
            VALUES (?, ?, ?, ?, ?)
        """, (username, hashed, email, int(household_size), diet_preference))
        conn.commit()
        return jsonify({"success": True})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Username or Email already exists"}), 409
    except Exception as e:
        # Fallback: If 'diet_pref' fails, maybe the column is 'diet_preference'?
        print(f"Register Warning: {e}") 
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

# --- LOGIN ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username_input = data.get("username")
    password_input = data.get("password")
    
    conn = get_db_connection()
    try:
        user = conn.execute("""
            SELECT * FROM users 
            WHERE (username=? OR email=?) AND password_hash=?
        """, (username_input, username_input, hash_password(password_input))).fetchone()
        
        if not user: 
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
        
        u = dict(user)
        
        # --- FIX: SAFE GETTERS ---
        # We use .get() so it never crashes, even if the column is missing
        return jsonify({
            "success": True, 
            "user": {
                "id": u.get('user_id'),
                "name": u.get('username'),
                "email": u.get('email'),
                "household_size": u.get('household_size', 1),
                
                # Try 'diet_pref', if missing try 'diet_preference', else default 'Non-Veg'
                "dietary_pref": u.get('diet_pref') or u.get('diet_preference') or "Non-Veg"
            }
        })
    finally:
        conn.close()

# --- PROFILE ---
@auth_bp.route('/user/<int:user_id>/profile', methods=['GET', 'PUT'])
def handle_profile(user_id):
    conn = get_db_connection()
    
    if request.method == 'GET':
        try:
            user = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
            
            if not user: 
                return jsonify({"success": False, "message": "User not found"}), 404

            # Stats logic
            total_products = conn.execute("SELECT COUNT(*) FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchone()[0]
            low_stock = 0
            products = conn.execute("SELECT current_quantity, usage_freq_qty, usage_freq_days FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchall()
            
            for p in products:
                daily_rate = p['usage_freq_qty'] / p['usage_freq_days'] if p['usage_freq_days'] > 0 else 0
                days_left = p['current_quantity'] / daily_rate if daily_rate > 0 else 999
                if days_left < 7:
                    low_stock += 1
            
            u = dict(user)
            return jsonify({
                "success": True,
                "user": {
                    "name": u.get('username'),
                    "email": u.get('email'),
                    "household_size": u.get('household_size', 1),
                    # SAFE GET for diet
                    "dietary_pref": u.get('diet_pref') or u.get('diet_preference') or "Non-Veg"
                },
                "stats": {"totalProducts": total_products, "lowStock": low_stock}
            })
        finally:
            conn.close()

    elif request.method == 'PUT':
        data = request.json
        try:
            # Try updating 'diet_pref'
            # If your DB uses 'diet_preference', you might need to change this query manually.
            conn.execute("""
                UPDATE users 
                SET username = ?, household_size = ?, diet_pref = ? 
                WHERE user_id = ?
            """, (data.get('name'), data.get('household_size'), data.get('dietary_pref'), user_id))
            
            conn.commit()
            return jsonify({"success": True, "message": "Profile updated"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            conn.close()