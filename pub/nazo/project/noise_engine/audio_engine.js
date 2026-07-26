// audio_engine.js

class AudioEngine {
    constructor(state) {
        this.state = state; // Reference to global engineState
        this.audioCtx = null;
        this.masterGain = null;
        this.glitchNode = null;
        this.recorderNode = null;
        this.analyser = null;

        // Scheduling
        this.nextNoteTime = 0;
        this.scheduleAheadTime = 0.1; // 100ms
        this.lookahead = 25; // ms
        this.timerID = null;

        // Buffers
        this.sharedNoiseBuffer = null;
        this.sampleBuffer = null;

        // Recording
        this.recordedLeft = [];
        this.recordedRight = [];
    }

    async init() {
        if (this.audioCtx) return;

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Load Worklets
        try {
            await this.audioCtx.audioWorklet.addModule('worklet.js');
        } catch (e) {
            console.error("Failed to load AudioWorklet:", e);
            alert("Error loading AudioWorklet. Cannot start engine.");
            return;
        }

        // Create Master Nodes
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = this.state.masterVol;

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;

        this.glitchNode = new AudioWorkletNode(this.audioCtx, 'glitch-processor');
        this.recorderNode = new AudioWorkletNode(this.audioCtx, 'recorder-processor');

        // Handle recording messages
        this.recorderNode.port.onmessage = (e) => {
            if (e.data.type === 'audioData') {
                this.recordedLeft.push(new Float32Array(e.data.left));
                this.recordedRight.push(new Float32Array(e.data.right));
            }
        };

        // Routing
        // Generated Voices -> GlitchNode -> MasterGain -> RecorderNode -> Analyser -> Destination
        this.glitchNode.connect(this.masterGain);
        this.masterGain.connect(this.recorderNode);
        this.recorderNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        // Pre-generate noise buffer
        this.createSharedNoiseBuffer();

        this.updateWorkletParams();
    }

