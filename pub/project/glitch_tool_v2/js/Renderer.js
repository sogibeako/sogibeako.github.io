/**
 * Renderer.js
 * Renders tiles and overlays to the main canvas.
 */

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * Renders the grid of tiles to the canvas.
     * @param {Tile[]} tiles 
     * @param {number} gridW 
     * @param {number} gridH 
     * @param {number} tileSize 
     */
    render(tiles, gridW, gridH, tileSize) {
        // Resize canvas to fit the grid
        this.canvas.width = gridW * tileSize;
        this.canvas.height = gridH * tileSize;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < gridH; y++) {
            for (let x = 0; x < gridW; x++) {
                const index = y * gridW + x;
                const tile = tiles[index];
                if (tile && tile.canvas) {
                    this.ctx.drawImage(tile.canvas, x * tileSize, y * tileSize);
                }
            }
        }
    }

    /**
     * Renders the influence overlay.
     * @param {Float32Array} influenceMap 
     * @param {Uint8Array} protectMap 
     * @param {number} gridW 
     * @param {number} gridH 
     * @param {number} tileSize 
     * @param {boolean} show
     */
    drawOverlay(influenceMap, protectMap, gridW, gridH, tileSize, show) {
        if (!show) return;

        this.ctx.save();
        for (let y = 0; y < gridH; y++) {
            for (let x = 0; x < gridW; x++) {
                const index = y * gridW + x;

                // Draw Protect (Blueish)
                if (protectMap && protectMap[index]) {
                    this.ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
                    this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }

                // Draw Influence (Redish)
                const inf = influenceMap ? influenceMap[index] : 0;
                if (inf > 0) {
                    // Normalize influence for visual (assuming max ~ 3.0 based on spec)
                    const alpha = Math.min(inf, 1.0) * 0.5;
                    this.ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
                    this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
        this.ctx.restore();
    }
}
