<?php
// api/stats.php
// Admin statistics (product count and order count)

require_once '../includes/db.php';
require_once '../includes/session.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $productCount = $pdo->query("SELECT COUNT(*) as count FROM products")->fetch()['count'];
    $orderCount = $pdo->query("SELECT COUNT(*) as count FROM orders")->fetch()['count'];
    
    jsonResponse([
        'total_products' => $productCount,
        'total_orders' => $orderCount
    ]);
}
?>
