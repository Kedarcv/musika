from flask import Blueprint, jsonify
from ..models.user import User
from ..models.restaurant import Restaurant, Order
from .auth import token_required, requires_roles
from .. import db

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
@token_required
@requires_roles('admin')
def get_admin_stats(current_user):
    try:
        total_orders = Order.query.count()
        total_users = User.query.filter(User.role == 'customer').count()
        total_restaurants = Restaurant.query.count()
        total_revenue = db.session.query(db.func.sum(Order.total)).scalar() or 0
        
        return jsonify({
            'total_orders': total_orders,
            'total_users': total_users,
            'total_restaurants': total_restaurants,
            'total_revenue': float(total_revenue)
        })
    except Exception as e:
        print(f"Error in get_admin_stats: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@admin_bp.route('/orders', methods=['GET'])
@token_required
@requires_roles('admin')
def get_admin_orders(current_user):
    try:
        orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
        return jsonify([{
            'id': order.id,
            'user': order.user.name,
            'restaurant': order.restaurant.name,
            'total': order.total,
            'status': order.status,
            'created_at': order.created_at.isoformat()
        } for order in orders])
    except Exception as e:
        print(f"Error in get_admin_orders: {e}")
        return jsonify({'message': 'Internal server error'}), 500
