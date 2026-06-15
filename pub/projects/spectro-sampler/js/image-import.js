/**
 * Image-to-Spectrogram Importer
 * Converts an image to STFT magnitude data so it can be
 * resynthesized as audio through the existing iSTFT pipeline.
 */

// ── Mapping Modes ─────────────────────────────────────────────
export const IMAGE_MODES = [
    { id: 'brightness', label: 'Brightness (Luminance)' },
    { id: 'red', label: 'Red Channel' },
    { id: 'green', label: 'Green Channel' },
    { id: 'blue', label: 'Blue Channel' },
    { id: 'hue', label: 'Hue (HSL)' },
    { id: 'saturation', label: 'Saturation (HSL)' },
    { id: 'inverted', label: 'Inverted Brightness' },
];

/**
 * Load an image file and return its pixel data at the desired resolution.
 * @param {File} file - Image file
 * @param {number} targetWidth  - Number of time frames (columns)
 * @param {number} targetHeight - Number of frequency bins (rows)
 * @returns {Promise<ImageData>}
 */
export function loadImageAsPixels(file, targetWidth, targetHeight) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            URL.revokeObjectURL(img.src);
            resolve(imageData);
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Get original image dimensions without resizing
 */
export function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Convert image pixels to spectrogram magnitude.
 * The image is read bottom-to-top (low freq at bottom → row 0 of magnitude is lowest freq).
 *
 * @param {ImageData} imageData
 * @param {string} mode - one of IMAGE_MODES ids
 * @param {number} maxMagnitude - peak magnitude value for the brightest pixel
 * @returns {Float64Array[]} magnitude - array of frames, each frame is freqBins values
 */
export function imageToMagnitude(imageData, mode = 'brightness', maxMagnitude = 10) {
    const { width, height, data } = imageData;
    // width = numFrames (time), height = freqBins (frequency)
    const magnitude = [];

    for (let x = 0; x < width; x++) {
        const frame = new Float64Array(height);
        for (let y = 0; y < height; y++) {
            // Image row 0 is top, but spectrogram row 0 is lowest frequency
            // So we flip: spectrogram bin 0 (lowest freq) = image row (height-1) (bottom)
            const imgY = height - 1 - y;
            const idx = (imgY * width + x) * 4;
            const r = data[idx] / 255;
            const g = data[idx + 1] / 255;
            const b = data[idx + 2] / 255;
            const a = data[idx + 3] / 255;

            let value = 0;
            switch (mode) {
                case 'brightness':
                    value = (0.299 * r + 0.587 * g + 0.114 * b) * a;
                    break;
                case 'red':
                    value = r * a;
                    break;
                case 'green':
                    value = g * a;
                    break;
                case 'blue':
                    value = b * a;
                    break;
                case 'hue': {
                    const [h] = rgbToHsl(r, g, b);
                    value = h * a;
                    break;
                }
                case 'saturation': {
                    const [, s] = rgbToHsl(r, g, b);
                    value = s * a;
                    break;
                }
                case 'inverted':
                    value = (1 - (0.299 * r + 0.587 * g + 0.114 * b)) * a;
                    break;
                default:
                    value = (0.299 * r + 0.587 * g + 0.114 * b) * a;
            }

            frame[y] = value * maxMagnitude;
        }
        magnitude.push(frame);
    }

    return magnitude;
}

/**
 * Generate random phase for iSTFT (needed since the image has no phase info).
 * Uses randomized initial phases for a more natural-sounding result.
 * @param {number} numFrames
 * @param {number} freqBins
 * @returns {Float64Array[]}
 */
export function generateRandomPhase(numFrames, freqBins) {
    const phase = [];
    for (let f = 0; f < numFrames; f++) {
        const ph = new Float64Array(freqBins);
        for (let b = 0; b < freqBins; b++) {
            ph[b] = (Math.random() * 2 - 1) * Math.PI;
        }
        phase.push(ph);
    }
    return phase;
}

// ── Helpers ───────────────────────────────────────────────────
function rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [h, s, l];
}
