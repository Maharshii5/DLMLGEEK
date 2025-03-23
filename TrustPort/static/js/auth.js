/**
 * Auth.js - Handles authentication functionality for the TrustPort mobile wallet application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        initializeLoginForm();
    }
    
    // Check if we're on the register page
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        initializeRegisterForm();
    }
});

/**
 * Initialize login form functionality
 */
function initializeLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', function(e) {
        // Client-side validation
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            e.preventDefault();
            showFormAlert('Please enter both username and password', 'danger');
        }
    });
}

/**
 * Initialize register form functionality
 */
function initializeRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    
    // Add password strength meter
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrengthMeter(strength);
        });
    }
    
    // Add password confirmation validation
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordMatch(passwordInput.value, this.value);
        });
    }
    
    // Form submission validation
    registerForm.addEventListener('submit', function(e) {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Check all fields are filled
        if (!username || !email || !password || !confirmPassword) {
            e.preventDefault();
            showFormAlert('Please fill in all fields', 'danger');
            return;
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
            e.preventDefault();
            showFormAlert('Please enter a valid email address', 'danger');
            return;
        }
        
        // Check password strength
        const strength = calculatePasswordStrength(password);
        if (strength < 2) {
            e.preventDefault();
            showFormAlert('Please choose a stronger password', 'danger');
            return;
        }
        
        // Check passwords match
        if (password !== confirmPassword) {
            e.preventDefault();
            showFormAlert('Passwords do not match', 'danger');
            return;
        }
    });
}

/**
 * Calculate password strength (0-4)
 */
function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
    if (password.match(/\d+/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
    
    return strength;
}

/**
 * Update password strength meter
 */
function updatePasswordStrengthMeter(strength) {
    const meter = document.getElementById('password-strength-meter');
    const text = document.getElementById('password-strength-text');
    
    if (!meter || !text) return;
    
    // Update meter width
    meter.style.width = `${(strength / 4) * 100}%`;
    
    // Update color
    let color = '';
    let strengthText = '';
    
    switch (strength) {
        case 0:
            color = '#ff4d4d';  // Red
            strengthText = 'Very Weak';
            break;
        case 1:
            color = '#ffaa00';  // Orange
            strengthText = 'Weak';
            break;
        case 2:
            color = '#ffff00';  // Yellow
            strengthText = 'Fair';
            break;
        case 3:
            color = '#aaff00';  // Light green
            strengthText = 'Good';
            break;
        case 4:
            color = '#00cc00';  // Green
            strengthText = 'Strong';
            break;
    }
    
    meter.style.backgroundColor = color;
    text.textContent = strengthText;
    text.style.color = color;
}

/**
 * Validate password match
 */
function validatePasswordMatch(password, confirmPassword) {
    const confirmInput = document.getElementById('confirm_password');
    const matchText = document.getElementById('password-match-text');
    
    if (!confirmInput || !matchText) return;
    
    if (!confirmPassword) {
        matchText.textContent = '';
        confirmInput.classList.remove('is-valid', 'is-invalid');
        return;
    }
    
    if (password === confirmPassword) {
        matchText.textContent = 'Passwords match';
        matchText.classList.remove('text-danger');
        matchText.classList.add('text-success');
        confirmInput.classList.remove('is-invalid');
        confirmInput.classList.add('is-valid');
    } else {
        matchText.textContent = 'Passwords do not match';
        matchText.classList.remove('text-success');
        matchText.classList.add('text-danger');
        confirmInput.classList.remove('is-valid');
        confirmInput.classList.add('is-invalid');
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Show alert within form
 */
function showFormAlert(message, type) {
    // Find or create alert container
    let alertContainer = document.querySelector('.form-alert-container');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'form-alert-container';
        
        // Insert at the top of the form
        const form = document.querySelector('form');
        form.prepend(alertContainer);
    }
    
    // Create alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Clear existing alerts
    alertContainer.innerHTML = '';
    
    // Add new alert
    alertContainer.appendChild(alert);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 5000);
}
