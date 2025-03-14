<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

// Check if user is authenticated
if (!isset($_SESSION['userId'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

// Save game
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save-game') {
    $userId = $_SESSION['userId'];
    $opponent = $conn->real_escape_string($_POST['opponent']);
    $result = $conn->real_escape_string($_POST['result']);
    
    // Determine result for database
    $resultadoDB = '';
    if ($result === 'win') {
        $resultadoDB = 'jugador1';
    } else if ($result === 'loss') {
        $resultadoDB = 'jugador2';
    } else {
        $resultadoDB = 'empate';
    }
    
    // Save game
    $query = "INSERT INTO partidas (id_jugador1, id_jugador2, resultado, fecha_partida) VALUES (?, ?, ?, NOW())";
    $stmt = $conn->prepare($query);
    $opponentId = ($opponent === 'CPU') ? NULL : $opponent;
    $stmt->bind_param("iis", $userId, $opponentId, $resultadoDB);
    
    if ($stmt->execute()) {
        // Update user stats
        if ($result === 'win') {
            $query = "UPDATE user_stats SET wins = wins + 1 WHERE user_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            
            // Update total wins
            $query = "UPDATE usuarios SET partidas_ganadas = partidas_ganadas + 1 WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
        } else if ($result === 'loss') {
            $query = "UPDATE user_stats SET losses = losses + 1 WHERE user_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
        } else {
            $query = "UPDATE user_stats SET draws = draws + 1 WHERE user_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
        }
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar partida']);
    }
    exit;
}

// Get user stats
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'user-stats') {
    $userId = $_SESSION['userId'];
    
    $query = "SELECT wins, losses, draws FROM user_stats WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['wins' => 0, 'losses' => 0, 'draws' => 0]);
    } else {
        $stats = $result->fetch_assoc();
        echo json_encode($stats);
    }
    exit;
}

// Get leaderboard
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'leaderboard') {
    $query = "SELECT 
                u.id, 
                u.username, 
                u.partidas_ganadas,
                s.wins, 
                s.losses, 
                s.draws,
                (s.wins + s.losses + s.draws) as total_games,
                IF((s.wins + s.losses + s.draws) > 0, ROUND((s.wins / (s.wins + s.losses + s.draws)) * 100, 0), 0) as win_rate
            FROM 
                usuarios u
            LEFT JOIN 
                user_stats s ON u.id = s.user_id
            ORDER BY 
                u.partidas_ganadas DESC, 
                win_rate DESC
            LIMIT 20";
            
    $result = $conn->query($query);
    $leaderboard = [];
    
    while ($row = $result->fetch_assoc()) {
        $leaderboard[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'partidas_ganadas' => $row['partidas_ganadas'],
            'wins' => $row['wins'] ?? 0,
            'totalGames' => $row['total_games'] ?? 0,
            'winRate' => $row['win_rate'] ?? 0
        ];
    }
    
    echo json_encode($leaderboard);
    exit;
}

// Get game history
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'game-history') {
    $userId = $_SESSION['userId'];
    
    $query = "SELECT 
                id, 
                id_jugador2 AS opponent, 
                resultado AS result, 
                fecha_partida AS date 
            FROM 
                partidas 
            WHERE 
                id_jugador1 = ? 
            ORDER BY 
                fecha_partida DESC 
            LIMIT 10";
            
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $history = [];
    
    while ($row = $result->fetch_assoc()) {
        $resultado = '';
        if ($row['result'] === 'jugador1') {
            $resultado = 'Victoria';
        } else if ($row['result'] === 'jugador2') {
            $resultado = 'Derrota';
        } else {
            $resultado = 'Empate';
        }
        
        $history[] = [
            'id' => $row['id'],
            'opponent' => $row['opponent'] ?? 'CPU',
            'result' => $resultado,
            'date' => $row['date']
        ];
    }
    
    echo json_encode($history);
    exit;
}
?>