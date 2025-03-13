document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authContainer = document.getElementById('auth-container');
    const gameContainer = document.getElementById('game-container');
    const statsContainer = document.getElementById('stats-container');
    const userStatus = document.getElementById('user-status');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const cells = document.querySelectorAll('.cell');
    const statusMessage = document.getElementById('status-message');
    const newGameBtn = document.getElementById('new-game-btn');
    const viewStatsBtn = document.getElementById('view-stats-btn');
    const backToGameBtn = document.getElementById('back-to-game-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Game state
    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let currentUser = null;
    let currentGameId = null;
    let moves = [];

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const targetForm = button.getAttribute('data-target');
            document.getElementById('login-form').style.display = targetForm === 'login-form' ? 'flex' : 'none';
            document.getElementById('register-form').style.display = targetForm === 'register-form' ? 'flex' : 'none';
        });
    });

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = loginForm.querySelector('.error-message');
        
        try {
            const response = await fetch('server/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = {
                    id: data.userId,
                    username: data.username
                };
                errorMsg.textContent = '';
                showGameBoard();
            } else {
                errorMsg.textContent = data.message || 'Login failed. Please try again.';
            }
        } catch (error) {
            errorMsg.textContent = 'An error occurred. Please try again.';
            console.error('Login error:', error);
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-password-confirm').value;
        const errorMsg = registerForm.querySelector('.error-message');
        
        if (password !== confirmPassword) {
            errorMsg.textContent = 'Passwords do not match';
            return;
        }
        
        try {
            const response = await fetch('server/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Switch to login tab
                tabButtons.forEach(btn => {
                    if (btn.getAttribute('data-target') === 'login-form') {
                        btn.click();
                    }
                });
                document.getElementById('login-username').value = username;
                errorMsg.textContent = '';
                loginForm.querySelector('.error-message').textContent = 'Registration successful! You can now log in.';
            } else {
                errorMsg.textContent = data.message || 'Registration failed. Please try again.';
            }
        } catch (error) {
            errorMsg.textContent = 'An error occurred. Please try again.';
            console.error('Registration error:', error);
        }
    });

    // Game board cell click
    cells.forEach(cell => {
        cell.addEventListener('click', async () => {
            const index = cell.getAttribute('data-index');
            
            if (gameBoard[index] !== '' || !gameActive) return;
            
            // Update game board and UI
            gameBoard[index] = currentPlayer;
            cell.textContent = currentPlayer;
            cell.classList.add(currentPlayer.toLowerCase());
            
            // Record the move
            const moveData = {
                player: currentPlayer,
                position: parseInt(index),
                gameId: currentGameId
            };
            moves.push(moveData);
            
            // Save move to server
            try {
                await fetch('server/record_move.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(moveData)
                });
            } catch (error) {
                console.error('Error recording move:', error);
            }
            
            // Check for win or draw
            if (checkWin()) {
                statusMessage.textContent = `Player ${currentPlayer} wins!`;
                gameActive = false;
                await endGame('win');
            } else if (checkDraw()) {
                statusMessage.textContent = 'Game ends in a draw!';
                gameActive = false;
                await endGame('draw');
            } else {
                // Switch player
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                statusMessage.textContent = `Player ${currentPlayer}'s turn`;
            }
        });
    });

    // New game button
    newGameBtn.addEventListener('click', () => {
        resetGame();
    });

    // View stats button
    viewStatsBtn.addEventListener('click', async () => {
        await loadStats();
        gameContainer.style.display = 'none';
        statsContainer.style.display = 'block';
    });

    // Back to game button
    backToGameBtn.addEventListener('click', () => {
        statsContainer.style.display = 'none';
        gameContainer.style.display = 'block';
    });

    // Logout button
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('server/logout.php');
            currentUser = null;
            gameContainer.style.display = 'none';
            statsContainer.style.display = 'none';
            authContainer.style.display = 'block';
            resetGame();
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    // Helper functions
    function showGameBoard() {
        authContainer.style.display = 'none';
        gameContainer.style.display = 'block';
        userStatus.innerHTML = `
            <div>Logged in as: <strong>${currentUser.username}</strong></div>
        `;
        resetGame();
    }

    async function resetGame() {
        // Reset game state
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = 'X';
        moves = [];
        
        // Reset UI
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        });
        statusMessage.textContent = `Player ${currentPlayer}'s turn`;
        
        // Create new game in database
        try {
            const response = await fetch('server/create_game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: currentUser.id })
            });
            
            const data = await response.json();
            if (data.success) {
                currentGameId = data.gameId;
            }
        } catch (error) {
            console.error('Error creating game:', error);
        }
    }

    function checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        return winPatterns.some(pattern => {
            return pattern.every(index => {
                return gameBoard[index] === currentPlayer;
            });
        });
    }

    function checkDraw() {
        return !gameBoard.includes('');
    }

    async function endGame(result) {
        try {
            await fetch('server/end_game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameId: currentGameId,
                    result: result,
                    winner: result === 'win' ? currentPlayer : null
                })
            });
        } catch (error) {
            console.error('Error ending game:', error);
        }
    }

    async function loadStats() {
        try {
            const response = await fetch(`server/get_stats.php?userId=${currentUser.id}`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('games-played').textContent = data.stats.total;
                document.getElementById('games-won').textContent = data.stats.wins;
                document.getElementById('games-lost').textContent = data.stats.losses;
                document.getElementById('games-draw').textContent = data.stats.draws;
                
                // Update recent games table
                const tableBody = document.querySelector('#recent-games-table tbody');
                tableBody.innerHTML = '';
                
                data.recentGames.forEach(game => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDate(game.date)}</td>
                        <td>${game.opponent || 'Computer'}</td>
                        <td>${formatResult(game.result, game.winner)}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    function formatResult(result, winner) {
        if (result === 'win' && winner === currentUser.id) return 'Won';
        if (result === 'win' && winner !== currentUser.id) return 'Lost';
        return 'Draw';
    }

    // Check if user is already logged in
    async function checkSession() {
        try {
            const response = await fetch('server/check_session.php');
            const data = await response.json();
            
            if (data.logged_in) {
                currentUser = {
                    id: data.userId,
                    username: data.username
                };
                showGameBoard();
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    }
    
    // Initialize the app
    checkSession();
});

