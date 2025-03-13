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
if (!isset($data['gameId']) || !isset($data['player']) || !isset($data['position'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required data'
    ]);
    exit;
}

$gameId = $data['gameId'];
$player = $data['player'];
$position = $data['position'];
$userId = $_SESSION['user_id'];

// Check if the game belongs to the user
$stmt = $conn->prepare("SELECT id FROM games WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $gameId, $userId);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Game not found or not owned by user'
    ]);
    $stmt->close();
    exit;
}
$stmt->close();

// Record the move
$stmt = $conn->prepare("INSERT INTO moves (game_id, player, position, created_at) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("isi", $gameId, $player, $position);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to record move: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>

