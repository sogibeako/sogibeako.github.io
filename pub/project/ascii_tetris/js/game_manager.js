import { Game } from './game.js';
import { InputHandler } from './input.js';
import { GAME_STATE } from './constants.js';

export class GameManager {
    constructor() {
        this.state = GAME_STATE.TITLE;
        this.input = new InputHandler();
        this.game = null;
        this.selectedMode = 0; // 0 = A
        this.modes = ['A', 'B', 'C', 'D'];    // Available modes
        this.startLevel = 1;   // Default start level

        // Game over data
        this.finalScore = 0;
        this.finalLevel = 0;
        this.finalLines = 0;
        this.gameOverKeyWait = false;
        this.gameOverReady = false;

        // DOM elements
        this.titleDisplay = document.getElementById('title-display');
        this.gameContainer = document.getElementById('game-container');

        this.animationId = null;
    }

    start() {
        this.showTitle();
        this.loop();
    }

    loop() {
        this.handleState();
        this.input.update();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    handleState() {
        switch (this.state) {
            case GAME_STATE.TITLE:
                this.handleTitle();
                break;
            case GAME_STATE.PLAYING:
                // Game runs its own loop
                break;
            case GAME_STATE.GAME_OVER:
                this.handleGameOver();
                break;
        }
    }

    showTitle() {
        this.state = GAME_STATE.TITLE;
        this.gameOverKeyWait = false;
        this.gameOverReady = false;
        this.titleDisplay.style.display = 'block';
        this.gameContainer.style.display = 'none';
        this.renderTitle();
    }

    renderTitle() {
        const isColdA = this._coldMode && this.modes[this.selectedMode] === 'A';
        const isBombC = this._coldMode && this.modes[this.selectedMode] === 'C';

        this.titleDisplay.classList.toggle('title-cold', isColdA);
        this.titleDisplay.classList.toggle('title-bomb', isBombC);

        const versionText =
            isColdA ? 'C O L D !' :
                isBombC ? 'B O M B !' :
                    'v 0 . 4';

        const ascii = [
            '  ╔═══════════════════════════════╗',
            '  ║                               ║',
            '  ║   ######## #### ########      ║',
            '  ║      ##    ##      ##         ║',
            '  ║      ##    ####    ##         ║',
            '  ║      ##    ##      ##         ║',
            '  ║      ##    ####    ##         ║',
            '  ║                               ║',
            '  ║   A S C I I   T E T R I S     ║',
            `  ║${this.centerInBox(versionText, 31)}║`,
            '  ║                               ║',
            '  ╠═══════════════════════════════╣',
            '  ║                               ║',
            '  ║   SELECT MODE:                ║',
            '  ║                               ║',
            ...this.renderModeListLines(),
            '  ║                               ║',
            `  ║   START LEVEL: ${String(this.startLevel).padStart(4, ' ')}           ║`,
            `  ║   [U/D] Mode  [L/R] Level     ║`,
            '  ║   [ENTER] Start               ║',
            '  ║                               ║',
            '  ╚═══════════════════════════════╝'
        ].join('\n');

        this.titleDisplay.textContent = ascii;
    }

    centerInBox(text, innerWidth) {
        const trimmed = text.trim();
        const pad = Math.max(0, innerWidth - trimmed.length);
        const left = Math.floor(pad / 2);
        const right = pad - left;
        return ' '.repeat(left) + trimmed + ' '.repeat(right);
    }

    renderModeListLines() {
        const modeDescriptions = {
            A: 'FROZEN BLOCKS',
            B: 'RISING GARBAGE',
            C: 'POLYOMINOES',
            D: 'BROKEN POLYOMINOES'
        };

        return ['A', 'B', 'C', 'D'].map((m, i) => {
            const isAvailable = this.modes.includes(m);
            const isSelected = i === this.selectedMode;
            const cursor = isSelected ? '> ' : '  ';
            const desc = isAvailable ? modeDescriptions[m] : '??????';
            const body = `   ${cursor}MODE ${m}: ${desc}`;
            return `  ║${body.padEnd(31, ' ')}║`;
        });
    }

    renderModeList() {
        const modeDescriptions = {
            'A': 'FROZEN BLOCKS',
            'B': 'RISING GARBAGE',
            'C': 'POLYOMINOES'
        };

        let html = '';
        const allModes = ['A', 'B', 'C'];
        for (let i = 0; i < allModes.length; i++) {
            const m = allModes[i];
            const isAvailable = this.modes.includes(m);
            const isSelected = i === this.selectedMode;
            const cursor = isSelected ? '> ' : '  ';
            const desc = modeDescriptions[m] || '';

            if (isAvailable) {
                const highlight = isSelected ? '<span style="color:#0ff;">' : '<span style="color:#888;">';
                html += `  ║   ${cursor}${highlight}MODE ${m}: ${desc}</span>${' '.repeat(Math.max(0, 17 - desc.length))}║\n`;
            } else {
                html += `  ║   ${cursor}<span style="color:#444;">MODE ${m}: ??????</span>${' '.repeat(Math.max(0, 17 - 6))}║\n`;
            }
        }
        return html;
    }

    handleTitle() {
        // Mode selection (Up/Down)
        if (this.input.isPressed('ArrowUp')) {
            this.selectedMode = (this.selectedMode - 1 + this.modes.length) % this.modes.length;
        }
        if (this.input.isPressed('ArrowDown')) {
            this.selectedMode = (this.selectedMode + 1) % this.modes.length;
        }

        // Start level adjustment (Left/Right)
        if (this.input.isPressed('ArrowLeft')) {
            this.startLevel = Math.max(1, this.startLevel - 100);
        }
        if (this.input.isPressed('ArrowRight')) {
            this.startLevel = Math.min(9999, this.startLevel + 100);
        }

        // Check A+B hidden mode (live visual feedback)
        const aDown = this.input.isDown('KeyA');
        const bDown = this.input.isDown('KeyB');
        this._coldMode = aDown && bDown;

        // Re-render title every frame (to show cold mode effect)
        this.renderTitle();

        // Start game
        if (this.input.isPressed('Enter')) {
            if (this._coldMode) {
                if (this.modes[this.selectedMode] === 'A') {
                    alert("What a cold day today!");
                    this.startGame(true, false);
                } else if (this.modes[this.selectedMode] === 'C') {
                    alert("Smells like gunpowder..."); // BOMB mode
                    this.startGame(false, true);
                } else {
                    this.startGame(false, false);
                }
            } else {
                this.startGame(false, false);
            }
        }
    }

    startGame(freezeFromStart = false, explosiveFromStart = false) {
        this.state = GAME_STATE.PLAYING;
        this.titleDisplay.style.display = 'none';
        this.gameContainer.style.display = 'flex';

        console.log('Starting game. freeze:', freezeFromStart, 'explosive:', explosiveFromStart);
        const selectedModeName = this.modes[this.selectedMode];
        this.game = new Game(this.startLevel, {
            freezeFromStart,
            explosiveFromStart,
            mode: selectedModeName
        });
        this.game.onGameOver = (score, level, lines) => {
            this.finalScore = score;
            this.finalLevel = level;
            this.finalLines = lines;
            this.gameOverKeyWait = false;
            this.state = GAME_STATE.GAME_OVER;
            this.renderGameOver();
        };
        this.game.start();
    }

    renderGameOver() {
        // Show game over screen on the game display
        const gameDisplay = document.getElementById('game-display');
        const ascii = `


      ╔═════════════════╗
      ║                 ║
      ║   GAME  OVER    ║
      ║                 ║
      ║  SCORE: ${String(this.finalScore).padStart(7, ' ')}  ║
      ║  LEVEL: ${String(this.finalLevel).padStart(7, ' ')}  ║
      ║  LINES: ${String(this.finalLines).padStart(7, ' ')}  ║
      ║                 ║
      ║  PRESS ANY KEY  ║
      ║                 ║
      ╚═════════════════╝


`;
        gameDisplay.innerHTML = ascii;
    }

    handleGameOver() {
        if (!this.gameOverKeyWait) {
            // Wait a moment before accepting key press (prevent accidental skip)
            this.gameOverKeyWait = true;
            setTimeout(() => { this.gameOverReady = true; }, 500);
            return;
        }

        if (this.gameOverReady) {
            // Check for any key press
            if (this.input.anyKeyPressed()) {
                if (this.game) {
                    this.game.stop();
                    this.game = null;
                }
                this.showTitle();
            }
        }
    }
}
