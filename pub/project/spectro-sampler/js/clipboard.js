/**
 * Clipboard module for SpectroSampler
 * Handles copy/paste/delete for both 1D (time range) and 2D (rect) selections.
 */

export class SpectroClipboard {
    constructor() {
        this.buffer = null;     // Float64Array[] (magnitude frames)
        this.phaseBuffer = null; // Float64Array[] (phase frames)
        this.type = null;       // 'time' or 'rect'
        // For rect: store bin range
        this.startBin = 0;
        this.endBin = 0;
    }

    get hasContent() {
        return this.buffer !== null && this.buffer.length > 0;
    }

    // ── 1D Time Range Operations ──────────────────────────────

    /**
     * Copy a time range of frames
     */
    copyTimeRange(magnitude, phase, startFrame, endFrame) {
        startFrame = Math.max(0, startFrame);
        endFrame = Math.min(magnitude.length, endFrame);
        this.buffer = [];
        this.phaseBuffer = [];
        for (let f = startFrame; f < endFrame; f++) {
            this.buffer.push(new Float64Array(magnitude[f]));
            if (phase && phase[f]) {
                this.phaseBuffer.push(new Float64Array(phase[f]));
            }
        }
        this.type = 'time';
        return this.buffer.length;
    }

    /**
     * Paste (overwrite) at a specific frame position
     * Overwrites existing frames, extends if needed
     */
    pasteOverwrite(magnitude, phase, atFrame) {
        if (!this.buffer || this.type !== 'time') return { magnitude, phase };

        const newMag = [...magnitude];
        const newPhase = phase ? [...phase] : null;

        for (let i = 0; i < this.buffer.length; i++) {
            const target = atFrame + i;
            if (target >= newMag.length) {
                // Extend
                newMag.push(new Float64Array(this.buffer[i]));
                if (newPhase && this.phaseBuffer[i]) {
                    newPhase.push(new Float64Array(this.phaseBuffer[i]));
                }
            } else {
                newMag[target] = new Float64Array(this.buffer[i]);
                if (newPhase && this.phaseBuffer[i]) {
                    newPhase[target] = new Float64Array(this.phaseBuffer[i]);
                }
            }
        }
        return { magnitude: newMag, phase: newPhase };
    }

    /**
     * Paste (insert) at a specific frame position — shifts everything right
     */
    pasteInsert(magnitude, phase, atFrame) {
        if (!this.buffer || this.type !== 'time') return { magnitude, phase };

        const newMag = [];
        const newPhase = phase ? [] : null;

        // Add frames before insertion point
        for (let f = 0; f < Math.min(atFrame, magnitude.length); f++) {
            newMag.push(magnitude[f]);
            if (newPhase) newPhase.push(phase[f]);
        }

        // Insert clipboard frames
        for (let i = 0; i < this.buffer.length; i++) {
            newMag.push(new Float64Array(this.buffer[i]));
            if (newPhase && this.phaseBuffer[i]) {
                newPhase.push(new Float64Array(this.phaseBuffer[i]));
            }
        }

        // Add remaining frames
        for (let f = atFrame; f < magnitude.length; f++) {
            newMag.push(magnitude[f]);
            if (newPhase) newPhase.push(phase[f]);
        }

        return { magnitude: newMag, phase: newPhase };
    }

    /**
     * Delete a range of frames
     */
    deleteRange(magnitude, phase, startFrame, endFrame) {
        startFrame = Math.max(0, startFrame);
        endFrame = Math.min(magnitude.length, endFrame);

        const newMag = [];
        const newPhase = phase ? [] : null;

        for (let f = 0; f < magnitude.length; f++) {
            if (f < startFrame || f >= endFrame) {
                newMag.push(magnitude[f]);
                if (newPhase) newPhase.push(phase[f]);
            }
        }

        return { magnitude: newMag, phase: newPhase };
    }

    // ── 2D Rect Operations ────────────────────────────────────

    /**
     * Copy a rectangular region (frame×bin patch)
     */
    copyRect(magnitude, startFrame, endFrame, startBin, endBin) {
        startFrame = Math.max(0, startFrame);
        endFrame = Math.min(magnitude.length, endFrame);
        const freqBins = magnitude[0] ? magnitude[0].length : 0;
        startBin = Math.max(0, startBin);
        endBin = Math.min(freqBins, endBin);

        this.buffer = [];
        this.startBin = 0;
        this.endBin = endBin - startBin;

        for (let f = startFrame; f < endFrame; f++) {
            const patch = new Float64Array(endBin - startBin);
            for (let b = startBin; b < endBin; b++) {
                patch[b - startBin] = magnitude[f][b];
            }
            this.buffer.push(patch);
        }
        this.type = 'rect';
        this.phaseBuffer = null;
        return this.buffer.length;
    }

    /**
     * Paste a 2D rect (overwrite only).
     * Pastes from (atFrame, atBin) toward right-down.
     * - Horizontal: extends magnitude array if it overflows
     * - Vertical: clips if it overflows (no extension)
     */
    pasteRectOverwrite(magnitude, atFrame, atBin) {
        if (!this.buffer || this.type !== 'rect') return magnitude;

        const newMag = magnitude.map(f => new Float64Array(f));
        const freqBins = newMag[0] ? newMag[0].length : 0;
        const patchWidth = this.buffer.length;   // time frames
        const patchHeight = this.buffer[0] ? this.buffer[0].length : 0; // freq bins

        for (let i = 0; i < patchWidth; i++) {
            const targetFrame = atFrame + i;
            // Extend if needed (horizontal overflow)
            while (targetFrame >= newMag.length) {
                newMag.push(new Float64Array(freqBins));
            }
            for (let j = 0; j < patchHeight; j++) {
                const targetBin = atBin + j;
                // Clip if vertical overflow
                if (targetBin >= 0 && targetBin < freqBins) {
                    newMag[targetFrame][targetBin] = this.buffer[i][j];
                }
            }
        }

        return newMag;
    }
}
