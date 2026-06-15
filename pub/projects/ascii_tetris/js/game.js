import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';
import { Field } from './field.js';
import { Tetromino, TETROMINOS } from './tetromino.js';
import { SpecialMino, SPECIAL_MINOS } from './special_minos.js';
import { Pentomino, PENTOMINOS } from './pentomino.js';
import { Hexomino, HEXOMINOS } from './hexomino.js';
import { Heptomino, HEPTOMINOS } from './heptomino.js';
import { BrokenMino, BROKEN_MINOS } from './broken_minos.js';
import { getSpeedSettings } from './speed_curve.js';
import {
    COLS, ROWS, KEY, LOCK_DELAY_BASE, LOCK_MAX_RESET,
    SPECIAL_TYPES, COLORS, EMPTY,
    FREEZE_DELAY, FREEZE_START_LEVEL, SPEED_20G_LEVEL
} from './constants.js';

export class Game {
    constructor(startLevel = 1, options = {}) {
        this.freezeFromStart = options.freezeFromStart || false;
        this.explosiveFromStart = options.explosiveFromStart || false;
        this.mode = options.mode || 'A';
        this.input = new InputHandler();
        this.renderer = new Renderer();
        this.field = new Field();

        this.activeTetromino = null;
        this.ghostTetromino = null;
        this.nextQueue = [];
        this.holdTetromino = 'BLANK';
        this.held = false;

        this.score = 0;
        this.level = startLevel;
        this.lines = 0;
        this.speed = 1.0;

        this.dropAccumulator = 0;

        this.lockTimer = 0;
        this.lockStacks = LOCK_MAX_RESET;
        this.isLocking = false;

        this.isGameOver = false;

        this.lastTime = 0;
        this.animationId = null;

        // DAS Handling
        this.dasSpeed = 1;
        this.dasCounter = 0;
        this.currentDasDirection = null;

        // ARE / Line Clear Delay
        this.areTimer = 0;
        this.areDelay = 0;     // Set from speed curve on lock
        this.lineClearTimer = 0;
        this.lineClearDelay = 0; // Set from speed curve on line clear
        this.waitingForSpawn = false;
        this.waitingForLineClear = false;

        this.initializeBag();
        this.fillBag(4);

        this.startTime = 0;
        this.elapsedTime = 0;

        this.clearMessage = '';
        this.clearMessageTimer = 0;

        // Mode A: Freeze tracking
        this.piecesPlaced = 0;

        // Mode B: Rise garbage counter
        this.riseCounter = 0;

        // Perfect Clear flag
        this._perfectClear = false;

        // Soft Drop Lock flag (ignore soft drop if held during spawn)
        this._ignoreSoftDrop = false;

        // Callback for game over (set by GameManager)
        this.onGameOver = null;
    }

