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

// Validate data
if (!isset($data['gameId']) || !isset($data['result'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required data'
    ]);
    exit;
}

$gameId = $data['gameId'];
$result = $data['result'];
$winner = $data['winner'] ?? null;
$userId = $_SESSION['user_id'];

// Update game status
$stmt = $conn->prepare("UPDATE games SET status = 'completed', result = ?, winner = ?, completed_at = NOW() WHERE id = ? AND user_id = ?");
$stmt->bind_param("ssii", $result, $winner, $gameId, $userId);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update game: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>

