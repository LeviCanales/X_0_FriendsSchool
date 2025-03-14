-- Este archivo contiene el esquema de la base de datos MySQL
-- NOTA: Este archivo es solo para referencia

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS tictactoe_db;
USE tictactoe_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    partidas_ganadas INT NOT NULL DEFAULT 0
);

-- Tabla de estadísticas de usuario (opcional, para datos detallados)
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES usuarios(id)
);

-- Tabla de partidas
CREATE TABLE IF NOT EXISTS partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_jugador1 INT NOT NULL,
    id_jugador2 INT,
    fecha_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado ENUM('jugador1', 'jugador2', 'empate') NOT NULL,
    FOREIGN KEY (id_jugador1) REFERENCES usuarios(id),
    FOREIGN KEY (id_jugador2) REFERENCES usuarios(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_partidas_jugador1 ON partidas(id_jugador1);
CREATE INDEX idx_partidas_jugador2 ON partidas(id_jugador2);
CREATE INDEX idx_partidas_fecha ON partidas(fecha_partida);

