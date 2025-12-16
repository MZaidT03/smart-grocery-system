# routes/auth.py
from flask import Blueprint, request, jsonify
import sqlite3
from database import get_db_connection
from utils import hash_password, safe_float

auth_bp = Blueprint('auth', __name__)

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
        conn.execute("""
            INSERT INTO users (username, password_hash, email, household_size, diet_preference) 
            VALUES (?, ?, ?, ?, ?)
        """, (username, hashed, email, int(household_size), diet_preference))
        conn.commit()
        return jsonify({"success": True})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Username already exists"}), 409
    finally:
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username=? AND password_hash=?", 
                       (data.get("username"), hash_password(data.get("password")))).fetchone()
    conn.close()
    if not user: return jsonify({"success": False}), 401
    return jsonify({"success": True, "userId": user['user_id'], "username": user['username']})

@auth_bp.route('/user/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    conn = get_db_connection()
    try:
        user = conn.execute("SELECT username, email, household_size, diet_preference, created_at FROM users WHERE user_id = ?", (user_id,)).fetchone()
        
        if not user: 
            return jsonify({"success": False, "message": "User not found"}), 404

        total_products = conn.execute("SELECT COUNT(*) FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchone()[0]
        
        low_stock = 0
        products = conn.execute("SELECT current_quantity, usage_freq_qty, usage_freq_days FROM products WHERE user_id = ? AND is_active = 1", (user_id,)).fetchall()
        
        for p in products:
            daily_rate = p['usage_freq_qty'] / p['usage_freq_days'] if p['usage_freq_days'] > 0 else 0
            days_left = p['current_quantity'] / daily_rate if daily_rate > 0 else 999
            if days_left < 7:
                low_stock += 1

        return jsonify({
            "success": True,
            "user": dict(user),
            "stats": {"totalProducts": total_products, "lowStock": low_stock}
        })
    finally:
        conn.close()