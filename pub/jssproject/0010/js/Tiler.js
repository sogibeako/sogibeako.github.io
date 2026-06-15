/**
 * Tiler.js
 * Splits images into tiles and manages the grid logic.
 */

export class Tiler {
    /**
     * Splits an image into tiles.
     * @param {ImageBitmap} image 
     * @param {number} tileSize 
     * @returns {object} { tiles: Tile[], gridW: number, gridH: number }
     */
    static createTiles(image, tileSize) {
        const gridW = Math.floor(image.width / tileSize);
        const gridH = Math.floor(image.height / tileSize);
        const tiles = [];

        // Create a temporary canvas to extract pixel data if needed, 
        // but for OffscreenCanvas we can draw directly.

        for (let y = 0; y < gridH; y++) {
            for (let x = 0; x < gridW; x++) {
                const tileCanvas = new OffscreenCanvas(tileSize, tileSize);
                const ctx = tileCanvas.getContext('2d');

                // Draw the specific section of the source image to the tile canvas
                ctx.drawImage(
                    image,
                    x * tileSize, y * tileSize, tileSize, tileSize, // Source rect
                    0, 0, tileSize, tileSize                        // Dest rect
                );

                tiles.push({
                    canvas: tileCanvas
                });
            }
        }

        return { tiles, gridW, gridH };
    }

    /**
     * Creates a deep copy of tiles.
     * @param {Tile[]} tiles 
     * @param {number} tileSize
     * @returns {Tile[]}
     */
    static cloneTiles(tiles, tileSize) {
        return tiles.map(tile => {
            const newCanvas = new OffscreenCanvas(tileSize, tileSize);
            const ctx = newCanvas.getContext('2d');
            ctx.drawImage(tile.canvas, 0, 0);
            return { canvas: newCanvas };
        });
    }
}
