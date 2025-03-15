from .. import db
import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='customer')  # admin, restaurant_owner, rider, customer
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    restaurant = db.relationship('Restaurant', backref='owner', lazy=True, uselist=False)
    orders = db.relationship('Order', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
