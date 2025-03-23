from datetime import datetime
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    wallet = db.relationship('Wallet', backref='owner', uselist=False, lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def __repr__(self):
        return f'<User {self.username}>'


class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    balance = db.Column(db.Float, default=0.0, nullable=False)
    wallet_id = db.Column(db.String(20), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Transactions sent by this wallet
    sent_transactions = db.relationship(
        'Transaction',
        foreign_keys='Transaction.sender_wallet_id',
        backref='sender',
        lazy='dynamic'
    )
    
    # Transactions received by this wallet
    received_transactions = db.relationship(
        'Transaction',
        foreign_keys='Transaction.receiver_wallet_id',
        backref='receiver',
        lazy='dynamic'
    )
    
    def __repr__(self):
        return f'<Wallet {self.wallet_id}>'


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    transaction_type = db.Column(db.String(20), nullable=False)  # 'transfer', 'deposit', 'withdrawal'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed'
    sender_wallet_id = db.Column(db.String(20), db.ForeignKey('wallet.wallet_id'))
    receiver_wallet_id = db.Column(db.String(20), db.ForeignKey('wallet.wallet_id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Transaction {self.id} - {self.amount}>'
