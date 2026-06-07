// assets/js/main.js
// Common JavaScript for frontend (customer pages)

// API base URL
const API_BASE = '/api/';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // If body is object, stringify it
    if (mergedOptions.body && typeof mergedOptions.body === 'object') {
        mergedOptions.body = JSON.stringify(mergedOptions.body);
    }
    
    try {
        const response = await fetch(API_BASE + endpoint, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.errors?.join(', ') || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Get current logged in user
async function getCurrentUser() {
    try {
        return await apiCall('auth.php?action=me');
    } catch (error) {
        return null;
    }
}

// Logout function
async function logout() {
    try {
        await apiCall('auth.php?action=logout', { method: 'POST' });
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Show alert message
function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    } else {
        alert(message);
    }
}

// Update navigation based on user login status
async function updateNavigation() {
    const navLinks = document.querySelector('.nav-links');
    const userInfoDiv = document.querySelector('.user-info');
    
    if (!navLinks) return;
    
    try {
        const user = await getCurrentUser();
        
        if (user && user.id) {
            // User is logged in
            localStorage.setItem('user', JSON.stringify(user));
            
            if (userInfoDiv) {
                userInfoDiv.innerHTML = `
                    <span class="user-name">Welcome, ${user.name}</span>
                    ${user.role === 'admin' ? '<a href="/admin/dashboard.html" class="btn" style="background:#e67e22">Admin Panel</a>' : ''}
                    <button class="logout-btn" onclick="logout()">Logout</button>
                `;
            }
            
            // Update cart count in navigation if needed
            updateCartCount();
        } else {
            // User not logged in
            if (userInfoDiv) {
                userInfoDiv.innerHTML = `
                    <a href="/login.html" style="color:white">Login</a>
                    <a href="/register.html" style="color:white">Register</a>
                `;
            }
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Failed to load user:', error);
    }
}

// Update cart count badge
async function updateCartCount() {
    const user = await getCurrentUser();
    if (!user) return;
    
    try {
        const cart = await apiCall('cart.php');
        const itemCount = cart.items?.length || 0;
        let cartBadge = document.querySelector('.cart-count');
        if (!cartBadge) {
            const cartLink = document.querySelector('a[href="/cart.html"]');
            if (cartLink) {
                cartBadge = document.createElement('span');
                cartBadge.className = 'cart-count';
                cartLink.appendChild(cartBadge);
            }
        }
        if (cartBadge) {
            cartBadge.textContent = itemCount > 0 ? itemCount : '';
            cartBadge.style.marginLeft = '5px';
            cartBadge.style.backgroundColor = '#e74c3c';
            cartBadge.style.padding = '2px 6px';
            cartBadge.style.borderRadius = '50%';
            cartBadge.style.fontSize = '0.7rem';
        }
    } catch (error) {
        console.error('Failed to get cart count:', error);
    }
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});
