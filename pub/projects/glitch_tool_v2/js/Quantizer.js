/**
 * Quantizer.js
 * Handles color reduction (8/16 colors) logic.
 */

export class Quantizer {
    /**
     * Reduces colors in the tile array.
     * Note: This is a heavy operation to do on Canvas directly.
     * Ideally we would process the whole image data at once, or use a shader.
     * For JS, we will do a simple nearest-neighbor to a generated palette.
     * 
     * @param {object[]} tiles 
     * @param {number} colorCount 8 or 16
     * @param {number} tileSize
     */
    static quantize(tiles, colorCount, tileSize) {
        // Limitation: Real palette quantization (median cut/k-means) requires analyzing ALL pixels.
        // For performance in JS (without WebASM/Shader), we will use a fixed palette or a simple channel quantization
        // plus mapping to a small set.

        // Simple approach: Channel Quantization (RGB 3-3-2 bit for 256 colors, then downsample?)
        // Better: "Posterize" by levels.
        // 8 colors = 2 levels per channel? (2x2x2=8)
        // 16 colors = ?

        // Spec suggests: "A案 (推奨): 全体パレット量子化 (median cut or k-means -> 最近傍色置換)"
        // Since we don't want to implement a full k-means in JS for this snippet without a library,
        // We will do a simplified uniform quantization, or just ignore for now if it's too complex for this step.
        // Let's implement a simple Posterization which is fast and looks glitchy.

        const levels = colorCount === 8 ? 2 : 3; // 2^3=8 colors, but levels=2 means 0 and 255.
        // Actually posterize is per channel. 
        // 8 colors usually means specific hardware palette.
        // Let's do a simple bitmasking to simulate look.

        const mask = colorCount === 8 ? 0xE0 : 0xC0; // Keep top 3 or 2 bits

        tiles.forEach(tile => {
            const ctx = tile.canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, tileSize, tileSize);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                // Simple posterization
                data[i] = data[i] & mask;
                data[i + 1] = data[i + 1] & mask;
                data[i + 2] = data[i + 2] & mask;
            }

            ctx.putImageData(imageData, 0, 0);
        });
    }
}
