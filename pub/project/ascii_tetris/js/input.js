export class InputHandler {
    constructor() {
        this.keys = {};
        this.pressed = {};
        this.down = {};
        this._anyPressed = false;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (!this.down[e.code]) {
                this.pressed[e.code] = true;
                this.down[e.code] = true;
                this._anyPressed = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.down[e.code] = false;
        });
    }

    isDown(code) {
        return !!this.keys[code];
    }

    isPressed(code) {
        return !!this.pressed[code];
    }

    anyKeyPressed() {
        return this._anyPressed;
    }

    update() {
        this.pressed = {};
        this._anyPressed = false;
    }
}
