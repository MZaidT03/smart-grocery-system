from flask import Blueprint, request, jsonify
from services.budget import get_budget_status, get_db_connection

budget_bp = Blueprint('budget', __name__)

@budget_bp.route('/budget', methods=['GET', 'POST'])
def handle_budget():
    user_id = request.args.get('userId') or request.json.get('userId')
    if not user_id: return jsonify({"success": False}), 400

    if request.method == 'GET':
        data = get_budget_status(user_id)
        return jsonify(data)

    if request.method == 'POST':
        limit = float(request.json.get('limit', 0))
        conn = get_db_connection()
        try:
            # Upsert Budget
            conn.execute("""
                INSERT INTO user_budgets (user_id, budget_limit) VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET budget_limit = excluded.budget_limit
            """, (user_id, limit))
            conn.commit()
            return jsonify({"success": True})
        finally:
            conn.close()