/**
 * Warp module for SpectroSampler
 * Mesh Warp, Liquify (Push/Pull), Time Warp Map, Freq Warp Map
 * All effects accept parameter objects for slider-driven control
 */

import { cloneMagnitude } from './stft.js';

// ── PRNG helper ───────────────────────────────────────────────
function makeRng(seed) {
    let s = seed | 0;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// ── Interpolation helpers ─────────────────────────────────────
function bilinearSample(data, numFrames, freqBins, x, y) {
    const x0 = Math.floor(x), x1 = Math.min(x0 + 1, numFrames - 1);
    const y0 = Math.floor(y), y1 = Math.min(y0 + 1, freqBins - 1);
    const fx = x - x0, fy = y - y0;

    if (x0 < 0 || x0 >= numFrames || y0 < 0 || y0 >= freqBins) return 0;

    const v00 = data[Math.max(0, x0)][Math.max(0, y0)];
    const v10 = data[Math.min(numFrames - 1, x1)][Math.max(0, y0)];
    const v01 = data[Math.max(0, x0)][Math.min(freqBins - 1, y1)];
    const v11 = data[Math.min(numFrames - 1, x1)][Math.min(freqBins - 1, y1)];

    return v00 * (1 - fx) * (1 - fy)
        + v10 * fx * (1 - fy)
        + v01 * (1 - fx) * fy
        + v11 * fx * fy;
}

// ── Mesh Warp ─────────────────────────────────────────────────
/**
 * Mesh Warp: distort spectrogram using a randomly displaced control point grid.
 * Params are slider-driven: gridW, gridH, smoothness, warpAmount, seed
 */
export function applyMeshWarp(magnitude, params) {
    const { gridW = 4, gridH = 4, smoothness = 0.5, warpAmount = 30, seed = 42 } = params;
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;
    const result = cloneMagnitude(magnitude);

    const cellW = numFrames / gridW;
    const cellH = freqBins / gridH;

    // Generate random displacements from seed
    const rand = makeRng(seed);
    const gridDx = Array.from({ length: gridH + 1 }, () => new Float64Array(gridW + 1));
    const gridDy = Array.from({ length: gridH + 1 }, () => new Float64Array(gridW + 1));

    for (let gj = 0; gj <= gridH; gj++) {
        for (let gi = 0; gi <= gridW; gi++) {
            // Keep boundary points fixed for stability
            const isBoundary = gi === 0 || gi === gridW || gj === 0 || gj === gridH;
            const scale = isBoundary ? 0 : warpAmount * (1 - smoothness * 0.5);
            gridDx[gj][gi] = (rand() - 0.5) * 2 * scale;
            gridDy[gj][gi] = (rand() - 0.5) * 2 * scale;
        }
    }

    // For each output pixel, find source via inverse mapping
    for (let f = 0; f < numFrames; f++) {
        for (let b = 0; b < freqBins; b++) {
            const gx = f / cellW;
            const gy = b / cellH;
            const gi = Math.floor(gx);
            const gj = Math.floor(gy);
            const fx = gx - gi;
            const fy = gy - gj;

            const gi0 = Math.max(0, Math.min(gridW, gi));
            const gi1 = Math.min(gridW, gi + 1);
            const gj0 = Math.max(0, Math.min(gridH, gj));
            const gj1 = Math.min(gridH, gj + 1);

            const dx = gridDx[gj0][gi0] * (1 - fx) * (1 - fy)
                + gridDx[gj0][gi1] * fx * (1 - fy)
                + gridDx[gj1][gi0] * (1 - fx) * fy
                + gridDx[gj1][gi1] * fx * fy;

            const dy = gridDy[gj0][gi0] * (1 - fx) * (1 - fy)
                + gridDy[gj0][gi1] * fx * (1 - fy)
                + gridDy[gj1][gi0] * (1 - fx) * fy
                + gridDy[gj1][gi1] * fx * fy;

            const srcX = f - dx;
            const srcY = b - dy;

            result[f][b] = bilinearSample(magnitude, numFrames, freqBins, srcX, srcY);
        }
    }

    return result;
}

// ── Liquify (Push/Pull) ───────────────────────────────────────
/**
 * Liquify: random push/pull distortion based on params.
 * Generates random strokes from seed, radius, strength, numStrokes, dirBias
 */
export function applyLiquify(magnitude, params) {
    const { radius = 15, strength = 1.0, numStrokes = 10, dirBias = 'both', seed = 42 } = params;
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;

    // Generate random strokes from seed
    const rand = makeRng(seed);
    const strokes = [];
    for (let i = 0; i < numStrokes; i++) {
        const frame = Math.floor(rand() * numFrames);
        const bin = Math.floor(rand() * freqBins);
        let dx = (rand() - 0.5) * 2 * radius * strength;
        let dy = (rand() - 0.5) * 2 * radius * strength;
        if (dirBias === 'time') dy = 0;
        if (dirBias === 'freq') dx = 0;
        strokes.push({ frame, bin, dx, dy, radius, strength: 1.0 });
    }

    // Build displacement field
    const dispX = Array.from({ length: numFrames }, () => new Float64Array(freqBins));
    const dispY = Array.from({ length: numFrames }, () => new Float64Array(freqBins));

    for (const stroke of strokes) {
        const { frame, bin, dx, dy, radius: r, strength: s } = stroke;

        const rInt = Math.ceil(r);
        for (let df = -rInt; df <= rInt; df++) {
            for (let db = -rInt; db <= rInt; db++) {
                const f = frame + df;
                const b = bin + db;
                if (f < 0 || f >= numFrames || b < 0 || b >= freqBins) continue;

                const dist = Math.sqrt(df * df + db * db) / r;
                if (dist > 1) continue;

                const weight = Math.pow(1 - dist, 2) * s;
                dispX[f][b] += dx * weight;
                dispY[f][b] += dy * weight;
            }
        }
    }

    // Apply displacement
    const result = cloneMagnitude(magnitude);
    for (let f = 0; f < numFrames; f++) {
        for (let b = 0; b < freqBins; b++) {
            const srcX = f - dispX[f][b];
            const srcY = b - dispY[f][b];
            result[f][b] = bilinearSample(magnitude, numFrames, freqBins, srcX, srcY);
        }
    }

    return result;
}

// ── Wave shape generator ──────────────────────────────────────
function waveShape(t, shape) {
    switch (shape) {
        case 'sine': return Math.sin(t * 2 * Math.PI);
        case 'triangle': return 2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - 1;
        case 'step': return Math.floor(t * 4) % 2 === 0 ? 1 : -1;
        default: return Math.sin(t * 2 * Math.PI);
    }
}

// ── Time Warp Map ─────────────────────────────────────────────
/**
 * Time Warp: non-linear time axis remapping via waveform
 * Controlled by warpAmount (0-1), warpFreq, warpShape
 */
export function applyTimeWarp(magnitude, params) {
    const { warpAmount = 0.3, warpFreq = 2, warpShape = 'sine' } = params;
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;
    const result = cloneMagnitude(magnitude);

    for (let f = 0; f < numFrames; f++) {
        const t = f / (numFrames - 1);
        // Warp: offset the time position with a wave
        const offset = waveShape(t * warpFreq, warpShape) * warpAmount;
        const mapped = Math.max(0, Math.min(1, t + offset));
        const srcFrame = mapped * (numFrames - 1);

        for (let b = 0; b < freqBins; b++) {
            result[f][b] = bilinearSample(magnitude, numFrames, freqBins, srcFrame, b);
        }
    }

    return result;
}

// ── Freq Warp Map ─────────────────────────────────────────────
/**
 * Frequency Warp: non-linear frequency axis remapping via waveform
 * Controlled by warpAmount (0-1), warpFreq, warpShape
 */
export function applyFreqWarp(magnitude, params) {
    const { warpAmount = 0.2, warpFreq = 2, warpShape = 'sine' } = params;
    const numFrames = magnitude.length;
    const freqBins = magnitude[0].length;
    const result = cloneMagnitude(magnitude);

    for (let f = 0; f < numFrames; f++) {
        for (let b = 0; b < freqBins; b++) {
            const t = b / (freqBins - 1);
            const offset = waveShape(t * warpFreq, warpShape) * warpAmount;
            const mapped = Math.max(0, Math.min(1, t + offset));
            const srcBin = mapped * (freqBins - 1);
            result[f][b] = bilinearSample(magnitude, numFrames, freqBins, f, srcBin);
        }
    }

    return result;
}

// ── Warp Registry (kept for backward compatibility) ───────────
export const WARP_TYPES = {
    'mesh-warp': { apply: applyMeshWarp, label: 'Mesh Warp', icon: '🕸' },
    'liquify': { apply: applyLiquify, label: 'Liquify', icon: '💧' },
    'time-warp': { apply: applyTimeWarp, label: 'Time Warp', icon: '⏳' },
    'freq-warp': { apply: applyFreqWarp, label: 'Freq Warp', icon: '📊' },
};

export function getWarpList() {
    return Object.entries(WARP_TYPES).map(([id, w]) => ({ id, label: w.label, icon: w.icon }));
}
