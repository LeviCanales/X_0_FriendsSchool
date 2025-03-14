// Simulación de API para interactuar con el backend
// En una aplicación real, estas funciones realizarían solicitudes HTTP al servidor

export const api = {
    // Autenticación
    async login(username, password) {
        // Simular validación con localStorage
        const users = JSON.parse(localStorage.getItem('tictactoe_users') || '[]');
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        // En una implementación real, la verificación de contraseña se haría en el servidor
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Contraseña incorrecta' };
        }
        
        // Simular sesión con localStorage
        localStorage.setItem('tictactoe_session', JSON.stringify({
            userId: user.id,
            username: user.username,
            email: user.email
        }));
        
        return { 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        };
    },
    
    async register(username, email, password) {
        // Validaciones básicas
        if (!username || !email || !password) {
            return { success: false, message: 'Todos los campos son obligatorios' };
        }
        
        if (username.length < 3) {
            return { success: false, message: 'El nombre de usuario debe tener al menos 3 caracteres' };
        }
        
        if (password.length < 6) {
            return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
        }
        
        // Verificar formato de email con una expresión regular básica
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, message: 'El formato del email es inválido' };
        }
        
        // Obtener usuarios existentes
        const users = JSON.parse(localStorage.getItem('tictactoe_users') || '[]');
        
        // Verificar si el usuario ya existe
        if (users.some(u => u.username === username)) {
            return { success: false, message: 'El nombre de usuario ya está en uso' };
        }
        
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'El email ya está registrado' };
        }
        
        // Crear nuevo usuario
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: this.hashPassword(password),
            created_at: new Date().toISOString(),
            partidas_ganadas: 0
        };
        
        // Guardar en localStorage
        users.push(newUser);
        localStorage.setItem('tictactoe_users', JSON.stringify(users));
        
        // Inicializar estadísticas del usuario
        const stats = JSON.parse(localStorage.getItem('tictactoe_stats') || '{}');
        stats[newUser.id] = {
            wins: 0,
            losses: 0,
            draws: 0,
            total_games: 0
        };
        localStorage.setItem('tictactoe_stats', JSON.stringify(stats));
        
        return { success: true };
    },
    
    async logout() {
        localStorage.removeItem('tictactoe_session');
        return { success: true };
    },
    
    async checkSession() {
        const session = localStorage.getItem('tictactoe_session');
        if (!session) {
            return { success: false };
        }
        
        const sessionData = JSON.parse(session);
        return { 
            success: true, 
            user: {
                id: sessionData.userId,
                username: sessionData.username,
                email: sessionData.email
            }
        };
    },
    
    // Juegos y estadísticas
    async saveGame(userId, opponent, result) {
        // Guardar registro de partida
        const games = JSON.parse(localStorage.getItem('tictactoe_games') || '[]');
        const newGame = {
            id: Date.now().toString(),
            id_jugador1: userId,
            id_jugador2: opponent === 'CPU' ? 'CPU' : opponent,
            result,
            date: new Date().toISOString()
        };
        games.push(newGame);
        localStorage.setItem('tictactoe_games', JSON.stringify(games));
        
        // Actualizar estadísticas y contador de partidas ganadas
        const stats = JSON.parse(localStorage.getItem('tictactoe_stats') || '{}');
        if (!stats[userId]) {
            stats[userId] = {
                wins: 0,
                losses: 0,
                draws: 0,
                total_games: 0
            };
        }
        
        stats[userId].total_games++;
        
        if (result === 'win') {
            stats[userId].wins++;
            
            // Actualizar partidas_ganadas en el perfil del usuario
            const users = JSON.parse(localStorage.getItem('tictactoe_users') || '[]');
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].partidas_ganadas = (users[userIndex].partidas_ganadas || 0) + 1;
                localStorage.setItem('tictactoe_users', JSON.stringify(users));
            }
        } else if (result === 'loss') {
            stats[userId].losses++;
        } else {
            stats[userId].draws++;
        }
        
        localStorage.setItem('tictactoe_stats', JSON.stringify(stats));
        
        return { success: true };
    },
    
    async getUserStats(userId) {
        const stats = JSON.parse(localStorage.getItem('tictactoe_stats') || '{}');
        const userStats = stats[userId] || {
            wins: 0,
            losses: 0,
            draws: 0,
            total_games: 0
        };
        
        return {
            wins: userStats.wins,
            losses: userStats.losses,
            draws: userStats.draws
        };
    },
    
    async getLeaderboard() {
        const stats = JSON.parse(localStorage.getItem('tictactoe_stats') || '{}');
        const users = JSON.parse(localStorage.getItem('tictactoe_users') || '[]');
        
        // Combinar datos de usuarios y estadísticas
        const leaderboardData = users.map(user => {
            const userStats = stats[user.id] || { 
                wins: 0, 
                losses: 0, 
                draws: 0, 
                total_games: 0 
            };
            
            const totalGames = userStats.total_games;
            const winRate = totalGames > 0 
                ? Math.round((userStats.wins / totalGames) * 100) 
                : 0;
            
            return {
                id: user.id,
                username: user.username,
                wins: userStats.wins,
                losses: userStats.losses,
                draws: userStats.draws,
                partidas_ganadas: user.partidas_ganadas || 0,
                totalGames,
                winRate
            };
        });
        
        // Ordenar por victorias (descendente)
        return leaderboardData.sort((a, b) => b.partidas_ganadas - a.partidas_ganadas);
    },
    
    async getGameHistory(userId) {
        const games = JSON.parse(localStorage.getItem('tictactoe_games') || '[]');
        
        // Filtrar partidas del usuario y transformar datos
        return games
            .filter(game => game.id_jugador1 === userId)
            .map(game => ({
                id: game.id,
                opponent: game.id_jugador2,
                result: this.translateResult(game.result),
                date: game.date
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10); // Mostrar solo las últimas 10 partidas
    },
    
    // Utilidades
    hashPassword(password) {
        // Esta es una simulación de hash, NO usar en producción
        // En una aplicación real, se usaría bcrypt u otro algoritmo seguro en el servidor
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    },
    
    translateResult(result) {
        if (result === 'win') return 'Victoria';
        if (result === 'loss') return 'Derrota';
        return 'Empate';
    }
};