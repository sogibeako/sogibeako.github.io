/**
 * Spectrogram Renderer for SpectroSampler
 * Canvas 2D rendering with colormap, zoom/scroll, markers
 */

import { magnitudeToDb } from './stft.js';

// ── Viridis-inspired colormap ─────────────────────────────────
const COLORMAP = generateViridisColormap(256);

function generateViridisColormap(steps) {
    // Simplified Viridis: deep purple → blue → teal → green → yellow
    const keypoints = [
        [0.0, [13, 8, 135]],    // deep purple
        [0.15, [84, 2, 163]],    // purple
        [0.3, [139, 10, 165]],  // magenta-purple
        [0.45, [185, 50, 137]],  // pink
        [0.55, [219, 92, 104]],  // coral
        [0.65, [238, 130, 62]],  // orange
        [0.8, [253, 185, 21]],  // gold
        [0.9, [240, 230, 30]],  // yellow
        [1.0, [252, 255, 164]], // light yellow
    ];
    const map = new Array(steps);
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        let lower = keypoints[0], upper = keypoints[keypoints.length - 1];
        for (let k = 0; k < keypoints.length - 1; k++) {
            if (t >= keypoints[k][0] && t <= keypoints[k + 1][0]) {
                lower = keypoints[k];
                upper = keypoints[k + 1];
                break;
            }
        }
        const range = upper[0] - lower[0];
        const frac = range > 0 ? (t - lower[0]) / range : 0;
        map[i] = [
            Math.round(lower[1][0] + (upper[1][0] - lower[1][0]) * frac),
            Math.round(lower[1][1] + (upper[1][1] - lower[1][1]) * frac),
            Math.round(lower[1][2] + (upper[1][2] - lower[1][2]) * frac),
        ];
    }
    return map;
}

