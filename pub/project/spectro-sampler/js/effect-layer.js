/**
 * Effect Layer system for SpectroSampler
 * Non-destructive spectrogram effects that operate on magnitude data
 */

import { cloneMagnitude } from './stft.js';

// ── Effect Definitions ────────────────────────────────────────

/**
 * Block Glitch: shifts rectangular blocks of the spectrogram
 */
function applyBlockGlitch(magnitude, params) {
    const { blockW = 8, blockH = 8, shiftX = 4, shiftY = 4, randomness = 0.5, seed = 42 } = params;
    const result = cloneMagnitude(magnitude);
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;

    let rng = seed;
    const rand = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; };

    for (let bx = 0; bx < numFrames; bx += blockW) {
        for (let by = 0; by < freqBins; by += blockH) {
            if (rand() > randomness) continue;
            const sx = Math.round((rand() - 0.5) * 2 * shiftX);
            const sy = Math.round((rand() - 0.5) * 2 * shiftY);

            for (let x = bx; x < Math.min(bx + blockW, numFrames); x++) {
                for (let y = by; y < Math.min(by + blockH, freqBins); y++) {
                    const srcX = Math.max(0, Math.min(numFrames - 1, x + sx));
                    const srcY = Math.max(0, Math.min(freqBins - 1, y + sy));
                    result[x][y] = magnitude[srcX][srcY];
                }
            }
        }
    }

    return result;
}

/**
 * Gaussian Blur (separable): smooths the spectrogram
 */
function applyGaussianBlur(magnitude, params) {
    const { radiusX = 3, radiusY = 3 } = params;
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;

    // Create kernel
    const makeKernel = (radius) => {
        const size = radius * 2 + 1;
        const kernel = new Float64Array(size);
        const sigma = radius / 2;
        let sum = 0;
        for (let i = 0; i < size; i++) {
            const x = i - radius;
            kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
            sum += kernel[i];
        }
        for (let i = 0; i < size; i++) kernel[i] /= sum;
        return kernel;
    };

    // Horizontal pass (time direction)
    let temp = cloneMagnitude(magnitude);
    if (radiusX > 0) {
        const kernel = makeKernel(radiusX);
        for (let f = 0; f < numFrames; f++) {
            for (let b = 0; b < freqBins; b++) {
                let sum = 0;
                for (let k = -radiusX; k <= radiusX; k++) {
                    const idx = Math.max(0, Math.min(numFrames - 1, f + k));
                    sum += magnitude[idx][b] * kernel[k + radiusX];
                }
                temp[f][b] = sum;
            }
        }
    }

    // Vertical pass (frequency direction)
    const result = cloneMagnitude(temp);
    if (radiusY > 0) {
        const kernel = makeKernel(radiusY);
        for (let f = 0; f < numFrames; f++) {
            for (let b = 0; b < freqBins; b++) {
                let sum = 0;
                for (let k = -radiusY; k <= radiusY; k++) {
                    const idx = Math.max(0, Math.min(freqBins - 1, b + k));
                    sum += temp[f][idx] * kernel[k + radiusY];
                }
                result[f][b] = sum;
            }
        }
    }

    return result;
}

/**
 * Dropout: randomly zeros out patches
 */
function applyDropout(magnitude, params) {
    const { density = 0.3, size = 4, depth = 1.0, seed = 42 } = params;
    const result = cloneMagnitude(magnitude);
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;

    let rng = seed;
    const rand = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; };

    for (let f = 0; f < numFrames; f += size) {
        for (let b = 0; b < freqBins; b += size) {
            if (rand() > density) continue;
            for (let df = 0; df < size && f + df < numFrames; df++) {
                for (let db = 0; db < size && b + db < freqBins; db++) {
                    result[f + df][b + db] *= (1 - depth);
                }
            }
        }
    }

    return result;
}

/**
 * Scanline: periodic stripe pattern
 */
function applyScanline(magnitude, params) {
    const { period = 8, duty = 0.5, orientation = 'freq', depth = 0.8 } = params;
    const result = cloneMagnitude(magnitude);
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;

    for (let f = 0; f < numFrames; f++) {
        for (let b = 0; b < freqBins; b++) {
            const pos = orientation === 'freq' ? b : f;
            const phase = (pos % period) / period;
            if (phase < duty) {
                result[f][b] *= (1 - depth);
            }
        }
    }

    return result;
}

