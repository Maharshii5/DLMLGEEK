import uuid
import logging
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from models import User, Wallet, Transaction
from app import db

logger = logging.getLogger(__name__)

def register_routes(app):
    
    @app.context_processor
    def inject_now():
        return {'now': datetime.now()}
    
    @app.route('/')
    def index():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        return render_template('login.html')
    
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
            
        if request.method == 'POST':
            username = request.form.get('username')
            password = request.form.get('password')
            
            user = User.query.filter_by(username=username).first()
            
            if user and user.check_password(password):
                login_user(user)
                flash('Login successful!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Invalid username or password', 'danger')
                
        return render_template('login.html')
    
    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
            
        if request.method == 'POST':
            username = request.form.get('username')
            email = request.form.get('email')
            password = request.form.get('password')
            
            # Check if username or email already exists
            existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
            if existing_user:
                flash('Username or email already exists!', 'danger')
                return render_template('register.html')
            
            # Create new user
            user = User(username=username, email=email)
            user.set_password(password)
            
            # Create wallet for the user
            wallet_id = generate_wallet_id()
            wallet = Wallet(wallet_id=wallet_id, balance=1000.00)  # Starting with 1000 balance for demo
            
            user.wallet = wallet
            
            db.session.add(user)
            db.session.commit()
            
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
            
        return render_template('register.html')
    
    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('You have been logged out.', 'info')
        return redirect(url_for('login'))
    
    @app.route('/dashboard')
    @login_required
    def dashboard():
        wallet = current_user.wallet
        
        # Get recent transactions (both sent and received)
        sent = wallet.sent_transactions.order_by(Transaction.timestamp.desc()).limit(5).all()
        received = wallet.received_transactions.order_by(Transaction.timestamp.desc()).limit(5).all()
        
        # Combine and sort by timestamp
        recent_transactions = sorted(
            sent + received,
            key=lambda x: x.timestamp,
            reverse=True
        )[:5]
        
        return render_template('dashboard.html', 
                               wallet=wallet, 
                               recent_transactions=recent_transactions)
    
    @app.route('/transactions')
    @login_required
    def transactions():
        wallet = current_user.wallet
        
        # Get all transactions (both sent and received)
        sent = wallet.sent_transactions.order_by(Transaction.timestamp.desc()).all()
        received = wallet.received_transactions.order_by(Transaction.timestamp.desc()).all()
        
        # Combine and sort by timestamp
        all_transactions = sorted(
            sent + received,
            key=lambda x: x.timestamp,
            reverse=True
        )
        
        return render_template('transactions.html', transactions=all_transactions)
    
    @app.route('/send-money', methods=['GET', 'POST'])
    @login_required
    def send_money():
        if request.method == 'POST':
            receiver_id = request.form.get('receiver_id')
            amount = float(request.form.get('amount'))
            description = request.form.get('description')
            
            # Validate inputs
            if amount <= 0:
                flash('Amount must be greater than zero', 'danger')
                return redirect(url_for('send_money'))
            
            # Check sender's balance
            sender_wallet = current_user.wallet
            if sender_wallet.balance < amount:
                flash('Insufficient balance', 'danger')
                return redirect(url_for('send_money'))
            
            # Find receiver's wallet
            receiver_wallet = Wallet.query.filter_by(wallet_id=receiver_id).first()
            if not receiver_wallet:
                flash('Receiver wallet not found', 'danger')
                return redirect(url_for('send_money'))
                
            # Don't allow sending to self
            if receiver_wallet.id == sender_wallet.id:
                flash('You cannot send money to yourself', 'danger')
                return redirect(url_for('send_money'))
                
            try:
                # Create transaction
                transaction = Transaction(
                    amount=amount,
                    description=description,
                    transaction_type='transfer',
                    status='completed',
                    sender_wallet_id=sender_wallet.wallet_id,
                    receiver_wallet_id=receiver_wallet.wallet_id
                )
                
                # Update balances
                sender_wallet.balance -= amount
                receiver_wallet.balance += amount
                
                db.session.add(transaction)
                db.session.commit()
                
                flash('Transaction completed successfully', 'success')
                return redirect(url_for('dashboard'))
            
            except Exception as e:
                db.session.rollback()
                logger.error(f"Transaction error: {str(e)}")
                flash('An error occurred during the transaction', 'danger')
                return redirect(url_for('send_money'))
                
        return render_template('send_money.html')
    
    @app.route('/profile')
    @login_required
    def profile():
        return render_template('profile.html', user=current_user)

def generate_wallet_id():
    """Generate a unique wallet ID"""
    return 'W' + str(uuid.uuid4().hex)[:10].upper()
