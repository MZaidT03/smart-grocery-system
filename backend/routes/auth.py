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
        # FIX: Changed 'diet_preference' to 'diet_pref' to match DB
        conn.execute("""
            INSERT INTO users (username, password_hash, email, household_size, diet_pref) 
            VALUES (?, ?, ?, ?, ?)
        """, (username, hashed, email, int(household_size), diet_preference))
        conn.commit()
        return jsonify({"success": True})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Username or Email already exists"}), 409
    except Exception as e:
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
        # Check both Username AND Email for flexibility
        # Also fetching 'diet_pref' and 'household_size' for the frontend
        user = conn.execute("""
            SELECT * FROM users 
            WHERE (username=? OR email=?) AND password_hash=?
        """, (username_input, username_input, hash_password(password_input))).fetchone()
        
        if not user: 
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
        
        # Convert row to dict
        u = dict(user)
        
        return jsonify({
            "success": True, 
            "user": {
                "id": u['user_id'],
                "name": u['username'],        # Maps DB 'username' -> Frontend 'name'
                "email": u['email'],
                "household_size": u['household_size'],
                "dietary_pref": u['diet_pref'] # Maps DB 'diet_pref' -> Frontend 'dietary_pref'
            }
        })
    finally:
        conn.close()

# --- PROFILE (GET & PUT) ---
@auth_bp.route('/user/<int:user_id>/profile', methods=['GET', 'PUT'])
def handle_profile(user_id):
    conn = get_db_connection()
    
    # 1. GET PROFILE
    if request.method == 'GET':
        try:
            user = conn.execute("SELECT username, email, household_size, diet_pref, created_at FROM users WHERE user_id = ?", (user_id,)).fetchone()
            
            if not user: 
                return jsonify({"success": False, "message": "User not found"}), 404

            # Calculate Low Stock Stats
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
                    "name": u['username'],
                    "email": u['email'],
                    "household_size": u['household_size'],
                    "dietary_pref": u['diet_pref']
                },
                "stats": {"totalProducts": total_products, "lowStock": low_stock}
            })
        finally:
            conn.close()

    # 2. UPDATE PROFILE (PUT)
    elif request.method == 'PUT':
        data = request.json
        try:
            # Updates Username, Household Size, and Diet Preference
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