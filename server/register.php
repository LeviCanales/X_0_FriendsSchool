<?php
require_once 'db_connect.php';

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

// Check if required fields are present
if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'All fields are required'
    ]);
    exit;
}

$username = $data['username'];
$email = $data['email'];
$password = $data['password'];

// Validate input
if (strlen($username) < 3) {
    echo json_encode([
        'success' => false,
        'message' => 'Username must be at least 3 characters long'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email address'
    ]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters long'
    ]);
    exit;
}

// Check if username already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Username already exists'
    ]);
    $stmt->close();
    exit;
}
$stmt->close();

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Email already exists'
    ]);
    $stmt->close();
    exit;
}
$stmt->close();

// Hash password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert new user
$stmt = $conn->prepare("INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("sss", $username, $email, $hashed_password);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Registration failed: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>

