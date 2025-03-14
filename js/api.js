// API para interactuar con el backend PHP
export const api = {
    // Autenticación
    async login(username, password) {
        try {
            const formData = new FormData();
            formData.append('action', 'login');
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch('php/auth.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión al servidor' };
        }
    },
    
    async register(username, email, password) {
        try {
            const formData = new FormData();
            formData.append('action', 'register');
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            
            const response = await fetch('php/auth.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, message: 'Error de conexión al servidor' };
        }
    },
    
    async logout() {
        try {
            const formData = new FormData();
            formData.append('action', 'logout');
            
            const response = await fetch('php/auth.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error en logout:', error);
            return { success: false, message: 'Error de conexión al servidor' };
        }
    },
    
    async checkSession() {
        try {
            const response = await fetch('php/auth.php?action=check-session', {
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            return { success: false };
        }
    },
    
    // Juegos y estadísticas
    async saveGame(userId, opponent, result) {
        try {
            const formData = new FormData();
            formData.append('action', 'save-game');
            formData.append('opponent', opponent);
            formData.append('result', result);
            
            const response = await fetch('php/game.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al guardar partida:', error);
            return { success: false };
        }
    },
    
    async getUserStats(userId) {
        try {
            const response = await fetch(`php/game.php?action=user-stats`, {
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return { wins: 0, losses: 0, draws: 0 };
        }
    },
    
    async getLeaderboard() {
        try {
            const response = await fetch(`php/game.php?action=leaderboard`, {
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al obtener ranking:', error);
            return [];
        }
    },
    
    async getGameHistory(userId) {
        try {
            const response = await fetch(`php/game.php?action=game-history`, {
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error al obtener historial:', error);
            return [];
        }
    }
};