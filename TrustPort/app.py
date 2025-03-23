import os
import logging

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_login import LoginManager

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///wallet.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the app with the extension
db.init_app(app)

# Setup Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Import routes after app is created to avoid circular imports
with app.app_context():
    # Import models
    from models import User, Wallet, Transaction
    
    # Create database tables
    db.create_all()
    
    # Import and register routes
    from routes import register_routes
    register_routes(app)
    
    # Import and register API routes
    from api import register_api_routes
    register_api_routes(app)
    
    # Configure login manager
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

logger.info("Application initialized successfully")
