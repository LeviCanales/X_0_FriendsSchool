// Este archivo es un ejemplo de cómo sería el backend en una implementación real
// usando Node.js, Express y MySQL
// NOTA: Este archivo NO funcionará en el navegador, es solo de referencia

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
app.use(cors({
    origin: 'http://localhost:8080', // URL de tu frontend
    credentials: true
}));

app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Conexión a MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'tictactoe_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'No autorizado' });
    }
};

// RUTAS DE AUTENTICACIÓN

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validaciones básicas
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios' 
            });
        }

        // Validar email con expresión regular
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'El formato del email es inválido' 
            });
        }
        
        // Verificar si el usuario ya existe
        const [userExists] = await pool.query(
            'SELECT id FROM usuarios WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (userExists.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El usuario o email ya está registrado' 
            });
        }
        
        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar nuevo usuario
        const [result] = await pool.query(
            'INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        
        // Inicializar estadísticas del usuario
        await pool.query(
            'INSERT INTO user_stats (user_id, wins, losses, draws) VALUES (?, 0, 0, 0)',
            [result.insertId]
        );
        
        res.status(201).json({ success: true, message: 'Usuario registrado correctamente' });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Inicio de sesión
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Buscar usuario
        const [users] = await pool.query(
            'SELECT id, username, email, password FROM usuarios WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        const user = users[0];
        
        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Contraseña incorrecta' 
            });
        }
        
        // Guardar sesión
        req.session.userId = user.id;
        req.session.username = user.username;
        
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Cerrar sesión
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.json({ success: true });
    });
});

// Verificar sesión
app.get('/api/auth/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            success: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    } else {
        res.json({ success: false });
    }
});

// RUTAS DE JUEGO Y ESTADÍSTICAS

// Guardar partida
app.post('/api/games', isAuthenticated, async (req, res) => {
    try {
        const { opponent, result } = req.body;
        const userId = req.session.userId;
        
        // Determinar el resultado según la API
        let resultadoDB;
        if (result === 'win') {
            resultadoDB = 'jugador1';
        } else if (result === 'loss') {
            resultadoDB = 'jugador2';
        } else {
            resultadoDB = 'empate';
        }
        
        // Guardar partida
        await pool.query(
            'INSERT INTO partidas (id_jugador1, id_jugador2, resultado, fecha_partida) VALUES (?, ?, ?, NOW())',
            [userId, opponent === 'CPU' ? null : opponent, resultadoDB]
        );
        
        // Actualizar estadísticas
        if (result === 'win') {
            await pool.query(
                'UPDATE user_stats SET wins = wins + 1 WHERE user_id = ?',
                [userId]
            );
            // Incrementar partidas_ganadas
            await pool.query(
                'UPDATE usuarios SET partidas_ganadas = partidas_ganadas + 1 WHERE id = ?',
                [userId]
            );
        } else if (result === 'loss') {
            await pool.query(
                'UPDATE user_stats SET losses = losses + 1 WHERE user_id = ?',
                [userId]
            );
        } else {
            await pool.query(
                'UPDATE user_stats SET draws = draws + 1 WHERE user_id = ?',
                [userId]
            );
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error al guardar partida:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Obtener estadísticas del usuario
app.get('/api/users/:userId/stats', isAuthenticated, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verificar que el usuario solicitado es el autenticado
        if (parseInt(userId) !== req.session.userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'No autorizado para ver estadísticas de otro usuario' 
            });
        }
        
        const [stats] = await pool.query(
            'SELECT wins, losses, draws FROM user_stats WHERE user_id = ?',
            [userId]
        );
        
        if (stats.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Estadísticas no encontradas' 
            });
        }
        
        res.json(stats[0]);
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Obtener ranking de jugadores
app.get('/api/leaderboard', async (req, res) => {
    try {
        const [leaderboard] = await pool.query(`
            SELECT 
                u.id, 
                u.username, 
                u.partidas_ganadas,
                s.wins, 
                s.losses, 
                s.draws,
                (s.wins + s.losses + s.draws) as total_games,
                ROUND((s.wins / (s.wins + s.losses + s.draws)) * 100, 0) as win_rate
            FROM 
                usuarios u
            LEFT JOIN 
                user_stats s ON u.id = s.user_id
            ORDER BY 
                u.partidas_ganadas DESC, 
                win_rate DESC
            LIMIT 20
        `);
        
        res.json(leaderboard.map(player => ({
            id: player.id,
            username: player.username,
            partidas_ganadas: player.partidas_ganadas,
            wins: player.wins || 0,
            totalGames: player.total_games || 0,
            winRate: player.win_rate || 0
        })));
        
    } catch (error) {
        console.error('Error al obtener ranking:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Obtener historial de partidas
app.get('/api/users/:userId/games', isAuthenticated, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verificar que el usuario solicitado es el autenticado
        if (parseInt(userId) !== req.session.userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'No autorizado para ver historial de otro usuario' 
            });
        }
        
        const [games] = await pool.query(`
            SELECT 
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
            LIMIT 10
        `, [userId]);
        
        // Transformar resultados
        const history = games.map(game => ({
            id: game.id,
            opponent: game.opponent,
            result: game.result === 'jugador1' ? 'win' : game.result === 'jugador2' ? 'loss' : 'draw',
            date: game.date
        }));
        
        res.json(history);
        
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Función auxiliar para traducir resultados
function translateResult(result) {
    if (result === 'win') return 'Victoria';
    if (result === 'loss') return 'Derrota';
    return 'Empate';
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});