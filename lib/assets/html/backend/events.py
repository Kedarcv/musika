from flask_socketio import emit, join_room, leave_room
from flask import request
from functools import wraps
import jwt
from .models import User

def authenticated_only(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not request.args.get('token'):
            disconnect()
            return
        try:
            from .app import app
            token = request.args.get('token')
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            user = User.query.get(data['user_id'])
            if not user:
                disconnect()
                return
            return f(*args, **kwargs)
        except jwt.InvalidTokenError:
            disconnect()
    return wrapped

def init_socketio(socketio):
    @socketio.on('connect')
    @authenticated_only
    def handle_connect():
        print('Client connected')
        emit('connection_response', {'status': 'connected'})

    @socketio.on('join')
    @authenticated_only
    def handle_join(data):
        room = data.get('room')
        if room:
            join_room(room)
            emit('room_response', {'status': 'joined', 'room': room}, room=room)

    @socketio.on('leave')
    @authenticated_only
    def handle_leave(data):
        room = data.get('room')
        if room:
            leave_room(room)
            emit('room_response', {'status': 'left', 'room': room}, room=room)

    @socketio.on('order_status_update')
    @authenticated_only
    def handle_order_status_update(data):
        order_id = data.get('order_id')
        new_status = data.get('status')
        
        # Emit to both customer and restaurant rooms
        emit('order_update', {
            'order_id': order_id,
            'status': new_status
        }, room=f'order_{order_id}')
        
        emit('order_update', {
            'order_id': order_id,
            'status': new_status
        }, room=f'restaurant_{data.get("restaurant_id")}')

    @socketio.on('menu_update')
    @authenticated_only
    def handle_menu_update(data):
        restaurant_id = data.get('restaurant_id')
        action = data.get('action')
        item = data.get('item')
        
        emit('menu_change', {
            'action': action,
            'item': item
        }, room=f'restaurant_{restaurant_id}')
