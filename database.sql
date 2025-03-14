-- Este archivo contiene el esquema de la base de datos MySQL
-- NOTA: Este archivo es solo para referencia

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS tictactoe_db;
USE tictactoe_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de estadísticas de usuario
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de partidas
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    opponent VARCHAR(50) NOT NULL,
    result ENUM('win', 'loss', 'draw') NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_date ON games(date);