export class SpectrogramRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Data
        this.magnitude = null;   // Float64Array[]
        this.numFrames = 0;
        this.freqBins = 0;
        this.sampleRate = 44100;
        this.fftSize = 4096;
        this.hopSize = 1024;

        // View state
        this.viewStartTime = 0;    // seconds
        this.viewEndTime = 10;     // seconds
        this.viewMinFreq = 0;      // Hz
        this.viewMaxFreq = 22050;  // Hz
        this.logFreqScale = false;
        this.minDb = -90;
        this.maxDb = 0;

        // Playback cursor
        this.cursorTime = 0;       // seconds

        // Start point
        this.startPoint = 0;       // seconds

        // Time selection (1D)
        this.selection = null;     // { startTime, endTime } or null

        // 2D rect selection
        this.rectSelection = null; // { startTime, endTime, minFreq, maxFreq } or null

        // Regions
        this.regions = [];
        this.selectedRegionIndex = -1;

        // Cached image
        this._cachedImage = null;
        this._cacheKey = '';

        // Interaction
        this._isDragging = false;
        this._dragStartX = 0;
        this._dragStartY = 0;
        this._dragStartViewStart = 0;
        this._dragStartViewMinFreq = 0;

        this._setupEvents();
    }

    get duration() {
        return this.numFrames * this.hopSize / this.sampleRate;
    }

    setData(magnitude, numFrames, freqBins, sampleRate, fftSize, hopSize) {
        this.magnitude = magnitude;
        this.numFrames = numFrames;
        this.freqBins = freqBins;
        this.sampleRate = sampleRate;
        this.fftSize = fftSize;
        this.hopSize = hopSize;
        this.viewStartTime = 0;
        this.viewEndTime = this.duration;
        this.viewMinFreq = 0;
        this.viewMaxFreq = sampleRate / 2;
        this._cachedImage = null;
        this.render();
    }

    // ── Coordinate mapping ────────────────────────────────────
    timeToX(time) {
        const w = this.canvas.width;
        return ((time - this.viewStartTime) / (this.viewEndTime - this.viewStartTime)) * w;
    }

    xToTime(x) {
        const w = this.canvas.width;
        return this.viewStartTime + (x / w) * (this.viewEndTime - this.viewStartTime);
    }

    freqToY(freq) {
        const h = this.canvas.height;
        if (this.logFreqScale) {
            const minLog = Math.log2(Math.max(this.viewMinFreq, 20));
            const maxLog = Math.log2(this.viewMaxFreq);
            const freqLog = Math.log2(Math.max(freq, 20));
            return h - ((freqLog - minLog) / (maxLog - minLog)) * h;
        }
        return h - ((freq - this.viewMinFreq) / (this.viewMaxFreq - this.viewMinFreq)) * h;
    }

    yToFreq(y) {
        const h = this.canvas.height;
        const ratio = 1 - y / h;
        if (this.logFreqScale) {
            const minLog = Math.log2(Math.max(this.viewMinFreq, 20));
            const maxLog = Math.log2(this.viewMaxFreq);
            return Math.pow(2, minLog + ratio * (maxLog - minLog));
        }
        return this.viewMinFreq + ratio * (this.viewMaxFreq - this.viewMinFreq);
    }

    timeToFrame(time) {
        return Math.floor(time * this.sampleRate / this.hopSize);
    }

    freqToBin(freq) {
        return Math.round(freq / (this.sampleRate / this.fftSize));
    }

    // ── Rendering ─────────────────────────────────────────────
    render() {
        const { canvas, ctx } = this;
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, w, h);

        if (!this.magnitude || this.numFrames === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Drop a WAV file here to begin', w / 2, h / 2);
            return;
        }

        this._renderSpectrogram();
        this._renderRegions();
        this._renderSelection();
        this._renderRectSelection();
        this._renderStartPoint();
        this._renderCursor();
        this._renderAxes();
    }

    _renderSpectrogram() {
        const { ctx, canvas, magnitude } = this;
        const w = canvas.width;
        const h = canvas.height;

        const startFrame = Math.max(0, this.timeToFrame(this.viewStartTime));
        const endFrame = Math.min(this.numFrames - 1, this.timeToFrame(this.viewEndTime));

        // Create ImageData
        const imgData = ctx.createImageData(w, h);
        const data = imgData.data;

        for (let px = 0; px < w; px++) {
            const time = this.xToTime(px);
            const frame = this.timeToFrame(time);
            if (frame < 0 || frame >= this.numFrames) continue;

            const mag = magnitude[frame];
            if (!mag) continue;

            for (let py = 0; py < h; py++) {
                const freq = this.yToFreq(py);
                const bin = this.freqToBin(freq);
                if (bin < 0 || bin >= this.freqBins) continue;

                const db = magnitudeToDb(mag[bin], this.minDb);
                const norm = Math.max(0, Math.min(1, (db - this.minDb) / (this.maxDb - this.minDb)));
                const colorIdx = Math.floor(norm * 255);
                const [r, g, b] = COLORMAP[colorIdx];

                const idx = (py * w + px) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    _renderRegions() {
        const { ctx } = this;
        for (let i = 0; i < this.regions.length; i++) {
            const region = this.regions[i];
            const x1 = this.timeToX(region.start);
            const x2 = this.timeToX(region.end);
            const isSelected = i === this.selectedRegionIndex;

            ctx.fillStyle = isSelected
                ? 'rgba(0, 200, 255, 0.15)'
                : `${region.color || 'rgba(255, 200, 0, 0.1)'}`;
            ctx.fillRect(x1, 0, x2 - x1, this.canvas.height);

            ctx.strokeStyle = isSelected ? '#00c8ff' : (region.color || '#ffcc00');
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(x1, 0, x2 - x1, this.canvas.height);
            ctx.setLineDash([]);

            // Region label
            if (region.name) {
                ctx.fillStyle = isSelected ? '#00c8ff' : '#ffcc00';
                ctx.font = '11px "Inter", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(region.name, x1 + 4, 14);
            }
        }
    }

    _renderStartPoint() {
        const { ctx, canvas } = this;
        const x = this.timeToX(this.startPoint);
        if (x < 0 || x > canvas.width) return;

        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();

        // Triangle marker
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 6, -12);
        ctx.lineTo(x + 6, -12);
        ctx.closePath();
        ctx.fill();
    }

    _renderSelection() {
        if (!this.selection) return;
        const { ctx, canvas } = this;
        const x1 = this.timeToX(this.selection.startTime);
        const x2 = this.timeToX(this.selection.endTime);
        const w = x2 - x1;
        if (w < 1) return;

        // Highlight band
        ctx.fillStyle = 'rgba(0, 200, 255, 0.12)';
        ctx.fillRect(x1, 0, w, canvas.height);

        // Borders
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, 0); ctx.lineTo(x1, canvas.height);
        ctx.moveTo(x2, 0); ctx.lineTo(x2, canvas.height);
        ctx.stroke();
    }

    _renderRectSelection() {
        if (!this.rectSelection) return;
        const { ctx } = this;
        const x1 = this.timeToX(this.rectSelection.startTime);
        const x2 = this.timeToX(this.rectSelection.endTime);
        const y1 = this.freqToY(this.rectSelection.maxFreq);
        const y2 = this.freqToY(this.rectSelection.minFreq);
        const w = x2 - x1;
        const h = y2 - y1;
        if (w < 1 || h < 1) return;

        // Highlight patch
        ctx.fillStyle = 'rgba(255, 160, 0, 0.15)';
        ctx.fillRect(x1, y1, w, h);

        // Dotted border
        ctx.strokeStyle = 'rgba(255, 160, 0, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x1, y1, w, h);
        ctx.setLineDash([]);
    }

    _renderCursor() {
        const { ctx, canvas } = this;
        const x = this.timeToX(this.cursorTime);
        if (x < 0 || x > canvas.width) return;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    _renderAxes() {
        const { ctx, canvas } = this;
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px "Inter", monospace';

        // Time axis (bottom)
        const timeRange = this.viewEndTime - this.viewStartTime;
        const timeStep = this._niceStep(timeRange, 8);
        const startT = Math.ceil(this.viewStartTime / timeStep) * timeStep;
        ctx.textAlign = 'center';
        for (let t = startT; t <= this.viewEndTime; t += timeStep) {
            const x = this.timeToX(t);
            ctx.fillText(t.toFixed(2) + 's', x, h - 4);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(x, 0, 1, h);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
        }

        // Frequency axis (left)
        const freqRange = this.viewMaxFreq - this.viewMinFreq;
        const freqStep = this._niceStep(freqRange, 6);
        const startF = Math.ceil(this.viewMinFreq / freqStep) * freqStep;
        ctx.textAlign = 'left';
        for (let f = startF; f <= this.viewMaxFreq; f += freqStep) {
            const y = this.freqToY(f);
            const label = f >= 1000 ? (f / 1000).toFixed(1) + 'k' : f.toFixed(0);
            ctx.fillText(label, 4, y - 2);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(0, y, w, 1);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
        }
    }

    _niceStep(range, targetTicks) {
        const rough = range / targetTicks;
        const mag = Math.pow(10, Math.floor(Math.log10(rough)));
        const residual = rough / mag;
        if (residual <= 1) return mag;
        if (residual <= 2) return 2 * mag;
        if (residual <= 5) return 5 * mag;
        return 10 * mag;
    }

    // ── Zoom/Scroll ───────────────────────────────────────────
    zoomTime(factor, centerX) {
        const centerTime = this.xToTime(centerX || this.canvas.width / 2);
        const range = this.viewEndTime - this.viewStartTime;
        const newRange = range * factor;
        const minRange = 0.01; // 10ms minimum
        const maxRange = this.duration;
        const clampedRange = Math.max(minRange, Math.min(maxRange, newRange));

        const ratio = (centerTime - this.viewStartTime) / range;
        this.viewStartTime = centerTime - ratio * clampedRange;
        this.viewEndTime = this.viewStartTime + clampedRange;

        // Clamp boundaries
        if (this.viewStartTime < 0) {
            this.viewEndTime -= this.viewStartTime;
            this.viewStartTime = 0;
        }
        if (this.viewEndTime > this.duration) {
            this.viewStartTime -= (this.viewEndTime - this.duration);
            this.viewEndTime = this.duration;
            if (this.viewStartTime < 0) this.viewStartTime = 0;
        }

        this.render();
    }

    zoomFreq(factor, centerY) {
        const centerFreq = this.yToFreq(centerY || this.canvas.height / 2);
        const range = this.viewMaxFreq - this.viewMinFreq;
        const newRange = range * factor;
        const nyquist = this.sampleRate / 2;

        const ratio = (centerFreq - this.viewMinFreq) / range;
        this.viewMinFreq = centerFreq - ratio * newRange;
        this.viewMaxFreq = this.viewMinFreq + newRange;

        if (this.viewMinFreq < 0) {
            this.viewMaxFreq -= this.viewMinFreq;
            this.viewMinFreq = 0;
        }
        if (this.viewMaxFreq > nyquist) {
            this.viewMinFreq -= (this.viewMaxFreq - nyquist);
            this.viewMaxFreq = nyquist;
            if (this.viewMinFreq < 0) this.viewMinFreq = 0;
        }

        this.render();
    }

    scrollTime(deltaSeconds) {
        const range = this.viewEndTime - this.viewStartTime;
        this.viewStartTime += deltaSeconds;
        this.viewEndTime += deltaSeconds;

        if (this.viewStartTime < 0) {
            this.viewStartTime = 0;
            this.viewEndTime = range;
        }
        if (this.viewEndTime > this.duration) {
            this.viewEndTime = this.duration;
            this.viewStartTime = this.viewEndTime - range;
        }

        this.render();
    }

    // ── Events ────────────────────────────────────────────────
    _setupEvents() {
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.15 : 0.87;

            if (e.shiftKey) {
                this.zoomFreq(factor, e.offsetY);
            } else if (e.ctrlKey) {
                // Scroll
                const range = this.viewEndTime - this.viewStartTime;
                this.scrollTime(e.deltaY > 0 ? range * 0.1 : -range * 0.1);
            } else {
                this.zoomTime(factor, e.offsetX);
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.altKey)) {
                // Middle click or Alt+click = pan
                this._isDragging = true;
                this._dragStartX = e.offsetX;
                this._dragStartY = e.offsetY;
                this._dragStartViewStart = this.viewStartTime;
                this._dragStartViewMinFreq = this.viewMinFreq;
                this.canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this._isDragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const dx = e.clientX - rect.left - this._dragStartX;
            const dy = e.clientY - rect.top - this._dragStartY;

            const timePerPx = (this.viewEndTime - this.viewStartTime) / this.canvas.width;
            const freqPerPx = (this.viewMaxFreq - this.viewMinFreq) / this.canvas.height;

            const timeRange = this.viewEndTime - this.viewStartTime;
            this.viewStartTime = this._dragStartViewStart - dx * timePerPx;
            this.viewEndTime = this.viewStartTime + timeRange;

            const freqRange = this.viewMaxFreq - this.viewMinFreq;
            this.viewMinFreq = this._dragStartViewMinFreq + dy * freqPerPx;
            this.viewMaxFreq = this.viewMinFreq + freqRange;

            this.render();
        });

        window.addEventListener('mouseup', () => {
            if (this._isDragging) {
                this._isDragging = false;
                this.canvas.style.cursor = 'crosshair';
            }
        });
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }
}
