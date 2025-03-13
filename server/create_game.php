<?php
session_start();
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not logged in'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = $_SESSION['user_id'];

// Create new game
$stmt = $conn->prepare("INSERT INTO games (user_id, status, created_at) VALUES (?, 'active', NOW())");
$stmt->bind_param("i", $userId);

if ($stmt->execute()) {
    $gameId = $conn->insert_id;
    echo json_encode([
        'success' => true,
        'gameId' => $gameId
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to create game: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>

