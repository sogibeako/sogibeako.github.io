/**
 * GlitchEngine.js
 * Orchestrates the glitch process.
 */

import { TileOps } from './TileOps.js';

export class GlitchEngine {
    constructor() {
    }

    /**
     * Applies glitch effects to the tiles.
     * @param {object} params Configuration parameters (p1-p7, mode, etc.)
     * @param {object[]} currentTiles Array of current tiles
     * @param {Float32Array} influenceMap 
     * @param {Uint8Array} protectMap 
     * @param {number} gridW 
     * @param {number} gridH 
     * @param {number} tileSize 
     * @param {object[]} overlayTiles Array of overlay tiles (optional)
     * @returns {object[]} New array of tiles
     */
    static apply(params, currentTiles, influenceMap, protectMap, gridW, gridH, tileSize, overlayTiles = []) {
        const nextTiles = new Array(currentTiles.length);
        const influenceMax = 3.0; // as per spec

        // Process loop: y then x (to support Left->Right propagation)
        for (let y = 0; y < gridH; y++) {
            for (let x = 0; x < gridW; x++) {
                const idx = y * gridW + x;
                const currentTile = currentTiles[idx];

                // 1. Protect Logic
                if (protectMap[idx] === 1) {
                    nextTiles[idx] = TileOps.clone(currentTile, tileSize);
                    continue;
                }

                // 2. Influence & Probability Logic
                const inf = influenceMap[idx];
                let shouldProcess = true;
                let scale = 1.0;

                if (params.glitchMode === 'inpaint') {
                    if (inf <= 0) {
                        shouldProcess = false;
                    } else {
                        scale = Math.min(inf / influenceMax, 1.0);
                    }
                } else { // global
                    // Base prob + boost
                    // We'll apply boost in the prob calculation
                    scale = 1.0 + (inf * (params.boostScale || 0.8));
                }

                if (!shouldProcess) {
                    nextTiles[idx] = TileOps.clone(currentTile, tileSize);
                    continue;
                }

                // Calculate User Probabilities
                const p1 = Math.min(1, params.p1 * scale); // Random Replace
                const p2 = Math.min(1, params.p2 * scale); // Neighbor Copy
                const p3 = Math.min(1, params.p3 * scale); // Color Shift
                const p4 = Math.min(1, params.p4 * scale); // Rotate
                const p5 = Math.min(1, params.p5 * scale); // Overlay
                const p6 = Math.min(1, params.p6 * scale); // Overlay + Color
                const p7 = Math.min(1, params.p7 * scale); // Overlay + Rotate

                // Roulette Selection
                // We pick one effect or none
                // Sum of probs can exceed 1, so we normalize or simpler: check in order or random?
                // Spec says "Weighted roulette to select max 1 effect". 
                // Let's use a random value 0..Sum or 0..1 depending on whether we want "At most one" or "Always one if prob > 1".
                // Usually for these tools, independent checks or accumulated threshold is best.
                // Let's do accumulated threshold logic.

                const r = Math.random();
                let acc = 0;
                let selectedEffect = 0; // 0 = none

                if (r < (acc += p1)) selectedEffect = 1;
                else if (r < (acc += p2)) selectedEffect = 2;
                else if (r < (acc += p3)) selectedEffect = 3;
                else if (r < (acc += p4)) selectedEffect = 4;
                else if (r < (acc += p5)) selectedEffect = 5;
                else if (r < (acc += p6)) selectedEffect = 6;
                else if (r < (acc += p7)) selectedEffect = 7;

                // 3. Apply Effect
                let resultTile = null;

                switch (selectedEffect) {
                    case 1: // Random Replace (from current image)
                        const rndIdx = Math.floor(Math.random() * currentTiles.length);
                        resultTile = TileOps.clone(currentTiles[rndIdx], tileSize);
                        break;
                    case 2: // Neighbor Copy (Left -> Right)
                        // Spec: if x-1 < 0, current. Else, copy nextTiles[left].
                        // Important: Use nextTiles for the left neighbor to propagate changes!
                        if (x > 0) {
                            const leftIdx = y * gridW + (x - 1);
                            // Ensure left neighbor is already set (it should be due to loop order)
                            // But nextTiles[leftIdx] might be null if we skipped it? No, we always fill nextTiles.
                            if (nextTiles[leftIdx]) {
                                resultTile = TileOps.clone(nextTiles[leftIdx], tileSize);
                            } else {
                                resultTile = TileOps.clone(currentTile, tileSize);
                            }
                        } else {
                            resultTile = TileOps.clone(currentTile, tileSize);
                        }
                        break;
                    case 3: // Color Shift
                        resultTile = TileOps.colorShift(currentTile, tileSize, params.colorAmount);
                        break;
                    case 4: // Rotate
                        const angle = [90, 180, 270][Math.floor(Math.random() * 3)];
                        resultTile = TileOps.rotate(currentTile, tileSize, angle);
                        break;
                    case 5: // Overlay Replace
                    case 6: // Overlay + Color
                    case 7: // Overlay + Rotate
                        if (overlayTiles && overlayTiles.length > 0) {
                            const paramsOverlay = overlayTiles[Math.floor(Math.random() * overlayTiles.length)];
                            resultTile = TileOps.clone(paramsOverlay, tileSize);
                            if (selectedEffect === 6) {
                                resultTile = TileOps.colorShift(resultTile, tileSize, params.colorAmount);
                            } else if (selectedEffect === 7) {
                                const ang = [90, 180, 270][Math.floor(Math.random() * 3)];
                                resultTile = TileOps.rotate(resultTile, tileSize, ang);
                            }
                        } else {
                            // No overlay loaded, fallback to current
                            resultTile = TileOps.clone(currentTile, tileSize);
                        }
                        break;
                    default:
                        // No effect
                        resultTile = TileOps.clone(currentTile, tileSize);
                        break;
                }

                nextTiles[idx] = resultTile;
            }
        }

        return nextTiles;
    }
}
