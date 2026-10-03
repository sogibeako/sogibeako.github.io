/**
 * Tools module for SpectroSampler
 * Handles tool state, brush parameters, and input dispatch
 */

export const TOOL_TYPES = {
    SELECT: 'select',
    RECT_SELECT: 'rect-select',
    REGION: 'region',
    BRUSH_AMP: 'brush-amp',
    BRUSH_ATT: 'brush-att',
    WARP_MESH: 'warp-mesh',
    WARP_LIQUIFY: 'warp-liquify',
    HAND: 'hand',
};

export class ToolManager {
    constructor() {
        this.activeTool = TOOL_TYPES.SELECT;

        // Brush parameters
        this.brushSize = 10;
        this.brushStrength = 2.0;
        this.brushHardness = 0.5;

        // Region creation state
        this._regionDragStart = null;
        this._regionDragEnd = null;

        // SELECT drag state (time range selection)
        this._selectDragStart = null;
        this._selectDragEnd = null;
        this._selectDidDrag = false;
        this._selectClickThreshold = 3; // px to distinguish click from drag

        // RECT_SELECT drag state (2D selection)
        this._rectDragStart = null; // { time, freq }
        this._rectDragEnd = null;   // { time, freq }

        // Brush stroke recording
        this.currentStrokes = [];

        // Callbacks
        this.onToolChange = null;
        this.onRegionCreate = null;
        this.onStartPointSet = null;      // click sets playback position
        this.onSelectionChange = null;     // time range selection changed
        this.onRectSelectionChange = null; // 2D rect selection changed
        this.onBrushStroke = null;
    }

    selectTool(type) {
        this.activeTool = type;
        this.currentStrokes = [];
        if (this.onToolChange) this.onToolChange(type);
    }

    /**
     * Handle mouse down on the canvas
     * @param {number} time - time in seconds
     * @param {number} freq - frequency in Hz
     * @param {number} frame - STFT frame index
     * @param {number} bin - frequency bin index
     * @param {MouseEvent} event
     */
    handleMouseDown(time, freq, frame, bin, event) {
        switch (this.activeTool) {
            case TOOL_TYPES.SELECT:
                this._selectDragStart = time;
                this._selectDragEnd = time;
                this._selectDidDrag = false;
                this._selectStartX = event.offsetX;
                break;

            case TOOL_TYPES.RECT_SELECT:
                this._rectDragStart = { time, freq };
                this._rectDragEnd = { time, freq };
                break;

            case TOOL_TYPES.REGION:
                this._regionDragStart = time;
                this._regionDragEnd = time;
                break;

            case TOOL_TYPES.BRUSH_AMP:
            case TOOL_TYPES.BRUSH_ATT:
                this.currentStrokes = [];
                this._addBrushStroke(frame, bin);
                break;

            case TOOL_TYPES.HAND:
                // Handled by spectrogram renderer
                break;
        }
    }

    handleMouseMove(time, freq, frame, bin, event) {
        switch (this.activeTool) {
            case TOOL_TYPES.SELECT:
                if (this._selectDragStart !== null) {
                    this._selectDragEnd = time;
                    // Detect actual drag (> threshold)
                    if (Math.abs(event.offsetX - this._selectStartX) > this._selectClickThreshold) {
                        this._selectDidDrag = true;
                    }
                    if (this._selectDidDrag && this.onSelectionChange) {
                        const start = Math.min(this._selectDragStart, this._selectDragEnd);
                        const end = Math.max(this._selectDragStart, this._selectDragEnd);
                        this.onSelectionChange({ startTime: start, endTime: end }, true); // true = preview
                    }
                }
                break;

            case TOOL_TYPES.RECT_SELECT:
                if (this._rectDragStart !== null) {
                    this._rectDragEnd = { time, freq };
                    if (this.onRectSelectionChange) {
                        this.onRectSelectionChange(this._getRectSelection(), true);
                    }
                }
                break;

            case TOOL_TYPES.REGION:
                if (this._regionDragStart !== null) {
                    this._regionDragEnd = time;
                }
                break;

            case TOOL_TYPES.BRUSH_AMP:
            case TOOL_TYPES.BRUSH_ATT:
                if (this.currentStrokes.length > 0 || event.buttons === 1) {
                    this._addBrushStroke(frame, bin);
                }
                break;
        }
    }

    handleMouseUp(time, freq, frame, bin, event) {
        switch (this.activeTool) {
            case TOOL_TYPES.SELECT:
                if (this._selectDragStart !== null) {
                    if (this._selectDidDrag) {
                        // Drag completed → finalize time selection
                        const start = Math.min(this._selectDragStart, this._selectDragEnd);
                        const end = Math.max(this._selectDragStart, this._selectDragEnd);
                        if (this.onSelectionChange) {
                            this.onSelectionChange({ startTime: start, endTime: end }, false);
                        }
                    } else {
                        // Click → set playback position + clear selection
                        if (this.onStartPointSet) this.onStartPointSet(time);
                        if (this.onSelectionChange) this.onSelectionChange(null, false);
                    }
                    this._selectDragStart = null;
                    this._selectDragEnd = null;
                }
                break;

            case TOOL_TYPES.RECT_SELECT:
                if (this._rectDragStart !== null) {
                    const rectSel = this._getRectSelection();
                    // Only finalize if it has some area
                    if (rectSel && (rectSel.endTime - rectSel.startTime) > 0.001) {
                        if (this.onRectSelectionChange) {
                            this.onRectSelectionChange(rectSel, false);
                        }
                    } else {
                        // Too small — clear
                        if (this.onRectSelectionChange) {
                            this.onRectSelectionChange(null, false);
                        }
                    }
                    this._rectDragStart = null;
                    this._rectDragEnd = null;
                }
                break;

            case TOOL_TYPES.REGION:
                if (this._regionDragStart !== null) {
                    const start = Math.min(this._regionDragStart, this._regionDragEnd);
                    const end = Math.max(this._regionDragStart, this._regionDragEnd);
                    if (this.onRegionCreate) this.onRegionCreate(start, end);
                    this._regionDragStart = null;
                    this._regionDragEnd = null;
                }
                break;

            case TOOL_TYPES.BRUSH_AMP:
            case TOOL_TYPES.BRUSH_ATT:
                if (this.currentStrokes.length > 0) {
                    if (this.onBrushStroke) {
                        this.onBrushStroke(
                            this.currentStrokes,
                            this.activeTool === TOOL_TYPES.BRUSH_AMP ? 'amplify' : 'attenuate'
                        );
                    }
                    this.currentStrokes = [];
                }
                break;
        }
    }

    _addBrushStroke(frame, bin) {
        this.currentStrokes.push({
            frame,
            bin,
            radius: this.brushSize,
            strength: this.brushStrength,
            hardness: this.brushHardness,
        });
    }

    _getRectSelection() {
        if (!this._rectDragStart || !this._rectDragEnd) return null;
        return {
            startTime: Math.min(this._rectDragStart.time, this._rectDragEnd.time),
            endTime: Math.max(this._rectDragStart.time, this._rectDragEnd.time),
            minFreq: Math.min(this._rectDragStart.freq, this._rectDragEnd.freq),
            maxFreq: Math.max(this._rectDragStart.freq, this._rectDragEnd.freq),
        };
    }

    getRegionDragPreview() {
        if (this._regionDragStart === null) return null;
        return {
            start: Math.min(this._regionDragStart, this._regionDragEnd),
            end: Math.max(this._regionDragStart, this._regionDragEnd),
        };
    }
}
