// Utilidades para la lógica del juego
export const gameUtils = {
    // Comprueba el resultado del juego: ganador, empate o juego en curso
    checkGameResult(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
            [0, 4, 8], [2, 4, 6]             // diagonales
        ];
        
        // Verificar si hay un ganador
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return {
                    winner: board[a],
                    winningCells: pattern
                };
            }
        }
        
        // Verificar si hay empate (tablero lleno)
        const isDraw = board.every(cell => cell !== '');
        
        return {
            winner: null,
            winningCells: [],
            draw: isDraw
        };
    }
};

