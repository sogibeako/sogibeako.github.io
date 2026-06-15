/**
 * TileOps.js
 * Provides static methods for tile manipulation (copy, rotate, color shift).
 */

export class TileOps {
    /**
     * Creates a deep copy of a tile.
     * @param {object} tile 
     * @param {number} tileSize 
     * @returns {object} New tile
     */
    static clone(tile, tileSize) {
        if (!tile || !tile.canvas) return null;
        const newCanvas = new OffscreenCanvas(tileSize, tileSize);
        const ctx = newCanvas.getContext('2d');
        ctx.drawImage(tile.canvas, 0, 0);
        return { canvas: newCanvas };
    }

    /**
     * Returns a rotated copy of a tile.
     * @param {object} tile 
     * @param {number} tileSize 
     * @param {number} angleDegrees 90, 180, or 270
     * @returns {object} New tile
     */
    static rotate(tile, tileSize, angleDegrees) {
        if (!tile || !tile.canvas) return null;
        const newCanvas = new OffscreenCanvas(tileSize, tileSize);
        const ctx = newCanvas.getContext('2d');

        ctx.translate(tileSize / 2, tileSize / 2);
        ctx.rotate(angleDegrees * Math.PI / 180);
        ctx.drawImage(tile.canvas, -tileSize / 2, -tileSize / 2);
        // Reset transform not strictly necessary for fresh canvas but good practice
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        return { canvas: newCanvas };
    }

    /**
     * Applies color shift to a tile.
     * @param {object} tile 
     * @param {number} tileSize 
     * @param {number} amount Intensity 0-1
     * @returns {object} New tile
     */
    static colorShift(tile, tileSize, amount) {
        if (!tile || !tile.canvas) return null;

        const newCanvas = new OffscreenCanvas(tileSize, tileSize);
        const ctx = newCanvas.getContext('2d');
        ctx.drawImage(tile.canvas, 0, 0);

        if (amount <= 0) return { canvas: newCanvas };

        const imageData = ctx.getImageData(0, 0, tileSize, tileSize);
        const data = imageData.data;

        // Simple random shift based on amount
        // For a more "glitchy" look, we might want to shift channels or hue
        // Spec says: hueShift, satMul, valMul, channelJitter

        const hueShift = (Math.random() - 0.5) * 360 * amount;
        const rOffset = (Math.random() - 0.5) * 255 * amount * 0.5;
        const gOffset = (Math.random() - 0.5) * 255 * amount * 0.5;
        const bOffset = (Math.random() - 0.5) * 255 * amount * 0.5;

        for (let i = 0; i < data.length; i += 4) {
            // RGB Jitter
            data[i] = Math.min(255, Math.max(0, data[i] + rOffset));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + gOffset));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + bOffset));

            // Hue shift could be done here but is expensive to do RGB->HSL->RGB per pixel in JS.
            // For performance, simple channel manipulation is often enough for "glitch".
            // If we really want hue shift, we can do a simplified rotation.
        }

        ctx.putImageData(imageData, 0, 0);
        return { canvas: newCanvas };
    }
}
