from flask import Flask, send_from_directory, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from models import db, User, Restaurant, MenuItem, Order, OrderItem, Review
from auth import Auth, login_required
import os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = 'musika-dev-secret-key-2025'
app.config['JWT_SECRET_KEY'] = 'musika-dev-secret-key-2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///musika.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
db.init_app(app)
auth = Auth(app)

# Create database tables
with app.app_context():
    db.create_all()

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
        token = auth.generate_token(user)
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
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
        username=data.get('username'),
        email=data.get('email'),
        role=data.get('role', 'customer')
    )
    user.set_password(data.get('password'))
    
    db.session.add(user)
    db.session.commit()
    
    token = auth.generate_token(user)
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    }), 201

# Static file routes
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/admin')
def admin():
    return send_from_directory('.', 'admin/index.html')

@app.route('/restaurant')
def restaurant():
    return send_from_directory('.', 'restaurant/index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# Admin API endpoints
@app.route('/api/admin/stats')
@login_required(roles=['admin'])
def admin_stats():
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

@app.route('/api/admin/orders-chart')
@login_required(roles=['admin'])
def admin_orders_chart():
    # Get orders for the last 6 months
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    orders = Order.query.filter(Order.created_at >= six_months_ago).all()
    
    # Group orders by month
    monthly_orders = {}
    for order in orders:
        month = order.created_at.strftime('%b')
        monthly_orders[month] = monthly_orders.get(month, 0) + 1
    
    return jsonify({
        'labels': list(monthly_orders.keys()),
        'values': list(monthly_orders.values())
    })

@app.route('/api/admin/revenue-chart')
@login_required(roles=['admin'])
def admin_revenue_chart():
    # Get revenue for the last 6 months
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    orders = Order.query.filter(Order.created_at >= six_months_ago).all()
    
    # Group revenue by month
    monthly_revenue = {}
    for order in orders:
        month = order.created_at.strftime('%b')
        monthly_revenue[month] = monthly_revenue.get(month, 0) + order.total
    
    return jsonify({
        'labels': list(monthly_revenue.keys()),
        'values': list(monthly_revenue.values())
    })

@app.route('/api/admin/recent-orders')
@login_required(roles=['admin'])
def admin_recent_orders():
    orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    return jsonify([{
        'id': order.id,
        'customer': order.customer.username,
        'restaurant': order.restaurant.name,
        'status': order.status,
        'total': f'${order.total:.2f}'
    } for order in orders])

# Restaurant API endpoints
@app.route('/api/restaurant/stats')
@login_required(roles=['restaurant'])
def restaurant_stats():
    restaurant = Restaurant.query.filter_by(owner_id=request.user['id']).first()
    if not restaurant:
        return jsonify({'message': 'Restaurant not found'}), 404
    
    today = datetime.utcnow().date()
    today_orders = Order.query.filter(
        Order.restaurant_id == restaurant.id,
        db.func.date(Order.created_at) == today
    ).count()
    
    menu_items = MenuItem.query.filter_by(restaurant_id=restaurant.id).count()
    today_revenue = db.session.query(db.func.sum(Order.total)).filter(
        Order.restaurant_id == restaurant.id,
        db.func.date(Order.created_at) == today
    ).scalar() or 0
    
    return jsonify({
        'todayOrders': today_orders,
        'menuItems': menu_items,
        'rating': restaurant.rating,
        'todayRevenue': today_revenue
    })

@app.route('/api/restaurant/menu', methods=['GET', 'POST'])
@login_required(roles=['restaurant'])
def restaurant_menu():
    restaurant = Restaurant.query.filter_by(owner_id=request.user['id']).first()
    if not restaurant:
        return jsonify({'message': 'Restaurant not found'}), 404
    
    if request.method == 'GET':
        menu_items = MenuItem.query.filter_by(restaurant_id=restaurant.id).all()
        return jsonify([{
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'price': item.price,
            'category': item.category,
            'available': item.available
        } for item in menu_items])
    
    # POST method - add new menu item
    data = request.get_json()
    menu_item = MenuItem(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        category=data.get('category', ''),
        restaurant_id=restaurant.id
    )
    db.session.add(menu_item)
    db.session.commit()
    
    # Notify connected clients about menu update
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
        'price': menu_item.price,
        'category': menu_item.category
    }), 201

@app.route('/api/restaurant/menu/<int:item_id>', methods=['PUT', 'DELETE'])
@login_required(roles=['restaurant'])
def restaurant_menu_item(item_id):
    restaurant = Restaurant.query.filter_by(owner_id=request.user['id']).first()
    if not restaurant:
        return jsonify({'message': 'Restaurant not found'}), 404
    
    menu_item = MenuItem.query.filter_by(id=item_id, restaurant_id=restaurant.id).first()
    if not menu_item:
        return jsonify({'message': 'Menu item not found'}), 404
    
    if request.method == 'PUT':
        data = request.get_json()
        menu_item.name = data.get('name', menu_item.name)
        menu_item.description = data.get('description', menu_item.description)
        menu_item.price = data.get('price', menu_item.price)
        menu_item.category = data.get('category', menu_item.category)
        menu_item.available = data.get('available', menu_item.available)
        
        db.session.commit()
        
        # Notify connected clients about menu update
        socketio.emit('menu_update', {
            'restaurant_id': restaurant.id,
            'action': 'update',
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
            'price': menu_item.price,
            'category': menu_item.category,
            'available': menu_item.available
        })
    
    # DELETE method
    db.session.delete(menu_item)
    db.session.commit()
    
    # Notify connected clients about menu update
    socketio.emit('menu_update', {
        'restaurant_id': restaurant.id,
        'action': 'delete',
        'item_id': item_id
    }, room=f'restaurant_{restaurant.id}')
    
    return '', 204

@app.route('/api/restaurant/orders/active')
@login_required(roles=['restaurant'])
def restaurant_active_orders():
    restaurant = Restaurant.query.filter_by(owner_id=request.user['id']).first()
    if not restaurant:
        return jsonify({'message': 'Restaurant not found'}), 404
    
    active_orders = Order.query.filter(
        Order.restaurant_id == restaurant.id,
        Order.status.in_(['pending', 'preparing', 'ready'])
    ).all()
    
    return jsonify([{
        'id': order.id,
        'customer': order.customer.username,
        'items': [{
            'name': item.menu_item.name,
            'quantity': item.quantity
        } for item in order.items],
        'status': order.status,
        'total': f'${order.total:.2f}'
    } for order in active_orders])

@app.route('/api/restaurant/orders/<int:order_id>/status', methods=['PUT'])
@login_required(roles=['restaurant'])
def update_order_status(order_id):
    restaurant = Restaurant.query.filter_by(owner_id=request.user['id']).first()
    if not restaurant:
        return jsonify({'message': 'Restaurant not found'}), 404
    
    order = Order.query.filter_by(id=order_id, restaurant_id=restaurant.id).first()
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    
    data = request.get_json()
    order.status = data['status']
    db.session.commit()
    
    # Notify connected clients about order status update
    socketio.emit('order_update', {
        'order_id': order.id,
        'status': order.status
    }, room=f'order_{order.id}')
    
    return jsonify({'status': order.status})

if __name__ == '__main__':
    socketio.run(app, debug=True)
