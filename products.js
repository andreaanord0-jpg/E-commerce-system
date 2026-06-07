// assets/js/products.js
// Product listing page functionality

// Load and display products
async function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '<div class="loading">Loading products...</div>';
    
    try {
        const products = await apiCall('products.php');
        
        if (products.length === 0) {
            productsGrid.innerHTML = '<p>No products found.</p>';
            return;
        }
        
        productsGrid.innerHTML = '';
        products.forEach(product => {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        });
    } catch (error) {
        productsGrid.innerHTML = `<div class="alert alert-error">Failed to load products: ${error.message}</div>`;
    }
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.image_url || 'https://picsum.photos/id/20/200/200';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}">
        <div class="product-info">
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
            <div class="product-description">${escapeHtml(product.description.substring(0, 100))}${product.description.length > 100 ? '...' : ''}</div>
            <div class="product-stock">Stock: ${product.stock}</div>
            <button class="btn add-to-cart" data-id="${product.id}" data-name="${escapeHtml(product.name)}" ${product.stock <= 0 ? 'disabled' : ''}>
                ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
        </div>
    `;
    
    const addButton = card.querySelector('.add-to-cart');
    if (addButton && product.stock > 0) {
        addButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await addToCart(product.id);
        });
    }
    
    return card;
}

// Add to cart function
async function addToCart(productId) {
    const user = await getCurrentUser();
    if (!user) {
        showAlert('Please login to add items to cart', 'error');
        window.location.href = '/login.html';
        return;
    }
    
    try {
        await apiCall('cart.php', {
            method: 'POST',
            body: { product_id: productId, quantity: 1 }
        });
        showAlert('Item added to cart!', 'success');
        updateCartCount();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Helper function to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Initialize products page
if (document.getElementById('products-grid')) {
    document.addEventListener('DOMContentLoaded', loadProducts);
}
