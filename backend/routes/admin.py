# routes/admin.py
from flask import Blueprint, jsonify
import csv
import os
from database import get_db_connection
from config import DEFAULT_CATALOG_CSV

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/load-catalog', methods=['POST'])
def load_catalog():
    if not os.path.exists(DEFAULT_CATALOG_CSV):
        return jsonify({"success": False, "message": "CSV missing"}), 404
        
    conn = get_db_connection()
    try:
        with open(DEFAULT_CATALOG_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for r in reader:
                conn.execute("""
                    INSERT INTO product_catalog (item_name, daily_consumption_per_person, consumption_unit, category, diet_type)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(item_name, consumption_unit) DO UPDATE SET daily_consumption_per_person = excluded.daily_consumption_per_person
                """, (r['name'], float(r['consumption']), r['unit'], r['category'], r['diet_type']))
                count += 1
        conn.commit()
        return jsonify({"success": True, "message": f"Loaded {count} items"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()