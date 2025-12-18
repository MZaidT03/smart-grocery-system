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

app = Flask(__name__)

# --- FIX: ALLOW BOTH LOCALHOST AND 127.0.0.1 ---
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"], 
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
}, supports_credentials=True)

app.register_blueprint(auth_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(shopping_bp)
app.register_blueprint(recipes_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(user_bp)

@app.route('/')
def serve():
    return "Grocery Backend is Running!"

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(app.root_path, 'data/images'), filename)

if __name__ == '__main__':
    print("🚀 Grocery Backend Running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)