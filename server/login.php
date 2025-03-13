<?php
session_start();
require_once 'db_connect.php';

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

// Check if required fields are present
if (!isset($data['username']) || !isset($data['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Username and password are required'
    ]);
    exit;
}

$username = $data['username'];
$password = $data['password'];

// Prepare statement
$stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    // Verify password
    if (password_verify($password, $user['password'])) {
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        
        echo json_encode([
            'success' => true,
            'userId' => $user['id'],
            'username' => $user['username']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid username or password'
    ]);
}

$stmt->close();
$conn->close();
?>

