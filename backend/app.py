from flask import Flask, send_from_directory
from flask_cors import CORS
import os


# Import Routes
from routes.auth import auth_bp
from routes.inventory import inventory_bp
from routes.shopping import shopping_bp
from routes.recipes import recipes_bp
from routes.analytics import analytics_bp
from routes.admin import admin_bp
from routes.user import user_bp
from routes.notifications import notifications_bp
from routes.budget import budget_bp

app = Flask(__name__)

# --- CORS CONFIGURATION ---
CORS(app, resources={r"/*": {"origins": "*"}})

app.register_blueprint(auth_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(shopping_bp)
app.register_blueprint(recipes_bp)
app.register_blueprint(analytics_bp)

# --- FIX: Added url_prefix='/admin' ---
app.register_blueprint(admin_bp, url_prefix='/admin') 

app.register_blueprint(user_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(budget_bp)

@app.route('/')
def serve():
    return "Grocery Backend is Running!"

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(app.root_path, 'data/images'), filename)

if __name__ == '__main__':
    print("🚀 Grocery Backend Running on http://0.0.0.0:5000")
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)