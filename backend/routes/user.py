from flask import Blueprint, request, jsonify
from database import get_db_connection

user_bp = Blueprint('user', __name__)

@user_bp.route('/user/<int:user_id>/profile', methods=['GET', 'PUT'])
def handle_profile(user_id):
    conn = get_db_connection()
    
    if request.method == 'GET':
        try:
            # --- FIX: Match DB Column Names (username, diet_pref) ---
            user = conn.execute("""
                SELECT user_id, username, email, household_size, diet_pref 
                FROM users 
                WHERE user_id = ?
            """, (user_id,)).fetchone()
            
            if not user:
                return jsonify({"success": False, "message": "User not found"}), 404
            
            # Convert to dictionary and map keys for Frontend
            u = dict(user)
            return jsonify({
                "success": True, 
                "user": {
                    "id": u['user_id'],
                    "name": u['username'],        # DB: username -> Frontend: name
                    "email": u['email'],
                    "household_size": u['household_size'],
                    "dietary_pref": u['diet_preference'] # DB: diet_preference -> Frontend: dietary_pref
                }
            })
        except Exception as e:
             print(f"Profile Fetch Error: {e}")
             return jsonify({"success": False, "message": str(e)}), 500
        finally:
            conn.close()

    elif request.method == 'PUT':
        data = request.json
        try:
            # --- FIX: Update the correct columns ---
            conn.execute("""
                UPDATE users 
                SET username = ?, household_size = ?, diet_pref = ? 
                WHERE user_id = ?
            """, (data.get('name'), data.get('household_size'), data.get('dietary_pref'), user_id))
            
            conn.commit()
            return jsonify({"success": True, "message": "Profile updated"})
        except Exception as e:
            print(f"Profile Update Error: {e}")
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            conn.close()