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

$userId = $_SESSION['user_id'];

// Get user statistics
$stmt = $conn->prepare("
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN result = 'win' AND winner = 'X' THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN result = 'win' AND winner = 'O' THEN 1 ELSE 0 END) AS losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws
    FROM games 
    WHERE user_id = ? AND status = 'completed'
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$stats = $result->fetch_assoc();
$stmt->close();

// Get recent games
$stmt = $conn->prepare("
    SELECT id, result, winner, created_at, completed_at
    FROM games 
    WHERE user_id = ? AND status = 'completed' 
    ORDER BY completed_at DESC 
    LIMIT 10
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$recentGamesResult = $stmt->get_result();
$recentGames = [];

while ($game = $recentGamesResult->fetch_assoc()) {
    $recentGames[] = [
        'id' => $game['id'],
        'date' => $game['completed_at'],
        'result' => $game['result'],
        'winner' => $game['winner']
    ];
}
$stmt->close();

echo json_encode([
    'success' => true,
    'stats' => $stats,
    'recentGames' => $recentGames
]);

$conn->close();
?>

