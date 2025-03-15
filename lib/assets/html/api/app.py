from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='..', static_url_path='')

# Configure CORS to allow requests from our admin and restaurant dashboards
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///musika.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'musika-dev-secret-key-2025'

db = SQLAlchemy(app)

# Serve static files
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

# Serve index.html
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Serve admin dashboard
@app.route('/admin')
def admin_dashboard():
    return send_from_directory(app.static_folder, 'admin/index.html')

# Serve restaurant dashboard
@app.route('/restaurant')
def restaurant_dashboard():
    return send_from_directory(app.static_folder, 'restaurant/index.html')

# Test route
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working!'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