    createSharedNoiseBuffer() {
        // 0.5s of white noise
        const frameCount = this.audioCtx.sampleRate * 0.5;
        this.sharedNoiseBuffer = this.audioCtx.createBuffer(1, frameCount, this.audioCtx.sampleRate);
        const data = this.sharedNoiseBuffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    updateWorkletParams() {
        if (!this.glitchNode) return;
        this.glitchNode.port.postMessage({
            type: 'parameters',
            bitDepth: this.state.bitDepth,
            downSample: this.state.downSample
        });

        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.state.masterVol, this.audioCtx.currentTime, 0.05);
        }
    }

    startScheduler() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.state.currentStep = 0;
        this.nextNoteTime = this.audioCtx.currentTime + 0.05;

        const scheduler = () => {
            if (!this.state.isPlaying) return;
            while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
                this.scheduleStep(this.state.currentStep, this.nextNoteTime);
                this.advanceNote();
            }
            this.timerID = setTimeout(scheduler, this.lookahead);
        };

        scheduler();
    }

    stopScheduler() {
        clearTimeout(this.timerID);
    }

    advanceNote() {
        const secondsPerBeat = 60.0 / this.state.bpm;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.state.currentStep = (this.state.currentStep + 1) % 16;

        // Notify UI to update active step
        if (this.onStepAdvance) {
            this.onStepAdvance(this.state.currentStep);
        }
    }

    scheduleStep(stepIdx, time) {
        const velConfig = this.state.stepVelocities[stepIdx];
        if (velConfig === 0) return; // Silent step

        // Gate check
        if (Math.random() > this.state.gateProb) return;

        // Base velocity gain
        let velGain = 0;
        if (velConfig === 1) velGain = 0.08;
        else if (velConfig === 2) velGain = 0.18;
        else if (velConfig === 3) velGain = 0.35; // Tamed down from 0.45

        // Dynamics Randomization
        if (this.state.isDynRand) {
            velGain *= (0.2 + Math.random() * 0.8);
        }

        // Stutter/Ratchet calc
        let divs = this.state.stutterValue;
        if (divs === 17) { // AUTO
            if (Math.random() < 0.3) {
                const autoDivs = [2, 4, 8, 16];
                divs = autoDivs[Math.floor(Math.random() * autoDivs.length)];
            } else {
                divs = 1;
            }
        }

        const stepDuration = (60.0 / this.state.bpm) * 0.25;
        const subStepTime = stepDuration / divs;

        for (let i = 0; i < divs; i++) {
            this.triggerVoice(time + i * subStepTime, velGain);
        }
    }

    triggerVoice(time, gainVal) {
        // Pitch Evaluation
        const pitchShift = Math.pow(2, (Math.random() - 0.5) * (this.state.pitchRange / 12) * 24);
        // Note: UI range 0-2 (up to 2 octaves spread) -> +/- 12 semitones x range
        const finalPitchFactor = this.state.pitchScale * pitchShift;

        // Mode Selection
        let mode = this.state.voiceMode;
        if (this.state.isWaveRand) {
            const modes = ['pure', 'digital', 'noise', 'sample'];
            // If no sample is loaded, exclude it from random
            if (!this.sampleBuffer) {
                modes.pop();
            }
            mode = modes[Math.floor(Math.random() * modes.length)];
        }

        // Envelope
        const voiceGain = this.audioCtx.createGain();
        voiceGain.connect(this.glitchNode);

        voiceGain.gain.setValueAtTime(0.0001, time);
        voiceGain.gain.exponentialRampToValueAtTime(Math.max(gainVal, 0.0001), time + 0.002);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + this.state.decayTime);

        // Source Generation
        if (mode === 'pure' || mode === 'digital') {
            const osc = this.audioCtx.createOscillator();
            if (mode === 'pure') {
                osc.type = 'triangle';
            } else {
                osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';
            }
            osc.frequency.setValueAtTime(440 * finalPitchFactor, time);
            osc.connect(voiceGain);
            osc.start(time);
            osc.stop(time + this.state.decayTime + 0.1);

        } else if (mode === 'noise') {
            const noise = this.audioCtx.createBufferSource();
            noise.buffer = this.sharedNoiseBuffer;
            noise.playbackRate.setValueAtTime(finalPitchFactor, time);

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = 600 * finalPitchFactor;
            filter.Q.value = 20;
            filter.gain.value = 25;

            noise.connect(filter);
            filter.connect(voiceGain);

            noise.start(time);
            noise.stop(time + this.state.decayTime + 0.1);

        } else if (mode === 'sample') {
            if (!this.sampleBuffer) return; // Mode fallback just ignores if empty buffer

            const sampleSrc = this.audioCtx.createBufferSource();
            sampleSrc.buffer = this.sampleBuffer;
            sampleSrc.playbackRate.setValueAtTime(finalPitchFactor, time);

            // Light filtering for samples
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 8000;
            filter.Q.value = 2;

            sampleSrc.connect(filter);
            filter.connect(voiceGain);

            sampleSrc.start(time);
            // Decay handles the envelope, wait a bit before hard stop
            sampleSrc.stop(time + this.state.decayTime + 0.1);
        }
    }

    startRecording() {
        if (!this.recorderNode) return;
        this.recordedLeft = [];
        this.recordedRight = [];
        this.recorderNode.port.postMessage({ command: 'start' });
    }

    stopRecording() {
        if (!this.recorderNode) return null;
        this.recorderNode.port.postMessage({ command: 'stop' });
        return this.exportWAV();
    }

    exportWAV() {
        if (this.recordedLeft.length === 0) return null;

        // Flatten arrays
        const totalLen = this.recordedLeft.reduce((acc, arr) => acc + arr.length, 0);
        const leftBuffer = new Float32Array(totalLen);
        const rightBuffer = new Float32Array(totalLen);

        let offset = 0;
        for (let i = 0; i < this.recordedLeft.length; i++) {
            leftBuffer.set(this.recordedLeft[i], offset);
            rightBuffer.set(this.recordedRight[i], offset);
            offset += this.recordedLeft[i].length;
        }

        // Interleave
        const interleaved = new Float32Array(totalLen * 2);
        for (let i = 0; i < totalLen; i++) {
            interleaved[i * 2] = leftBuffer[i];
            interleaved[i * 2 + 1] = rightBuffer[i];
        }

        // Create ArrayBuffer for WAV
        const dataLength = interleaved.length * 2; // 16-bit
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);
        const sampleRate = this.audioCtx.sampleRate;

        // RIFF chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        this.writeString(view, 8, 'WAVE');

        // FMT sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);   // format chunk length
        view.setUint16(20, 1, true);    // PCM format
        view.setUint16(22, 2, true);    // stereo
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true); // byte rate (SR * 2 * 2)
        view.setUint16(32, 4, true);    // block align
        view.setUint16(34, 16, true);   // bits per sample

        // Data sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Write PCM samples
        let offset2 = 44;
        for (let i = 0; i < interleaved.length; i++) {
            let s = Math.max(-1, Math.min(1, interleaved[i]));
            view.setInt16(offset2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset2 += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}
