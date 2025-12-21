from flask import Blueprint, jsonify, request
from database import get_db_connection

notifications_bp = Blueprint('notifications', __name__)

# --- HELPER: Ensure Table Exists ---
def init_notification_table():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            message TEXT,
            type TEXT DEFAULT 'info',  -- info, warning, success
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

# Run initialization immediately
init_notification_table()

@notifications_bp.route('/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('userId')
    conn = get_db_connection()
    try:
        # Get last 10 notifications, newest first
        rows = conn.execute("""
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC LIMIT 10
        """, (user_id,)).fetchall()
        
        # Count unread
        unread = conn.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", (user_id,)).fetchone()[0]
        
        return jsonify({
            "success": True, 
            "notifications": [dict(r) for r in rows],
            "unreadCount": unread
        })
    finally:
        conn.close()

@notifications_bp.route('/notifications/mark-read', methods=['POST'])
def mark_read():
    data = request.json
    user_id = data.get('userId')
    conn = get_db_connection()
    try:
        conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
        conn.commit()
        return jsonify({"success": True})
    finally:
        conn.close()