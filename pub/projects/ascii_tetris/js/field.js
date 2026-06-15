import { COLS, ROWS, HIDDEN_ROWS, EMPTY } from './constants.js';

export class Field {
    constructor() {
        this.cols = COLS;
        this.rows = ROWS;
        this.grid = this.createGrid();
        this.freezeGrid = this.createFreezeGrid();
        // coldGrid: stores piecesPlaced number when cell was placed (0 = not cold)
        this.coldGrid = this.createColdGrid();
    }

    createGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(EMPTY));
    }

    createFreezeGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    }

    createColdGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    isValid(tetromino) {
        for (let y = 0; y < tetromino.shape.length; y++) {
            for (let x = 0; x < tetromino.shape[y].length; x++) {
                if (tetromino.shape[y][x]) {
                    const boardX = tetromino.x + x;
                    const boardY = tetromino.y + y;

                    if (boardX < 0 || boardX >= this.cols || boardY >= this.rows) {
                        return false;
                    }

                    if (boardY >= 0 && this.grid[boardY][boardX] !== EMPTY) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lock(tetromino) {
        for (let y = 0; y < tetromino.shape.length; y++) {
            for (let x = 0; x < tetromino.shape[y].length; x++) {
                if (tetromino.shape[y][x]) {
                    const boardY = tetromino.y + y;
                    const boardX = tetromino.x + x;
                    if (boardY >= 0 && boardY < this.rows && boardX >= 0 && boardX < this.cols) {
                        this.grid[boardY][boardX] = tetromino.colorClass;
                    }
                }
            }
        }
    }

    /**
     * Find all full rows (without clearing them).
     * Returns array of row indices.
     */
    findFullRows() {
        const rows = [];
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== EMPTY)) {
                rows.push(y);
            }
        }
        return rows;
    }

    /**
     * Expand full rows to include adjacent rows (上下1行) for explosive clear.
     * Returns Set of row indices.
     */
    findExplosiveRows(fullRows) {
        const explosive = new Set(fullRows);
        for (const y of fullRows) {
            if (y - 1 >= 0) explosive.add(y - 1);
            if (y + 1 < this.rows) explosive.add(y + 1);
        }
        return [...explosive];
    }

    /**
     * Flash rows: set all cells in given rows to the flash color.
     */
    /**
     * Flash rows: set all cells in given rows to the flash color.
     * Skips frozen cells (they don't flash).
     */
    flashRows(rowIndices, flashColor) {
        for (const y of rowIndices) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] !== EMPTY && !this.freezeGrid[y][x]) {
                    this.grid[y][x] = flashColor;
                }
            }
        }
    }

    /**
     * Process line clear for both clean and frozen rows.
     * - cleanRows: Removed completely, rows above shift down.
     * - frozenRows: Only non-frozen cells are cleared to EMPTY, rows DO NOT shift.
     */
    processClear(cleanRows, frozenRows) {
        // 1. Clear non-frozen cells in frozen rows (in place)
        for (const y of frozenRows) {
            for (let x = 0; x < this.cols; x++) {
                if (!this.freezeGrid[y][x]) {
                    this.grid[y][x] = EMPTY;
                    // coldGrid stays? Usually yes, or maybe reset to 0?
                    // Original logic kept coldGrid, so we keep it.
                }
            }
        }

        // 2. Remove clean rows (shift down)
        if (cleanRows.length > 0) {
            const removeSet = new Set(cleanRows);
            const newGrid = [];
            const newFreezeGrid = [];
            const newColdGrid = [];

            for (let y = 0; y < this.rows; y++) {
                if (!removeSet.has(y)) {
                    newGrid.push(this.grid[y]);
                    newFreezeGrid.push(this.freezeGrid[y]);
                    newColdGrid.push(this.coldGrid[y]);
                }
            }

            while (newGrid.length < this.rows) {
                newGrid.unshift(Array(this.cols).fill(EMPTY));
                newFreezeGrid.unshift(Array(this.cols).fill(false));
                newColdGrid.unshift(Array(this.cols).fill(0));
            }

            this.grid = newGrid;
            this.freezeGrid = newFreezeGrid;
            this.coldGrid = newColdGrid;
        }
    }

    /**
     * Clear lines with freeze awareness.
     * Returns { cleared, hadFrozenTetris }
     *   cleared: number of non-frozen full lines actually removed
     *   hadFrozenTetris: true if 4+ full lines found AND any contained frozen blocks
     */
    clearLines() {
        // Step 1: Find all full rows
        const fullRows = [];
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== EMPTY)) {
                fullRows.push(y);
            }
        }

        if (fullRows.length === 0) {
            return { cleared: 0, hadFrozenTetris: false };
        }

        // Step 2: Separate into frozen-containing and clean rows
        const frozenRows = [];
        const cleanRows = [];

        for (const y of fullRows) {
            const hasFrozen = this.freezeGrid[y].some(f => f === true);
            if (hasFrozen) {
                frozenRows.push(y);
            } else {
                cleanRows.push(y);
            }
        }

        // Step 3: Handle frozen rows - remove only non-frozen cells
        for (const y of frozenRows) {
            for (let x = 0; x < this.cols; x++) {
                if (!this.freezeGrid[y][x]) {
                    this.grid[y][x] = EMPTY;
                    // coldGrid stays — remaining cells keep their cold counter
                }
            }
        }

        // Step 4: Handle clean rows - remove ALL at once (batch)
        if (cleanRows.length > 0) {
            const cleanSet = new Set(cleanRows);
            const newGrid = [];
            const newFreezeGrid = [];
            const newColdGrid = [];

            for (let y = 0; y < this.rows; y++) {
                if (!cleanSet.has(y)) {
                    newGrid.push(this.grid[y]);
                    newFreezeGrid.push(this.freezeGrid[y]);
                    newColdGrid.push(this.coldGrid[y]);
                }
            }

            // Add empty rows at top to fill the gap
            while (newGrid.length < this.rows) {
                newGrid.unshift(Array(this.cols).fill(EMPTY));
                newFreezeGrid.unshift(Array(this.cols).fill(false));
                newColdGrid.unshift(Array(this.cols).fill(0));
            }

            this.grid = newGrid;
            this.freezeGrid = newFreezeGrid;
            this.coldGrid = newColdGrid;
        }

        // Step 5: Check for frozen Tetris (4+ full lines including frozen ones)
        const hadFrozenTetris = (fullRows.length >= 4 && frozenRows.length > 0);

        return { cleared: cleanRows.length, totalFull: fullRows.length, hadFrozenTetris };
    }

    /**
     * Remove the absolute bottom row of the field (bonus for frozen Tetris).
     */
    removeBottomRow() {
        this.grid.splice(this.rows - 1, 1);
        this.freezeGrid.splice(this.rows - 1, 1);
        this.coldGrid.splice(this.rows - 1, 1);
        this.grid.unshift(Array(this.cols).fill(EMPTY));
        this.freezeGrid.unshift(Array(this.cols).fill(false));
        this.coldGrid.unshift(Array(this.cols).fill(0));
    }

    /**
     * Freeze specific cells (change color to frozen, mark in freezeGrid).
     */
    freezeCell(y, x, frozenColor) {
        if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
            if (this.grid[y][x] !== EMPTY) {
                this.grid[y][x] = frozenColor;
                this.freezeGrid[y][x] = true;
            }
        }
    }

    /**
     * Check if a cell is frozen.
     */
    isFrozen(y, x) {
        if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
            return this.freezeGrid[y][x];
        }
        return false;
    }

    /**
     * Mark cells as cold (set placedAt value in coldGrid).
     */
    markCold(y, x, placedAt) {
        if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
            this.coldGrid[y][x] = placedAt;
        }
    }

    /**
     * Process freezing: convert cold cells to frozen if enough pieces placed.
     * Returns number of cells frozen.
     */
    processFreezing(currentPiecesPlaced, freezeDelay, frozenColor) {
        let frozenCount = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const placedAt = this.coldGrid[y][x];
                if (placedAt > 0 && !this.freezeGrid[y][x] && this.grid[y][x] !== EMPTY) {
                    if (currentPiecesPlaced - placedAt >= freezeDelay) {
                        this.grid[y][x] = frozenColor;
                        this.freezeGrid[y][x] = true;
                        this.coldGrid[y][x] = 0; // No longer cold, now frozen
                        frozenCount++;
                    }
                }
            }
        }
        return frozenCount;
    }

    /**
     * Mode B: Rise garbage — copy the bottom row upward and push all rows up by 1.
     * The top row (row 0) is discarded.
     */
    riseRow() {
        // Copy the bottom row
        const bottomRow = this.grid[this.rows - 1].slice();
        const bottomFreeze = this.freezeGrid[this.rows - 1].slice();
        const bottomCold = this.coldGrid[this.rows - 1].slice();

        // Shift everything up by 1 (discard top row)
        this.grid.shift();
        this.freezeGrid.shift();
        this.coldGrid.shift();

        // Add duplicated bottom row at the bottom
        this.grid.push(bottomRow);
        this.freezeGrid.push(bottomFreeze);
        this.coldGrid.push(bottomCold);
    }

    /**
     * Mode C 誘爆性ライン消去: 揃ったラインの上下1行も同時に消去。
     * Returns { cleared, hadFrozenTetris }
     */
    clearLinesExplosive() {
        // Step 1: Find all full rows
        const fullRows = new Set();
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== EMPTY)) {
                fullRows.add(y);
            }
        }

        if (fullRows.size === 0) {
            return { cleared: 0, hadFrozenTetris: false };
        }

        // Step 2: Expand to include adjacent rows (上下1行)
        const explosiveRows = new Set(fullRows);
        for (const y of fullRows) {
            if (y - 1 >= 0) explosiveRows.add(y - 1);
            if (y + 1 < this.rows) explosiveRows.add(y + 1);
        }

        // Step 3: Remove all explosive rows (batch)
        const removeSet = explosiveRows;
        const newGrid = [];
        const newFreezeGrid = [];
        const newColdGrid = [];

        for (let y = 0; y < this.rows; y++) {
            if (!removeSet.has(y)) {
                newGrid.push(this.grid[y]);
                newFreezeGrid.push(this.freezeGrid[y]);
                newColdGrid.push(this.coldGrid[y]);
            }
        }

        // Add empty rows at top to fill the gap
        while (newGrid.length < this.rows) {
            newGrid.unshift(Array(this.cols).fill(EMPTY));
            newFreezeGrid.unshift(Array(this.cols).fill(false));
            newColdGrid.unshift(Array(this.cols).fill(0));
        }

        this.grid = newGrid;
        this.freezeGrid = newFreezeGrid;
        this.coldGrid = newColdGrid;

        return { cleared: removeSet.size, hadFrozenTetris: false };
    }

    /**
     * Check if the entire board is empty (Perfect Clear / 全消し).
     * Only checks visible rows (HIDDEN_ROWS onward).
     */
    isEmpty() {
        for (let y = HIDDEN_ROWS; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] !== EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }
}
