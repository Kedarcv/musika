from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta
from models import User

class Auth:
    def __init__(self, app):
        self.app = app
        self.secret_key = app.config['JWT_SECRET_KEY']

    def generate_token(self, user):
        """Generate JWT token for authenticated users"""
        payload = {
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')

    def verify_token(self, token):
        """Verify JWT token and return user info"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

def login_required(roles=None):
    """Decorator for protecting routes and checking user roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = None
            auth_header = request.headers.get('Authorization')

            if auth_header:
                try:
                    token = auth_header.split(" ")[1]
                except IndexError:
                    return jsonify({'message': 'Invalid token format'}), 401

            if not token:
                return jsonify({'message': 'Token is missing'}), 401

            from server import auth  # Import here to avoid circular import
            payload = auth.verify_token(token)
            
            if not payload:
                return jsonify({'message': 'Invalid or expired token'}), 401

            if roles and payload['role'] not in roles:
                return jsonify({'message': 'Unauthorized access'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
