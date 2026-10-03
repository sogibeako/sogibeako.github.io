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
 * Heptomino Definitions — 7セルのポリオミノ
 *
 * テトロミノと同じ形式: rotations配列に回転状態をAAで記述。
 * 定義済みのものだけがbagに入ります。追加は自由に。
 *
 * ※ キーに "H7_" プレフィックスを使用
 */

export const HEPTOMINOS = {
    // === 以下に定義を追加していく ===

    H7_I: {
        rotations: [
            // State 0
            parseAA(`
                #######
            `),
            // State 1 (CW)
            parseAA(`
                .....#.
                .....#.
                .....#.
                .....#.
                .....#.
                .....#.
                .....#.
            `),
            // State 2 (180)
            parseAA(`
                #######
            `),
            // State 3 (CCW)
            parseAA(`
                .#.....
                .#.....
                .#.....
                .#.....
                .#.....
                .#.....
                .#.....
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: 0 },
        preserveHeight: true
    },

    H7_2: {
        rotations: [
            // State 0
            parseAA(`
                #.....
                ######
            `),
            // State 1 (CW)
            parseAA(`
                ..##..
                ..#...
                ..#...
                ..#...
                ..#...
                ..#...
            `),
            // State 2 (180)
            parseAA(`
                ######
                .....#
            `),
            // State 3 (CCW)
            parseAA(`
                ...#..
                ...#..
                ...#..
                ...#..
                ...#..
                ...#..
                ..##..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: 0 },
        preserveHeight: true
    },

    H7_2r: {
        rotations: [
            // State 0
            parseAA(`
                .....#
                ######
            `),
            // State 1 (CW)
            parseAA(`
                ..#...
                ..#...
                ..#...
                ..#...
                ..#...
                ..##..
            `),
            // State 2 (180)
            parseAA(`
                ######
                #.....
            `),
            // State 3 (CCW)
            parseAA(`
                ..##..
                ...#..
                ...#..
                ...#..
                ...#..
                ...#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: 0 },
        preserveHeight: true
    },

    H7_3: {
        rotations: [
            // State 0
            parseAA(`
                ....#.
                ######
            `),
            // State 1 (CW)
            parseAA(`
                ..#...
                ..#...
                ..#...
                ..#...
                ..##..
                ..#...
            `),
            // State 2 (180)
            parseAA(`
                ######
                .#....
            `),
            // State 3 (CCW)
            parseAA(`
                ...#..
                ..##..
                ...#..
                ...#..
                ...#..
                ...#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: 0 },
        preserveHeight: true
    },

    H7_3r: {
        rotations: [
            // State 0
            parseAA(`
                .#....
                ######
            `),
            // State 1 (CW)
            parseAA(`
                ..#...
                ..##..
                ..#...
                ..#...
                ..#...
                ..#...
            `),
            // State 2 (180)
            parseAA(`
                ######
                ....#.
            `),
            // State 3 (CCW)
            parseAA(`
                ...#..
                ...#..
                ...#..
                ...#..
                ..##..
                ...#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: 0 },
        preserveHeight: true
    },

    H7_4: {
        rotations: [
            // State 0
            parseAA(`
                ...#..
                ######
            `),
            // State 1 (CW)
            parseAA(`
                ..#...
                ..#...
                ..#...
                ..##..
                ..#...
                ..#...
            `),
            // State 2 (180)
            parseAA(`
                ######
                ..#...
            `),
            // State 3 (CCW)
            parseAA(`
                ...#..
                ...#..
                ..##..
                ...#..
                ...#..
                ...#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: 0 },
        preserveHeight: true
    },

    H7_4r: {
        rotations: [
            // State 0
            parseAA(`
                ..#...
                ######
            `),
            // State 1 (CW)
            parseAA(`
                ..#...
                ..#...
                ..##..
                ..#...
                ..#...
                ..#...
            `),
            // State 2 (180)
            parseAA(`
                ######
                ...#..
            `),
            // State 3 (CCW)
            parseAA(`
                ...#..
                ...#..
                ...#..
                ..##..
                ...#..
                ...#..
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 2, y: 0 },
        preserveHeight: true
    },

    H7_5: {
        rotations: [
            // State 0
            parseAA(`
                #....
                #....
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..###
                ..#..
                ..#..
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                ....#
                ....#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..#..
                ###..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_5r: {
        rotations: [
            // State 0
            parseAA(`
                ....#
                ....#
                #####
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                .#...
                .#...
                .#...
                .###.
            `),
            // State 2 (180)
            parseAA(`
                #####
                #....
                #....
            `),
            // State 3 (CCW)
            parseAA(`
                .###.
                ...#.
                ...#.
                ...#.
                ...#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_6: {
        rotations: [
            // State 0
            parseAA(`
                #....
                #....
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..###
                ..#..
                ..#..
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                ....#
                ....#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..#..
                ###..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_6r: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                ...#.
                #####
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                .#...
                .#...
                .###.
                .#...
            `),
            // State 2 (180)
            parseAA(`
                #####
                .#...
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ...#.
                .###.
                ...#.
                ...#.
                ...#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },



    H7_7: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                ..#..
                #####
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                .#...
                .###.
                .#...
                .#...
            `),
            // State 2 (180)
            parseAA(`
                #####
                ..#..
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                ...#.
                ...#.
                .###.
                ...#.
                ...#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_8: {
        rotations: [
            // State 0
            parseAA(`
                ##...
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..##.
                ..##.
                ..#..
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                ...##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                .##..
                .##..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_8r: {
        rotations: [
            // State 0
            parseAA(`
                ...##
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..##.
                ..##.
            `),
            // State 2 (180)
            parseAA(`
                #####
                ##...
            `),
            // State 3 (CCW)
            parseAA(`
                .##..
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

    H7_9: {
        rotations: [
            // State 0
            parseAA(`
                #.#..
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..##.
                ..#..
                ..##.
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                ..#.#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                .##..
                ..#..
                .##..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_9r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.#
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..##.
                ..#..
                ..##.
            `),
            // State 2 (180)
            parseAA(`
                #####
                #.#..
            `),
            // State 3 (CCW)
            parseAA(`
                .##..
                ..#..
                .##..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_10: {
        rotations: [
            // State 0
            parseAA(`
                #..#.
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..##.
                ..#..
                ..#..
                ..##.
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                .#..#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                .##..
                ..#..
                ..#..
                .##..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_10r: {
        rotations: [
            // State 0
            parseAA(`
                .#..#
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..##.
                ..#..
                ..#..
                ..##.
            `),
            // State 2 (180)
            parseAA(`
                #####
                #.#..
            `),
            // State 3 (CCW)
            parseAA(`
                .##..
                ..#..
                ..#..
                .##..
                ..#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_11: {
        rotations: [
            // State 0
            parseAA(`
                #...#
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..##.
                ..#..
                ..#..
                ..#..
                ..##.
            `),
            // State 2 (180)
            parseAA(`
                #####
                #...#
            `),
            // State 3 (CCW)
            parseAA(`
                .##..
                ..#..
                ..#..
                ..#..
                .##..
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_12: {
        rotations: [
            // State 0
            parseAA(`
                ..##.
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..##.
                ..##.
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                .##..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                .##..
                .##..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_12r: {
        rotations: [
            // State 0
            parseAA(`
                .##..
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..##.
                ..##.
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                ..##.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                .##..
                .##..
                ..#..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_13: {
        rotations: [
            // State 0
            parseAA(`
                .#.#.
                #####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..##.
                ..#..
                ..##.
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                #####
                .#.#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                .##..
                ..#..
                .##..
                ..#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_14: {
        rotations: [
            // State 0
            parseAA(`
                #...
                #...
                #...
                ####
            `),
            // State 1 (CW)
            parseAA(`
                ####
                #...
                #...
                #...
            `),
            // State 2 (180)
            parseAA(`
                ####
                ...#
                ...#
                ...#
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ...#
                ...#
                ####
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_15: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .#..
                .#..
                ####
            `),
            // State 1 (CW)
            parseAA(`
                #...
                ####
                #...
                #...
            `),
            // State 2 (180)
            parseAA(`
                ####
                ..#.
                ..#.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ...#
                ####
                ...#
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_15r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..#.
                ..#.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                #...
                #...
                ####
                #...
            `),
            // State 2 (180)
            parseAA(`
                ####
                .#..
                .#..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ####
                ...#
                ...#
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_16: {
        rotations: [
            // State 0
            parseAA(`
                #...
                ##..
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .###
                .##.
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ..##
                ...#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                .##.
                ###.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_16r: {
        rotations: [
            // State 0
            parseAA(`
                ...#
                ..##
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .##.
                .###
            `),
            // State 2 (180)
            parseAA(`
                ####
                ##..
                #...
            `),
            // State 3 (CCW)
            parseAA(`
                ###.
                .##.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_17: {
        rotations: [
            // State 0
            parseAA(`
                #...
                #.#.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .###
                .#..
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .#.#
                ...#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                ..#.
                ###.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_17r: {
        rotations: [
            // State 0
            parseAA(`
                ...#
                .#.#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                .#..
                .###
            `),
            // State 2 (180)
            parseAA(`
                ####
                #.#.
                #...
            `),
            // State 3 (CCW)
            parseAA(`
                ###.
                ..#.
                .##.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_18: {
        rotations: [
            // State 0
            parseAA(`
                #...
                #..#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .###
                .#..
                .#..
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                #..#
                ...#
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ..#.
                ..#.
                ###.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_18r: {
        rotations: [
            // State 0
            parseAA(`
                ...#
                #..#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .#..
                .#..
                .###
            `),
            // State 2 (180)
            parseAA(`
                ####
                #..#
                #...
            `),
            // State 3 (CCW)
            parseAA(`
                ###.
                ..#.
                ..#.
                .##.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_19: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ##..
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .###
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ..##
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                ###.
                .##.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_19r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..##
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .###
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                ##..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ###.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_20: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                #.#.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .#..
                .###
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .#.#
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ###.
                ..#.
                .##.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_20r: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .#.#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .###
                .#..
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                #.#.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ..#.
                ###.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_21: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .##.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .###
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .##.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                ###.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_21r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .##.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                .###
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .##.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ###.
                .##.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_22: {
        rotations: [
            // State 0
            parseAA(`
                ###.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .##.
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .###
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                .##.
                .##.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_22r: {
        rotations: [
            // State 0
            parseAA(`
                .###
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                .##.
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                .###
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                .##.
                .##.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_23: {
        rotations: [
            // State 0
            parseAA(`
                ##.#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .##.
                .#..
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                #.##
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ..#.
                .##.
                .##.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_23r: {
        rotations: [
            // State 0
            parseAA(`
                #.##
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                .#..
                .##.
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ####
                ##.#
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                .##.
                ..#.
                .##.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_24: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                #...
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .###
                .#.#
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ...#
                ..##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                #.#.
                ###.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_24r: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ...#
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .#.#
                .###
            `),
            // State 2 (180)
            parseAA(`
                ####
                #...
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                ###.
                #.#.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_25: {
        rotations: [
            // State 0
            parseAA(`
                .##.
                .#..
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .###
                .#.#
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ..#.
                .##.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                #.#.
                ###.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_25r: {
        rotations: [
            // State 0
            parseAA(`
                .##.
                ..#.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#.#
                .###
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                .#..
                .##.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ###.
                #.#.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_26: {
        rotations: [
            // State 0
            parseAA(`
                ##...
                .#...
                .####
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                .###.
                .#...
                .#...
                .#...
            `),
            // State 2 (180)
            parseAA(`
                ####.
                ...#.
                ...##
            `),
            // State 3 (CCW)
            parseAA(`
                ...#.
                ...#.
                ...#.
                .###.
                .#...
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_26r: {
        rotations: [
            // State 0
            parseAA(`
                ...##
                ...#.
                ####.
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                .#...
                .#...
                .###.
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                .####
                .#...
                ##...
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                .###.
                ...#.
                ...#.
                ...#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_27: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ..#.
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .#..
                .###
                .#.#
            `),
            // State 2 (180)
            parseAA(`
                ####
                .#..
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #.#.
                ###.
                ..#.
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_27r: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                .#..
                ####
            `),
            // State 1 (CW)
            parseAA(`
                .#.#
                .###
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ####
                ..#.
                ..##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                ###.
                #.#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_28: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                ##...
                .####
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                .###.
                .#...
                .#...
                .#...
            `),
            // State 2 (180)
            parseAA(`
                ####.
                ...##
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                ...#.
                ...#.
                ...#.
                .###.
                ..#..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_28r: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                ...##
                ####.
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                .#...
                .#...
                .###.
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                .####
                ##...
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                .###.
                ...#.
                ...#.
                ...#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_29: {
        rotations: [
            // State 0
            parseAA(`
                ##....
                .#####
            `),
            // State 1 (CW)
            parseAA(`
                ....#.
                ...##.
                ...#..
                ...#..
                ...#..
                ...#..
            `),
            // State 2 (180)
            parseAA(`
                #####.
                ....##
            `),
            // State 3 (CCW)
            parseAA(`
                ..#...
                ..#...
                ..#...
                ..#...
                .##...
                .#....
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_29r: {
        rotations: [
            // State 0
            parseAA(`
                ....##
                #####.
            `),
            // State 1 (CW)
            parseAA(`
                ...#..
                ...#..
                ...#..
                ...#..
                ...##.
                ....#.
            `),
            // State 2 (180)
            parseAA(`
                .#####
                ##....
            `),
            // State 3 (CCW)
            parseAA(`
                .#....
                .##...
                ..#...
                ..#...
                ..#...
                ..#...
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_30: {
        rotations: [
            // State 0
            parseAA(`
                ###...
                ..####
            `),
            // State 1 (CW)
            parseAA(`
                ....#.
                ....#.
                ...##.
                ...#..
                ...#..
                ...#..
            `),
            // State 2 (180)
            parseAA(`
                ####..
                ...###
            `),
            // State 3 (CCW)
            parseAA(`
                ..#...
                ..#...
                ..#...
                .##...
                .#....
                .#....
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_30r: {
        rotations: [
            // State 0
            parseAA(`
                ...###
                ####..
            `),
            // State 1 (CW)
            parseAA(`
                ...#..
                ...#..
                ...#..
                ...##.
                ....#.
                ....#.
            `),
            // State 2 (180)
            parseAA(`
                ..####
                ###...
            `),
            // State 3 (CCW)
            parseAA(`
                .#....
                .#....
                .##...
                ..#...
                ..#...
                ..#...
            `),
        ],
        color: COLORS.I,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_31: {
        rotations: [
            // State 0
            parseAA(`
                ###..
                .####
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                ..##.
                ..##.
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ####.
                ..###
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                .##..
                .##..
                .#...
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_31r: {
        rotations: [
            // State 0
            parseAA(`
                ..###
                ####.
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..##.
                ..##.
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                .####
                ###..
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                .##..
                .##..
                ..#..
                ..#..
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_32: {
        rotations: [
            // State 0
            parseAA(`
                #....
                ##...
                .####
            `),
            // State 1 (CW)
            parseAA(`
                ...##
                ..##.
                ..#..
                ..#..
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ####.
                ...##
                ....#
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                .##..
                ##...
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_32r: {
        rotations: [
            // State 0
            parseAA(`
                ....#
                ...##
                ####.
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..##.
                ...##
            `),
            // State 2 (180)
            parseAA(`
                .####
                ##...
                #....
            `),
            // State 3 (CCW)
            parseAA(`
                ##...
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

    H7_33: {
        rotations: [
            // State 0
            parseAA(`
                .###.
                ..#..
                ..#..
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ....#
                #####
                ....#
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..#..
                .###.
            `),
            // State 3 (CCW)
            parseAA(`
                #....
                #####
                #....
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_34: {
        rotations: [
            // State 0
            parseAA(`
                ..##.
                .##..
                ..#..
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                #####
                ....#
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..#..
                ..##.
                .##..
            `),
            // State 3 (CCW)
            parseAA(`
                #....
                #####
                .#...
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_34r: {
        rotations: [
            // State 0
            parseAA(`
                .##..
                ..##.
                ..#..
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ....#
                #####
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..#..
                .##..
                ..##.
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                #####
                #....
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_35: {
        rotations: [
            // State 0
            parseAA(`
                ..##.
                ..#..
                .##..
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                #####
                ....#
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..##.
                ..#..
                .##..
            `),
            // State 3 (CCW)
            parseAA(`
                #....
                #####
                ..#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_35r: {
        rotations: [
            // State 0
            parseAA(`
                .##..
                ..#..
                ..##.
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ....#
                #####
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                .##..
                ..#..
                ..##.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                #####
                #....
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_36: {
        rotations: [
            // State 0
            parseAA(`
                ..##.
                ..#..
                ..#..
                .##..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                #####
                ....#
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..##.
                ..#..
                ..#..
                .##..
            `),
            // State 3 (CCW)
            parseAA(`
                #....
                #####
                ...#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_36r: {
        rotations: [
            // State 0
            parseAA(`
                .##..
                ..#..
                ..#..
                ..##.
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ....#
                #####
                .#...
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                .##..
                ..#..
                ..#..
                ..##.
            `),
            // State 3 (CCW)
            parseAA(`
                ...#.
                #####
                #....
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_37: {
        rotations: [
            // State 0
            parseAA(`
                ..##.
                ..#..
                ..#..
                ..#..
                .##..
            `),
            // State 1 (CW)
            parseAA(`
                #....
                #####
                ....#
            `),
            // State 2 (180)
            parseAA(`
                ..##.
                ..#..
                ..#..
                ..#..
                .##..
            `),
            // State 3 (CCW)
            parseAA(`
                #....
                #####
                ....#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_37r: {
        rotations: [
            // State 0
            parseAA(`
                .##..
                ..#..
                ..#..
                ..#..
                ..##.
            `),
            // State 1 (CW)
            parseAA(`
                ....#
                #####
                #....
            `),
            // State 2 (180)
            parseAA(`
                .##..
                ..#..
                ..#..
                ..#..
                ..##.
            `),
            // State 3 (CCW)
            parseAA(`
                ....#
                #####
                #....
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_38: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                ..#..
                .###.
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                #####
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                .###.
                ..#..
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                #####
                ..#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_39: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                ..##.
                .##..
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                #####
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..##.
                .##..
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                #####
                ..#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_39r: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                .##..
                ..##.
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                #####
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..##.
                .##..
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                #####
                ..#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_40: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                ..##.
                ..#..
                .##..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                #####
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..##.
                ..#..
                .##..
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                #####
                ...#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_40r: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                .##..
                ..#..
                ..##.
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                #####
                .#...
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..##.
                ..#..
                .##..
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                #####
                ...#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_41: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .#..
                ##..
                .###
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                ####
                #...
                #...
            `),
            // State 2 (180)
            parseAA(`
                ###.
                ..##
                ..#.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ...#
                ####
                ..#.
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_41r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..#.
                ..##
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                #...
                #...
                ####
                .#..
            `),
            // State 2 (180)
            parseAA(`
                .###
                ##..
                .#..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ####
                ...#
                ...#
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_42: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ##..
                .#..
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ####
                #...
                #...
            `),
            // State 2 (180)
            parseAA(`
                ###.
                ..#.
                ..##
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ...#
                ####
                .#..
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_42r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..##
                ..#.
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                #...
                #...
                ####
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .###
                .#..
                ##..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ####
                ...#
                ...#
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_43: {
        rotations: [
            // State 0
            parseAA(`
                ##..
                .#..
                .#..
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ...#
                ####
                #...
                #...
            `),
            // State 2 (180)
            parseAA(`
                ###.
                ..#.
                ..#.
                ..##
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ...#
                ####
                #...
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_43r: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ..#.
                ..#.
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                #...
                #...
                ####
                ...#
            `),
            // State 2 (180)
            parseAA(`
                .###
                .#..
                .#..
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #...
                ####
                ...#
                ...#
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_44: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..#.
                ###.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ...#
                ####
                ..#.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ##..
                .###
                .#..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .#..
                ####
                #...
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_44r: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .#..
                .###
                ##..
            `),
            // State 1 (CW)
            parseAA(`
                #...
                ####
                .#..
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ..##
                ###.
                ..#.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ..#.
                ####
                ...#
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_45: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ####
                .#..
                .#..
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ####
                ..#.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ..#.
                ..#.
                ####
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .#..
                ####
                .#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_46: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .###
                ##..
                .#..
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                ####
                ..#.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ..#.
                ..##
                ###.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .#..
                ####
                ..#.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_46r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ###.
                ..##
                ..#.
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..#.
                ####
                .#..
            `),
            // State 2 (180)
            parseAA(`
                .#..
                ##..
                .###
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ####
                .#..
                .#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_47: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .###
                .#..
                ##..
            `),
            // State 1 (CW)
            parseAA(`
                #...
                ####
                ..#.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                ..##
                ..#.
                ###.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .#..
                ####
                ...#
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_47r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ###.
                ..#.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ..#.
                ####
                #...
            `),
            // State 2 (180)
            parseAA(`
                ##..
                .#..
                .###
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ####
                .#..
                .#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_48: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..#.
                ..##
                .###
            `),
            // State 1 (CW)
            parseAA(`
                #...
                ####
                ##..
            `),
            // State 2 (180)
            parseAA(`
                ###.
                ##..
                .#..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..##
                ####
                ...#
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_48r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..#.
                .##.
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ##..
                ####
                #...
            `),
            // State 2 (180)
            parseAA(`
                ###.
                .##.
                .#..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ####
                ..##
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_49: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..#.
                .###
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                ####
                ##..
            `),
            // State 2 (180)
            parseAA(`
                ##..
                ###.
                .#..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..##
                ####
                ..#.
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_49r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..#.
                .###
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                ##..
                ####
                .#..
            `),
            // State 2 (180)
            parseAA(`
                .##.
                ###.
                .#..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ####
                ..##
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_50: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .##.
                ..##
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ####
                ##..
            `),
            // State 2 (180)
            parseAA(`
                ##..
                ##..
                .##.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..##
                ####
                .#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_50r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..##
                .##.
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                ##..
                ####
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .##.
                .##.
                ##..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ####
                ..##
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_51: {
        rotations: [
            // State 0
            parseAA(`
                .##.
                ..#.
                ..##
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ...#
                ####
                ##..
            `),
            // State 2 (180)
            parseAA(`
                ##..
                ##..
                .#..
                .##.
            `),
            // State 3 (CCW)
            parseAA(`
                ..##
                ####
                #...
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_51r: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ..#.
                .##.
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                ##..
                ####
                ...#
            `),
            // State 2 (180)
            parseAA(`
                .##.
                .##.
                .#..
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #...
                ####
                ..##
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_52: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .##.
                .##.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                .##.
                ####
                #...
            `),
            // State 2 (180)
            parseAA(`
                ##..
                .##.
                .##.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ####
                .##.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_52r: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                .##.
                .##.
                ##..
            `),
            // State 1 (CW)
            parseAA(`
                #...
                ####
                .##.
            `),
            // State 2 (180)
            parseAA(`
                ..##
                .##.
                .##.
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .##.
                ####
                ...#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_53: {
        rotations: [
            // State 0
            parseAA(`
                ...#
                ####
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                .##.
                .##.
                ..##
            `),
            // State 2 (180)
            parseAA(`
                .##.
                ####
                #...
            `),
            // State 3 (CCW)
            parseAA(`
                ##..
                .##.
                .##.
                .#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_53r: {
        rotations: [
            // State 0
            parseAA(`
                #...
                ####
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                ..##
                .##.
                .##.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .##.
                ####
                ...#
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .##.
                .##.
                ##..
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_54: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ####
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                .##.
                .###
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .##.
                ####
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ###.
                .##.
                .#..
            `),
        ],
        color: COLORS.L,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_54r: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ####
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                .###
                .##.
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .##.
                ####
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                .##.
                ###.
                .#..
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_55: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..##
                ..#.
                .###
            `),
            // State 1 (CW)
            parseAA(`
                #...
                ####
                #.#.
            `),
            // State 2 (180)
            parseAA(`
                ###.
                .#..
                ##..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#.#
                ####
                ...#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_55r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .##.
                ..#.
                .###
            `),
            // State 1 (CW)
            parseAA(`
                #.#.
                ####
                #...
            `),
            // State 2 (180)
            parseAA(`
                ###.
                .#..
                .##.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ####
                .#.#
            `),
        ],
        color: COLORS.J,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_56: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                ..##
                .##.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                ####
                #.#.
            `),
            // State 2 (180)
            parseAA(`
                ##..
                .##.
                ##..
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#.#
                ####
                ..#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_56r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .##.
                ..##
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                #.#.
                ####
                .#..
            `),
            // State 2 (180)
            parseAA(`
                .##.
                ##..
                .##.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ####
                .#.#
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_57: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .###
                ..#.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                ####
                #.#.
            `),
            // State 2 (180)
            parseAA(`
                ##..
                .#..
                ###.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#.#
                ####
                .#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_57r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .###
                ..#.
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                #.#.
                ####
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .##.
                .#..
                ###.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ####
                .#.#
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_58: {
        rotations: [
            // State 0
            parseAA(`
                .##.
                ..##
                ..#.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                ...#
                ####
                #.#.
            `),
            // State 2 (180)
            parseAA(`
                ##..
                .#..
                ##..
                .##.
            `),
            // State 3 (CCW)
            parseAA(`
                .#.#
                ####
                #...
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_58r: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                .##.
                ..#.
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                #.#.
                ####
                ...#
            `),
            // State 2 (180)
            parseAA(`
                .##.
                .#..
                .##.
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #...
                ####
                .#.#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_59: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ..#.
                ..#.
                .###
            `),
            // State 1 (CW)
            parseAA(`
                #...
                ####
                #..#
            `),
            // State 2 (180)
            parseAA(`
                ###.
                .#..
                .#..
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #..#
                ####
                ...#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_59r: {
        rotations: [
            // State 0
            parseAA(`
                .##.
                ..#.
                ..#.
                .###
            `),
            // State 1 (CW)
            parseAA(`
                #..#
                ####
                #...
            `),
            // State 2 (180)
            parseAA(`
                ###.
                .#..
                .#..
                .##.
            `),
            // State 3 (CCW)
            parseAA(`
                ...#
                ####
                #..#
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_60: {
        rotations: [
            // State 0
            parseAA(`
                ..##
                ..#.
                .##.
                ..##
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                ####
                #..#
            `),
            // State 2 (180)
            parseAA(`
                ##..
                .##.
                .#..
                ##..
            `),
            // State 3 (CCW)
            parseAA(`
                #..#
                ####
                ..#.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_60r: {
        rotations: [
            // State 0
            parseAA(`
                .##.
                ..#.
                ..##
                .##.
            `),
            // State 1 (CW)
            parseAA(`
                #..#
                ####
                .#..
            `),
            // State 2 (180)
            parseAA(`
                .##.
                ##..
                .#..
                .##.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                ####
                #..#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_61: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                .###.
                ..#..
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                ####.
                ...##
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..#..
                .###.
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ##...
                .####
                .#...
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_61r: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                .###.
                ..#..
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ...##
                ####.
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..#..
                .###.
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                .####
                ##...
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_62: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                ..##.
                .##..
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ####.
                ...##
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                ..##.
                .##..
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ##...
                .####
                ..#..
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_62r: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                .##..
                ..##.
                ..#..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ...##
                ####.
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..#..
                .##..
                ..##.
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                .####
                ##...
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_63: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                ..##.
                ..#..
                .##..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                ####.
                ...##
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..##.
                ..#..
                .##..
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ##...
                .####
                ...#.
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_63r: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                .##..
                ..#..
                ..##.
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ...##
                ####.
                .#...
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                .##..
                ..#..
                ..##.
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                ...#.
                .####
                ##...
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_64: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                ..##.
                ..#..
                ..#..
                .##..
            `),
            // State 1 (CW)
            parseAA(`
                #....
                ####.
                ...##
            `),
            // State 2 (180)
            parseAA(`
                ..##.
                ..#..
                ..#..
                .##..
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ##...
                .####
                ....#
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_64r: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                .##..
                ..#..
                ..#..
                ..##.
            `),
            // State 1 (CW)
            parseAA(`
                ...##
                ####.
                #....
            `),
            // State 2 (180)
            parseAA(`
                .##..
                ..#..
                ..#..
                ..##.
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                ....#
                .####
                ##...
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_64: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                ..##.
                ..#..
                ..##.
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                ####.
                .#.##
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                .##..
                ..#..
                .##..
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ##.#.
                .####
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_64r: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                .##..
                ..#..
                .##..
                ..#..
            `),
            // State 1 (CW)
            parseAA(`
                .#.##
                ####.
            `),
            // State 2 (180)
            parseAA(`
                ..#..
                ..##.
                ..#..
                ..##.
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                .####
                ##.#.
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_64: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                ..##.
                ..#..
                ..#..
                ..##.
            `),
            // State 1 (CW)
            parseAA(`
                ####.
                #..##
            `),
            // State 2 (180)
            parseAA(`
                .##..
                ..#..
                ..#..
                .##..
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ##..#
                .####
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_64r: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                .##..
                ..#..
                ..#..
                .##..
            `),
            // State 1 (CW)
            parseAA(`
                #..##
                ####.
            `),
            // State 2 (180)
            parseAA(`
                ..##.
                ..#..
                ..#..
                ..##.
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                .####
                ##..#
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_65: {
        rotations: [
            // State 0
            parseAA(`
                ...#.
                ...#.
                .###.
                .#...
                .#...
            `),
            // State 1 (CW)
            parseAA(`
                ###..
                ..#..
                ..###
            `),
            // State 2 (180)
            parseAA(`
                ...#.
                ...#.
                .###.
                .#...
                .#...
            `),
            // State 3 (CCW)
            parseAA(`
                ...#.
                ...#.
                .###.
                .#...
                .#...
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_65r: {
        rotations: [
            // State 0
            parseAA(`
                .#...
                .#...
                .###.
                ...#.
                ...#.
            `),
            // State 1 (CW)
            parseAA(`
                ..###
                ..#..
                ###..
            `),
            // State 2 (180)
            parseAA(`
                .#...
                .#...
                .###.
                ...#.
                ...#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..###
                ..#..
                ###..
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_66: {
        rotations: [
            // State 0
            parseAA(`
                ####.
                ...#.
                ..###
            `),
            // State 1 (CW)
            parseAA(`
                ...#.
                ...#.
                .#.#.
                .###.
                .#...
            `),
            // State 2 (180)
            parseAA(`
                ###..
                .#...
                .####
            `),
            // State 3 (CCW)
            parseAA(`
                ...#.
                .###.
                .#.#.
                .#...
                .#...
            `),
        ],
        color: COLORS.Z,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_66r: {
        rotations: [
            // State 0
            parseAA(`
                .####
                .#...
                ###..
            `),
            // State 1 (CW)
            parseAA(`
                .#...
                .###.
                .#.#.
                ...#.
                ...#.
            `),
            // State 2 (180)
            parseAA(`
                ..###
                ...#.
                ####.
            `),
            // State 3 (CCW)
            parseAA(`
                .#...
                .#...
                .#.#.
                .###.
                ...#.
            `),
        ],
        color: COLORS.S,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_67: {
        rotations: [
            // State 0
            parseAA(`
                ##.
                #.#
                ###
            `),
            // State 1 (CW)
            parseAA(`
                ###
                #.#
                ##.
            `),
            // State 2 (180)
            parseAA(`
                ###
                #.#
                .##
            `),
            // State 3 (CCW)
            parseAA(`
                .##
                #.#
                ###
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_67: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                ..#..
                .###.
                .#...
                .#...
            `),
            // State 1 (CW)
            parseAA(`
                ###..
                ..###
                ..#..
            `),
            // State 2 (180)
            parseAA(`
                ...#.
                ...#.
                .###.
                ..#..
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..#..
                ###..
                ..###
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_67r: {
        rotations: [
            // State 0
            parseAA(`
                ..#..
                ..#..
                .###.
                ...#.
                ...#.
            `),
            // State 1 (CW)
            parseAA(`
                ..#..
                ..###
                ###..
            `),
            // State 2 (180)
            parseAA(`
                .#...
                .#...
                .###.
                ..#..
                ..#..
            `),
            // State 3 (CCW)
            parseAA(`
                ..###
                ###..
                ..#..
            `),
        ],
        color: COLORS.T,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_68: {
        rotations: [
            // State 0
            parseAA(`
                .#..
                ###.
                .###
            `),
            // State 1 (CW)
            parseAA(`
                ..#.
                .###
                .##.
                .#..
            `),
            // State 2 (180)
            parseAA(`
                ###.
                .###
                ..#.
            `),
            // State 3 (CCW)
            parseAA(`
                ..#.
                .##.
                ###.
                .#..
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },

    H7_68r: {
        rotations: [
            // State 0
            parseAA(`
                ..#.
                .###
                ###.
            `),
            // State 1 (CW)
            parseAA(`
                .#..
                .##.
                .###
                ..#.
            `),
            // State 2 (180)
            parseAA(`
                .###
                ###.
                .#..
            `),
            // State 3 (CCW)
            parseAA(`
                .#..
                ###.
                .##.
                ..#.
            `),
        ],
        color: COLORS.O,
        spawnOffset: { x: 3, y: 0 },
        preserveHeight: true
    },



    // 他のヘプトミノはここに追加
};

/**
 * Heptomino class — Tetromino と同じインターフェース
 */
export class Heptomino {
    constructor(type) {
        this.type = type;
        const def = HEPTOMINOS[type];
        this.rotations = def.rotations;
        this.rotationIndex = 0;
        this.shape = JSON.parse(JSON.stringify(this.rotations[0]));
        this.colorClass = def.color;
        this.x = def.spawnOffset.x;
        this.y = def.spawnOffset.y;
        this.preserveHeight = def.preserveHeight !== false;
        this.isPoly = true;
        this.polySize = 7;
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
        const clone = new Heptomino(this.type);
        clone.x = this.x;
        clone.y = this.y;
        clone.rotationIndex = this.rotationIndex;
        clone.shape = JSON.parse(JSON.stringify(this.shape));
        return clone;
    }
}
