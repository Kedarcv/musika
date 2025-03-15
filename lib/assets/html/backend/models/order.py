from . import db
from datetime import datetime

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, preparing, ready, delivered, cancelled
    total = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True)

    def to_dict(self):
        """Convert order to dictionary for API responses and WebSocket events"""
        return {
            'id': self.id,
            'customer': self.customer.username,
            'restaurant': self.restaurant.name,
            'status': self.status,
            'total': f'${self.total:.2f}',
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat()
        }

    def update_status(self, new_status):
        """Update order status and emit WebSocket event"""
        from flask import current_app
        from flask_socketio import emit
        
        self.status = new_status
        db.session.commit()
        
        # Emit WebSocket event to relevant rooms
        emit('order_update', {
            'order_id': self.id,
            'status': self.status
        }, room=f'order_{self.id}', namespace='/')
        
        # Also notify restaurant dashboard
        emit('order_update', {
            'order_id': self.id,
            'status': self.status
        }, room=f'restaurant_{self.restaurant_id}', namespace='/')

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        """Convert order item to dictionary for API responses"""
        return {
            'id': self.id,
            'name': self.menu_item.name,
            'quantity': self.quantity,
            'price': f'${self.price:.2f}'
        }
