export const COLS = 10;
export const ROWS = 24; // 20 visible + 4 hidden
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 4;

export const BLOCK = '##';
export const EMPTY = ' .';
export const WALL = '|';
export const FLOOR = '=';

export const KEY = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    ROTATE_LEFT: 'KeyZ',
    ROTATE_RIGHT: 'KeyX',
    HOLD: 'KeyC'
};

export const COLORS = {
    I: 'color-i',
    L: 'color-j',
    J: 'color-l',
    O: 'color-o',
    T: 'color-t',
    S: 'color-s',
    Z: 'color-z',
    SPECIAL: 'color-special',
    FROZEN: 'color-frozen',
    GARBAGE: 'color-garbage',
    SHADOW: 'color-shadow',
    FLASH: 'color-flash'
};

export const SPECIAL_TYPES = {
    BOMB: 'BOMB',
    BUILDER: 'BUILDER',
    DEMOLISHER: 'DEMOLISHER'
};

export const LOCK_DELAY_BASE = 30; // Frames (assuming 60fps, so 0.5s)
export const LOCK_MAX_RESET = 15;  // Max number of resets allowed

// Mode A constants
export const FREEZE_DELAY = 8;       // Pieces until cold blocks freeze
export const FREEZE_START_LEVEL = 1300;
export const SPEED_20G_LEVEL = 500;

export const GAME_STATE = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};
