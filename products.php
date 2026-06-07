<?php
// api/products.php
// Product CRUD operations (customer can view, admin can add/update/delete)

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

$method = $_SERVER['REQUEST_METHOD'];

// GET - Retrieve products (all or single)
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $product = $stmt->fetch();
        if ($product) {
            jsonResponse($product);
        } else {
            jsonResponse(['error' => 'Product not found'], 404);
        }
    } else {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
        $products = $stmt->fetchAll();
        jsonResponse($products);
    }
}

// POST - Add new product (admin only)
if ($method === 'POST') {
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');
    $price = isset($data['price']) ? floatval($data['price']) : 0;
    $image_url = trim($data['image_url'] ?? '');
    $stock = isset($data['stock']) ? intval($data['stock']) : 0;
    
    $errors = [];
    if (empty($name)) $errors[] = 'Product name is required';
    if ($price <= 0) $errors[] = 'Price must be greater than 0';
    if ($stock < 0) $errors[] = 'Stock cannot be negative';
    
    if (!empty($errors)) {
        jsonResponse(['errors' => $errors], 400);
    }
    
    $stmt = $pdo->prepare("INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)");
    if ($stmt->execute([$name, $description, $price, $image_url, $stock])) {
        jsonResponse(['message' => 'Product added successfully', 'id' => $pdo->lastInsertId()], 201);
    } else {
        jsonResponse(['error' => 'Failed to add product'], 500);
    }
}

// PUT - Update product (admin only)
if ($method === 'PUT') {
    requireAdmin();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    
    if (!$id) {
        jsonResponse(['error' => 'Product ID required'], 400);
    }
    
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');
    $price = isset($data['price']) ? floatval($data['price']) : 0;
    $image_url = trim($data['image_url'] ?? '');
    $stock = isset($data['stock']) ? intval($data['stock']) : 0;
    
    $errors = [];
    if (empty($name)) $errors[] = 'Product name is required';
    if ($price <= 0) $errors[] = 'Price must be greater than 0';
    
    if (!empty($errors)) {
        jsonResponse(['errors' => $errors], 400);
    }
    
    $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, image_url=?, stock=? WHERE id=?");
    if ($stmt->execute([$name, $description, $price, $image_url, $stock, $id])) {
        jsonResponse(['message' => 'Product updated successfully']);
    } else {
        jsonResponse(['error' => 'Failed to update product'], 500);
    }
}

// DELETE - Delete product (admin only)
if ($method === 'DELETE') {
    requireAdmin();
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        jsonResponse(['error' => 'Product ID required'], 400);
    }
    
    // Check if product exists
    $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    if ($stmt->execute([$id])) {
        jsonResponse(['message' => 'Product deleted successfully']);
    } else {
        jsonResponse(['error' => 'Failed to delete product'], 500);
    }
}
?>
