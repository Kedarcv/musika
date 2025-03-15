from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True
}

db = SQLAlchemy(app)

def test_connection():
    try:
        # Try to connect to the database
        with app.app_context():
            db.engine.connect()
        print("✅ Successfully connected to the database!")
        return True
    except Exception as e:
        print("❌ Failed to connect to the database!")
        print(f"Error: {str(e)}")
        return False

if __name__ == '__main__':
    success = test_connection()
    sys.exit(0 if success else 1)
