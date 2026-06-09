
E-COMMERCE SYSTEM SETUP INSTRUCTIONS

Writer: ANDREA ANORD ANDREA 
Registration Number: 14322084/T.24
1. REQUIREMENTS:
   - XAMPP / WAMP / LAMP with PHP 7.4+ and MySQL
   - Web browser

2. SETUP STEPS:
   a) Copy all files to your web server root directory (e.g., htdocs/ecommerce/)
   b) Import the database:
      - Open phpMyAdmin
      - Create a database named 'ecommerce'
      - Import the 'ecommerce.sql' file
   c) Update database credentials in includes/db.php if necessary
   d) Run the seed_admin.php script to create admin user:
      - Navigate to http://localhost/ecommerce/seed_admin.php
      - Or run from command line: php seed_admin.php
      - Admin credentials: admin@example.com / admin123
   e) Ensure proper file permissions for the project folder

3. ACCESSING THE SYSTEM:
   - Customer: Register a new account or login with customer credentials
   - Admin: Login with admin@example.com / admin123
   - Admin panel: http://localhost/ecommerce/admin/dashboard.html

4. FEATURES:
   - Customer: View products, add to cart, place orders, view order history
   - Admin: Manage products (CRUD), manage orders (update status, delete)
   - Password hashing, client & server validation
   - Separation of concerns: HTML/CSS/JS frontend, PHP API backend

5. API ENDPOINTS (used by frontend):
   - /api/auth.php - Register, login, logout, get user
   - /api/products.php - Product listing and management
   - /api/cart.php - Shopping cart operations
   - /api/orders.php - Order placement and management
   - /api/stats.php - Admin statistics

6. TROUBLESHOOTING:
   - If you get CORS errors, adjust the Access-Control-Allow-Origin headers
   - Make sure mod_rewrite is enabled if using custom URLs (not required)
   - Check PHP error logs if API calls fail
   - Ensure session storage is writable

For any issues, verify database connection and file paths.

7. HOW IT WORK
   User(customer) t3nd to register and login to access the system and can
 click afd zo cart button to put products he/ she like, then,
customer can view all products in cart and place order.
7.Admin can see all orders and manage them
