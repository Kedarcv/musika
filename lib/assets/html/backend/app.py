from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from dotenv import load_dotenv
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='..', static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///musika.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'musika-dev-secret-key-2025')

# Initialize extensions
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='customer')  # admin, restaurant_owner, rider, customer
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def set_password(self, password):
        self.password = generate_password_hash(password, method='sha256')

    def check_password(self, password):
        return check_password_hash(self.password, password)

class Restaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_available = db.Column(db.Boolean, default=True)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, preparing, ready, delivered, cancelled
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

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

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Role-based authorization decorator
def requires_roles(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'message': 'Unauthorized access'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    if room:
        join_room(room)
        emit('status', {'msg': f'Joined room: {room}'}, room=room)

@socketio.on('leave')
def handle_leave(data):
    room = data.get('room')
    if room:
        leave_room(room)
        emit('status', {'msg': f'Left room: {room}'}, room=room)

# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    
    if user and user.check_password(data.get('password')):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, app.config['JWT_SECRET_KEY'])
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already registered'}), 400
        
    user = User(
        name=data.get('name'),
        email=data.get('email'),
        role=data.get('role', 'customer')
    )
    user.set_password(data.get('password'))
    
    db.session.add(user)
    db.session.commit()
    
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['JWT_SECRET_KEY'])
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    }), 201

# Admin routes
@app.route('/api/admin/stats')
@token_required
@requires_roles('admin')
def admin_stats(current_user):
    total_orders = Order.query.count()
    active_restaurants = Restaurant.query.count()
    total_users = User.query.count()
    total_revenue = db.session.query(db.func.sum(Order.total)).scalar() or 0
    
    return jsonify({
        'totalOrders': total_orders,
        'activeRestaurants': active_restaurants,
        'totalUsers': total_users,
        'totalRevenue': total_revenue
    })

@app.route('/api/admin/recent-orders')
@token_required
@requires_roles('admin')
def admin_recent_orders(current_user):
    orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    return jsonify([{
        'id': order.id,
        'customer': order.user_id,
        'restaurant': order.restaurant_id,
        'status': order.status,
        'total': order.total
    } for order in orders])

# Restaurant routes
@app.route('/api/restaurant/menu', methods=['GET', 'POST'])
@token_required
@requires_roles('restaurant_owner')
def restaurant_menu(current_user):
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first()
    if not restaurant:
        return jsonify({'message': 'Restaurant not found'}), 404
    
    if request.method == 'GET':
        menu_items = MenuItem.query.filter_by(restaurant_id=restaurant.id).all()
        return jsonify([{
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'price': item.price,
            'is_available': item.is_available
        } for item in menu_items])
    
    data = request.get_json()
    menu_item = MenuItem(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        restaurant_id=restaurant.id
    )
    db.session.add(menu_item)
    db.session.commit()
    
    socketio.emit('menu_update', {
        'restaurant_id': restaurant.id,
        'action': 'add',
        'item': {
            'id': menu_item.id,
            'name': menu_item.name,
            'price': menu_item.price
        }
    }, room=f'restaurant_{restaurant.id}')
    
    return jsonify({
        'id': menu_item.id,
        'name': menu_item.name,
        'description': menu_item.description,
        'price': menu_item.price
    }), 201

@app.route('/api/restaurant/orders/active')
@token_required
@requires_roles('restaurant_owner')
def restaurant_active_orders(current_user):
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first()
    if not restaurant:
        return jsonify({'message': 'Restaurant not found'}), 404
    
    active_orders = Order.query.filter(
        Order.restaurant_id == restaurant.id,
        Order.status.in_(['pending', 'preparing', 'ready'])
    ).all()
    
    return jsonify([{
        'id': order.id,
        'customer': order.user_id,
        'status': order.status,
        'total': order.total
    } for order in active_orders])

@app.route('/api/restaurant/orders/<int:order_id>/status', methods=['PUT'])
@token_required
@requires_roles('restaurant_owner')
def update_order_status(current_user, order_id):
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first()
    if not restaurant:
        return jsonify({'message': 'Restaurant not found'}), 404
    
    order = Order.query.filter_by(id=order_id, restaurant_id=restaurant.id).first()
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    
    data = request.get_json()
    order.status = data['status']
    db.session.commit()
    
    socketio.emit('order_update', {
        'order_id': order.id,
        'status': order.status
    }, room=f'order_{order.id}')
    
    return jsonify({'status': order.status})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create super admin if not exists
        super_admin_email = 'cvlised360@gmail.com'
        if not User.query.filter_by(email=super_admin_email).first():
            super_admin = User(
                name='Super Admin',
                email=super_admin_email,
                role='admin'
            )
            super_admin.set_password('Cvlised@360')
            db.session.add(super_admin)
            db.session.commit()
            print("Super admin created successfully!")
    
    socketio.run(app, debug=True)
