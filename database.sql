-- Create the database
CREATE DATABASE IF NOT EXISTS tictactoe_db;
USE tictactoe_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    last_login DATETIME
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('active', 'completed') NOT NULL,
    result ENUM('win', 'draw') NULL,
    winner CHAR(1) NULL,
    created_at DATETIME NOT NULL,
    completed_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Moves table
CREATE TABLE IF NOT EXISTS moves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player CHAR(1) NOT NULL,
    position INT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Index for performance
CREATE INDEX idx_user_id ON games (user_id);
CREATE INDEX idx_game_id ON moves (game_id);

