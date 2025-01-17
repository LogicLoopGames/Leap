class Game {
    constructor() {
        this.gridSize = 7;
        this.currentNumber = 1;
        this.currentPosition = null;
        this.grid = [];
        this.highScore = localStorage.getItem('highScore') || 0;
        this.normalRange = 3; // Normal range for straight moves
        this.currentRange = this.normalRange;
        this.powerCells = new Set(); // Track cells with powers
        this.initialize();
    }

    initialize() {
        this.startButton = document.getElementById('start-button');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverElement = document.getElementById('game-over');
        this.gridContainer = document.querySelector('.grid-container');
        
        this.startButton.addEventListener('click', () => this.startGame());
        this.createGrid();
        this.updateHighScore();
    }

    createGrid() {
        this.gridContainer.innerHTML = '';
        this.grid = [];

        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                this.gridContainer.appendChild(cell);
                this.grid[row][col] = {
                    element: cell,
                    value: null
                };
            }
        }
    }

    startGame() {
        this.currentNumber = 1;
        this.currentPosition = null;
        this.gameOverElement.classList.add('hidden');
        
        // Reset grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].value = null;
                this.grid[row][col].element.textContent = '';
                this.grid[row][col].element.className = 'cell';
            }
        }

        this.currentRange = this.normalRange;
        this.powerCells.clear();
        this.clearAllPowers();

        this.updateScore();
        this.clearValidMoves(); // Clear any existing highlights
    }

    handleCellClick(row, col) {
        if (this.grid[row][col].value !== null) return;

        if (this.currentPosition === null) {
            this.makeMove(row, col);
            return;
        }

        if (this.isValidMove(row, col)) {
            // Apply power-up/down if available
            if (this.hasPowerUp) {
                this.currentRange = this.normalRange + 1;
                this.hasPowerUp = false;
                this.powerUpElement.classList.add('hidden');
            } else if (this.hasPowerDown) {
                this.currentRange = this.normalRange - 1;
                this.hasPowerDown = false;
                this.powerDownElement.classList.add('hidden');
            } else {
                this.currentRange = this.normalRange;
            }

            this.makeMove(row, col);
        }
    }

    isValidMove(row, col) {
        const [currentRow, currentCol] = this.currentPosition;
        
        // Straight moves (horizontal and vertical)
        if (row === currentRow) {
            return Math.abs(col - currentCol) === this.currentRange;
        }
        if (col === currentCol) {
            return Math.abs(row - currentRow) === this.currentRange;
        }
        
        // Diagonal moves - directly use currentRange - 1
        // This makes diagonal moves always one cell less than straight moves
        const diagonalRange = this.currentRange - 1;
        if (Math.abs(row - currentRow) === diagonalRange && 
            Math.abs(col - currentCol) === diagonalRange) {
            return true;
        }

        return false;
    }

    makeMove(row, col) {
        // Check if the cell has a power before clearing it
        const power = this.grid[row][col].power;
        if (power) {
            this.currentRange = this.normalRange + power;
            this.powerCells.delete(`${row},${col}`);
        } else {
            this.currentRange = this.normalRange;
        }

        // Clear the cell's power visual
        this.grid[row][col].element.classList.remove('power-up', 'power-down');
        delete this.grid[row][col].power;

        // Existing makeMove code
        this.grid[row][col].value = this.currentNumber;
        this.grid[row][col].element.textContent = this.currentNumber;
        this.grid[row][col].element.classList.add('used');

        if (this.currentPosition) {
            const [prevRow, prevCol] = this.currentPosition;
            this.grid[prevRow][prevCol].element.classList.remove('current');
        }

        this.clearValidMoves();
        this.grid[row][col].element.classList.add('current');
        this.currentPosition = [row, col];
        this.currentNumber++;
        this.updateScore();

        // Add a new random power after the move
        this.addRandomPower();

        if (!this.hasValidMoves()) {
            this.gameOver();
        } else {
            this.showValidMoves();
        }
    }

    hasValidMoves() {
        if (!this.currentPosition) return false;
        
        const [currentRow, currentCol] = this.currentPosition;

        // Check all possible moves
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].value === null && this.isValidMove(row, col)) {
                    return true;
                }
            }
        }

        return false;
    }

    gameOver() {
        this.gameOverElement.classList.remove('hidden');
        if (this.currentNumber - 1 > this.highScore) {
            this.highScore = this.currentNumber - 1;
            localStorage.setItem('highScore', this.highScore);
            this.updateHighScore();
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.currentNumber - 1;
    }

    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }

    showValidMoves() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].value === null && this.isValidMove(row, col)) {
                    this.grid[row][col].element.classList.add('valid-move');
                }
            }
        }
    }

    clearValidMoves() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].element.classList.remove('valid-move');
            }
        }
    }

    clearAllPowers() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].element.classList.remove('power-up', 'power-down');
                delete this.grid[row][col].power;
            }
        }
    }

    addRandomPower() {
        if (Math.random() < 0.15) { // 15% chance to add power
            const emptyCells = [];
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (this.grid[row][col].value === null && !this.powerCells.has(`${row},${col}`)) {
                        emptyCells.push([row, col]);
                    }
                }
            }

            if (emptyCells.length > 0) {
                const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                const isPowerUp = Math.random() < 0.5;
                
                this.grid[row][col].power = isPowerUp ? 1 : -1;
                this.grid[row][col].element.classList.add(isPowerUp ? 'power-up' : 'power-down');
                this.powerCells.add(`${row},${col}`);
            }
        }
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    const game = new Game();
});