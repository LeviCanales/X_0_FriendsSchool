<?php
session_start();
require_once 'db_connect.php';

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'logged_in' => true,
        'userId' => $_SESSION['user_id'],
        'username' => $_SESSION['username']
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
?>