    start() {
        this.spawnPiece();
        this.update();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    initializeBag() {
        this.bags = {
            4: [],  // Tetromino bag
            5: [],  // Pentomino bag
            6: [],  // Hexomino bag
            7: [],  // Heptomino bag
            8: [],  // Broken Bag
        };
        // Cycle index: which size to draw next
        // Cycle sequence is built dynamically based on maxPoly
        this.polyCycleIndex = 0;
    }

    /**
     * Fill a bag for the given polyomino size.
     * Only includes defined pieces from the corresponding dictionary.
     */
    fillBag(size) {
        let pieces;
        switch (size) {
            case 4: pieces = Object.keys(TETROMINOS).filter(k => k !== 'BLANK'); break;
            case 5: pieces = Object.keys(PENTOMINOS); break;
            case 6: pieces = Object.keys(HEXOMINOS); break;
            case 7: pieces = Object.keys(HEPTOMINOS); break;
            case 8: pieces = Object.keys(BROKEN_MINOS); break;
            default: pieces = Object.keys(TETROMINOS).filter(k => k !== 'BLANK'); break;
        }
        if (pieces.length === 0) return; // No defined pieces for this size
        // Shuffle
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        this.bags[size].push(...pieces);
    }

    /**
     * Build the cycle sequence based on current maxPoly.
     * 4 only → [4], 5 → [4,5], 6 → [4,5,6], 7 → [4,5,6,7]
     * Only includes sizes that have defined pieces.
     */
    getPolyCycle() {
        const settings = getSpeedSettings(this.level);
        let maxPoly = 4;
        if (this.mode === 'C') {
            maxPoly = this.explosiveFromStart ? 7 : settings.maxPoly;
        }

        // MODE D:
        // 4 = tetromino bag
        // 8 = broken bag
        // 'F' = family bag (5/6/7 を等確率で選ぶ)
        if (this.mode === 'D') {
            const hasBroken = Object.keys(BROKEN_MINOS).length > 0;
            const has5 = Object.keys(PENTOMINOS).length > 0;
            const has6 = Object.keys(HEXOMINOS).length > 0;
            const has7 = Object.keys(HEPTOMINOS).length > 0;
            const hasFamily = has5 || has6 || has7;

            const cycle = [
                4, 4, 4, 4,
                ...(hasBroken ? [8] : []),
                4, 4, 4, 4,
                ...(hasBroken ? [8] : []),
                4, 4, 4, 4,
                ...(hasBroken ? [8] : []),
                ...(hasFamily ? ['F'] : [])
            ];

            return cycle.length > 0 ? cycle : [4];
        }

        const cycle = [];
        for (let s = 4; s <= maxPoly; s++) {
            let hasPieces;
            switch (s) {
                case 4: hasPieces = Object.keys(TETROMINOS).filter(k => k !== 'BLANK').length > 0; break;
                case 5: hasPieces = Object.keys(PENTOMINOS).length > 0; break;
                case 6: hasPieces = Object.keys(HEXOMINOS).length > 0; break;
                case 7: hasPieces = Object.keys(HEPTOMINOS).length > 0; break;
                default: hasPieces = false;
            }
            if (hasPieces) cycle.push(s);
        }

        return cycle.length > 0 ? cycle : [4];
    }

    getNextPiece() {
        // Special interrupt
        if (Math.random() < 1 / 50) {
            const types = Object.keys(SPECIAL_TYPES);
            let available = types;
            if (this.level >= SPEED_20G_LEVEL) {
                available = types.filter(t => t !== 'BOMB');
            }
            if (available.length > 0) {
                return available[Math.floor(Math.random() * available.length)];
            }
        }

        const cycle = this.getPolyCycle();
        const slot = cycle[this.polyCycleIndex % cycle.length];
        this.polyCycleIndex++;

        if (slot === 'F') {
            const familySizes = [];
            if (Object.keys(PENTOMINOS).length > 0) familySizes.push(5);
            if (Object.keys(HEXOMINOS).length > 0) familySizes.push(6);
            if (Object.keys(HEPTOMINOS).length > 0) familySizes.push(7);

            if (familySizes.length === 0) {
                if (this.bags[4].length === 0) this.fillBag(4);
                return this.bags[4].shift();
            }

            const size = familySizes[Math.floor(Math.random() * familySizes.length)];
            if (!this.bags[size] || this.bags[size].length === 0) {
                this.fillBag(size);
            }

            if (this.bags[size].length > 0) {
                return this.bags[size].shift();
            }

            if (this.bags[4].length === 0) this.fillBag(4);
            return this.bags[4].shift();
        }

        const size = slot;
        if (!this.bags[size] || this.bags[size].length === 0) {
            this.fillBag(size);
        }

        if (!this.bags[size] || this.bags[size].length === 0) {
            if (this.bags[4].length === 0) this.fillBag(4);
            return this.bags[4].shift();
        }

        return this.bags[size].shift();
    }

    /**
     * Create the correct piece instance from a type string.
     * Looks up in all dictionaries to find the right class.
     */
    createPiece(type) {
        if (SPECIAL_TYPES[type]) return new SpecialMino(type);
        if (PENTOMINOS[type]) return new Pentomino(type);
        if (BROKEN_MINOS[type]) return new BrokenMino(type);
        if (HEXOMINOS[type]) return new Hexomino(type);
        if (HEPTOMINOS[type]) return new Heptomino(type);
        if (TETROMINOS[type]) return new Tetromino(type);

        throw new Error(`Unknown piece type: ${type}`);
    }

    updateNextQueue() {
        while (this.nextQueue.length < 4) {
            this.nextQueue.push(this.getNextPiece());
        }
    }

    spawnPiece() {
        this.updateNextQueue();
        const type = this.nextQueue.shift();

        this.activeTetromino = this.createPiece(type);
        this.held = false;
        this.resetLockState();
        this._spawnFrame = true;

        // If Down is held during spawn, ignore it until released
        if (this.input.isDown(KEY.DOWN)) {
            this._ignoreSoftDrop = true;
        }

        // IRS: Initial Rotation System
        // If rotation key is held during spawn, pre-rotate
        if (!this.activeTetromino.isSpecial) {
            if (this.input.isDown(KEY.ROTATE_RIGHT)) {
                this.activeTetromino.rotate(1);
            } else if (this.input.isDown(KEY.ROTATE_LEFT)) {
                this.activeTetromino.rotate(-1);
            }
        }

        if (!this.field.isValid(this.activeTetromino)) {
            this.isGameOver = true;
            alert("GAME OVER");
            if (this.onGameOver) {
                this.onGameOver(this.score, this.level, this.lines);
            }
            cancelAnimationFrame(this.animationId);
            return;
        }

        // IRS: Initial Hold System
        // If hold key is held during spawn, immediately hold
        // Handle inline to prevent recursion
        if (this.input.isDown(KEY.HOLD) && !this._irsHoldLock) {
            this._irsHoldLock = true; // Prevent re-trigger on recursive spawnPiece
            const currentType = this.activeTetromino.type;
            if (!this.holdTetromino || this.holdTetromino === 'BLANK') {
                // First hold: store current piece, spawn next
                // (recursive spawnPiece already applies IRS rotation)
                this.holdTetromino = currentType;
                this.held = true;
                this.spawnPiece();
            } else {
                // Swap hold
                const swap = this.holdTetromino;
                this.holdTetromino = currentType;
                this.activeTetromino = this.createPiece(swap);
                // IRS rotation on swapped piece
                if (!this.activeTetromino.isSpecial) {
                    if (this.input.isDown(KEY.ROTATE_RIGHT)) {
                        this.activeTetromino.rotate(1);
                    } else if (this.input.isDown(KEY.ROTATE_LEFT)) {
                        this.activeTetromino.rotate(-1);
                    }
                }
                this.held = true;
                this.resetLockState();
                this.updateGhost();
                if (this.level >= SPEED_20G_LEVEL) this.apply20G();
            }
            this._irsHoldLock = false;
            return;
        }

        this.updateGhost();

        // 20G: Instantly drop to ghost position on spawn
        if (this.level >= SPEED_20G_LEVEL) {
            this.apply20G();
        }
    }

    /**
     * 20G: Instantly move piece to ghost position (bottom).
     */
    apply20G() {
        if (!this.activeTetromino || !this.ghostTetromino) return;
        this.activeTetromino.y = this.ghostTetromino.y;
    }

    /**
     * IMS: Pre-charge DAS during ARE / line clear delay.
     * Tracks direction and accumulates dasCounter while waiting.
     */
    preChargeDAS() {
        const settings = getSpeedSettings(this.level);
        const dasDelay = settings.das;

        let direction = 0;
        if (this.input.isDown(KEY.LEFT)) direction = -1;
        if (this.input.isDown(KEY.RIGHT)) direction = 1;

        if (direction !== 0) {
            if (this.currentDasDirection !== direction) {
                this.currentDasDirection = direction;
                this.dasCounter = 0;
            }
            this.dasCounter++;
        } else {
            this.currentDasDirection = null;
            this.dasCounter = 0;
        }
    }

    /**
     * IMS: Apply pre-charged DAS movement on piece spawn.
     * If DAS is fully charged, immediately move the piece.
     */
    applyIMS() {
        if (!this.activeTetromino || !this.currentDasDirection) return;

        const settings = getSpeedSettings(this.level);
        const dasDelay = settings.das;

        if (this.dasCounter >= dasDelay) {
            // DAS is charged — move the piece
            this.move(this.currentDasDirection, 0);
            this.updateGhost();
        }
    }

    resetLockState() {
        this.isLocking = false;
        this.lockTimer = 0;
        this.lockStacks = LOCK_MAX_RESET;
    }

    updateGhost() {
        if (!this.activeTetromino) return;
        this.ghostTetromino = this.activeTetromino.clone();

        while (this.field.isValid(this.ghostTetromino)) {
            this.ghostTetromino.y++;
        }
        this.ghostTetromino.y--;
    }

    update(time = 0) {
        try {
            if (!this.startTime && time > 0) this.startTime = time;
            if (!this.isGameOver) {
                this.elapsedTime = time - this.startTime;
            }

            if (this.isGameOver) return;

            if (this.clearMessageTimer > 0) {
                this.clearMessageTimer--;
                if (this.clearMessageTimer === 0) {
                    this.clearMessage = '';
                }
            }

            // Line clear delay
            if (this.waitingForLineClear) {
                this.preChargeDAS(); // IMS: charge DAS during delay
                this.lineClearTimer++;
                if (this.lineClearTimer >= this.lineClearDelay) {
                    this.waitingForLineClear = false;

                    // Actually remove the flashed rows now
                    if (this._pendingClear) {
                        this.field.processClear(this._pendingClear.cleanRows, this._pendingClear.frozenRows);
                        // Frozen Tetris bonus: remove bottom row
                        if (this._pendingClear.hadFrozenTetris) {
                            this.field.removeBottomRow();
                            this.score += 1000 * this.level;
                        }

                        // Perfect Clear (全消し) detection
                        if (this.field.isEmpty()) {
                            this._perfectClear = true;
                            this.score += 10000 * this.level;
                        }

                        this._pendingClear = null;
                        this._flashClearCount = 0;
                    }

                    // Start ARE after line clear
                    this.waitingForSpawn = true;
                    this.areTimer = 0;
                }
                this.renderer.render(this);
                this.input.update();
                this.animationId = requestAnimationFrame((t) => this.update(t));
                return;
            }

            // ARE (appearance delay)
            if (this.waitingForSpawn) {
                this.preChargeDAS(); // IMS: charge DAS during delay
                this.areTimer++;
                if (this.areTimer >= this.areDelay) {
                    this.waitingForSpawn = false;
                    this.spawnPiece();
                    // IMS: Apply pre-charged DAS movement on spawn
                    this.applyIMS();
                }
                this.renderer.render(this);
                this.input.update();
                this.animationId = requestAnimationFrame((t) => this.update(t));
                return;
            }

            this.updateInput();
            this.updateGravity();

            // Update speed display from speed curve
            const settings = getSpeedSettings(this.level);
            this.speed = settings.gravity;

            this.renderer.render(this);

            this.input.update();
            this.animationId = requestAnimationFrame((t) => this.update(t));
        } catch (e) {
            console.error("Game Loop Error:", e);
            this.isGameOver = true;
        }
    }

    updateInput() {
        if (!this.activeTetromino) return;

        let movedHorizontal = false;
        let rotated = false;
        let dropped = false;

        // 1. Rotation / Action (Special) — processed first
        if (this.input.isPressed(KEY.ROTATE_LEFT) || this.input.isPressed(KEY.ROTATE_RIGHT)) {
            if (this.activeTetromino.isSpecial) {
                this.handleSpecialAction();
            } else {
                const dir = this.input.isPressed(KEY.ROTATE_RIGHT) ? 1 : -1;
                if (this.rotate(dir)) rotated = true;
            }
        }

        // 2. Hold
        if (this.input.isPressed(KEY.HOLD)) {
            this.holdPiece();
            return;
        }

        // 3. DAS / Horizontal movement (delay from speed curve)
        const settings = getSpeedSettings(this.level);
        const dasDelay = settings.das;

        // On 20G spawn frame, skip horizontal movement so piece drops straight
        const skip20GHorizontal = this._spawnFrame && this.level >= SPEED_20G_LEVEL;
        this._spawnFrame = false;

        let direction = 0;
        if (this.input.isDown(KEY.LEFT)) direction = -1;
        if (this.input.isDown(KEY.RIGHT)) direction = 1;

        if (direction !== 0) {
            if (this.currentDasDirection !== direction) {
                if (!skip20GHorizontal) {
                    if (this.move(direction, 0)) movedHorizontal = true;
                }
                this.currentDasDirection = direction;
                this.dasCounter = 0;
            } else {
                this.dasCounter++;
                if (this.dasCounter >= dasDelay) {
                    if ((this.dasCounter - dasDelay) % this.dasSpeed === 0) {
                        if (!skip20GHorizontal) {
                            if (this.move(direction, 0)) movedHorizontal = true;
                        }
                    }
                }
            }
        } else {
            this.currentDasDirection = null;
            this.dasCounter = 0;
        }

        // 4. Hard Drop (Down)
        // 4. Soft Drop (Down) - 5G speed
        if (!this.input.isDown(KEY.DOWN)) {
            this._ignoreSoftDrop = false;
        }

        if (this.input.isDown(KEY.DOWN) && !this._ignoreSoftDrop) {
            const downSpeed = 5;
            for (let i = 0; i < downSpeed; i++) {
                if (this.move(0, 1)) {
                    dropped = true;
                } else {
                    // Lock immediately if on ground
                    this.lockPiece();
                    return;
                }
            }
        }

        // 5. Sonic Drop (Up)
        if (this.input.isPressed(KEY.UP)) {
            while (this.move(0, 1)) {
                dropped = true;
            }
        }

        // Lock Delay Manipulation
        if (this.isLocking) {
            if (movedHorizontal || rotated) {
                if (this.lockStacks > 0) {
                    this.lockTimer = 0;
                    this.lockStacks--;
                }
            }
        }

        if (dropped) {
            this.lockTimer = 0;
            this.lockStacks = Math.min(LOCK_MAX_RESET, this.lockStacks + 1);
            this.isLocking = false;
        }

        // 20G: After horizontal move or rotation, re-apply 20G
        if (this.level >= SPEED_20G_LEVEL && (movedHorizontal || rotated)) {
            this.updateGhost();
            this.apply20G();
        }

        this.updateGhost();
    }

    move(dx, dy) {
        this.activeTetromino.x += dx;
        this.activeTetromino.y += dy;

        if (!this.field.isValid(this.activeTetromino)) {
            this.activeTetromino.x -= dx;
            this.activeTetromino.y -= dy;
            return false;
        }
        return true;
    }

    rotate(dir) {
        const piece = this.activeTetromino;
        const originalShape = JSON.parse(JSON.stringify(piece.shape));
        const originalRotationIndex = piece.rotationIndex;
        const originalY = piece.y;

        // Get bottom row before rotation (for height preservation)
        const bottomBefore = piece.getBottomRow();

        // Apply rotation (switches to next/prev AA state)
        piece.rotate(dir);

        // Height preservation: adjust Y so the lowest block stays at the same board row
        // Exception: I-mino does NOT preserve height
        if (piece.preserveHeight) {
            const bottomAfter = piece.getBottomRow();
            const diff = bottomAfter - bottomBefore;
            piece.y -= diff;
        }

        if (this.field.isValid(piece)) {
            return true;
        }

        // Wall kick: right priority (try right first, then left)
        const kicks = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: -1 },
            { x: 1, y: -1 }, { x: -1, y: -1 }
        ];

