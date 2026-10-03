import { COLS, VISIBLE_ROWS, HIDDEN_ROWS, BLOCK, EMPTY, WALL, FLOOR, COLORS, FREEZE_START_LEVEL, SPEED_20G_LEVEL } from './constants.js';
import { getSpeedSettings } from './speed_curve.js';
import { TETROMINOS } from './tetromino.js';
import { SPECIAL_MINOS } from './special_minos.js';
import { PENTOMINOS } from './pentomino.js';
import { HEXOMINOS } from './hexomino.js';
import { HEPTOMINOS } from './heptomino.js';
import { BROKEN_MINOS } from './broken_minos.js';

export class Renderer {
    constructor() {
        this.gameDisplay = document.getElementById('game-display');
        this.nextDisplay = document.getElementById('next-display');
        this.holdDisplay = document.getElementById('hold-display');
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.linesEl = document.getElementById('lines');
        this.timeEl = document.getElementById('time');
        this.speedEl = document.getElementById('speed');
    }

    render(game) {
        this.renderField(game);
        this.renderStats(game);
        this.renderNext(game.nextQueue);
        this.renderHold(game.holdTetromino);
    }

    renderField(game) {
        const field = game.field;
        const active = game.activeTetromino;
        let ghost = game.ghostTetromino;

        // Hide ghost in 20G mode (Level 500+) to prevent visual confusion
        if (game.level >= SPEED_20G_LEVEL) {
            ghost = null;
        }
        // We will construct an HTML string
        let html = '';

        // Buffer to compose the frame
        // Initialize with field data
        const displayBuffer = [];

        for (let y = 0; y < field.rows; y++) {
            const isHidden = y < HIDDEN_ROWS;
            let rowHtml = isHidden
                ? '<span class="hidden-row"><span class="wall">' + WALL + '</span>'
                : '<span class="wall">' + WALL + '</span>';
            for (let x = 0; x < field.cols; x++) {
                let cell = field.grid[y][x];
                let char = cell === EMPTY ? EMPTY : BLOCK;
                let className = '';

                // If empty, check for ghost
                if (cell === EMPTY && ghost) {
                    // Check if ghost is here
                    if (x >= ghost.x && x < ghost.x + ghost.shape[0].length &&
                        y >= ghost.y && y < ghost.y + ghost.shape.length) {
                        const localX = x - ghost.x;
                        const localY = y - ghost.y;
                        if (ghost.shape[localY] && ghost.shape[localY][localX]) {
                            char = BLOCK;
                            className = COLORS.SHADOW;
                        }
                    }
                }

                // Check for active piece override
                if (active) {
                    if (x >= active.x && x < active.x + active.shape[0].length &&
                        y >= active.y && y < active.y + active.shape.length) {
                        const localX = x - active.x;
                        const localY = y - active.y;
                        if (active.shape[localY] && active.shape[localY][localX]) {
                            char = BLOCK;
                            className = active.colorClass;
                        }
                    }
                }

                // If it's a field block
                if (cell !== EMPTY && !className) {
                    if (typeof cell === 'string' && cell !== EMPTY) {
                        className = cell;
                    }
                }

                if (className) {
                    rowHtml += `<span class="${className}">${char}</span>`;
                } else {
                    rowHtml += char;
                }
            }
            rowHtml += '<span class="wall">' + WALL + '</span>';
            if (isHidden) rowHtml += '</span>'; // close hidden-row
            rowHtml += '\n';
            html += rowHtml;
        }

        // Add Floor
        html += ' ' + FLOOR.repeat(field.cols * 2 + 2) + ' \n';

        // Status line below the floor
        const fieldWidth = field.cols * 2 + 4; // walls + floor padding
        const statusLines = this.buildStatusLines(game);
        for (const line of statusLines) {
            // Center the text within the field width
            const padded = line.padStart(Math.floor((fieldWidth + line.length) / 2)).padEnd(fieldWidth);
            html += padded + '\n';
        }

        this.gameDisplay.innerHTML = html;
    }

    buildStatusLines(game) {
        const lines = [];

        // Line 1: Line clear message (shown during lineClearDelay)
        if (game.clearMessageTimer > 0 && game.clearMessage) {
            const isBig = game.clearMessage.includes('TETRIS') || game.clearMessage.includes('PERFECT');
            const colorClass = isBig ? 'color-flash' : 'color-special';
            lines.push(`<span class="${colorClass}">${game.clearMessage}</span>`);
        } else {
            lines.push('');
        }

        // Line 2: Mode-specific status
        if (game.mode === 'A' && (game.level >= FREEZE_START_LEVEL || game.freezeFromStart)) {
            lines.push(`<span class="color-frozen">❄ FREEZE</span>`);
        } else if (game.mode === 'B') {
            const settings = getSpeedSettings(game.level);
            if (settings.riseRate > 0) {
                const remaining = settings.riseRate - game.riseCounter;
                lines.push(`<span class="color-garbage">▲ RISE: ${remaining}</span>`);
            } else {
                lines.push('');
            }
        } else if (game.mode === 'C') {
            if (game.explosiveFromStart || game.level >= 1000) {
                lines.push(`<span class="color-flash">💥 EXPLOSIVE</span>`);
            } else {
                lines.push('');
            }
        } else {
            lines.push('');
        }

        return lines;
    }

    renderStats(game) {
        this.scoreEl.textContent = game.score;
        this.levelEl.textContent = game.level;
        this.linesEl.textContent = game.lines;
        this.speedEl.textContent = game.speed;

        // Time Formatting (mm:ss:cc)
        const totalCentiseconds = Math.floor(game.elapsedTime / 10);
        const cc = totalCentiseconds % 100;
        const totalSeconds = Math.floor(totalCentiseconds / 100);
        const ss = totalSeconds % 60;
        const mm = Math.floor(totalSeconds / 60);

        const pad = (n) => n.toString().padStart(2, '0');
        this.timeEl.textContent = `${pad(mm)}:${pad(ss)}:${pad(cc)}`;
    }

    renderNext(nextQueue) {
        // Render 4 next pieces
        let html = '';
        nextQueue.slice(0, 4).forEach(tetrominoType => {
            html += this.renderMini(tetrominoType) + '\n';
        });
        this.nextDisplay.innerHTML = html;
    }

    renderHold(holdTetromino) {
        if (holdTetromino) {
            this.holdDisplay.innerHTML = this.renderMini(holdTetromino);
        } else {
            this.holdDisplay.innerHTML = '';
        }
    }

    renderMini(type) {
        // Check all dictionaries
        const def = TETROMINOS[type] || SPECIAL_MINOS[type] || PENTOMINOS[type] || HEXOMINOS[type] || HEPTOMINOS[type] || BROKEN_MINOS[type];
        if (!type || !def) return '\n'.repeat(7);

        const shape = def.rotations ? def.rotations[0] : def.shape;
        const colorClass = def.color;
        let html = '';

        // Fixed 7 rows to prevent layout shift (max heptomino height)
        const fixedRows = 7;
        const shapeWidth = shape[0] ? shape[0].length : 4;

        for (let y = 0; y < fixedRows; y++) {
            let rowHtml = '';
            if (y < shape.length) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        rowHtml += `<span class="${colorClass}">${BLOCK}</span>`;
                    } else {
                        rowHtml += `<span class="empty">  </span>`;
                    }
                }
            } else {
                // Empty padding row (match width of shape)
                rowHtml += `<span class="empty">${'  '.repeat(shapeWidth)}</span>`;
            }
            html += rowHtml + '\n';
        }
        return html;
    }
}
