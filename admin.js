// assets/js/admin.js
// Admin panel functionality (products and orders management)

// Load admin dashboard stats
async function loadDashboardStats() {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer) return;
    
    try {
        const stats = await apiCall('stats.php');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.total_products}</div>
                <div class="stat-label">Total Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.total_orders}</div>
                <div class="stat-label">Total Orders</div>
            </div>
        `;
    } catch (error) {
        statsContainer.innerHTML = `<div class="alert alert-error">Failed to load stats: ${error.message}</div>`;
    }
}

// Load products for admin
async function loadAdminProducts() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading products...</td></tr>';
    
    try {
        const products = await apiCall('products.php');
        
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No products found. Add a product.</td></tr>';
            return;
        }
        
        tableBody.innerHTML = '';
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>${product.stock}</td>
                <td><img src="${product.image_url || 'https://picsum.photos/id/20/50/50'}" style="width:50px; height:50px; object-fit:cover;"></td>
                <td class="action-buttons">
                    <button class="btn-warning edit-product" data-id="${product.id}">Edit</button>
                    <button class="btn-danger delete-product" data-id="${product.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Attach event listeners
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', () => openProductModal(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
        
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="alert alert-error">Failed to load products: ${error.message}</td></tr>`;
    }
}

// Open product modal for add/edit
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');
    
    if (!modal) return;
    
    if (productId) {
        title.textContent = 'Edit Product';
        // Fetch product details
        apiCall(`products.php?id=${productId}`)
            .then(product => {
                document.getElementById('product-id').value = product.id;
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-description').value = product.description;
                document.getElementById('product-price').value = product.price;
                document.getElementById('product-stock').value = product.stock;
                document.getElementById('product-image').value = product.image_url || '';
            })
            .catch(error => showAlert(error.message, 'error'));
    } else {
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('product-id').value = '';
    }
    
    modal.style.display = 'block';
}

// Close modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

// Save product (add or update)
async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        image_url: document.getElementById('product-image').value
    };
    
    if (productId) {
        productData.id = productId;
        try {
            await apiCall('products.php', { method: 'PUT', body: productData });
            showAlert('Product updated successfully', 'success');
            closeProductModal();
            loadAdminProducts();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    } else {
        try {
            await apiCall('products.php', { method: 'POST', body: productData });
            showAlert('Product added successfully', 'success');
            closeProductModal();
            loadAdminProducts();
            if (document.getElementById('dashboard-stats')) loadDashboardStats();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await apiCall(`products.php?id=${productId}`, { method: 'DELETE' });
        showAlert('Product deleted', 'success');
        loadAdminProducts();
        if (document.getElementById('dashboard-stats')) loadDashboardStats();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Load orders for admin
async function loadAdminOrders() {
    const tableBody = document.getElementById('admin-orders-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Loading orders...</td></tr>';
    
    try {
        const orders = await apiCall('orders.php?all=1');
        
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>';
            return;
        }
        
        tableBody.innerHTML = '';
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${escapeHtml(order.user_name)}</td>
                <td>${order.user_email}</td>
                <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
                <td>
                    <select class="order-status-select" data-id="${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td class="action-buttons">
                    <button class="btn-danger delete-order" data-id="${order.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Attach status change listeners
        document.querySelectorAll('.order-status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const orderId = select.dataset.id;
                const newStatus = select.value;
                await updateOrderStatus(orderId, newStatus);
            });
        });
        
        document.querySelectorAll('.delete-order').forEach(btn => {
            btn.addEventListener('click', async () => {
                await deleteOrder(btn.dataset.id);
            });
        });
        
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="7" class="alert alert-error">Failed to load orders: ${error.message}</td></tr>`;
    }
}

// Update order status (admin)
async function updateOrderStatus(orderId, status) {
    try {
        await apiCall('orders.php', { method: 'PUT', body: { order_id: orderId, status: status } });
        showAlert('Order status updated', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
        loadAdminOrders(); // Reload to revert
    }
}

// Delete order (admin)
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
        await apiCall(`orders.php?id=${orderId}`, { method: 'DELETE' });
        showAlert('Order deleted', 'success');
        loadAdminOrders();
        if (document.getElementById('dashboard-stats')) loadDashboardStats();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Initialize admin pages based on current page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard-stats')) {
        loadDashboardStats();
    }
    if (document.getElementById('products-table-body')) {
        loadAdminProducts();
        
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => openProductModal());
        }
        
        const modalClose = document.querySelector('.close');
        if (modalClose) {
            modalClose.addEventListener('click', closeProductModal);
        }
        
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', saveProduct);
        }
        
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('productModal');
            if (e.target === modal) closeProductModal();
        });
    }
    
    if (document.getElementById('admin-orders-table-body')) {
        loadAdminOrders();
    }
});
