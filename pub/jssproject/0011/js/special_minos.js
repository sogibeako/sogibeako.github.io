import { COLORS } from './constants.js';

export const SPECIAL_MINOS = {
    BOMB: {
        name: 'BOMB',
        shape: [[1]],
        color: COLORS.SPECIAL,
        spawnOffset: { x: 4, y: 0 }
    },
    BUILDER: {
        name: 'BUILDER',
        shape: [[1], [1]], // 1x2 Vertical
        color: COLORS.SPECIAL,
        spawnOffset: { x: 4, y: 0 }
    },
    DEMOLISHER: {
        name: 'DEMOLISHER',
        shape: [[1], [1], [1]], // 1x3 Vertical
        color: COLORS.SPECIAL,
        spawnOffset: { x: 4, y: 0 }
    }
};

export class SpecialMino {
    constructor(type) {
        this.type = type;
        this.data = SPECIAL_MINOS[type];
        // Deep copy shape
        this.shape = JSON.parse(JSON.stringify(this.data.shape));
        this.colorClass = this.data.color;
        this.x = this.data.spawnOffset.x;
        this.y = this.data.spawnOffset.y;
        this.isSpecial = true;
        this.climbCount = 0; // Builder: max 5 climbs
    }

    clone() {
        const clone = new SpecialMino(this.type);
        clone.x = this.x;
        clone.y = this.y;
        clone.shape = JSON.parse(JSON.stringify(this.shape));
        return clone;
    }

    rotate(dir) {
        // Special minos don't rotate in traditional sense
        return false;
    }

    // Action method for Builder/Demolisher
    // Returns action result object or null
    action(type) {
        // Defined in Game class or here?
        // Logic depends on Field.
        // So Game class handles action logic.
        return null;
    }
}
