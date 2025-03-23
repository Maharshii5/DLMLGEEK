import logging
from flask import jsonify, request, Blueprint
from flask_login import login_required, current_user
from models import User, Wallet, Transaction
from app import db

api_bp = Blueprint('api', __name__, url_prefix='/api')
logger = logging.getLogger(__name__)

def register_api_routes(app):
    
    @api_bp.route('/wallet/balance', methods=['GET'])
    @login_required
    def get_balance():
        """API to get the current user's wallet balance"""
        wallet = current_user.wallet
        if wallet:
            return jsonify({
                'success': True,
                'wallet_id': wallet.wallet_id,
                'balance': wallet.balance
            }), 200
        return jsonify({'success': False, 'message': 'Wallet not found'}), 404
    
    @api_bp.route('/transactions', methods=['GET'])
    @login_required
    def get_transactions():
        """API to get the current user's transactions"""
        wallet = current_user.wallet
        
        # Get the type filter if provided
        tx_type = request.args.get('type')
        
        # Get all transactions (both sent and received)
        sent = wallet.sent_transactions
        received = wallet.received_transactions
        
        # Apply filter if provided
        if tx_type == 'sent':
            sent = sent.all()
            received = []
        elif tx_type == 'received':
            sent = []
            received = received.all()
        else:
            sent = sent.all()
            received = received.all()
        
        # Combine and sort by timestamp
        all_transactions = sorted(
            sent + received,
            key=lambda x: x.timestamp,
            reverse=True
        )
        
        # Convert to dictionary format
        transactions_data = [{
            'id': tx.id,
            'amount': tx.amount,
            'description': tx.description,
            'transaction_type': tx.transaction_type,
            'status': tx.status,
            'sender': tx.sender_wallet_id,
            'receiver': tx.receiver_wallet_id,
            'timestamp': tx.timestamp.isoformat(),
            'is_outgoing': tx.sender_wallet_id == wallet.wallet_id
        } for tx in all_transactions]
        
        return jsonify({
            'success': True,
            'transactions': transactions_data
        }), 200
    
    @api_bp.route('/transfer', methods=['POST'])
    @login_required
    def transfer_funds():
        """API to transfer funds between wallets"""
        data = request.json
        receiver_id = data.get('receiver_id')
        amount = float(data.get('amount', 0))
        description = data.get('description', '')
        
        # Validate inputs
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Amount must be greater than zero'}), 400
        
        # Check sender's balance
        sender_wallet = current_user.wallet
        if sender_wallet.balance < amount:
            return jsonify({'success': False, 'message': 'Insufficient balance'}), 400
        
        # Find receiver's wallet
        receiver_wallet = Wallet.query.filter_by(wallet_id=receiver_id).first()
        if not receiver_wallet:
            return jsonify({'success': False, 'message': 'Receiver wallet not found'}), 404
            
        # Don't allow sending to self
        if receiver_wallet.id == sender_wallet.id:
            return jsonify({'success': False, 'message': 'You cannot send money to yourself'}), 400
            
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
            
            return jsonify({
                'success': True, 
                'message': 'Transaction completed successfully',
                'transaction_id': transaction.id,
                'new_balance': sender_wallet.balance
            }), 200
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"API transaction error: {str(e)}")
            return jsonify({'success': False, 'message': 'An error occurred during the transaction'}), 500
    
    @api_bp.route('/user/search', methods=['GET'])
    @login_required
    def search_user():
        """API to search for users by username or wallet ID"""
        query = request.args.get('q', '')
        
        if not query or len(query) < 3:
            return jsonify({'success': False, 'message': 'Search query too short'}), 400
            
        # Search by username or wallet ID
        users = User.query.filter(User.username.like(f'%{query}%')).all()
        wallets = Wallet.query.filter(Wallet.wallet_id.like(f'%{query}%')).all()
        
        # Combine results (without duplicates)
        results = []
        
        # Add users from username search
        for user in users:
            if user.id != current_user.id:  # Exclude current user
                results.append({
                    'user_id': user.id,
                    'username': user.username,
                    'wallet_id': user.wallet.wallet_id
                })
        
        # Add users from wallet search (if not already added)
        user_ids = [r['user_id'] for r in results]
        for wallet in wallets:
            if wallet.user_id != current_user.id and wallet.user_id not in user_ids:
                user = User.query.get(wallet.user_id)
                results.append({
                    'user_id': user.id,
                    'username': user.username,
                    'wallet_id': wallet.wallet_id
                })
        
        return jsonify({
            'success': True,
            'results': results
        }), 200
    
    # Register the blueprint with the app
    app.register_blueprint(api_bp)
