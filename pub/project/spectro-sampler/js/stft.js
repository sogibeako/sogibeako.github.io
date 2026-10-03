/**
 * STFT / iSTFT module for SpectroSampler
 * Radix-2 Cooley-Tukey FFT implementation
 */

// ── Window Functions ──────────────────────────────────────────
export function hannWindow(N) {
    const w = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
    }
    return w;
}

export function hammingWindow(N) {
    const w = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        w[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
    }
    return w;
}

export function blackmanWindow(N) {
    const w = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        w[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))
            + 0.08 * Math.cos(4 * Math.PI * i / (N - 1));
    }
    return w;
}

// ── FFT (Radix-2 Cooley-Tukey) ────────────────────────────────
function bitReverse(n, bits) {
    let reversed = 0;
    for (let i = 0; i < bits; i++) {
        reversed = (reversed << 1) | (n & 1);
        n >>= 1;
    }
    return reversed;
}

/**
 * In-place FFT. real and imag are Float64Arrays of length N (power of 2).
 * @param {Float64Array} real
 * @param {Float64Array} imag
 * @param {boolean} inverse - if true, compute inverse FFT
 */
export function fft(real, imag, inverse = false) {
    const N = real.length;
    const bits = Math.log2(N);
    if (N !== (1 << bits)) throw new Error('FFT size must be power of 2');

    // Bit-reversal permutation
    for (let i = 0; i < N; i++) {
        const j = bitReverse(i, bits);
        if (j > i) {
            [real[i], real[j]] = [real[j], real[i]];
            [imag[i], imag[j]] = [imag[j], imag[i]];
        }
    }

    // Butterfly stages
    const sign = inverse ? 1 : -1;
    for (let size = 2; size <= N; size *= 2) {
        const halfSize = size / 2;
        const angle = sign * 2 * Math.PI / size;
        const wReal = Math.cos(angle);
        const wImag = Math.sin(angle);

        for (let i = 0; i < N; i += size) {
            let curReal = 1, curImag = 0;
            for (let j = 0; j < halfSize; j++) {
                const a = i + j;
                const b = a + halfSize;
                const tReal = curReal * real[b] - curImag * imag[b];
                const tImag = curReal * imag[b] + curImag * real[b];
                real[b] = real[a] - tReal;
                imag[b] = imag[a] - tImag;
                real[a] += tReal;
                imag[a] += tImag;
                const newCurReal = curReal * wReal - curImag * wImag;
                curImag = curReal * wImag + curImag * wReal;
                curReal = newCurReal;
            }
        }
    }

    if (inverse) {
        for (let i = 0; i < N; i++) {
            real[i] /= N;
            imag[i] /= N;
        }
    }
}

// ── STFT ──────────────────────────────────────────────────────
/**
 * Compute Short-Time Fourier Transform
 * @param {Float32Array} signal - mono audio samples
 * @param {number} fftSize - FFT window size (power of 2)
 * @param {number} hopSize - hop size in samples
 * @param {Float32Array} window - window function array
 * @returns {{ magnitude: Float64Array[], phase: Float64Array[], numFrames: number, freqBins: number }}
 */
export function stft(signal, fftSize, hopSize, window) {
    const freqBins = fftSize / 2 + 1;
    const numFrames = Math.floor((signal.length - fftSize) / hopSize) + 1;
    const magnitude = [];
    const phase = [];

    const real = new Float64Array(fftSize);
    const imag = new Float64Array(fftSize);

    for (let frame = 0; frame < numFrames; frame++) {
        const offset = frame * hopSize;

        // Apply window and copy to buffers
        for (let i = 0; i < fftSize; i++) {
            const idx = offset + i;
            real[i] = idx < signal.length ? signal[idx] * window[i] : 0;
            imag[i] = 0;
        }

        fft(real, imag, false);

        // Extract magnitude and phase for positive frequencies
        const mag = new Float64Array(freqBins);
        const ph = new Float64Array(freqBins);
        for (let k = 0; k < freqBins; k++) {
            mag[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
            ph[k] = Math.atan2(imag[k], real[k]);
        }
        magnitude.push(mag);
        phase.push(ph);
    }

    return { magnitude, phase, numFrames, freqBins };
}

// ── iSTFT ─────────────────────────────────────────────────────
/**
 * Inverse STFT - reconstruct audio from magnitude (optionally edited) and phase
 * @param {Float64Array[]} magnitude - array of magnitude frames
 * @param {Float64Array[]} phase - array of phase frames
 * @param {number} fftSize
 * @param {number} hopSize
 * @param {Float32Array} window
 * @param {number} outputLength - desired output length in samples
 * @returns {Float32Array} reconstructed signal
 */
export function istft(magnitude, phase, fftSize, hopSize, window, outputLength) {
    const numFrames = magnitude.length;
    const freqBins = fftSize / 2 + 1;
    const output = new Float64Array(outputLength);
    const windowSum = new Float64Array(outputLength);

    const real = new Float64Array(fftSize);
    const imag = new Float64Array(fftSize);

    for (let frame = 0; frame < numFrames; frame++) {
        const offset = frame * hopSize;
        const mag = magnitude[frame];
        const ph = phase[frame];

        // Reconstruct full spectrum (mirror for negative frequencies)
        for (let k = 0; k < freqBins; k++) {
            real[k] = mag[k] * Math.cos(ph[k]);
            imag[k] = mag[k] * Math.sin(ph[k]);
        }
        for (let k = freqBins; k < fftSize; k++) {
            const mirror = fftSize - k;
            real[k] = real[mirror];
            imag[k] = -imag[mirror];
        }

        fft(real, imag, true);

        // Overlap-add with window
        for (let i = 0; i < fftSize; i++) {
            const idx = offset + i;
            if (idx < outputLength) {
                output[idx] += real[i] * window[i];
                windowSum[idx] += window[i] * window[i];
            }
        }
    }

    // Compute steady-state windowSum from the middle of the signal
    // (where overlap is fully developed) as a reference for safe normalization
    const midIdx = Math.floor(outputLength / 2);
    const steadyStateWS = windowSum[midIdx] || 1;
    // Clamp windowSum to at least 10% of steady-state to prevent boundary amplification
    const safeMinWS = steadyStateWS * 0.1;

    // Normalize by window sum (with safe clamping)
    const result = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
        const ws = Math.max(windowSum[i], safeMinWS);
        result[i] = output[i] / ws;
    }

    // Safety fade-in/out to prevent boundary pops (2048 samples ≈ 46ms @ 44.1kHz)
    const fadeSamples = Math.min(2048, Math.floor(outputLength / 4));
    for (let i = 0; i < fadeSamples; i++) {
        const gain = 0.5 * (1 - Math.cos(Math.PI * i / fadeSamples)); // raised cosine
        result[i] *= gain;
        result[outputLength - 1 - i] *= gain;
    }

    return result;
}

// ── Utility ───────────────────────────────────────────────────
/**
 * Deep clone a 2D magnitude array for editing
 */
export function cloneMagnitude(magnitude) {
    return magnitude.map(frame => new Float64Array(frame));
}

/**
 * Convert magnitude to dB scale
 */
export function magnitudeToDb(value, minDb = -120) {
    if (value <= 0) return minDb;
    const db = 20 * Math.log10(value);
    return Math.max(db, minDb);
}

/**
 * Convert dB to magnitude
 */
export function dbToMagnitude(db) {
    return Math.pow(10, db / 20);
}
