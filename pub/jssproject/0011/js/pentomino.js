import { COLORS } from './constants.js';

/**
 * AAテキストから回転行列に変換するヘルパー
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
 * Pentomino Definitions — 5セルのポリオミノ
 *
 * テトロミノと同じ形式: rotations配列に回転状態をAAで記述。
 * 定義済みのものだけがbagに入ります。追加は自由に。
 *
 * 標準的なペントミノは12種 (Free) / 18種 (One-sided):
 *   F, I, L, N, P, T, U, V, W, X, Y, Z
 *
 * ※ テトロミノとの名前衝突を避けるため、キーに "P5_" プレフィックスを使用
 */

export const PENTOMINOS = {
    // === 以下に定義を追加していく ===

    P5_I: {
        rotations: [
            // State 0
            parseAA(`
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: -4 },
        preserveHeight: true
    },

    P5_F1: {
        rotations: [
            // State 0
            parseAA(`
                .##
                ##.
                .#.
            `),
            // State 1 (CW),RT
            parseAA(`
                .#.
                ###
                ..#
            `),
            // State 2 (180)
            parseAA(`
                .#.
                .##
                ##.
            `),
            // State 3 (CCW),LT
            parseAA(`
                #..
                ###
                .#.
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_F2: {
        rotations: [
            // State 0
            parseAA(`
                ##.
                .##
                .#.
            `),
            // State 1 (CW),RT
            parseAA(`
                ..#
                ###
                .#.
            `),
            // State 2 (180)
            parseAA(`
                .#.
                ##.
                .##
            `),
            // State 3 (CCW),LT
            parseAA(`
                .#.
                ###
                #..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_L: {
        rotations: [
            // State 0
            parseAA(`
                ...#
                ####
            `),
            // State 1 (CW),RT
            parseAA(`
                .#..
                .#..
                .#..
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                #...
            `),
            // State 3 (CCW),LT
            parseAA(`
                .##.
                ..#.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_J: {
        rotations: [
            // State 0
            parseAA(`
                #...
                ####
            `),
            // State 1 (CW),RT
            parseAA(`
                .##.
                .#..
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ...#
            `),
            // State 3 (CCW),LT
            parseAA(`
                ..#.
                ..#.
                ..#.
                .##.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_N1: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                .###
            `),
            // State 1 (CW),RT
            parseAA(`
                ..#.
                .##.
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ###.
                ..##
            `),
            // State 3 (CCW),LT
            parseAA(`
                ..#.
                ..#.
                .##.
                .#..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_N2: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ###.
            `),
            // State 1 (CW),RT
            parseAA(`
                .#..
                .#..
                .##.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .###
                ##..
            `),
            // State 3 (CCW),LT
            parseAA(`
                .#..
                .##.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_T: {
        rotations: [
            // State 0
            parseAA(`
                ###
                .#.
                .#.
            `),
            // State 1 (CW)
            parseAA(`
                ..#
                ###
                ..#
            `),
            // State 2 (180)
            parseAA(`
                .#.
                .#.
                ###
            `),
            // State 3 (CCW)
            parseAA(`
                #..
                ###
                #..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_P1: {
        rotations: [
            // State 0
            parseAA(`
                .##
                ###
            `),
            // State 1 (CW)
            parseAA(`
                .#.
                .##
                .##
            `),
            // State 2 (180)
            parseAA(`
                ###
                ##.
            `),
            // State 3 (CCW)
            parseAA(`
                ##.
                ##.
                .#.
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_P2: {
        rotations: [
            // State 0
            parseAA(`
                ##.
                ###
            `),
            // State 1 (CW)
            parseAA(`
                .##
                .##
                .#.
            `),
            // State 2 (180)
            parseAA(`
                ###
                .##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#
                .##
                .##
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_U: {
        rotations: [
            // State 0
            parseAA(`
                #.#
                ###
            `),
            // State 1 (CW)
            parseAA(`
                .##
                .#.
                .##
            `),
            // State 2 (180)
            parseAA(`
                ###
                #.#
            `),
            // State 3 (CCW)
            parseAA(`
                ##.
                .#.
                ##.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_V: {
        rotations: [
            // State 0
            parseAA(`
                ..#
                ..#
                ###
            `),
            // State 1 (CW)
            parseAA(`
                #..
                #..
                ###
            `),
            // State 2 (180)
            parseAA(`
                ###
                #..
                #..
            `),
            // State 3 (CCW)
            parseAA(`
                ###
                ..#
                ..#
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_X: {
        rotations: [
            // State 0
            parseAA(`
                .#.
                ###
                .#.
            `),
            // State 1 (CW)
            parseAA(`
                .#.
                ###
                .#.
            `),
            // State 2 (180)
            parseAA(`
                .#.
                ###
                .#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#.
                ###
                .#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_W: {
        rotations: [
            // State 0
            parseAA(`
                ..#
                .##
                ##.
            `),
            // State 1 (CW)
            parseAA(`
                #..
                ##.
                .##
            `),
            // State 2 (180)
            parseAA(`
                .##
                ##.
                #..
            `),
            // State 3 (CCW)
            parseAA(`
                ##.
                .##
                ..#
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_W2: {
        rotations: [
            // State 0
            parseAA(`
                #..
                ##.
                .##
            `),
            // State 1 (CW)
            parseAA(`
                ..#
                .##
                ##.
            `),
            // State 2 (180)
            parseAA(`
                ##.
                .##
                ..#
            `),
            // State 3 (CCW)
            parseAA(`
                .##
                ##.
                #..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_Y1: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: false
    },

    P5_Y2: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                .##.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: false
    },

    P5_S: {
        rotations: [
            // State 0
            parseAA(`
                .##
                .#.
                ##.
            `),
            // State 1 (CW)
            parseAA(`
                #..
                ###
                ..#
            `),
            // State 2 (180)
            parseAA(`
                .##
                .#.
                ##.
            `),
            // State 3 (CCW)
            parseAA(`
                #..
                ###
                ..#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    P5_Z: {
        rotations: [
            // State 0
            parseAA(`
                ##.
                .#.
                .##
            `),
            // State 1 (CW)
            parseAA(`
                ..#
                ###
                #..
            `),
            // State 2 (180)
            parseAA(`
                ##.
                .#.
                .##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#
                ###
                #..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    // 他のペントミノはここに追加:
    // P5_F, P5_L, P5_N, P5_P, P5_U, P5_V, P5_W, P5_X, P5_Y, P5_Z
};

/**
 * Pentomino class — Tetromino と同じインターフェース
 */
export class Pentomino {
    constructor(type) {
        this.type = type;
        const def = PENTOMINOS[type];
        this.rotations = def.rotations;
        this.rotationIndex = 0;
        this.shape = JSON.parse(JSON.stringify(this.rotations[0]));
        this.colorClass = def.color;
        this.x = def.spawnOffset.x;
        this.y = def.spawnOffset.y;
        this.preserveHeight = def.preserveHeight !== false;
        this.isPoly = true;
        this.polySize = 5;
    }

    rotate(direction) {
        const count = this.rotations.length;
        this.rotationIndex = ((this.rotationIndex + direction) % count + count) % count;
        this.shape = JSON.parse(JSON.stringify(this.rotations[this.rotationIndex]));
    }

    getBottomRow() {
        for (let y = this.shape.length - 1; y >= 0; y--) {
            if (this.shape[y].some(c => c !== 0)) return y;
        }
        return 0;
    }

    clone() {
        const clone = new Pentomino(this.type);
        clone.x = this.x;
        clone.y = this.y;
        clone.rotationIndex = this.rotationIndex;
        clone.shape = JSON.parse(JSON.stringify(this.shape));
        return clone;
    }
}