/**
 * Posterize: quantize magnitude levels
 */
function applyPosterize(magnitude, params) {
    const { levels = 4 } = params;
    const result = cloneMagnitude(magnitude);
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;

    // Find max for normalization
    let maxVal = 0;
    for (let f = 0; f < numFrames; f++) {
        for (let b = 0; b < freqBins; b++) {
            if (magnitude[f][b] > maxVal) maxVal = magnitude[f][b];
        }
    }

    if (maxVal === 0) return result;

    for (let f = 0; f < numFrames; f++) {
        for (let b = 0; b < freqBins; b++) {
            const norm = result[f][b] / maxVal;
            const quantized = Math.round(norm * (levels - 1)) / (levels - 1);
            result[f][b] = quantized * maxVal;
        }
    }

    return result;
}

/**
 * Brush stroke (applied directly to magnitude data)
 */
function applyBrush(magnitude, params) {
    const { strokes = [], mode = 'amplify' } = params;
    const result = cloneMagnitude(magnitude);

    // Compute a reference peak for clipping (max magnitude in source)
    let refPeak = 0;
    for (let f = 0; f < magnitude.length; f++) {
        for (let b = 0; b < magnitude[f].length; b++) {
            if (magnitude[f][b] > refPeak) refPeak = magnitude[f][b];
        }
    }
    const magCeiling = refPeak * 10; // allow up to 10× amplification

    for (const stroke of strokes) {
        const { frame, bin, radius = 5, strength = 2, hardness = 0.5 } = stroke;

        for (let df = -radius; df <= radius; df++) {
            for (let db = -radius; db <= radius; db++) {
                const f = frame + df;
                const b = bin + db;
                if (f < 0 || f >= magnitude.length || b < 0 || b >= magnitude[0].length) continue;

                const dist = Math.sqrt(df * df + db * db) / radius;
                if (dist > 1) continue;

                const falloff = Math.pow(1 - dist, hardness * 3);
                if (mode === 'amplify') {
                    result[f][b] *= 1 + (strength - 1) * falloff;
                    // Clip to ceiling
                    if (result[f][b] > magCeiling) result[f][b] = magCeiling;
                } else if (mode === 'attenuate') {
                    result[f][b] *= 1 - falloff * Math.min(strength, 1);
                }
            }
        }
    }

    return result;
}

// ── Effect Registry ───────────────────────────────────────────
const EFFECTS = {
    'block-glitch': {
        apply: applyBlockGlitch,
        label: 'Block Glitch',
        icon: '⬛',
        paramDefs: [
            { key: 'blockW', label: 'Block Width', type: 'range', min: 1, max: 64, step: 1, default: 8 },
            { key: 'blockH', label: 'Block Height', type: 'range', min: 1, max: 64, step: 1, default: 8 },
            { key: 'shiftX', label: 'Shift X (Time)', type: 'range', min: 0, max: 64, step: 1, default: 6 },
            { key: 'shiftY', label: 'Shift Y (Freq)', type: 'range', min: 0, max: 64, step: 1, default: 6 },
            { key: 'randomness', label: 'Randomness', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5 },
            { key: 'seed', label: 'Seed', type: 'range', min: 0, max: 9999, step: 1, default: 42 },
        ],
    },
    'gaussian-blur': {
        apply: applyGaussianBlur,
        label: 'Gaussian Blur',
        icon: '🌫',
        paramDefs: [
            { key: 'radiusX', label: 'Radius X (Time)', type: 'range', min: 0, max: 20, step: 1, default: 3 },
            { key: 'radiusY', label: 'Radius Y (Freq)', type: 'range', min: 0, max: 20, step: 1, default: 3 },
        ],
    },
    'dropout': {
        apply: applyDropout,
        label: 'Dropout',
        icon: '💀',
        paramDefs: [
            { key: 'density', label: 'Density', type: 'range', min: 0, max: 1, step: 0.01, default: 0.3 },
            { key: 'size', label: 'Patch Size', type: 'range', min: 1, max: 32, step: 1, default: 4 },
            { key: 'depth', label: 'Depth', type: 'range', min: 0, max: 1, step: 0.01, default: 0.8 },
            { key: 'seed', label: 'Seed', type: 'range', min: 0, max: 9999, step: 1, default: 42 },
        ],
    },
    'scanline': {
        apply: applyScanline,
        label: 'Scanline',
        icon: '▤',
        paramDefs: [
            { key: 'period', label: 'Period', type: 'range', min: 2, max: 64, step: 1, default: 8 },
            { key: 'duty', label: 'Duty', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5 },
            {
                key: 'orientation', label: 'Direction', type: 'select', options: [
                    { value: 'freq', label: 'Frequency' },
                    { value: 'time', label: 'Time' },
                ], default: 'freq'
            },
            { key: 'depth', label: 'Depth', type: 'range', min: 0, max: 1, step: 0.01, default: 0.8 },
        ],
    },
    'posterize': {
        apply: applyPosterize,
        label: 'Posterize',
        icon: '🎨',
        paramDefs: [
            { key: 'levels', label: 'Levels', type: 'range', min: 2, max: 32, step: 1, default: 4 },
        ],
    },
    'brush': {
        apply: applyBrush,
        label: 'Brush',
        icon: '🖌',
        paramDefs: [],
        hidden: true,  // brush strokes are added interactively, not from dropdown
    },
};

