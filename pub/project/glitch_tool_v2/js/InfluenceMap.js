/**
 * InfluenceMap.js
 * Manages the influence (Float32Array) and protect (Uint8Array) maps.
 * Handles pen strokes and drawing logic.
 */

export class InfluenceMap {
    constructor(gridW, gridH) {
        this.resize(gridW, gridH);
    }

    resize(gridW, gridH) {
        this.gridW = gridW;
        this.gridH = gridH;
        this.influence = new Float32Array(gridW * gridH).fill(0);
        this.protect = new Uint8Array(gridW * gridH).fill(0);
    }

    getIndex(x, y) {
        if (x < 0 || x >= this.gridW || y < 0 || y >= this.gridH) return -1;
        return y * this.gridW + x;
    }

    /**
     * Applies a pen stroke to the influence map.
     * @param {number} cx Tile X (center)
     * @param {number} cy Tile Y (center)
     * @param {number} radius Radius in tiles
     * @param {number} strength Strength to add (0-1)
     * @param {string} type 'brush' or 'eraser' (not glitch eraser, but influence eraser)
     */
    strokeInfluence(cx, cy, radius, strength, type = 'brush') {
        const r = Math.ceil(radius);
        const rSq = radius * radius;

        for (let y = cy - r; y <= cy + r; y++) {
            for (let x = cx - r; x <= cx + r; x++) {
                const idx = this.getIndex(x, y);
                if (idx === -1) continue;

                if (this.protect[idx] === 1) continue; // Respect protect

                const dx = x - cx;
                const dy = y - cy;
                const dSq = dx * dx + dy * dy;

                if (dSq <= rSq) {
                    // Linear falloff for now, can be improved
                    const dist = Math.sqrt(dSq);
                    const falloff = Math.max(0, 1 - dist / radius);

                    if (type === 'brush') {
                        this.influence[idx] += strength * falloff;
                        // Clamp to some max, spec says influenceMax (e.g. 3.0)
                        // For now clamp to 3.0
                        if (this.influence[idx] > 3.0) this.influence[idx] = 3.0;
                    } else if (type === 'eraser') {
                        // Influence eraser
                        this.influence[idx] -= strength * falloff * 2.0; // Stronger erase
                        if (this.influence[idx] < 0) this.influence[idx] = 0;
                    }
                }
            }
        }
    }

    /**
     * Applies a pen stroke to the protect map.
     * @param {number} cx 
     * @param {number} cy 
     * @param {number} radius 
     * @param {boolean} value true=protect, false=unprotect
     */
    strokeProtect(cx, cy, radius, value) {
        const r = Math.ceil(radius);
        const rSq = radius * radius;
        const val = value ? 1 : 0;

        for (let y = cy - r; y <= cy + r; y++) {
            for (let x = cx - r; x <= cx + r; x++) {
                const idx = this.getIndex(x, y);
                if (idx === -1) continue;

                const dx = x - cx;
                const dy = y - cy;
                if (dx * dx + dy * dy <= rSq) {
                    this.protect[idx] = val;
                }
            }
        }
    }

    reset() {
        this.influence.fill(0);
        this.protect.fill(0);
    }

    cloneMaps() {
        return {
            influence: new Float32Array(this.influence),
            protect: new Uint8Array(this.protect)
        };
    }

    restoreMaps(influence, protect) {
        this.influence.set(influence);
        this.protect.set(protect);
    }

    /**
     * Applies a simple 3x3 box blur to the influence map.
     * @param {number} iterations 
     */
    blur(iterations = 1) {
        for (let k = 0; k < iterations; k++) {
            const temp = new Float32Array(this.influence);
            for (let y = 0; y < this.gridH; y++) {
                for (let x = 0; x < this.gridW; x++) {
                    const idx = y * this.gridW + x;
                    if (this.protect[idx] === 1) continue;

                    let sum = 0;
                    let count = 0;

                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy;
                            const nx = x + dx;
                            if (nx >= 0 && nx < this.gridW && ny >= 0 && ny < this.gridH) {
                                sum += temp[ny * this.gridW + nx];
                                count++;
                            }
                        }
                    }
                    this.influence[idx] = sum / count;
                }
            }
        }
    }

    /**
     * Applies a high-pass filter (edge detection style).
     * @param {number} gain 
     */
    highPass(gain = 1.0) {
        // Highpass = Original - Blurred
        const blurred = new Float32Array(this.influence);
        // Compute blur first (1 pass)
        for (let y = 0; y < this.gridH; y++) {
            for (let x = 0; x < this.gridW; x++) {
                let sum = 0;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (nx >= 0 && nx < this.gridW && ny >= 0 && ny < this.gridH) {
                            sum += this.influence[ny * this.gridW + nx];
                            count++;
                        }
                    }
                }
                blurred[y * this.gridW + x] = sum / count;
            }
        }

        for (let i = 0; i < this.influence.length; i++) {
            if (this.protect[i] === 1) continue;
            const hp = this.influence[i] - blurred[i];
            // Mode: Positive only or abs? Spec says "mode (abs / positive)".
            // Let's implement ABS for edges.
            this.influence[i] = Math.abs(hp) * gain * 2.0; // Boost a bit
            // Clamp?
            if (this.influence[i] > 3.0) this.influence[i] = 3.0;
        }
    }
}
