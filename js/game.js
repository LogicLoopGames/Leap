class Game {
    constructor() {
        this.gridSize = 7;
        this.currentNumber = 1;
        this.currentPosition = null;
        this.grid = [];
        this.highScore = localStorage.getItem('highScore') || 0;
        this.normalRange = 3;
        this.currentRange = this.normalRange;
        this.powerCells = new Set();
        this.powerTypes = {
            RANGE_UP: {
                type: 'power-up',
                effect: 1,
                probability: 0.25,
                displayDuration: 10000 // 10 seconds display time
            },
            RANGE_DOWN: {
                type: 'power-down',
                effect: -1,
                probability: 0.25,
                displayDuration: 10000
            },
            DOUBLE_SCORE: {
                type: 'double-score',
                effect: 2,
                probability: 0.2,
                duration: 5000, // 5 seconds effect duration
                displayDuration: 10000
            },
            TRIPLE_SCORE: {
                type: 'triple-score',
                effect: 3,
                probability: 0.15,
                duration: 5000,
                displayDuration: 10000
            },
            TELEPORT: {
                type: 'teleport',
                effect: 'teleport',
                probability: 0.15,
                displayDuration: 10000
            }
        };
        this.scoreMultiplier = 1;
        this.multiplierTimeout = null;
        this.teleportActive = false;
        this.teleportOrigin = null;
        this.activeMultiplierCell = null;
        this.powerTimeouts = new Map(); // Track timeouts for power cells
        this.teleportUsed = false;
        this.activeMultipliers = new Set(); // Track active multipliers
        this.clearingAnimation = false;
        this.clearAnimationDuration = 500; // 500ms for clear animation
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

        // Reset all power-related states
        this.currentRange = this.normalRange;
        this.powerCells.clear();
        this.clearAllPowers();
        this.scoreMultiplier = 1;
        this.activeMultipliers.clear();
        if (this.multiplierTimeout) {
            clearTimeout(this.multiplierTimeout);
            this.multiplierTimeout = null;
        }
        this.activeMultiplierCell = null;

        // Clear all power timeouts
        this.powerTimeouts.forEach(timeout => clearTimeout(timeout));
        this.powerTimeouts.clear();

        this.updateScore();
        this.updateMultiplierDisplay();
        this.teleportActive = false;
        this.teleportOrigin = null;
    }

    handleCellClick(row, col) {
        if (this.grid[row][col].value !== null) return;

        // If teleport is active, handle the teleport destination
        if (this.teleportActive && this.teleportOrigin) {
            if (row === this.teleportOrigin[0] && col === this.teleportOrigin[1]) {
                return; // Can't teleport to the teleport cell itself
            }
            this.makeMove(row, col);
            this.teleportActive = false;
            this.teleportOrigin = null;
            this.clearTeleportHighlight();
            return;
        }

        if (this.currentPosition === null) {
            this.makeMove(row, col);
            return;
        }

        if (this.isValidMove(row, col)) {
            const power = this.grid[row][col].power;
            if (power && power.type === 'teleport') {
                this.handleTeleport(row, col);
            } else {
                this.makeMove(row, col);
            }
        }
    }

    handleTeleport(row, col) {
        // Store the teleport origin and activate teleport mode
        this.teleportOrigin = [row, col];
        this.teleportActive = true;

        // Highlight all empty cells as valid moves
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c].value === null && 
                    !(r === row && c === col)) {
                    this.grid[r][c].element.classList.add('valid-move', 'teleport-target');
                }
            }
        }
    }

    clearTeleportHighlight() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].element.classList.remove('teleport-target');
            }
        }
    }

    isValidMove(row, col) {
        if (this.teleportActive && this.teleportOrigin) {
            // During teleport, any empty cell is valid except the teleport cell itself
            return this.grid[row][col].value === null && 
                   !(row === this.teleportOrigin[0] && col === this.teleportOrigin[1]);
        }

        const [currentRow, currentCol] = this.currentPosition;
        
        // Straight moves
        if (row === currentRow) {
            return Math.abs(col - currentCol) === this.currentRange;
        }
        if (col === currentCol) {
            return Math.abs(row - currentRow) === this.currentRange;
        }
        
        // Diagonal moves
        const diagonalRange = this.currentRange - 1;
        if (Math.abs(row - currentRow) === diagonalRange && 
            Math.abs(col - currentCol) === diagonalRange) {
            return true;
        }

        return false;
    }

    makeMove(row, col) {
        // If this is a teleport move, clear the origin cell's power
        if (this.teleportActive && this.teleportOrigin) {
            const [originRow, originCol] = this.teleportOrigin;
            this.clearPowerFromCell(originRow, originCol);
        }

        // Check if the cell has a power before clearing it
        const power = this.grid[row][col].power;
        if (power) {
            this.clearPowerFromCell(row, col);
            
            switch (power.type) {
                case 'power-up':
                case 'power-down':
                    this.currentRange = this.normalRange + power.effect;
                    break;
                case 'double-score':
                case 'triple-score':
                    // Calculate new multiplier by multiplying with current multiplier
                    const newMultiplier = this.scoreMultiplier * power.effect;
                    this.scoreMultiplier = newMultiplier;

                    // Add visual indicator
                    this.activeMultiplierCell = this.grid[row][col].element;
                    this.activeMultiplierCell.classList.add('multiplier-active');
                    
                    // Clear existing timeout if any
                    if (this.multiplierTimeout) {
                        clearTimeout(this.multiplierTimeout);
                    }
                    
                    // Set timeout to reset multiplier
                    this.multiplierTimeout = setTimeout(() => {
                        // Reset to 1 when timer expires
                        this.scoreMultiplier = 1;
                        this.activeMultiplierCell.classList.remove('multiplier-active');
                        this.activeMultiplierCell = null;
                        this.updateMultiplierDisplay();
                    }, power.duration);
                    break;
                case 'teleport':
                    // Reset teleport flag when picking up a new teleport power-up
                    this.teleportUsed = false;
                    break;
            }
            this.updateMultiplierDisplay();
        } else {
            this.currentRange = this.normalRange;
        }

        // Clear the cell's power visual
        this.grid[row][col].element.classList.remove(
            'power-up', 'power-down', 'double-score', 'triple-score', 'teleport'
        );
        delete this.grid[row][col].power;

        // Place number and update score
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
        
        // Apply score multiplier
        this.currentNumber += this.scoreMultiplier;

        this.updateScore();
        this.addRandomPower();

        this.checkAndClearLines();

        if (!this.hasValidMoves()) {
            this.gameOver();
        } else {
            this.showValidMoves();
        }
    }

    hasValidMoves() {
        if (!this.currentPosition) return false;
        
        const [currentRow, currentCol] = this.currentPosition;

        // First check if there's a teleport power-up that can be used
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell.value === null && this.isValidMove(row, col)) {
                    // If this is a reachable cell with teleport power
                    if (cell.power && cell.power.type === 'teleport' && !this.teleportUsed) {
                        // Check if there are any empty cells to teleport to
                        for (let r = 0; r < this.gridSize; r++) {
                            for (let c = 0; c < this.gridSize; c++) {
                                if (this.grid[r][c].value === null && 
                                    !(r === row && c === col)) {
                                    return true; // Found a valid teleport destination
                                }
                            }
                        }
                    }
                    // If this is a reachable cell with range modifier
                    if (cell.power && (cell.power.type === 'power-up' || cell.power.type === 'power-down')) {
                        // Check moves with modified range
                        const modifiedRange = this.normalRange + cell.power.effect;
                        for (let r = 0; r < this.gridSize; r++) {
                            for (let c = 0; c < this.gridSize; c++) {
                                if (this.grid[r][c].value === null) {
                                    // Check if move would be valid with modified range
                                    if (this.isValidMoveWithRange(r, c, row, col, modifiedRange)) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    // If this is just a normal reachable empty cell
                    return true;
                }
            }
        }

        return false;
    }

    // Helper method to check move validity with a specific range
    isValidMoveWithRange(targetRow, targetCol, fromRow, fromCol, range) {
        // Straight moves
        if (targetRow === fromRow) {
            return Math.abs(targetCol - fromCol) === range;
        }
        if (targetCol === fromCol) {
            return Math.abs(targetRow - fromRow) === range;
        }
        
        // Diagonal moves
        const diagonalRange = range - 1;
        return Math.abs(targetRow - fromRow) === diagonalRange && 
               Math.abs(targetCol - fromCol) === diagonalRange;
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
        this.updateMultiplierDisplay();
    }

    updateMultiplierDisplay() {
        // Update score text to show active multiplier
        const scoreValue = this.currentNumber - 1;
        const scoreText = this.scoreMultiplier > 1 
            ? `${scoreValue} (${this.scoreMultiplier}x)`
            : `${scoreValue}`;
        this.scoreElement.textContent = scoreText;
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
                this.clearPowerFromCell(row, col);
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
                
                // Choose power type based on probabilities
                const rand = Math.random();
                let cumProb = 0;
                let chosenPower = null;

                for (const power of Object.values(this.powerTypes)) {
                    cumProb += power.probability;
                    if (rand < cumProb && !chosenPower) {
                        chosenPower = power;
                    }
                }

                const key = `${row},${col}`;
                this.grid[row][col].power = chosenPower;
                this.grid[row][col].element.classList.add(chosenPower.type, 'power-active');
                this.powerCells.add(key);

                // Set timeout to remove power after 10 seconds
                const timeout = setTimeout(() => {
                    if (this.powerCells.has(key)) {
                        this.clearPowerFromCell(row, col);
                    }
                }, chosenPower.displayDuration); // Use displayDuration instead of hardcoded value

                this.powerTimeouts.set(key, timeout);
            }
        }
    }

    clearPowerFromCell(row, col) {
        const key = `${row},${col}`;
        this.powerCells.delete(key);
        if (this.powerTimeouts.has(key)) {
            clearTimeout(this.powerTimeouts.get(key));
            this.powerTimeouts.delete(key);
        }
        
        const cell = this.grid[row][col];
        cell.element.classList.remove(
            'power-up', 'power-down', 'double-score', 'triple-score', 'teleport',
            'power-active' // New class for timing animation
        );
        delete cell.power;
    }

    checkAndClearLines() {
        const linesToClear = this.findLinesToClear();
        if (linesToClear.length > 0) {
            this.clearingAnimation = true;
            this.animateLineClear(linesToClear, () => {
                this.clearLines(linesToClear);
                this.clearingAnimation = false;
                this.showValidMoves();
            });
        }
    }

    findLinesToClear() {
        const lines = [];

        // Check rows
        for (let row = 0; row < this.gridSize; row++) {
            let rowFull = true;
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col].value === null) {
                    rowFull = false;
                    break;
                }
            }
            if (rowFull) {
                lines.push({ type: 'row', index: row });
            }
        }

        // Check columns
        for (let col = 0; col < this.gridSize; col++) {
            let colFull = true;
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col].value === null) {
                    colFull = false;
                    break;
                }
            }
            if (colFull) {
                lines.push({ type: 'col', index: col });
            }
        }

        return lines;
    }

    animateLineClear(lines, callback) {
        // Add flash animation to cells that will be cleared
        lines.forEach(line => {
            const cells = this.getCellsInLine(line);
            cells.forEach(cell => {
                cell.element.classList.add('clear-animation');
            });
        });

        // Wait for animation to complete
        setTimeout(() => {
            lines.forEach(line => {
                const cells = this.getCellsInLine(line);
                cells.forEach(cell => {
                    cell.element.classList.remove('clear-animation');
                });
            });
            callback();
        }, this.clearAnimationDuration);
    }

    getCellsInLine(line) {
        const cells = [];
        if (line.type === 'row') {
            for (let col = 0; col < this.gridSize; col++) {
                cells.push(this.grid[line.index][col]);
            }
        } else {
            for (let row = 0; row < this.gridSize; row++) {
                cells.push(this.grid[row][line.index]);
            }
        }
        return cells;
    }

    clearLines(lines) {
        lines.forEach(line => {
            const cells = this.getCellsInLine(line);
            cells.forEach(cell => {
                cell.value = null;
                cell.element.textContent = '';
                cell.element.className = 'cell';
                delete cell.power;
            });
        });

        // Add bonus points for clearing lines
        const clearedLines = lines.length;
        const baseBonus = 100;
        const bonus = baseBonus * clearedLines * this.scoreMultiplier;
        this.currentNumber += bonus;
        
        // Show bonus animation
        this.showBonusAnimation(bonus, lines);
        
        // Add new power-ups after clearing
        this.addRandomPower();
        this.addRandomPower(); // Add extra power-up for balance
    }

    showBonusAnimation(bonus, lines) {
        const bonusDiv = document.createElement('div');
        bonusDiv.className = 'bonus-popup';
        bonusDiv.textContent = `+${bonus}`;
        
        // Position the bonus text near the cleared lines
        const firstLine = lines[0];
        const cell = this.getCellsInLine(firstLine)[0];
        const rect = cell.element.getBoundingClientRect();
        
        bonusDiv.style.left = `${rect.left}px`;
        bonusDiv.style.top = `${rect.top}px`;
        
        document.body.appendChild(bonusDiv);
        
        // Remove after animation
        setTimeout(() => {
            bonusDiv.remove();
        }, 1000);
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    const game = new Game();
});