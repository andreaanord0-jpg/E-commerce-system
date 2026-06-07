-- ecommerce.sql
-- Create database and tables for the e-commerce system

CREATE DATABASE IF NOT EXISTS ecommerce;
USE ecommerce;

-- Users table (customer and admin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping cart table
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert default admin (email: admin@example.com, password: admin123)
-- Password hashed using PHP password_hash('admin123', PASSWORD_DEFAULT)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@example.com', '$2y$10$YourHashedPasswordHere', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample products
INSERT INTO products (name, description, price, image_url, stock) VALUES
('Smartphone X', 'Latest smartphone with 128GB storage', 699.99, 'https://picsum.photos/id/0/200/200', 10),
('Laptop Pro', 'High performance laptop for work and gaming', 1299.99, 'https://picsum.photos/id/1/200/200', 5),
('Wireless Headphones', 'Noise cancelling over-ear headphones', 199.99, 'https://picsum.photos/id/2/200/200', 15),
('Smart Watch', 'Fitness tracker with heart rate monitor', 249.99, 'https://picsum.photos/id/3/200/200', 8),
('Tablet Mini', 'Portable tablet for entertainment', 329.99, 'https://picsum.photos/id/4/200/200', 12);

-- Note: After running the SQL, you need to replace the hashed password with a real one.
-- Use the provided seed_admin.php script to insert admin with proper hash.
-- Or update the hash manually.
