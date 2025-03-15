import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'musika-dev-secret-key-2025')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'musika-dev-secret-key-2025')
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql://your_username:your_password@database.musikazw.com/your_database_name')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    }
    
    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5000,http://127.0.0.1:5000').split(',')
    CORS_HEADERS = 'Content-Type'
    
    # WebSocket Configuration
    SOCKETIO_CORS_ALLOWED_ORIGINS = CORS_ORIGINS
    
    # MySQL Configuration
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'your_database_name')
    MYSQL_USER = os.getenv('MYSQL_USER', 'your_username')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'your_password')
    MYSQL_ROOT_PASSWORD = os.getenv('MYSQL_ROOT_PASSWORD', 'your_root_password')

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
    
    # Use secure cookies in production
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    
    # Enable SSL/TLS for database connection
    SQLALCHEMY_ENGINE_OPTIONS = {
        **Config.SQLALCHEMY_ENGINE_OPTIONS,
        'ssl': {
            'ssl_ca': '/path/to/ca.pem'  # Add your SSL certificate path
        }
    }

# Create config dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
