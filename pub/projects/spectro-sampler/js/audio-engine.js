/**
 * Audio Engine for SpectroSampler
 * Handles audio loading, playback, effects, and retrigger
 */

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.buffer = null;         // original AudioBuffer
        this.sourceNode = null;
        this.gainNode = null;
        this.filterNode = null;
        this.reverbNode = null;
        this.reverbGain = null;
        this.dryGain = null;

        this.playing = false;
        this.looping = false;
        this.startPoint = 0;        // seconds
        this.playbackStartTime = 0;
        this.pauseOffset = 0;

        // Retrigger
        this.retriggering = false;
        this.retriggerInterval = 100;  // ms
        this.retriggerTimer = null;
        this.retriggerRegion = null;
        this.retriggerFadeIn = 5;    // ms
        this.retriggerFadeOut = 5;   // ms

        // Filter
        this.filterType = 'lowpass';
        this.filterCutoff = 20000;
        this.filterResonance = 0;

        // Reverb
        this.reverbMix = 0;
        this.reverbDecay = 2;

        // Volume
        this.volume = 1;

        // Callbacks
        this.onPlayStateChange = null;
        this.onTimeUpdate = null;
        this._animFrame = null;
    }

    async init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Build audio graph
        this.gainNode = this.ctx.createGain();
        this.filterNode = this.ctx.createBiquadFilter();
        this.dryGain = this.ctx.createGain();
        this.reverbGain = this.ctx.createGain();

        this.filterNode.type = this.filterType;
        this.filterNode.frequency.value = this.filterCutoff;
        this.filterNode.Q.value = this.filterResonance;

        this.dryGain.gain.value = 1;
        this.reverbGain.gain.value = 0;

        // Chain: source -> filter -> [dry + reverb] -> destination
        this.filterNode.connect(this.dryGain);
        this.dryGain.connect(this.gainNode);
        this.reverbGain.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);

        // Generate impulse response for reverb
        await this._generateImpulseResponse();
    }

    async _generateImpulseResponse() {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 3; // 3 seconds max
        const impulse = this.ctx.createBuffer(2, length, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const decay = Math.exp(-t * (6 / this.reverbDecay));
                data[i] = (Math.random() * 2 - 1) * decay;
            }
        }

        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = impulse;
        this.filterNode.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGain);
    }

    async loadFile(file) {
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        const arrayBuffer = await file.arrayBuffer();
        this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.startPoint = 0;
        this.pauseOffset = 0;
        return this.buffer;
    }

    async loadArrayBuffer(arrayBuffer) {
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.startPoint = 0;
        this.pauseOffset = 0;
        return this.buffer;
    }

    /**
     * Replace the playback buffer with a new Float32Array (e.g. after iSTFT resynthesis)
     */
    replaceBuffer(samples, sampleRate) {
        const newBuffer = this.ctx.createBuffer(1, samples.length, sampleRate || this.ctx.sampleRate);
        newBuffer.copyToChannel(samples, 0);
        this.buffer = newBuffer;
    }

    getMonoSamples() {
        if (!this.buffer) return null;
        const ch0 = this.buffer.getChannelData(0);
        if (this.buffer.numberOfChannels === 1) return ch0;
        // Mix to mono
        const ch1 = this.buffer.getChannelData(1);
        const mono = new Float32Array(ch0.length);
        for (let i = 0; i < ch0.length; i++) {
            mono[i] = (ch0[i] + ch1[i]) * 0.5;
        }
        return mono;
    }

    get duration() {
        return this.buffer ? this.buffer.duration : 0;
    }

    get sampleRate() {
        return this.buffer ? this.buffer.sampleRate : (this.ctx ? this.ctx.sampleRate : 44100);
    }

    get currentTime() {
        if (!this.playing) return this.pauseOffset;
        const elapsed = this.ctx.currentTime - this.playbackStartTime;
        const raw = this.pauseOffset + elapsed;

        // Wrap within loop boundaries when looping
        if (this.looping && this.sourceNode && this.sourceNode.loop) {
            const loopStart = this.sourceNode.loopStart || 0;
            const loopEnd = this.sourceNode.loopEnd || (this.buffer ? this.buffer.duration : 0);
            if (loopEnd > loopStart && raw >= loopEnd) {
                const loopDuration = loopEnd - loopStart;
                return loopStart + ((raw - loopStart) % loopDuration);
            }
        }

        return raw;
    }

    // ── Playback ──────────────────────────────────────────────
    play(offset, regionStart, regionEnd) {
        if (!this.buffer) return;
        this.stop();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const start = offset !== undefined ? offset : this.pauseOffset;
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffer;
        source.loop = this.looping;

        if (regionStart !== undefined && regionEnd !== undefined) {
            source.loopStart = regionStart;
            source.loopEnd = regionEnd;
        }

        source.connect(this.filterNode);
        source.onended = () => {
            if (this.playing && this.sourceNode === source) {
                // Smooth fade-out for reverb tail on natural end
                this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
                this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);
                setTimeout(() => {
                    this.playing = false;
                    this.pauseOffset = 0;
                    this._stopTimeUpdate();
                    // Restore gain
                    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
                    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
                    if (this.onPlayStateChange) this.onPlayStateChange(false);
                }, 100);
            }
        };

        this.sourceNode = source;
        this.playbackStartTime = this.ctx.currentTime;
        this.pauseOffset = start;
        source.start(0, start);
        this.playing = true;

        this._startTimeUpdate();
        if (this.onPlayStateChange) this.onPlayStateChange(true);
    }

    stop() {
        if (this.sourceNode) {
            try {
                // Smooth ramp-down to avoid reverb tail pop (50ms fade)
                this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
                this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
                const oldSource = this.sourceNode;
                setTimeout(() => {
                    try { oldSource.stop(); } catch (e) { }
                    oldSource.disconnect();
                    // Restore gain for next playback
                    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
                    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
                }, 60);
            } catch (e) {
                try { this.sourceNode.stop(); } catch (e2) { }
                this.sourceNode.disconnect();
            }
            this.sourceNode = null;
        }
        if (this.playing) {
            this.pauseOffset = this.currentTime;
        }
        this.playing = false;
        this._stopTimeUpdate();
        this.stopRetrigger();
    }

    togglePlay() {
        if (this.playing) {
            this.stop();
            if (this.onPlayStateChange) this.onPlayStateChange(false);
        } else {
            this.play();
        }
    }

    seekTo(time) {
        this.pauseOffset = Math.max(0, Math.min(time, this.duration));
        if (this.playing) {
            this.play(this.pauseOffset);
        }
    }

    // ── Retrigger ─────────────────────────────────────────────
    startRetrigger(regionStart, regionEnd, intervalMs) {
        this.stopRetrigger();
        this.retriggering = true;
        this.retriggerRegion = { start: regionStart, end: regionEnd };
        if (intervalMs) this.retriggerInterval = intervalMs;

        const trigger = () => {
            if (!this.retriggering) return;
            this._playRetriggerSlice();
        };

        trigger();
        this.retriggerTimer = setInterval(trigger, this.retriggerInterval);
    }

    _playRetriggerSlice() {
        if (!this.buffer || !this.retriggerRegion) return;
        const { start, end } = this.retriggerRegion;
        const duration = Math.min(end - start, this.retriggerInterval / 1000);

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffer;

        const envelope = this.ctx.createGain();
        const fadeIn = this.retriggerFadeIn / 1000;
        const fadeOut = this.retriggerFadeOut / 1000;
        const now = this.ctx.currentTime;

        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(1, now + fadeIn);
        envelope.gain.setValueAtTime(1, now + duration - fadeOut);
        envelope.gain.linearRampToValueAtTime(0, now + duration);

        source.connect(envelope);
        envelope.connect(this.filterNode);
        source.start(0, start, duration);
    }

    stopRetrigger() {
        this.retriggering = false;
        if (this.retriggerTimer) {
            clearInterval(this.retriggerTimer);
            this.retriggerTimer = null;
        }
    }

    // ── Filter ────────────────────────────────────────────────
    setFilterType(type) {
        this.filterType = type;
        if (this.filterNode) this.filterNode.type = type;
    }

    setFilterCutoff(value) {
        this.filterCutoff = value;
        if (this.filterNode) {
            this.filterNode.frequency.setTargetAtTime(value, this.ctx.currentTime, 0.01);
        }
    }

    setFilterResonance(value) {
        this.filterResonance = value;
        if (this.filterNode) {
            this.filterNode.Q.setTargetAtTime(value, this.ctx.currentTime, 0.01);
        }
    }

    // ── Reverb ────────────────────────────────────────────────
    setReverbMix(value) {
        this.reverbMix = value;
        if (this.dryGain) this.dryGain.gain.setTargetAtTime(1 - value, this.ctx.currentTime, 0.01);
        if (this.reverbGain) this.reverbGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
    }

    async setReverbDecay(value) {
        this.reverbDecay = value;
        await this._generateImpulseResponse();
    }

    // ── Volume ────────────────────────────────────────────────
    setVolume(value) {
        this.volume = value;
        if (this.gainNode) {
            this.gainNode.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
        }
    }

    // ── Time update loop ──────────────────────────────────────
    _startTimeUpdate() {
        const update = () => {
            if (!this.playing) return;
            if (this.onTimeUpdate) this.onTimeUpdate(this.currentTime);
            this._animFrame = requestAnimationFrame(update);
        };
        update();
    }

    _stopTimeUpdate() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
    }

    destroy() {
        this.stop();
        if (this.ctx) this.ctx.close();
    }
}
