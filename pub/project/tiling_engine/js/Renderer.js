/**
 * Renderer Module
 * Draws the generated tiles to the canvas according to their styles.
 */
class Renderer {
    constructor(canvas, definition, images) {
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.def = definition;
        this.images = images; // Preloaded images object { id: HTMLImageElement }

        this.styles = this.def.styles;
        this.presets = this.styles.presets;
        this.styleMap = this.styles.tileStyleMap;
        this.uvMaps = this.def.uvMaps;

        this.renderDef = this.def.render;
        this.textureGlobal = this.renderDef.textureGlobal || { enabled: false, size: 1.0, zoom: 1.0, offsetX: 0, offsetY: 0 };
        this.viewport = this.renderDef.viewport || { fitMode: "contain", padding: 24 };
    }

    /**
     * Clears the canvas and renders the provided tiles.
     */
    render(tiles) {
        // Clear background
        this.ctx.fillStyle = this.renderDef.backgroundColor || "#000000";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Calculate bounding box and transform for viewport fitting
        this.applyViewportTransform(tiles);

        // Set global antialias / smoothing
        this.ctx.imageSmoothingEnabled = this.renderDef.antialias !== false;

        for (const tile of tiles) {
            this.drawTile(tile);
        }

        // Restore transform
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    /**
     * Determines screen bounding box and applies scaling/translation
     * to fit the tiles inside the canvas according to the viewport settings.
     */
    applyViewportTransform(tiles) {
        if (tiles.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        // Anchor the camera viewport to the original generation 0 seed tiles.
        // This stops the camera from zooming in on child tiles that shrink inward.
        const seedTiles = this.def.geometry.seed || tiles;
        for (const tile of seedTiles) {
            for (const pt of tile.points) {
                if (pt[0] < minX) minX = pt[0];
                if (pt[1] < minY) minY = pt[1];
                if (pt[0] > maxX) maxX = pt[0];
                if (pt[1] > maxY) maxY = pt[1];
            }
        }

        const padding = this.viewport.padding || 0;
        const availableW = this.width - padding * 2;
        const availableH = this.height - padding * 2;

        const contentW = maxX - minX;
        const contentH = maxY - minY;

        let scale = 1;
        if (this.viewport.fitMode === "contain" && contentW > 0 && contentH > 0) {
            scale = Math.min(availableW / contentW, availableH / contentH);
        }

        const cx = minX + contentW / 2;
        const cy = minY + contentH / 2;

        const tx = this.width / 2 - cx * scale;
        const ty = this.height / 2 - cy * scale;

        this.ctx.setTransform(scale, 0, 0, scale, tx, ty);
    }

    drawTile(tile) {
        const styleName = this.styleMap[tile.type];
        if (!styleName) return;

        const preset = this.presets[styleName];
        if (!preset) return;

        this.ctx.beginPath();
        this.ctx.moveTo(tile.points[0][0], tile.points[0][1]);
        this.ctx.lineTo(tile.points[1][0], tile.points[1][1]);
        this.ctx.lineTo(tile.points[2][0], tile.points[2][1]);
        this.ctx.closePath();

        if (preset.mode === "fill") {
            if (preset.fillColor) {
                this.ctx.fillStyle = preset.fillColor;
                this.ctx.fill();
            }
        }
        else if (preset.mode === "sharedTexture") {
            this.drawSharedTexture(tile, preset);
        }

        if (this.renderDef.showStroke !== false && preset.strokeColor) {
            this.ctx.strokeStyle = preset.strokeColor;
            this.ctx.lineWidth = (preset.strokeWidth || 1) / this.ctx.getTransform().a; // keep stroke width constant regardless of zoom
            this.ctx.stroke();
        }
    }

    drawSharedTexture(tile, preset) {
        const imgDef = preset.imageId;
        const img = this.images[imgDef];
        if (!img) return;

        const uvMapDef = this.uvMaps[preset.uvMap];
        if (!uvMapDef || uvMapDef.kind !== "triangle") return;

        this.ctx.save();
        this.ctx.clip(); // Clip to the triangle

        // Calculate final zoom and offsets
        const globalZoom = this.textureGlobal.zoom || 1.0;
        const presetZoom = preset.zoom || 1.0;
        const finalZoom = globalZoom * presetZoom;

        const finalOffsetX = (this.textureGlobal.offsetX || 0) + (preset.offsetX || 0);
        const finalOffsetY = (this.textureGlobal.offsetY || 0) + (preset.offsetY || 0);

        // Source UVs defined in normalized coordinates [0, 1]
        const srcUv = uvMapDef.points;
        const imgW = img.width;
        const imgH = img.height;

        // Convert UVs [0..1] to pixel coordinates of the image
        // apply zoom and offset on the image coordinates
        const u0 = srcUv[0][0] * imgW * finalZoom + finalOffsetX;
        const v0 = srcUv[0][1] * imgH * finalZoom + finalOffsetY;
        const u1 = srcUv[1][0] * imgW * finalZoom + finalOffsetX;
        const v1 = srcUv[1][1] * imgH * finalZoom + finalOffsetY;
        const u2 = srcUv[2][0] * imgW * finalZoom + finalOffsetX;
        const v2 = srcUv[2][1] * imgH * finalZoom + finalOffsetY;

        const imgPoints = [[u0, v0], [u1, v1], [u2, v2]];

        // We want to map `imgPoints` to `tile.points`
        const matrix = Geometry.getAffineTransform(imgPoints, tile.points);

        // FollowTile Rotation Policy
        // Actually, by mapping `imgPoints` -> `tile.points`, the transform intrinsically follows the tile's rotation/scale.
        // If policy is "fixed" we would map the canvas points back instead, but followTile is standard for now.

        // Apply affine transform
        this.ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);

        this.ctx.drawImage(img, 0, 0);

        this.ctx.restore();
    }
}