// Import and register warp effects
import { applyMeshWarp, applyLiquify, applyTimeWarp, applyFreqWarp } from './warp.js';

EFFECTS['mesh-warp'] = {
    apply: applyMeshWarp,
    label: 'Mesh Warp',
    icon: '🕸',
    paramDefs: [
        { key: 'gridW', label: 'Grid Width', type: 'range', min: 2, max: 16, step: 1, default: 4 },
        { key: 'gridH', label: 'Grid Height', type: 'range', min: 2, max: 16, step: 1, default: 4 },
        { key: 'smoothness', label: 'Smoothness', type: 'range', min: 0, max: 1, step: 0.01, default: 0.5 },
        { key: 'warpAmount', label: 'Warp Amount', type: 'range', min: 0, max: 200, step: 1, default: 30 },
        { key: 'seed', label: 'Seed', type: 'range', min: 0, max: 9999, step: 1, default: 42 },
    ],
};

EFFECTS['liquify'] = {
    apply: applyLiquify,
    label: 'Liquify',
    icon: '💧',
    paramDefs: [
        { key: 'radius', label: 'Radius', type: 'range', min: 3, max: 60, step: 1, default: 15 },
        { key: 'strength', label: 'Strength', type: 'range', min: 0.1, max: 5, step: 0.1, default: 1.0 },
        { key: 'numStrokes', label: 'Num Strokes', type: 'range', min: 1, max: 50, step: 1, default: 10 },
        {
            key: 'dirBias', label: 'Direction Bias', type: 'select', options: [
                { value: 'both', label: 'Both' },
                { value: 'time', label: 'Time Only' },
                { value: 'freq', label: 'Freq Only' },
            ], default: 'both'
        },
        { key: 'seed', label: 'Seed', type: 'range', min: 0, max: 9999, step: 1, default: 42 },
    ],
};

EFFECTS['time-warp'] = {
    apply: applyTimeWarp,
    label: 'Time Warp',
    icon: '⏳',
    paramDefs: [
        { key: 'warpAmount', label: 'Warp Amount', type: 'range', min: 0, max: 1, step: 0.01, default: 0.3 },
        { key: 'warpFreq', label: 'Warp Frequency', type: 'range', min: 0.5, max: 8, step: 0.1, default: 2 },
        {
            key: 'warpShape', label: 'Shape', type: 'select', options: [
                { value: 'sine', label: 'Sine' },
                { value: 'triangle', label: 'Triangle' },
                { value: 'step', label: 'Step (Glitch)' },
            ], default: 'sine'
        },
    ],
};

EFFECTS['freq-warp'] = {
    apply: applyFreqWarp,
    label: 'Freq Warp',
    icon: '📊',
    paramDefs: [
        { key: 'warpAmount', label: 'Warp Amount', type: 'range', min: 0, max: 1, step: 0.01, default: 0.2 },
        { key: 'warpFreq', label: 'Warp Frequency', type: 'range', min: 0.5, max: 8, step: 0.1, default: 2 },
        {
            key: 'warpShape', label: 'Shape', type: 'select', options: [
                { value: 'sine', label: 'Sine' },
                { value: 'triangle', label: 'Triangle' },
                { value: 'step', label: 'Step (Glitch)' },
            ], default: 'sine'
        },
    ],
};