        for (let kick of kicks) {
            piece.x += kick.x;
            piece.y += kick.y;
            if (this.field.isValid(piece)) {
                return true;
            }
            piece.x -= kick.x;
            piece.y -= kick.y;
        }

        // Failed: restore everything
        piece.shape = originalShape;
        piece.rotationIndex = originalRotationIndex;
        piece.y = originalY;
        return false;
    }

    updateGravity() {
        if (!this.activeTetromino) return;

        const settings = getSpeedSettings(this.level);
        const gravity = settings.gravity;



        // Normal gravity from speed curve
        this.dropAccumulator += gravity;

        if (this.dropAccumulator >= 1) {
            const cells = Math.floor(this.dropAccumulator);
            this.dropAccumulator -= cells;

            for (let i = 0; i < cells; i++) {
                if (this.move(0, 1)) {
                    this.lockTimer = 0;
                    this.lockStacks = Math.min(LOCK_MAX_RESET, this.lockStacks + 1);
                    this.isLocking = false;
                } else {
                    break;
                }
            }
        }

        this.checkLock();
    }

    checkLock() {
        this.activeTetromino.y++;
        const isGrounded = !this.field.isValid(this.activeTetromino);
        this.activeTetromino.y--;

        if (isGrounded) {
            if (!this.isLocking) {
                this.isLocking = true;
                this.lockTimer = 0;
            }

            this.lockTimer++;

            if (this.lockTimer >= LOCK_DELAY_BASE) {
                this.lockPiece();
            }
        } else {
            this.isLocking = false;
        }
    }

    lockPiece() {
        if (this.activeTetromino.isSpecial) {
            const type = this.activeTetromino.type;
            const tx = this.activeTetromino.x;
            const ty = this.activeTetromino.y;

            if (type === SPECIAL_TYPES.BOMB) {
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const py = ty + dy;
                        const px = tx + dx;
                        if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
                            // Frozen blocks are immune to bombs
                            if (!this.field.isFrozen(py, px)) {
                                this.field.grid[py][px] = EMPTY;
                            }
                        }
                    }
                }
            }
            // Builder/Demolisher vanish on lock
        } else {
            this.field.lock(this.activeTetromino);

            // Mode A: Mark locked cells as cold in the field's coldGrid
            this.piecesPlaced++;
            if (this.mode === 'A' && (this.freezeFromStart || this.level >= FREEZE_START_LEVEL)) {
                for (let y = 0; y < this.activeTetromino.shape.length; y++) {
                    for (let x = 0; x < this.activeTetromino.shape[y].length; x++) {
                        if (this.activeTetromino.shape[y][x]) {
                            const boardY = this.activeTetromino.y + y;
                            const boardX = this.activeTetromino.x + x;
                            this.field.markCold(boardY, boardX, this.piecesPlaced);
                        }
                    }
                }
            }
        }

        // Mode A only: Freeze cold cells that are old enough
        if (this.mode === 'A') {
            this.field.processFreezing(this.piecesPlaced, FREEZE_DELAY, COLORS.FROZEN);
        }

        // Line clear — detect and flash, but defer actual removal
        this._lastLineClear = 0;
        this._flashClearCount = 0;
        this._pendingClear = null;
        this._perfectClear = false;

        // Clear message is independent from lineClearDelay / ARE
        // It is only overwritten when a new clear actually happens.
        if (!this.activeTetromino.isSpecial) {
            const fullRows = this.field.findFullRows();

            if (fullRows.length > 0) {
                const useExplosive = this.mode === 'C' && (this.level >= 1000 || this.explosiveFromStart);
                const allRows = useExplosive
                    ? this.field.findExplosiveRows(fullRows)
                    : fullRows;

                // Split into clean vs frozen rows
                const cleanRows = [];
                const frozenRows = [];

                for (const y of allRows) {
                    const hasFrozen = this.field.freezeGrid[y].some(f => f === true);
                    if (hasFrozen) {
                        frozenRows.push(y);
                    } else {
                        cleanRows.push(y);
                    }
                }

                const clearedCount = allRows.length;

                // Score/level update
                this.lines += clearedCount;
                this.level += clearedCount;
                this._lastLineClear = clearedCount;
                this._flashClearCount = clearedCount;

                const baseScores = [0, 100, 300, 500, 800];
                const score = (baseScores[Math.min(clearedCount, 4)] || 800) * this.level;
                this.score += score;

                // Flash all target rows (flashRows skips frozen blocks automatically)
                this.field.flashRows(allRows, COLORS.FLASH);

                // Store pending rows for deferred removal
                this._pendingClear = {
                    cleanRows: cleanRows,
                    frozenRows: frozenRows,
                    hadFrozenTetris: fullRows.length >= 4 && frozenRows.length > 0
                };

                // Human-readable clear message with guaranteed visibility
                const labels = {
                    1: '1 LINE!',
                    2: '2 LINES!',
                    3: '3 LINES!',
                    4: 'TETRIS!'
                };
                this.clearMessage = labels[clearedCount] || `${clearedCount} LINES!`;

                // Bigger clears stay a bit longer
                this.clearMessageTimer = clearedCount >= 4 ? 60 : 45;
            }
        }

        // Mode B: Rising garbage
        if (this.mode === 'B') {
            const settings = getSpeedSettings(this.level);
            if (settings.riseRate > 0 && this._lastLineClear === 0) {
                // Only increment rise counter if no lines were cleared
                this.riseCounter++;
                if (this.riseCounter >= settings.riseRate) {
                    this.riseCounter = 0;
                    this.field.riseRow();
                }
            }
        }

        this.score += 10;
        this.level += 1;

        // Clear active piece (it's locked now, delay before next)
        this.activeTetromino = null;
        this.ghostTetromino = null;

        // Start delay before next piece (ARE / line clear delay)
        const settings = getSpeedSettings(this.level);
        if (this._lastLineClear > 0) {
            // Line clear delay first (flash is visible during this), then ARE
            this.lineClearDelay = settings.lineClear;
            this.lineClearTimer = 0;
            this.waitingForLineClear = true;
            this._lastLineClear = 0;
        } else {
            // ARE only
            this.areDelay = settings.are;
            this.areTimer = 0;
            this.waitingForSpawn = true;
        }
    }

    holdPiece() {
        if (this.held) return;

        const currentType = this.activeTetromino.type;
        if (!this.holdTetromino || this.holdTetromino === 'BLANK') {
            this.holdTetromino = currentType;
            this._irsHoldLock = true;
            this.spawnPiece();
            this._irsHoldLock = false;
        } else {
            const swap = this.holdTetromino;
            this.holdTetromino = currentType;

            this.activeTetromino = this.createPiece(swap);

            this.resetLockState();
            if (!this.field.isValid(this.activeTetromino)) {
                this.activeTetromino = this.createPiece(currentType);
                this.holdTetromino = swap;
                return;
            }
        }

        this.held = true;
        this.updateGhost();

        // 20G: Apply after hold swap
        if (this.level >= SPEED_20G_LEVEL) {
            this.apply20G();
        }
    }

    handleSpecialAction() {
        try {
            if (!this.activeTetromino.isSpecial) return;

            const type = this.activeTetromino.type;
            const x = this.activeTetromino.x;
            const y = this.activeTetromino.y;

            if (type === SPECIAL_TYPES.BUILDER) {
                let startY = y + 2;
                let projectileY = startY;

                while (projectileY < ROWS) {
                    if (projectileY >= 0 && this.field.grid[projectileY] && this.field.grid[projectileY][x] !== EMPTY) {
                        break;
                    }
                    projectileY++;
                }
                projectileY--;

                if (projectileY >= 0 && projectileY < ROWS) {
                    if (this.field.grid[projectileY] && this.field.grid[projectileY][x] === EMPTY) {
                        this.field.grid[projectileY][x] = COLORS.SPECIAL;

                        // Mark Builder block as cold (same turn as current piece)
                        if (this.mode === 'A' && (this.freezeFromStart || this.level >= FREEZE_START_LEVEL)) {
                            this.field.markCold(projectileY, x, this.piecesPlaced);
                        }

                        const result = this.field.clearLines();
                        if (result.cleared > 0) {
                            this.lines += result.cleared;
                            this.level += result.cleared;
                        }
                        if (result.hadFrozenTetris) {
                            this.field.removeBottomRow();
                            this.score += 1000 * this.level;
                        }

                        let isGrounded = false;
                        let groundY = y + 2;
                        if (groundY >= ROWS) {
                            isGrounded = true;
                        } else if (groundY >= 0 && this.field.grid[groundY] && this.field.grid[groundY][x] !== EMPTY) {
                            isGrounded = true;
                        }

                        if (isGrounded) {
                            let overheadY = y - 1;
                            let canClimb = false;

                            if (overheadY < 0) {
                                canClimb = true;
                            } else if (this.field.grid[overheadY] && this.field.grid[overheadY][x] === EMPTY) {
                                canClimb = true;
                            }

                            if (canClimb && this.activeTetromino.climbCount < 5) {
                                this.activeTetromino.y -= 1;
                                this.activeTetromino.climbCount++;
                                this.lockTimer = 0;
                                this.isLocking = false;
                            }
                        }
                    }
                }
            }

            if (type === SPECIAL_TYPES.DEMOLISHER) {
                let scanY = y + 3;
                while (scanY < ROWS) {
                    if (scanY >= 0 && this.field.grid[scanY] && this.field.grid[scanY][x] !== EMPTY) {
                        // Don't destroy frozen blocks
                        if (!this.field.isFrozen(scanY, x)) {
                            this.field.grid[scanY][x] = EMPTY;
                            this.score += 50;
                            this.lockTimer = 0;
                            this.isLocking = false;

                            // Force fall after shooting to avoid floating
                            this.move(0, 1);
                        }
                        break;
                    }
                    scanY++;
                }
            }

            this.updateGhost();
        } catch (e) {
            console.error("Special Action Error:", e);
        }
    }
}
