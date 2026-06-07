<?php
// api/cart.php
// Shopping cart operations for logged in customers

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
$method = $_SERVER['REQUEST_METHOD'];

// GET - Retrieve cart items for current user
if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT cart.id as cart_id, cart.product_id, cart.quantity, 
               products.name, products.price, products.image_url, products.stock
        FROM cart 
        JOIN products ON cart.product_id = products.id 
        WHERE cart.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $cartItems = $stmt->fetchAll();
    
    // Calculate total
    $total = 0;
    foreach ($cartItems as $item) {
        $total += $item['price'] * $item['quantity'];
    }
    
    jsonResponse(['items' => $cartItems, 'total' => $total]);
}

// POST - Add item to cart
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $product_id = $data['product_id'] ?? null;
    $quantity = isset($data['quantity']) ? intval($data['quantity']) : 1;
    
    if (!$product_id || $quantity <= 0) {
        jsonResponse(['error' => 'Invalid product or quantity'], 400);
    }
    
    // Check if product exists and has stock
    $stmt = $pdo->prepare("SELECT stock FROM products WHERE id = ?");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch();
    if (!$product) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    
    // Check if item already in cart
    $stmt = $pdo->prepare("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?");
    $stmt->execute([$user_id, $product_id]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        $newQuantity = $existing['quantity'] + $quantity;
        if ($newQuantity > $product['stock']) {
            jsonResponse(['error' => 'Not enough stock'], 400);
        }
        $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
        $stmt->execute([$newQuantity, $existing['id']]);
    } else {
        if ($quantity > $product['stock']) {
            jsonResponse(['error' => 'Not enough stock'], 400);
        }
        $stmt = $pdo->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $product_id, $quantity]);
    }
    
    jsonResponse(['message' => 'Item added to cart'], 201);
}

// PUT - Update cart item quantity
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $cart_id = $data['cart_id'] ?? null;
    $quantity = isset($data['quantity']) ? intval($data['quantity']) : 0;
    
    if (!$cart_id || $quantity < 0) {
        jsonResponse(['error' => 'Invalid request'], 400);
    }
    
    // Verify cart item belongs to user
    $stmt = $pdo->prepare("SELECT cart.product_id, products.stock FROM cart JOIN products ON cart.product_id = products.id WHERE cart.id = ? AND cart.user_id = ?");
    $stmt->execute([$cart_id, $user_id]);
    $item = $stmt->fetch();
    
    if (!$item) {
        jsonResponse(['error' => 'Cart item not found'], 404);
    }
    
    if ($quantity == 0) {
        // Remove item
        $stmt = $pdo->prepare("DELETE FROM cart WHERE id = ?");
        $stmt->execute([$cart_id]);
        jsonResponse(['message' => 'Item removed from cart']);
    } else {
        if ($quantity > $item['stock']) {
            jsonResponse(['error' => 'Not enough stock'], 400);
        }
        $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
        $stmt->execute([$quantity, $cart_id]);
        jsonResponse(['message' => 'Cart updated']);
    }
}

// DELETE - Remove item from cart
if ($method === 'DELETE') {
    $cart_id = $_GET['id'] ?? null;
    if (!$cart_id) {
        jsonResponse(['error' => 'Cart item ID required'], 400);
    }
    
    $stmt = $pdo->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
    $stmt->execute([$cart_id, $user_id]);
    jsonResponse(['message' => 'Item removed from cart']);
}
?>
