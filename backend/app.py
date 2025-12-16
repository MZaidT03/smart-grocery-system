# app.py
from flask import Flask
from flask_cors import CORS
from database import init_db

# Import Blueprints
from routes.auth import auth_bp
from routes.inventory import inventory_bp
from routes.shopping import shopping_bp
from routes.analytics import analytics_bp
from routes.admin import admin_bp

app = Flask(__name__)
CORS(app)

# Initialize Database
init_db()

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(shopping_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(admin_bp)

if __name__ == '__main__':
    print(f"🚀 Grocery Backend Running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)