from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask extensions
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app)
    
    # Configure database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///musika.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'musika-dev-secret-key-2025')
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.admin import admin_bp
    from .routes.restaurant import restaurant_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(restaurant_bp, url_prefix='/api/restaurant')
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Import models
        from .models.user import User
        
        # Create super admin if not exists
        super_admin_email = 'cvlised360@gmail.com'
        if not User.query.filter_by(email=super_admin_email).first():
            from werkzeug.security import generate_password_hash
            super_admin = User(
                name='Super Admin',
                email=super_admin_email,
                password=generate_password_hash('Cvlised@360', method='sha256'),
                role='admin'
            )
            db.session.add(super_admin)
            db.session.commit()
            print("Super admin created successfully!")
    
    return app
