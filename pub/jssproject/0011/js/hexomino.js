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
 * Hexomino Definitions — 6セルのポリオミノ
 *
 * テトロミノと同じ形式: rotations配列に回転状態をAAで記述。
 * 定義済みのものだけがbagに入ります。追加は自由に。
 *
 * ※ キーに "H6_" プレフィックスを使用
 * ※ レベル1300以降は「誘爆性」: 揃ったラインの上下1行も同時消去
 */

export const HEXOMINOS = {
    // === 以下に定義を追加していく ===

    H6_1: {
        rotations: [
            // State 0
            parseAA(`
                ######
            `),
            // State 1 (CW)
            parseAA(`
                ...#..
                ...#..
                ...#..
                ...#..
                ...#..
                ...#..
            `),
            // State 2 (180)
            parseAA(`
                ######
            `),
            // State 3 (CCW)
            parseAA(`
                ..#...
                ..#...
                ..#...
                ..#...
                ..#...
                ..#...
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: 0 },
        preserveHeight: true
    },

    H6_2: {
        rotations: [
            // State 0
            parseAA(`
                ....#
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..#..
                ..##.
            `),
            // State 2 (180)
            parseAA(`
                #####
                #....
            `),
            // State 3 (CCW)
            parseAA(`
                .##..
                ..#..
                ..#..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_2r: {
        rotations: [
            // State 0
            parseAA(`
                #....
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..##.
                ..#..
                ..#..
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                ....#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..#..
                .##..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_3: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..##.
                ..#..
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                .##..
                ..#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_3: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..##.
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                .##..
                ..#..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_4: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..##.
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                .##..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_5: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .##.
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                .##.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_5r: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .##.
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ..##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                .##.
                .##.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_6: {
        rotations: [
            // State 0
            parseAA(`
                #.#.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .#..
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .#.#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                ..#.
                .##.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_6r: {
        rotations: [
            // State 0
            parseAA(`
                .#.#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                .#..
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                #.#.
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ..#.
                .##.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_7: {
        rotations: [
            // State 0
            parseAA(`
                #..#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .#..
                .#..
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                #..#
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ..#.
                ..#.
                .##.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_8: {
        rotations: [
            // State 0
            parseAA(`
                ...#
                ...#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .#..
                .###
            `),
            // State 2 (180)
            parseAA(`
                ####
                #...
                #...
            `),
            // State 3 (CCW)
            parseAA(`
                ###.
                ..#.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_8r: {
        rotations: [
            // State 0
            parseAA(`
                #...
                #...
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .###
                .#..
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ...#
                ...#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                ..#.
                ###.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_9: {
        rotations: [
            // State 0
            parseAA(`
                .##.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .##.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                .##.
                ..#.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_10: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .#..
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .###
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ..#.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                ###.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_10r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..#.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .###
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .#..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ###.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_11: {
        rotations: [
            // State 0
            parseAA(`
                ....
                ...#
                ####
                ...#
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..#.
                ..#.
                .###
            `),
            // State 2 (180)
            parseAA(`
                ....
                #...
                ####
                #...
            `),
            // State 3 (CCW)
            parseAA(`
                ###.
                .#..
                .#..
                .#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_12: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ####
                ...#
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..#.
                ..##
                .##.
            `),
            // State 2 (180)
            parseAA(`
                #...
                ####
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ##..
                .#..
                .#..
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_12r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ####
                #...
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                ..#.
                ..##
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ...#
                ####
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ##..
                .#..
                .##.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_13: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ####
                ...#
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..##
                ..#.
                .##.
            `),
            // State 2 (180)
            parseAA(`
                #...
                ####
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                .#..
                ##..
                .#..
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_13r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ####
                #...
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                ..#.
                ..##
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ...#
                ####
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .#..
                ##..
                .##.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_14: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ..#.
                ..#.
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                #...
                ####
                ...#
            `),
            // State 2 (180)
            parseAA(`
                .##.
                .#..
                .#..
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #...
                ####
                ...#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_15r: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                .#..
                .#..
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                ...#
                ####
                #...
            `),
            // State 2 (180)
            parseAA(`
                .##.
                ..#.
                ..#.
                ..##
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ####
                #...
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_16: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ####
                ..#.
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..##
                .##.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .#..
                ####
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .##.
                ##..
                .#..
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_16r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ####
                .#..
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                .##.
                ..##
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ..#.
                ####
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ##..
                .##.
                .#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 }, // 横幅6以上なら2, 5以下なら3 
        preserveHeight: true
    },

    H6_17: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .###
                ..#.
                ..#.
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ####
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .#..
                .#..
                ###.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ####
                .#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_18: {
        rotations: [
            // State 0
            parseAA(`
                ...##
                ####.
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..##.
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                .####
                ##...
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                .##..
                ..#..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_18r: {
        rotations: [
            // State 0
            parseAA(`
                ##...
                .####
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                ..##.
                ..#..
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ####.
                ...##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                .##..
                .#...
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_19: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ##..
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                .###
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ###.
                ..##
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                ###.
                .#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_19r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..##
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .###
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .###
                ##..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ###.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_20: {
        rotations: [
            // State 0
            parseAA(`
                ##.#
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                .##.
                .#..
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ###.
                #.##
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ..#.
                .##.
                .#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_20r: {
        rotations: [
            // State 0
            parseAA(`
                #.##
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .#..
                .##.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .###
                ##.#
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .##.
                ..#.
                .##.
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_21: {
        rotations: [
            // State 0
            parseAA(`
                ..###
                ###..
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..##.
                ...#.
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                ..###
                ###..
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                .#...
                .##..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_21r: {
        rotations: [
            // State 0
            parseAA(`
                ###..
                ..###
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                ...#.
                ..##.
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ###..
                ..###
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                .##..
                .#...
                .#...
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_22: {
        rotations: [
            // State 0
            parseAA(`
                ###.
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                .##.
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ###.
                .###
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                .##.
                .#..
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_22r: {
        rotations: [
            // State 0
            parseAA(`
                .###
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                .##.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .###
                ###.
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .##.
                .##.
                ..#.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_23: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ###.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..#.
                .###
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ....
                ##..
                .###
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ###.
                .#..
                .#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_23r: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .###
                ##..
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .###
                ..#.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ....
                ..##
                ###.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .#..
                ###.
                ..#.
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_24: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ###.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..##
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ....
                ##..
                .###
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                ##..
                .#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_24r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .###
                ##..
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                ..##
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ..##
                ###.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ##..
                .##.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_25: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                .#..
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                .###
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ###.
                ..#.
                ..##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                ###.
                #...
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_25r: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ..#.
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .###
                ...#
            `),
            // State 2 (180)
            parseAA(`
                .###
                .#..
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #...
                ###.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_26: {
        rotations: [
            // State 0
            parseAA(`
                #...
                ##..
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ..##
                .##.
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ###.
                ..##
                ...#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                .##.
                ##..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_26r: {
        rotations: [
            // State 0
            parseAA(`
                ...#
                ..##
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .##.
                ..##
            `),
            // State 2 (180)
            parseAA(`
                .###
                ##..
                #...
            `),
            // State 3 (CCW)
            parseAA(`
                ##..
                .##.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_27: {
        rotations: [
            // State 0
            parseAA(`
                ###
                ###
            `),
            // State 1 (CW)
            parseAA(`
                .##
                .##
                .##
            `),
            // State 2 (180)
            parseAA(`
                ###
                ###
            `),
            // State 3 (CCW)
            parseAA(`
                ##.
                ##.
                ##.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_28: {
        rotations: [
            // State 0
            parseAA(`
                ..#
                .##
                ###
            `),
            // State 1 (CW)
            parseAA(`
                #..
                ##.
                ###
            `),
            // State 2 (180)
            parseAA(`
                ###
                ##.
                #..
            `),
            // State 3 (CCW)
            parseAA(`
                ###
                .##
                ..#
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_29: {
        rotations: [
            // State 0
            parseAA(`
                #..
                #.#
                ###
            `),
            // State 1 (CW)
            parseAA(`
                ###
                #..
                ##.
            `),
            // State 2 (180)
            parseAA(`
                ###
                #.#
                ..#
            `),
            // State 3 (CCW)
            parseAA(`
                .##
                ..#
                ###
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_29r: {
        rotations: [
            // State 0
            parseAA(`
                ..#
                #.#
                ###
            `),
            // State 1 (CW)
            parseAA(`
                ##.
                #..
                ###
            `),
            // State 2 (180)
            parseAA(`
                ###
                #.#
                #..
            `),
            // State 3 (CCW)
            parseAA(`
                ###
                ..#
                .##
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_30: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                .###
                ...#
            `),
            // State 1 (CW)
            parseAA(`
                ...#
                ..##
                ..#.
                .##.
            `),
            // State 2 (180)
            parseAA(`
                #...
                ###.
                ..##
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                .#..
                ##..
                #...
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_30r: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ###.
                #...
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                ..#.
                ..##
                ...#
            `),
            // State 2 (180)
            parseAA(`
                ...#
                .###
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #...
                ##..
                .#..
                .##.
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_31: {
        rotations: [
            // State 0
            parseAA(`
                ..#
                ###
                .##
            `),
            // State 1 (CW)
            parseAA(`
                .#.
                ##.
                ###
            `),
            // State 2 (180)
            parseAA(`
                ##.
                ###
                #..
            `),
            // State 3 (CCW)
            parseAA(`
                ###
                .##
                .#.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_31r: {
        rotations: [
            // State 0
            parseAA(`
                #..
                ###
                ##.
            `),
            // State 1 (CW)
            parseAA(`
                ###
                ##.
                .#.
            `),
            // State 2 (180)
            parseAA(`
                .##
                ###
                ..#
            `),
            // State 3 (CCW)
            parseAA(`
                .#.
                .##
                ###
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_32: {
        rotations: [
            // State 0
            parseAA(`
                .#.
                ###
                ##.
            `),
            // State 1 (CW)
            parseAA(`
                ##.
                ###
                .#.
            `),
            // State 2 (180)
            parseAA(`
                .##
                ###
                .#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#.
                ###
                .##
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_33: {
        rotations: [
            // State 0
            parseAA(`
                .##
                ##.
                ##.
            `),
            // State 1 (CW)
            parseAA(`
                ##.
                ###
                ..#
            `),
            // State 2 (180)
            parseAA(`
                .##
                .##
                ##.
            `),
            // State 3 (CCW)
            parseAA(`
                #..
                ###
                .##
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_33r: {
        rotations: [
            // State 0
            parseAA(`
                ##.
                .##
                .##
            `),
            // State 1 (CW)
            parseAA(`
                ..#
                ###
                ##.
            `),
            // State 2 (180)
            parseAA(`
                ##.
                ##.
                .##
            `),
            // State 3 (CCW)
            parseAA(`
                .##
                ###
                #..
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_34: {
        rotations: [
            // State 0
            parseAA(`
                .#.
                ###
                #.#
            `),
            // State 1 (CW)
            parseAA(`
                ##.
                .##
                ##.
            `),
            // State 2 (180)
            parseAA(`
                #.#
                ###
                .#.
            `),
            // State 3 (CCW)
            parseAA(`
                .##
                ##.
                .##
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_35: {
        rotations: [
            // State 0
            parseAA(`
                ..#
                ###
                #.#
            `),
            // State 1 (CW)
            parseAA(`
                ##.
                .#.
                ###
            `),
            // State 2 (180)
            parseAA(`
                #.#
                ###
                #..
            `),
            // State 3 (CCW)
            parseAA(`
                ###
                .#.
                .##
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_35r: {
        rotations: [
            // State 0
            parseAA(`
                #..
                ###
                #.#
            `),
            // State 1 (CW)
            parseAA(`
                ###
                .#.
                ##.
            `),
            // State 2 (180)
            parseAA(`
                #.#
                ###
                ..#
            `),
            // State 3 (CCW)
            parseAA(`
                .##
                .#.
                ###
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_36: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                .##.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ...#
                ..##
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ##..
                .##.
                ..##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                ##..
                #...
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H6_36r: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                .##.
                ##..
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                ..##
                ...#
            `),
            // State 2 (180)
            parseAA(`
                ..##
                .##.
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #...
                ##..
                .##.
                ..#.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    // 他のヘキソミノはここに追加
};

/**
 * Hexomino class — Tetromino と同じインターフェース
 */
export class Hexomino {
    constructor(type) {
        this.type = type;
        const def = HEXOMINOS[type];
        this.rotations = def.rotations;
        this.rotationIndex = 0;
        this.shape = JSON.parse(JSON.stringify(this.rotations[0]));
        this.colorClass = def.color;
        this.x = def.spawnOffset.x;
        this.y = def.spawnOffset.y;
        this.preserveHeight = def.preserveHeight !== false;
        this.isPoly = true;
        this.polySize = 6;
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
        const clone = new Hexomino(this.type);
        clone.x = this.x;
        clone.y = this.y;
        clone.rotationIndex = this.rotationIndex;
        clone.shape = JSON.parse(JSON.stringify(this.shape));
        return clone;
    }
}
