# routes/analytics.py
from flask import Blueprint, request, jsonify
from database import get_db_connection

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/<int:user_id>', methods=['GET'])
def get_analytics(user_id):
    days = int(request.args.get("days", 30))
    conn = get_db_connection()
    
    trend = conn.execute("""
        SELECT summary_date as date, SUM(total_consumed) as total_consumption
        FROM consumption_summary WHERE user_id = ? AND summary_date >= date('now', '-' || ? || ' days')
        GROUP BY summary_date ORDER BY summary_date ASC
    """, (user_id, days)).fetchall()
    
    top = conn.execute("""
        SELECT p.item_name as name, p.consumption_unit as unit, SUM(cs.total_consumed) as total
        FROM consumption_summary cs JOIN products p ON cs.product_id = p.product_id
        WHERE cs.user_id = ? AND cs.summary_date >= date('now', '-' || ? || ' days')
        GROUP BY p.product_id, p.item_name, p.consumption_unit ORDER BY total DESC LIMIT 5
    """, (user_id, days)).fetchall()
    
    conn.close()
    return jsonify({"trend": [dict(t) for t in trend], "topProducts": [dict(p) for p in top]})