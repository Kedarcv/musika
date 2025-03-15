from flask import Blueprint, jsonify
from ..models.restaurant import Restaurant, MenuItem, Order, Review
from .auth import token_required, requires_roles
from .. import db
import datetime

restaurant_bp = Blueprint('restaurant', __name__)

@restaurant_bp.route('/stats', methods=['GET'])
@token_required
@requires_roles('restaurant_owner')
def get_restaurant_stats(current_user):
    try:
        restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first()
        if not restaurant:
            return jsonify({'message': 'Restaurant not found'}), 404
        
        today = datetime.datetime.utcnow().date()
        today_orders = Order.query.filter(
            Order.restaurant_id == restaurant.id,
            db.func.date(Order.created_at) == today
        ).count()
        
        menu_items_count = MenuItem.query.filter_by(restaurant_id=restaurant.id).count()
        
        reviews = Review.query.filter_by(restaurant_id=restaurant.id).all()
        avg_rating = sum(review.rating for review in reviews) / len(reviews) if reviews else 0
        
        today_revenue = db.session.query(db.func.sum(Order.total)).filter(
            Order.restaurant_id == restaurant.id,
            db.func.date(Order.created_at) == today
        ).scalar() or 0
        
        return jsonify({
            'today_orders': today_orders,
            'menu_items': menu_items_count,
            'rating': round(avg_rating, 1),
            'today_revenue': float(today_revenue)
        })
    except Exception as e:
        print(f"Error in get_restaurant_stats: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@restaurant_bp.route('/orders/active', methods=['GET'])
@token_required
@requires_roles('restaurant_owner')
def get_active_orders(current_user):
    try:
        restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first()
        if not restaurant:
            return jsonify({'message': 'Restaurant not found'}), 404
        
        active_orders = Order.query.filter(
            Order.restaurant_id == restaurant.id,
            Order.status.in_(['pending', 'preparing', 'ready'])
        ).order_by(Order.created_at.desc()).all()
        
        return jsonify([{
            'id': order.id,
            'user': order.user.name,
            'items': [{
                'name': item.menu_item.name,
                'quantity': item.quantity,
                'price': item.price
            } for item in order.items],
            'total': order.total,
            'status': order.status,
            'created_at': order.created_at.isoformat()
        } for order in active_orders])
    except Exception as e:
        print(f"Error in get_active_orders: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@restaurant_bp.route('/reviews', methods=['GET'])
@token_required
@requires_roles('restaurant_owner')
def get_restaurant_reviews(current_user):
    try:
        restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first()
        if not restaurant:
            return jsonify({'message': 'Restaurant not found'}), 404
        
        reviews = Review.query.filter_by(restaurant_id=restaurant.id).order_by(Review.created_at.desc()).limit(5).all()
        
        return jsonify([{
            'id': review.id,
            'user': review.user.name,
            'rating': review.rating,
            'comment': review.comment,
            'created_at': review.created_at.isoformat()
        } for review in reviews])
    except Exception as e:
        print(f"Error in get_restaurant_reviews: {e}")
        return jsonify({'message': 'Internal server error'}), 500
