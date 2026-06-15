// app.js

const engineState = {
    isPlaying: false,
    isRecording: false,
    voiceMode: 'digital', // pure, digital, noise, sample
    bpm: 120,
    gateProb: 1.0,
    pitchScale: 1.0,
    pitchRange: 0.0,
    decayTime: 0.1,
    stutterValue: 1, // 1-16, 17=AUTO
    bitDepth: 16,
    downSample: 1,
    masterVol: 1.0,
    isWaveRand: false,
    isDynRand: false,
    currentStep: 0,
    stepVelocities: Array(16).fill(2) // 0, 1, 2, 3
};

let audioEngine = new AudioEngine(engineState);

// Drawing logic
const canvas = document.getElementById('scopeCanvas');
const ctx = canvas.getContext('2d');
let animationFrameId;

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // init

function drawScope() {
    if (!engineState.isPlaying && !engineState.isRecording) return; // Keep rendering if recording to visually see

    // Fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#003310';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
    }
    ctx.stroke();

    if (audioEngine.analyser) {
        const bufferLength = audioEngine.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        audioEngine.analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ff41';
        ctx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }

    animationFrameId = requestAnimationFrame(drawScope);
}

// UI Setup
function initUI() {
    // Generate Steps purely from JS
    const stepEditor = document.getElementById('stepEditor');
    stepEditor.innerHTML = '';

    for (let i = 0; i < 16; i++) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.dataset.idx = i;
        stepDiv.dataset.vel = engineState.stepVelocities[i];

        stepDiv.addEventListener('mousedown', (e) => {
            let vel = (parseInt(stepDiv.dataset.vel) + 1) % 4;
            engineState.stepVelocities[i] = vel;
            stepDiv.dataset.vel = vel;
        });

        stepEditor.appendChild(stepDiv);
    }

    audioEngine.onStepAdvance = (step) => {
        // UI thread callback from Audio Scheduler
        const steps = stepEditor.children;
        for (let i = 0; i < 16; i++) steps[i].classList.remove('active');
        if (steps[step]) steps[step].classList.add('active');
    };

    // Transport
    const startBtn = document.getElementById('startBtn');
    const recBtn = document.getElementById('recBtn');

    startBtn.addEventListener('click', async () => {
        if (!audioEngine.audioCtx) {
            await audioEngine.init();
        }

        engineState.isPlaying = !engineState.isPlaying;

        if (engineState.isPlaying) {
            startBtn.innerText = "STOP ENGINE";
            startBtn.style.color = "#ff3333";
            startBtn.style.borderColor = "#ff3333";
            startBtn.style.textShadow = "0 0 5px #ff3333";
            recBtn.disabled = false;
            audioEngine.startScheduler();
            drawScope();
        } else {
            startBtn.innerText = "START ENGINE";
            startBtn.style.color = "";
            startBtn.style.borderColor = "";
            startBtn.style.textShadow = "";

            // If recording was active, stop it
            if (engineState.isRecording) {
                recBtn.click();
            }
            recBtn.disabled = true;

            audioEngine.stopScheduler();

            // Clear active UI steps
            const steps = stepEditor.children;
            for (let i = 0; i < 16; i++) steps[i].classList.remove('active');

            // Clear canvas
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationFrameId);
        }
    });

    recBtn.addEventListener('click', () => {
        if (!engineState.isPlaying && !engineState.isRecording) return;

        engineState.isRecording = !engineState.isRecording;
        if (engineState.isRecording) {
            recBtn.innerText = "STOP REC";
            recBtn.classList.add('recording');
            audioEngine.startRecording();
        } else {
            recBtn.innerText = "REC";
            recBtn.classList.remove('recording');
            const wavBlob = audioEngine.stopRecording();

            if (wavBlob) {
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                // Date formatting
                const now = new Date();
                const d = now.toISOString().slice(0, 10);
                const t = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');

                a.download = `noise_engine_${d}_${t}.wav`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            }
        }
    });

    // Random Toggles
    const waveRandBtn = document.getElementById('waveRandBtn');
    waveRandBtn.addEventListener('click', () => {
        engineState.isWaveRand = !engineState.isWaveRand;
        waveRandBtn.classList.toggle('on', engineState.isWaveRand);
        waveRandBtn.querySelector('.status').innerText = engineState.isWaveRand ? "ON" : "OFF";
    });

    const dynRandBtn = document.getElementById('dynRandBtn');
    dynRandBtn.addEventListener('click', () => {
        engineState.isDynRand = !engineState.isDynRand;
        dynRandBtn.classList.toggle('on', engineState.isDynRand);
        dynRandBtn.querySelector('.status').innerText = engineState.isDynRand ? "ON" : "OFF";
    });

    // Radio
    const modes = document.getElementsByName('voiceMode');
    modes.forEach(r => {
        r.addEventListener('change', (e) => {
            engineState.voiceMode = e.target.value;
            if (engineState.voiceMode === 'sample' && !audioEngine.sampleBuffer) {
                document.getElementById('sampleInfo').innerText = "ERROR: NO SAMPLE LOADED!";
                document.getElementById('sampleInfo').style.color = "var(--alert-color)";
            } else {
                updateSampleInfo();
            }
        });
    });

    // Sliders
    const linkSlider = (id, stateKey, valId, suffix = "", formatter = null) => {
        const sl = document.getElementById(id);
        const vl = document.getElementById(valId);
        sl.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            engineState[stateKey] = val;
            if (formatter) {
                vl.innerText = formatter(val);
            } else {
                vl.innerText = val + suffix;
            }
            audioEngine.updateWorkletParams();
        });
    };

    linkSlider('bpmSlider', 'bpm', 'bpmVal');
    linkSlider('gateSlider', 'gateProb', 'gateVal', '%', v => `${v}%`);
    document.getElementById('gateSlider').addEventListener('input', e => {
        engineState.gateProb = parseFloat(e.target.value) / 100.0;
    });

    linkSlider('pitchSlider', 'pitchScale', 'pitchVal');
    linkSlider('rangeSlider', 'pitchRange', 'rangeVal', '', v => `±${(v * 12).toFixed(1)} st`); // roughly semantics
    linkSlider('decaySlider', 'decayTime', 'decayVal', 's');
    linkSlider('bitSlider', 'bitDepth', 'bitVal', '', v => v.toFixed(1));
    linkSlider('downSlider', 'downSample', 'downVal');

    linkSlider('masterVolSlider', 'masterVol', 'masterVolVal', '%', v => `${Math.round(v * 100)}%`);

    const stutterSel = document.getElementById('stutterSelect');
    stutterSel.addEventListener('change', (e) => {
        engineState.stutterValue = parseInt(e.target.value);
        document.getElementById('stutterVal').innerText = (engineState.stutterValue === 17) ? "AUTO" : engineState.stutterValue;
    });

    // Normalize Audio Buffer to a peak of 1.0
    function normalizeAudioBuffer(buffer) {
        let peak = 0;
        for (let c = 0; c < buffer.numberOfChannels; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < data.length; i++) {
                const abs = Math.abs(data[i]);
                if (abs > peak) peak = abs;
            }
        }
        if (peak > 0 && peak !== 1.0) {
            const ratio = 1.0 / peak;
            for (let c = 0; c < buffer.numberOfChannels; c++) {
                const data = buffer.getChannelData(c);
                for (let i = 0; i < data.length; i++) {
                    data[i] *= ratio;
                }
            }
        }
    }

    // Sample Loader
    const wavLoader = document.getElementById('wavLoader');
    wavLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            try {
                // Ensure audio context is ready
                if (!audioEngine.audioCtx) {
                    await audioEngine.init();
                }
                const audioBuffer = await audioEngine.audioCtx.decodeAudioData(arrayBuffer);

                // Normalize loaded sample
                normalizeAudioBuffer(audioBuffer);

                audioEngine.sampleBuffer = audioBuffer;
                engineState.voiceMode = 'sample';
                document.querySelector('input[name="voiceMode"][value="sample"]').checked = true;

                // Reset Master Volume to 100%
                engineState.masterVol = 1.0;
                document.getElementById('masterVolSlider').value = 1.0;
                document.getElementById('masterVolVal').innerText = "100%";
                audioEngine.updateWorkletParams();

                updateSampleInfo(file.name, audioBuffer.duration, audioBuffer.sampleRate);
            } catch (err) {
                document.getElementById('sampleInfo').innerText = "ERROR: FAILED TO DECODE WAV";
                document.getElementById('sampleInfo').style.color = "var(--alert-color)";
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function updateSampleInfo(name, duration, sr) {
    const info = document.getElementById('sampleInfo');
    info.style.color = "var(--neon-green-dim)";
    if (audioEngine.sampleBuffer) {
        // Just keeping generic if not fresh loaded
        let cName = name || "SAMPLE_LOADED";
        let cDur = duration !== undefined ? duration : audioEngine.sampleBuffer.duration;
        let cSr = sr !== undefined ? sr : audioEngine.sampleBuffer.sampleRate;
        info.innerText = `SAMPLE: ${cName} / ${cDur.toFixed(2)}s / ${(cSr / 1000).toFixed(1)}kHz`;
    } else {
        info.innerText = "NO SAMPLE LOADED";
    }
}

document.addEventListener('DOMContentLoaded', initUI);
