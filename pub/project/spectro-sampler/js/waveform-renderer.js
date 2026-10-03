/**
 * Waveform Renderer for SpectroSampler
 * Canvas 2D waveform display synced with spectrogram view
 */

export class WaveformRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.samples = null;
        this.sampleRate = 44100;

        // Shared view state (synced from spectrogram)
        this.viewStartTime = 0;
        this.viewEndTime = 10;
        this.cursorTime = 0;
        this.startPoint = 0;
        this.regions = [];
        this.selectedRegionIndex = -1;
    }

    get duration() {
        return this.samples ? this.samples.length / this.sampleRate : 0;
    }

    setData(samples, sampleRate) {
        this.samples = samples;
        this.sampleRate = sampleRate;
        this.render();
    }

    syncView(specRenderer) {
        this.viewStartTime = specRenderer.viewStartTime;
        this.viewEndTime = specRenderer.viewEndTime;
        this.cursorTime = specRenderer.cursorTime;
        this.startPoint = specRenderer.startPoint;
        this.regions = specRenderer.regions;
        this.selectedRegionIndex = specRenderer.selectedRegionIndex;
        this.render();
    }

    timeToX(time) {
        const w = this.canvas.width;
        return ((time - this.viewStartTime) / (this.viewEndTime - this.viewStartTime)) * w;
    }

    render() {
        const { canvas, ctx, samples } = this;
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, w, h);

        if (!samples) return;

        // Regions
        for (let i = 0; i < this.regions.length; i++) {
            const r = this.regions[i];
            const x1 = this.timeToX(r.start);
            const x2 = this.timeToX(r.end);
            const isSel = i === this.selectedRegionIndex;
            ctx.fillStyle = isSel ? 'rgba(0,200,255,0.1)' : 'rgba(255,200,0,0.06)';
            ctx.fillRect(x1, 0, x2 - x1, h);
        }

        // Waveform
        const startSample = Math.floor(this.viewStartTime * this.sampleRate);
        const endSample = Math.floor(this.viewEndTime * this.sampleRate);
        const samplesPerPx = (endSample - startSample) / w;

        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#00e5ff');
        gradient.addColorStop(0.5, '#7c4dff');
        gradient.addColorStop(1, '#00e5ff');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();

        const mid = h / 2;
        for (let px = 0; px < w; px++) {
            const s = startSample + Math.floor(px * samplesPerPx);
            const e = Math.min(s + Math.ceil(samplesPerPx), samples.length);
            let min = 0, max = 0;
            for (let i = s; i < e; i++) {
                if (i >= 0 && i < samples.length) {
                    if (samples[i] < min) min = samples[i];
                    if (samples[i] > max) max = samples[i];
                }
            }
            const y1 = mid - max * mid;
            const y2 = mid - min * mid;
            ctx.moveTo(px, y1);
            ctx.lineTo(px, y2);
        }
        ctx.stroke();

        // Center line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, mid);
        ctx.lineTo(w, mid);
        ctx.stroke();

        // Start point
        const spX = this.timeToX(this.startPoint);
        if (spX >= 0 && spX <= w) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(spX, 0);
            ctx.lineTo(spX, h);
            ctx.stroke();
        }

        // Cursor
        const cX = this.timeToX(this.cursorTime);
        if (cX >= 0 && cX <= w) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(cX, 0);
            ctx.lineTo(cX, h);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }
}
