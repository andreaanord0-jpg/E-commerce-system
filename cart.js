// assets/js/cart.js
// Shopping cart functionality

// Load cart items
async function loadCart() {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return;
    
    cartContainer.innerHTML = '<div class="loading">Loading cart...</div>';
    
    try {
        const cart = await apiCall('cart.php');
        
        if (!cart.items || cart.items.length === 0) {
            cartContainer.innerHTML = '<p>Your cart is empty. <a href="/products.html">Continue shopping</a></p>';
            return;
        }
        
        let html = `
            <table class="cart-table">
                <thead>
                    <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th>Action</th></tr>
                </thead>
                <tbody>
        `;
        
        cart.items.forEach(item => {
            const subtotal = item.price * item.quantity;
            html += `
                <tr data-cart-id="${item.cart_id}">
                    <td>${escapeHtml(item.name)}</td>
                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                    <td>
                        <input type="number" class="cart-quantity" value="${item.quantity}" min="1" max="${item.stock}" style="width:70px">
                    </td>
                    <td class="subtotal">$${subtotal.toFixed(2)}</td>
                    <td><button class="btn-danger remove-item" data-id="${item.cart_id}">Remove</button></td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <div class="cart-total">
                <strong>Total: $<span id="cart-total">${cart.total.toFixed(2)}</span></strong>
                <button id="checkout-btn" class="btn-success" style="margin-left:1rem">Proceed to Checkout</button>
            </div>
        `;
        
        cartContainer.innerHTML = html;
        
        // Attach event listeners
        document.querySelectorAll('.cart-quantity').forEach(input => {
            input.addEventListener('change', async (e) => {
                const row = e.target.closest('tr');
                const cartId = row.dataset.cartId;
                const newQuantity = parseInt(e.target.value);
                await updateCartQuantity(cartId, newQuantity);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const cartId = btn.dataset.id;
                await removeCartItem(cartId);
            });
        });
        
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', placeOrder);
        }
        
    } catch (error) {
        cartContainer.innerHTML = `<div class="alert alert-error">Failed to load cart: ${error.message}</div>`;
    }
}

// Update cart item quantity
async function updateCartQuantity(cartId, quantity) {
    try {
        await apiCall('cart.php', {
            method: 'PUT',
            body: { cart_id: cartId, quantity: quantity }
        });
        loadCart(); // Reload cart
        updateCartCount();
    } catch (error) {
        showAlert(error.message, 'error');
        loadCart(); // Reload to revert
    }
}

// Remove cart item
async function removeCartItem(cartId) {
    try {
        await apiCall(`cart.php?id=${cartId}`, { method: 'DELETE' });
        loadCart();
        updateCartCount();
        showAlert('Item removed', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Place order
async function placeOrder() {
    try {
        const result = await apiCall('orders.php', { method: 'POST' });
        showAlert('Order placed successfully!', 'success');
        window.location.href = '/orders.html';
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Initialize cart page
if (document.getElementById('cart-container')) {
    document.addEventListener('DOMContentLoaded', loadCart);
}
