<?php
// seed_admin.php
// Run this script once to create admin user with proper password hash
// Place this file in the project root (ecommerce/) and access via browser

require_once 'C:/xampp/htdocs/ecommerce/includes/db.php';

$email = 'admin@example.com';
$password = 'admin123';
$name = 'Admin User';

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {
    // Check if admin already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Admin user already exists. To reset password, delete the user manually from database.\n";
    } else {
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')");
        $stmt->execute([$name, $email, $hashedPassword]);
        echo "Admin user created successfully!\n";
        echo "Email: admin@example.com\n";
        echo "Password: admin123\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
