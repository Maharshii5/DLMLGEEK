/**
 * Wallet.js - Handles wallet functionality for the TrustPort mobile wallet application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the dashboard page
    const dashboardPage = document.querySelector('.dashboard-page');
    if (dashboardPage) {
        initializeDashboard();
    }
    
    // Initialize mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
        });
    }
});

/**
 * Initialize dashboard functionality
 */
function initializeDashboard() {
    // Fetch latest wallet balance
    fetchWalletBalance();
    
    // Refresh balance every 30 seconds
    setInterval(fetchWalletBalance, 30000);
    
    // Setup copy wallet ID functionality
    const walletIdElement = document.getElementById('wallet-id');
    const copyButton = document.getElementById('copy-wallet-id');
    
    if (walletIdElement && copyButton) {
        copyButton.addEventListener('click', function() {
            const walletId = walletIdElement.textContent;
            copyToClipboard(walletId);
            showToast('Wallet ID copied to clipboard!');
        });
    }
}

/**
 * Fetch wallet balance from API
 */
function fetchWalletBalance() {
    fetch('/api/wallet/balance')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateWalletUI(data);
            }
        })
        .catch(error => {
            console.error('Error fetching wallet balance:', error);
        });
}

/**
 * Update wallet UI with new data
 */
function updateWalletUI(data) {
    const balanceElement = document.getElementById('wallet-balance');
    if (balanceElement) {
        balanceElement.textContent = formatCurrency(data.balance);
    }
}

/**
 * Format currency amount
 */
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Unable to copy to clipboard', err);
    }
    
    document.body.removeChild(textarea);
}

/**
 * Show toast notification
 */
function showToast(message) {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
        
        // Add styles for toast container
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1000';
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Add styles to toast
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '4px';
    toast.style.marginTop = '10px';
    toast.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    toast.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        
        // Remove element after animation completes
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