export function getEffectList() {
    return Object.entries(EFFECTS)
        .filter(([_, e]) => !e.hidden)
        .map(([id, e]) => ({ id, label: e.label, icon: e.icon }));
}

export function getParamDefs(effectId) {
    const effect = EFFECTS[effectId];
    return effect ? (effect.paramDefs || []) : [];
}

// ── Layer Stack ───────────────────────────────────────────────

export class EffectLayerStack {
    constructor() {
        this.layers = [];
        this.onChange = null;

        // Undo/Redo history
        this._undoStack = [];
        this._redoStack = [];
        this._maxHistory = 50;
    }

    /** Save current state to undo stack before mutation */
    _pushUndo() {
        this._undoStack.push(this._serialize());
        if (this._undoStack.length > this._maxHistory) {
            this._undoStack.shift();
        }
        this._redoStack = []; // clear redo on new action
    }

    _serialize() {
        return JSON.stringify(this.layers.map(l => ({
            id: l.id,
            label: l.label,
            icon: l.icon,
            params: { ...l.params },
            bypass: l.bypass,
            mix: l.mix,
        })));
    }

    _restore(json) {
        this.layers = JSON.parse(json);
    }

    undo() {
        if (this._undoStack.length === 0) return false;
        this._redoStack.push(this._serialize());
        this._restore(this._undoStack.pop());
        this._notifyChange();
        return true;
    }

    redo() {
        if (this._redoStack.length === 0) return false;
        this._undoStack.push(this._serialize());
        this._restore(this._redoStack.pop());
        this._notifyChange();
        return true;
    }

    get canUndo() { return this._undoStack.length > 0; }
    get canRedo() { return this._redoStack.length > 0; }

    addLayer(effectId, params = {}) {
        const effect = EFFECTS[effectId];
        if (!effect) return -1;

        this._pushUndo();
        const idx = this.layers.length;
        this.layers.push({
            id: effectId,
            label: effect.label,
            icon: effect.icon,
            params: { ...params },
            bypass: false,
            mix: 1.0,
        });

        this._notifyChange();
        return idx;
    }

    removeLayer(index) {
        this._pushUndo();
        this.layers.splice(index, 1);
        this._notifyChange();
    }

    moveLayer(from, to) {
        this._pushUndo();
        const [layer] = this.layers.splice(from, 1);
        this.layers.splice(to, 0, layer);
        this._notifyChange();
    }

    setLayerParam(index, key, value) {
        if (index >= 0 && index < this.layers.length) {
            // Don't push undo for every slider tick — throttled externally
            this.layers[index].params[key] = value;
            this._notifyChange();
        }
    }

    /** Push undo specifically for param changes (call before starting a slider drag) */
    pushParamUndo() {
        this._pushUndo();
    }

    setLayerBypass(index, bypass) {
        if (index >= 0 && index < this.layers.length) {
            this._pushUndo();
            this.layers[index].bypass = bypass;
            this._notifyChange();
        }
    }

    setLayerMix(index, mix) {
        if (index >= 0 && index < this.layers.length) {
            this.layers[index].mix = mix;
            this._notifyChange();
        }
    }

    /** Clear all layers (used during commit) */
    clearAll() {
        this._pushUndo();
        this.layers = [];
        this._notifyChange();
    }

    /**
     * Apply all active layers to magnitude data
     * @param {Float64Array[]} magnitude - original magnitude data
     * @returns {Float64Array[]} processed magnitude
     */
    apply(magnitude) {
        let current = magnitude;

        for (const layer of this.layers) {
            if (layer.bypass) continue;

            const effect = EFFECTS[layer.id];
            if (!effect) continue;

            const processed = effect.apply(current, layer.params);

            // Mix: blend between input and processed
            if (layer.mix < 1.0) {
                const mixed = cloneMagnitude(current);
                const numFrames = current.length;
                const freqBins = current[0].length;
                for (let f = 0; f < numFrames; f++) {
                    for (let b = 0; b < freqBins; b++) {
                        mixed[f][b] = current[f][b] * (1 - layer.mix) + processed[f][b] * layer.mix;
                    }
                }
                current = mixed;
            } else {
                current = processed;
            }
        }

        return current;
    }

    _notifyChange() {
        if (this.onChange) this.onChange();
    }
}
