from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .restaurant import Restaurant
from .menu import MenuItem
from .order import Order, OrderItem
from .review import Review
