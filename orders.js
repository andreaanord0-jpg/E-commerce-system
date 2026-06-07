// assets/js/orders.js
// Customer orders page

async function loadOrders() {
    const ordersContainer = document.getElementById('orders-container');
    if (!ordersContainer) return;
    
    ordersContainer.innerHTML = '<div class="loading">Loading your orders...</div>';
    
    try {
        const orders = await apiCall('orders.php');
        
        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = '<p>You have no orders yet. <a href="/products.html">Start shopping</a></p>';
            return;
        }
        
        let html = '';
        orders.forEach(order => {
            html += `
                <div class="order-card" style="background:white; margin-bottom:1.5rem; padding:1rem; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #ddd; padding-bottom:0.5rem;">
                        <strong>Order #${order.id}</strong>
                        <span>Date: ${new Date(order.created_at).toLocaleDateString()}</span>
                        <span>Status: <span class="order-status status-${order.status}">${order.status}</span></span>
                        <strong>Total: $${parseFloat(order.total_amount).toFixed(2)}</strong>
                    </div>
                    <table style="width:100%; margin-top:1rem;">
                        <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr></thead>
                        <tbody>
            `;
            
            order.items.forEach(item => {
                const subtotal = item.price * item.quantity;
                html += `
                    <tr>
                        <td>${escapeHtml(item.product_name)}</td>
                        <td>${item.quantity}</td>
                        <td>$${parseFloat(item.price).toFixed(2)}</td>
                        <td>$${subtotal.toFixed(2)}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        ordersContainer.innerHTML = html;
    } catch (error) {
        ordersContainer.innerHTML = `<div class="alert alert-error">Failed to load orders: ${error.message}</div>`;
    }
}

if (document.getElementById('orders-container')) {
    document.addEventListener('DOMContentLoaded', loadOrders);
}
