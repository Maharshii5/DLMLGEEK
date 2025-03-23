/**
 * Transaction.js - Handles transaction functionality for the TrustPort mobile wallet application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the send money page
    const sendMoneyForm = document.getElementById('send-money-form');
    if (sendMoneyForm) {
        initializeSendMoneyForm();
    }
    
    // Check if we're on the transactions page
    const transactionsPage = document.querySelector('.transactions-page');
    if (transactionsPage) {
        initializeTransactionsPage();
    }
});

/**
 * Initialize send money form functionality
 */
function initializeSendMoneyForm() {
    const sendMoneyForm = document.getElementById('send-money-form');
    const receiverInput = document.getElementById('receiver_id');
    const amountInput = document.getElementById('amount');
    const searchResultsContainer = document.getElementById('search-results');
    
    // Add search functionality for receiver
    if (receiverInput) {
        receiverInput.addEventListener('input', debounce(function() {
            const query = receiverInput.value.trim();
            if (query.length >= 3) {
                searchUsers(query, searchResultsContainer);
            } else {
                if (searchResultsContainer) {
                    searchResultsContainer.innerHTML = '';
                }
            }
        }, 500));
    }
    
    // Add amount validation
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            validateAmount(amountInput);
        });
    }
    
    // Handle form submission via API
    if (sendMoneyForm) {
        sendMoneyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(sendMoneyForm);
            const receiverId = formData.get('receiver_id');
            const amount = parseFloat(formData.get('amount'));
            const description = formData.get('description');
            
            // Basic validation
            if (!receiverId || isNaN(amount) || amount <= 0) {
                showAlert('Please fill in all required fields correctly', 'danger');
                return;
            }
            
            // Send transaction via API
            sendTransaction(receiverId, amount, description);
        });
    }
}

/**
 * Initialize transactions page functionality
 */
function initializeTransactionsPage() {
    // Add filter functionality
    const filterButtons = document.querySelectorAll('.transaction-filter');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Get filter type
                const filterType = this.dataset.filter;
                
                // Fetch transactions with filter
                fetchTransactions(filterType);
            });
        });
        
        // Trigger all transactions by default
        fetchTransactions('all');
    }
}

/**
 * Search users by username or wallet ID
 */
function searchUsers(query, resultsContainer) {
    fetch(`/api/user/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && resultsContainer) {
                resultsContainer.innerHTML = '';
                
                if (data.results.length === 0) {
                    resultsContainer.innerHTML = '<div class="search-no-results">No users found</div>';
                    return;
                }
                
                const resultsList = document.createElement('ul');
                resultsList.className = 'search-results-list';
                
                data.results.forEach(user => {
                    const resultItem = document.createElement('li');
                    resultItem.className = 'search-result-item';
                    resultItem.innerHTML = `
                        <div class="search-result-info">
                            <div class="search-result-name">${user.username}</div>
                            <div class="search-result-wallet">${user.wallet_id}</div>
                        </div>
                    `;
                    
                    // Add click event to select user
                    resultItem.addEventListener('click', function() {
                        document.getElementById('receiver_id').value = user.wallet_id;
                        resultsContainer.innerHTML = '';
                    });
                    
                    resultsList.appendChild(resultItem);
                });
                
                resultsContainer.appendChild(resultsList);
            }
        })
        .catch(error => {
            console.error('Error searching users:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div class="search-error">Error searching users</div>';
            }
        });
}

/**
 * Fetch transactions with optional filter
 */
function fetchTransactions(filterType) {
    const url = filterType === 'all' ? '/api/transactions' : `/api/transactions?type=${filterType}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateTransactionsUI(data.transactions);
            }
        })
        .catch(error => {
            console.error('Error fetching transactions:', error);
            showAlert('Error loading transactions', 'danger');
        });
}

/**
 * Update transactions UI with fetched data
 */
function updateTransactionsUI(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    if (!transactionsList) return;
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No transactions found</h3>
                <p>When you make transactions, they will appear here.</p>
            </div>
        `;
        return;
    }
    
    transactionsList.innerHTML = '';
    
    transactions.forEach(tx => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        const isOutgoing = tx.is_outgoing;
        const iconClass = isOutgoing ? 'outgoing' : 'incoming';
        const amountPrefix = isOutgoing ? '-' : '+';
        const amountClass = isOutgoing ? 'outgoing' : 'incoming';
        const direction = isOutgoing ? 'To' : 'From';
        const counterparty = isOutgoing ? tx.receiver : tx.sender;
        
        transactionItem.innerHTML = `
            <div class="transaction-icon ${iconClass}">
                <i class="fas fa-${isOutgoing ? 'arrow-up' : 'arrow-down'}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${tx.description || 'Transaction'}</div>
                <div class="transaction-info">${direction}: ${counterparty}</div>
                <div class="transaction-date">${formatDate(tx.timestamp)}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountPrefix}$${parseFloat(tx.amount).toFixed(2)}
            </div>
        `;
        
        transactionsList.appendChild(transactionItem);
    });
}

/**
 * Send transaction using API
 */
function sendTransaction(receiverId, amount, description) {
    // Show loading state
    const submitButton = document.querySelector('#send-money-form button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    
    // Prepare data
    const data = {
        receiver_id: receiverId,
        amount: amount,
        description: description || 'Transfer'
    };
    
    // Send request
    fetch('/api/transfer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        
        if (data.success) {
            showAlert('Transaction completed successfully!', 'success');
            // Update balance if shown
            const balanceElement = document.getElementById('wallet-balance');
            if (balanceElement && data.new_balance !== undefined) {
                balanceElement.textContent = formatCurrency(data.new_balance);
            }
            
            // Clear form
            document.getElementById('send-money-form').reset();
            
            // Redirect to dashboard after a delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            showAlert(data.message || 'Transaction failed', 'danger');
        }
    })
    .catch(error => {
        console.error('Error sending transaction:', error);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        showAlert('An error occurred while processing your transaction', 'danger');
    });
}

/**
 * Validate amount input
 */
function validateAmount(amountInput) {
    const value = amountInput.value;
    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue) || numericValue <= 0) {
        amountInput.classList.add('is-invalid');
        const errorElement = document.querySelector('.amount-error');
        if (!errorElement) {
            const error = document.createElement('div');
            error.className = 'amount-error text-danger mt-1';
            error.textContent = 'Please enter a valid amount greater than zero';
            amountInput.parentNode.appendChild(error);
        }
    } else {
        amountInput.classList.remove('is-invalid');
        const errorElement = document.querySelector('.amount-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    
    // Find alert container
    const alertContainer = document.querySelector('.alert-container');
    if (alertContainer) {
        // Clear any existing alerts
        alertContainer.innerHTML = '';
        
        // Add new alert
        alertContainer.appendChild(alertElement);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertElement.style.opacity = '0';
            setTimeout(() => {
                alertElement.remove();
            }, 300);
        }, 5000);
    }
}

/**
 * Format currency amount
 */
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
