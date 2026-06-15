import { COLORS } from './constants.js';

/**
 * AAテキストから回転行列に変換するヘルパー
 *
 * 使い方:
 *   parseAA(`
 *     .#.
 *     ###
 *     ...
 *   `)
 *   → [[0,1,0],[1,1,1],[0,0,0]]
 *
 * 記法:
 *   . = 空 (0)
 *   # = ブロック (1)
 *   空行・先頭末尾の空白は自動で無視されます
 */
function parseAA(aa) {
    const lines = aa.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    return lines.map(line =>
        [...line].map(ch => (ch === '#') ? 1 : 0)
    );
}

/**
 * Tetromino Definitions with AA-based rotation states.
 *
 * 各ミノは `rotations` 配列に4つの回転状態を持つ。
 * AAでそのまま記述し、parseAA() で行列に変換する。
 *
 * 将来のペントミノ・ヘキソミノ等も同じ形式で追加可能:
 *   → 別ファイル polyominoes.js に同じ形式で定義
 */

export const TETROMINOS = {
    I: {
        rotations: [
            // State 0
            parseAA(`
                ####
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..#.
                ..#.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ####
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },
    J: {
        rotations: [
            // State 0
            parseAA(`
                #..
                ###
            `),
            // State 1 (CW)
            parseAA(`
                .##
                .#.
                .#.
            `),
            // State 2 (180)
            parseAA(`
                ###
                ..#
            `),
            // State 3 (CCW)
            parseAA(`
                .#.
                .#.
                ##.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },
    L: {
        rotations: [
            // State 0
            parseAA(`
                ..#
                ###
            `),
            // State 1 (CW)
            parseAA(`
                .#.
                .#.
                .##
            `),
            // State 2 (180)
            parseAA(`
                ###
                #..
            `),
            // State 3 (CCW)
            parseAA(`
                ##.
                .#.
                .#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },
    O: {
        rotations: [
            parseAA(`
                ##
                ##
            `),
            parseAA(`
                ##
                ##
            `),
            parseAA(`
                ##
                ##
            `),
            parseAA(`
                ##
                ##
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 4, y: 0 },
        preserveHeight: true
    },
    S: {
        rotations: [
            // State 0
            parseAA(`
                .##
                ##.
            `),
            // State 1 (CW)
            parseAA(`
                #..
                ##.
                .#.
            `),
            // State 2 (180)
            parseAA(`
                .##
                ##.
            `),
            // State 3 (CCW)
            parseAA(`
                #..
                ##.
                .#.
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },
    T: {
        rotations: [
            // State 0
            parseAA(`
                ###
                .#.
            `),
            // State 1 (CW)
            parseAA(`
                .#.
                ##.
                .#.
            `),
            // State 2 (180)
            parseAA(`
                ...
                .#.
                ###
            `),
            // State 3 (CCW)
            parseAA(`
                .#.
                .##
                .#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },
    Z: {
        rotations: [
            // State 0
            parseAA(`
                ##.
                .##
            `),
            // State 1 (CW)
            parseAA(`
                ..#
                .##
                .#.
            `),
            // State 2 (180)
            parseAA(`
                ##.
                .##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#
                .##
                .#.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },
    BLANK: {
        rotations: [
            parseAA(`
                ....
                ....
                ....
                ....
            `),
        ],
        color: 'color-blank',
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    }
};

export class Tetromino {
    constructor(type) {
        this.type = type;
        const def = TETROMINOS[type];
        this.rotations = def.rotations;
        this.rotationIndex = 0;
        this.shape = JSON.parse(JSON.stringify(this.rotations[0]));
        this.colorClass = def.color;
        this.x = def.spawnOffset.x;
        this.y = def.spawnOffset.y;
        this.preserveHeight = def.preserveHeight !== false;
    }

    /**
     * Rotate by switching to next/prev rotation state.
     * direction: 1 = CW, -1 = CCW
     */
    rotate(direction) {
        const count = this.rotations.length;
        this.rotationIndex = ((this.rotationIndex + direction) % count + count) % count;
        this.shape = JSON.parse(JSON.stringify(this.rotations[this.rotationIndex]));
    }

    /**
     * Get the lowest row (relative to shape) that has a block.
     */
    getBottomRow() {
        for (let y = this.shape.length - 1; y >= 0; y--) {
            if (this.shape[y].some(c => c !== 0)) return y;
        }
        return 0;
    }

    clone() {
        const clone = new Tetromino(this.type);
        clone.x = this.x;
        clone.y = this.y;
        clone.rotationIndex = this.rotationIndex;
        clone.shape = JSON.parse(JSON.stringify(this.shape));
        return clone;
    }
}
