// worklet.js

class GlitchProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bitDepth = 16;
        this.downSample = 1;
        this.sampleCounter = 0;
        this.lastL = 0;
        this.lastR = 0;

        this.port.onmessage = (e) => {
            if (e.data.type === 'parameters') {
                if (e.data.bitDepth !== undefined) this.bitDepth = e.data.bitDepth;
                if (e.data.downSample !== undefined) this.downSample = e.data.downSample;
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || input.length === 0) return true;

        const channelCount = Math.min(input.length, output.length);
        const step = Math.pow(0.5, this.bitDepth); // Pseudo-bit quantization magnitude

        for (let c = 0; c < channelCount; c++) {
            const inChannel = input[c];
            const outChannel = output[c];

            for (let i = 0; i < inChannel.length; i++) {
                // Downsample logic over channels
                // Note: sampleCounter must be advanced only once per frame across all channels,
                // so we check channel 0 for counter increment.
                if (c === 0) {
                    this.sampleCounter++;
                }

                let val = inChannel[i];

                if (this.sampleCounter % this.downSample === 0) {
                    // Apply bitcrush quantization
                    val = step * Math.round(val / step);

                    if (c === 0) this.lastL = val;
                    else if (c === 1) this.lastR = val;

                    outChannel[i] = val;
                } else {
                    // Hold previous value
                    outChannel[i] = (c === 0) ? this.lastL : (c === 1 ? this.lastR : val);
                }
            }
        }

        return true;
    }
}

class RecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.isRecording = false;

        this.port.onmessage = (e) => {
            if (e.data.command === 'start') {
                this.isRecording = true;
            } else if (e.data.command === 'stop') {
                this.isRecording = false;
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        // Pass through audio unchanged
        if (input && input.length > 0) {
            for (let c = 0; c < input.length; c++) {
                if (output[c]) {
                    output[c].set(input[c]);
                }
            }

            // If recording, send data to main thread
            if (this.isRecording) {
                // We assume max 2 channels
                const left = input[0] ? new Float32Array(input[0]) : new Float32Array(128);
                const right = input[1] ? new Float32Array(input[1]) : new Float32Array(left); // mono fallback

                // Transfer to avoid GC stall if possible, or just post
                this.port.postMessage({
                    type: 'audioData',
                    left: left,
                    right: right
                }, [left.buffer, right.buffer]);
            }
        }

        return true;
    }
}

registerProcessor('glitch-processor', GlitchProcessor);
registerProcessor('recorder-processor', RecorderProcessor);
