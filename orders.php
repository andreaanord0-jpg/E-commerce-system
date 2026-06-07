<?php
// api/orders.php
// Order placement, retrieval, and admin management

require_once '../includes/db.php';
require_once '../includes/session.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

requireLogin();

$user_id = $_SESSION['user_id'];
$is_admin = isAdmin();
$method = $_SERVER['REQUEST_METHOD'];

// GET - Retrieve orders (admin gets all, customer gets their own)
if ($method === 'GET') {
    if ($is_admin && isset($_GET['all']) && $_GET['all'] == 1) {
        // Admin view all orders with user details
        $stmt = $pdo->query("
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ");
        $orders = $stmt->fetchAll();
        
        // Get items for each order
        foreach ($orders as &$order) {
            $stmt = $pdo->prepare("
                SELECT oi.*, p.name as product_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll();
        }
        jsonResponse($orders);
    } else {
        // Customer view their own orders
        $stmt = $pdo->prepare("
            SELECT * FROM orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user_id]);
        $orders = $stmt->fetchAll();
        
        foreach ($orders as &$order) {
            $stmt = $pdo->prepare("
                SELECT oi.*, p.name as product_name, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ");
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll();
        }
        jsonResponse($orders);
    }
}

// POST - Place order (create order from cart)
if ($method === 'POST') {
    // Get cart items
    $stmt = $pdo->prepare("
        SELECT cart.product_id, cart.quantity, products.price, products.stock
        FROM cart 
        JOIN products ON cart.product_id = products.id 
        WHERE cart.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $cartItems = $stmt->fetchAll();
    
    if (empty($cartItems)) {
        jsonResponse(['error' => 'Cart is empty'], 400);
    }
    
    // Calculate total and check stock
    $total = 0;
    foreach ($cartItems as $item) {
        if ($item['quantity'] > $item['stock']) {
            jsonResponse(['error' => 'Not enough stock for one or more items'], 400);
        }
        $total += $item['price'] * $item['quantity'];
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Create order
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, 'pending')");
        $stmt->execute([$user_id, $total]);
        $order_id = $pdo->lastInsertId();
        
        // Create order items and update stock
        foreach ($cartItems as $item) {
            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
            $stmt->execute([$order_id, $item['product_id'], $item['quantity'], $item['price']]);
            
            // Update stock
            $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['product_id']]);
        }
        
        // Clear cart
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
        $stmt->execute([$user_id]);
        
        $pdo->commit();
        jsonResponse(['message' => 'Order placed successfully', 'order_id' => $order_id], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Failed to place order: ' . $e->getMessage()], 500);
    }
}

// PUT - Update order status (admin only)
if ($method === 'PUT') {
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $order_id = $data['order_id'] ?? null;
    $status = $data['status'] ?? null;
    
    $allowed_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!$order_id || !$status || !in_array($status, $allowed_statuses)) {
        jsonResponse(['error' => 'Invalid order ID or status'], 400);
    }
    
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    if ($stmt->execute([$status, $order_id])) {
        jsonResponse(['message' => 'Order status updated']);
    } else {
        jsonResponse(['error' => 'Failed to update order'], 500);
    }
}

// DELETE - Delete order (admin only)
if ($method === 'DELETE') {
    requireAdmin();
    
    $order_id = $_GET['id'] ?? null;
    if (!$order_id) {
        jsonResponse(['error' => 'Order ID required'], 400);
    }
    
    // Delete order items first (cascade will handle if foreign key constraint, but do explicitly)
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("DELETE FROM order_items WHERE order_id = ?");
        $stmt->execute([$order_id]);
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$order_id]);
        $pdo->commit();
        jsonResponse(['message' => 'Order deleted successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Failed to delete order'], 500);
    }
}
?>
