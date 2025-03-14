import { createApp } from 'vue';
import { api } from './api.js';
import { gameUtils } from './gameUtils.js';

const app = createApp({
    data() {
        return {
            isAuthenticated: false,
            authTab: 'login',
            loginForm: {
                username: '',
                password: ''
            },
            registerForm: {
                username: '',
                email: '',
                password: '',
                passwordConfirm: ''
            },
            loginError: '',
            registerError: '',
            user: null,
            currentView: 'game',
            
            // Datos del juego
            board: Array(9).fill(''),
            currentPlayer: 'X',
            playerX: '',
            playerO: 'CPU',
            gameStatus: 'Tu turno',
            winningCells: [],
            gameFinished: false,
            
            // Estadísticas
            userStats: {
                wins: 0,
                losses: 0,
                draws: 0
            },
            leaderboard: [],
            gameHistory: []
        };
    },
    
    mounted() {
        // Comprobar si hay una sesión guardada
        this.checkSession();
    },
    
    methods: {
        // Métodos de autenticación
        async checkSession() {
            try {
                const response = await api.checkSession();
                if (response.success) {
                    this.user = response.user;
                    this.isAuthenticated = true;
                    this.playerX = this.user.username;
                    this.loadUserStats();
                    this.loadLeaderboard();
                    this.loadGameHistory();
                }
            } catch (error) {
                console.error('Error al verificar sesión:', error);
            }
        },
        
        async login() {
            this.loginError = '';
            if (!this.loginForm.username || !this.loginForm.password) {
                this.loginError = 'Por favor completa todos los campos';
                return;
            }
            
            try {
                const response = await api.login(this.loginForm.username, this.loginForm.password);
                if (response.success) {
                    this.user = response.user;
                    this.isAuthenticated = true;
                    this.playerX = this.user.username;
                    this.loadUserStats();
                    this.loadLeaderboard();
                    this.loadGameHistory();
                } else {
                    this.loginError = response.message || 'Error al iniciar sesión';
                }
            } catch (error) {
                this.loginError = 'Error de conexión al servidor';
                console.error('Error al iniciar sesión:', error);
            }
        },
        
        async register() {
            this.registerError = '';
            
            // Validaciones básicas
            if (!this.registerForm.username || !this.registerForm.email || 
                !this.registerForm.password || !this.registerForm.passwordConfirm) {
                this.registerError = 'Por favor completa todos los campos';
                return;
            }
            
            if (this.registerForm.password !== this.registerForm.passwordConfirm) {
                this.registerError = 'Las contraseñas no coinciden';
                return;
            }
            
            if (this.registerForm.username.length < 3) {
                this.registerError = 'El nombre de usuario debe tener al menos 3 caracteres';
                return;
            }
            
            if (this.registerForm.password.length < 6) {
                this.registerError = 'La contraseña debe tener al menos 6 caracteres';
                return;
            }
            
            try {
                const response = await api.register(
                    this.registerForm.username,
                    this.registerForm.email,
                    this.registerForm.password
                );
                
                if (response.success) {
                    this.authTab = 'login';
                    this.loginForm.username = this.registerForm.username;
                    this.loginForm.password = '';
                    
                    // Limpiar formulario de registro
                    this.registerForm = {
                        username: '',
                        email: '',
                        password: '',
                        passwordConfirm: ''
                    };
                    
                    // Mostrar mensaje de éxito como error (para reutilizar el estilo)
                    this.loginError = 'Registro exitoso. Por favor inicia sesión.';
                } else {
                    this.registerError = response.message || 'Error al registrar usuario';
                }
            } catch (error) {
                this.registerError = 'Error de conexión al servidor';
                console.error('Error al registrar usuario:', error);
            }
        },
        
        async logout() {
            try {
                await api.logout();
                this.isAuthenticated = false;
                this.user = null;
                this.resetGame();
                this.authTab = 'login';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            }
        },
        
        // Métodos del juego
        makeMove(index) {
            // No permite hacer movimientos si el juego ha terminado o la celda ya está ocupada
            if (this.gameFinished || this.board[index] !== '') {
                return;
            }
            
            // Realizar movimiento del jugador
            this.board[index] = this.currentPlayer;
            
            // Verificar si hay un ganador o empate
            const result = gameUtils.checkGameResult(this.board);
            
            if (result.winner) {
                this.winningCells = result.winningCells;
                this.gameFinished = true;
                
                if (result.winner === 'X') {
                    this.gameStatus = '¡Has ganado!';
                    this.saveGameResult('win');
                } else {
                    this.gameStatus = '¡Has perdido!';
                    this.saveGameResult('loss');
                }
                
                return;
            }
            
            if (result.draw) {
                this.gameFinished = true;
                this.gameStatus = 'Empate';
                this.saveGameResult('draw');
                return;
            }
            
            // Cambiar de jugador
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.gameStatus = this.currentPlayer === 'X' ? 'Tu turno' : 'Turno de CPU';
            
            // Si es turno del CPU, hacer su movimiento
            if (this.currentPlayer === 'O') {
                setTimeout(() => {
                    this.makeCPUMove();
                }, 700);
            }
        },
        
        makeCPUMove() {
            if (this.gameFinished) return;
            
            // En una implementación real, podrías tener un algoritmo más inteligente
            const availableCells = this.board.map((cell, index) => cell === '' ? index : null)
                                            .filter(index => index !== null);
            
            if (availableCells.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableCells.length);
                const selectedCell = availableCells[randomIndex];
                this.makeMove(selectedCell);
            }
        },
        
        resetGame() {
            this.board = Array(9).fill('');
            this.currentPlayer = 'X';
            this.gameStatus = 'Tu turno';
            this.winningCells = [];
            this.gameFinished = false;
        },
        
        async saveGameResult(result) {
            if (!this.isAuthenticated) return;
            
            try {
                await api.saveGame(this.user.id, this.playerO, result);
                this.loadUserStats();
                this.loadLeaderboard();
                this.loadGameHistory();
            } catch (error) {
                console.error('Error al guardar resultado del juego:', error);
            }
        },
        
        // Métodos de estadísticas
        async loadUserStats() {
            if (!this.isAuthenticated) return;
            
            try {
                const stats = await api.getUserStats(this.user.id);
                this.userStats = stats;
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            }
        },
        
        async loadLeaderboard() {
            try {
                const leaderboard = await api.getLeaderboard();
                this.leaderboard = leaderboard;
            } catch (error) {
                console.error('Error al cargar ranking:', error);
            }
        },
        
        async loadGameHistory() {
            if (!this.isAuthenticated) return;
            
            try {
                const history = await api.getGameHistory(this.user.id);
                this.gameHistory = history.map(game => ({
                    ...game,
                    date: new Date(game.date)
                }));
            } catch (error) {
                console.error('Error al cargar historial:', error);
            }
        },
        
        // Utilidades
        formatDate(date) {
            return new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        },
        
        getResultClass(result) {
            if (result === 'Victoria') return 'victory';
            if (result === 'Derrota') return 'defeat';
            return 'draw';
        }
    }
});

app.mount('#app');

