/**
 * SpectroSampler - Main Application
 * Wires together all modules, handles UI events, file loading
 */

import { AudioEngine } from './audio-engine.js';
import { stft, istft, hannWindow, cloneMagnitude } from './stft.js';
import { SpectrogramRenderer } from './spectrogram-renderer.js';
import { WaveformRenderer } from './waveform-renderer.js';
import { RegionManager } from './region-manager.js';
import { EffectLayerStack, getEffectList, getParamDefs } from './effect-layer.js';
import { ToolManager, TOOL_TYPES } from './tools.js';
import { loadImageAsPixels, imageToMagnitude, generateRandomPhase, getImageDimensions } from './image-import.js';
import { SpectroClipboard } from './clipboard.js';
import { applyAffineTransform, isIdentityTransform } from './transform.js';

// ── State ─────────────────────────────────────────────────────
let engine, specRenderer, waveRenderer, regionManager, effectStack, toolManager;

// STFT data
let originalMagnitude = null;
let originalPhase = null;
let processedMagnitude = null;
let stftParams = { fftSize: 4096, hopSize: 1024, window: null };
let needsResynth = false; // true when spectrogram was edited but audio not yet resynthesized
let currentSelection = null;     // { startTime, endTime } or null
let currentRectSelection = null; // { startTime, endTime, minFreq, maxFreq } or null
const clipboard = new SpectroClipboard();
let lastClickPos = { time: 0, freq: 0, frame: 0, bin: 0 }; // last click on spectrogram

// Magnitude undo/redo stack (for clipboard operations)
const magUndoStack = [];
const magRedoStack = [];
const MAX_MAG_UNDO = 30;

// ── Initialization ────────────────────────────────────────────
async function init() {
    engine = new AudioEngine();
    await engine.init();

    const specCanvas = document.getElementById('spectrogram-canvas');
    const waveCanvas = document.getElementById('waveform-canvas');

    specRenderer = new SpectrogramRenderer(specCanvas);
    waveRenderer = new WaveformRenderer(waveCanvas);
    regionManager = new RegionManager();
    effectStack = new EffectLayerStack();
    toolManager = new ToolManager();

    stftParams.window = hannWindow(stftParams.fftSize);

    setupTransport();
    setupFileHandling();
    setupToolbar();
    setupEffectPanel();
    setupFilterControls();
    setupReverbControls();
    setupRetriggerControls();
    setupCanvasInteraction();
    setupResizeHandler();
    setupSTFTControls();
    setupUndoRedo();
    setupKeyboardShortcuts();
    setupImageImport();
    setupTransformPanel();
    setupDirectInput();

    // Initial resize
    specRenderer.resize();
    waveRenderer.resize();

    // Region manager callbacks
    regionManager.onRegionsChange = (regions, selected) => {
        specRenderer.regions = regions;
        specRenderer.selectedRegionIndex = selected;
        specRenderer.render();
        waveRenderer.syncView(specRenderer);
        updateRegionList();
    };

    // Effect stack callbacks
    effectStack.onChange = () => {
        updateEffectLayerUI();
        reprocessSpectrogram();
        updateUndoRedoButtons();
    };

    // Time update
    engine.onTimeUpdate = (time) => {
        specRenderer.cursorTime = time;
        specRenderer.render();
        waveRenderer.syncView(specRenderer);
        updateTimeDisplay(time);
    };

    engine.onPlayStateChange = (playing) => {
        const btn = document.getElementById('btn-play');
        btn.textContent = playing ? '⏸' : '▶';
        btn.classList.toggle('active', playing);
    };

    console.log('SpectroSampler initialized');
}

// ── File Handling ─────────────────────────────────────────────
function setupFileHandling() {
    const dropZone = document.getElementById('main-view');
    const fileInput = document.getElementById('file-input');
    const loadBtn = document.getElementById('btn-load');

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (!file) return;
        // Auto-detect: image or audio
        if (file.type.startsWith('image/')) {
            openImageImportDialog(file);
        } else {
            loadAudioFile(file);
        }
    });

    // File input
    loadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) loadAudioFile(e.target.files[0]);
    });
}

async function loadAudioFile(file) {
    showStatus('Loading: ' + file.name);

    try {
        await engine.loadFile(file);
        document.getElementById('file-name').textContent = file.name;

        // Get mono samples for analysis
        const mono = engine.getMonoSamples();
        waveRenderer.setData(mono, engine.sampleRate);

        // Compute STFT
        showStatus('Computing STFT...');
        await computeSTFT(mono, engine.sampleRate);

        showStatus('Ready');
    } catch (err) {
        showStatus('Error: ' + err.message);
        console.error(err);
    }
}

async function computeSTFT(samples, sampleRate) {
    const { fftSize, hopSize, window } = stftParams;

    // Run in chunks to avoid blocking UI
    return new Promise((resolve) => {
        setTimeout(() => {
            const result = stft(samples, fftSize, hopSize, window);
            originalMagnitude = result.magnitude;
            originalPhase = result.phase;
            processedMagnitude = cloneMagnitude(originalMagnitude);

            specRenderer.setData(
                processedMagnitude,
                result.numFrames,
                result.freqBins,
                sampleRate,
                fftSize,
                hopSize
            );

            waveRenderer.viewStartTime = 0;
            waveRenderer.viewEndTime = samples.length / sampleRate;
            waveRenderer.syncView(specRenderer);

            resolve();
        }, 50);
    });
}

// ── Image Import ─────────────────────────────────────────────
let pendingImageFile = null;

function setupImageImport() {
    const imageInput = document.getElementById('image-input');
    const loadImageBtn = document.getElementById('btn-load-image');
    const dialog = document.getElementById('image-import-dialog');
    const cancelBtn = document.getElementById('img-cancel');
    const importBtn = document.getElementById('img-import');
    const durationSlider = document.getElementById('img-duration');
    const durationVal = document.getElementById('img-duration-val');
    const magSlider = document.getElementById('img-magnitude');
    const magVal = document.getElementById('img-mag-val');

    loadImageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => {
        if (e.target.files[0]) openImageImportDialog(e.target.files[0]);
        imageInput.value = ''; // reset for re-selection
    });

    durationSlider.addEventListener('input', (e) => {
        durationVal.textContent = parseFloat(e.target.value).toFixed(1) + 's';
    });

    magSlider.addEventListener('input', (e) => {
        magVal.textContent = e.target.value;
    });

    cancelBtn.addEventListener('click', () => {
        dialog.style.display = 'none';
        pendingImageFile = null;
    });

    // Click backdrop to close
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.style.display = 'none';
            pendingImageFile = null;
        }
    });

    importBtn.addEventListener('click', () => {
        if (pendingImageFile) executeImageImport();
    });
}

async function openImageImportDialog(file) {
    pendingImageFile = file;
    const dialog = document.getElementById('image-import-dialog');
    const previewCanvas = document.getElementById('image-preview-canvas');
    const info = document.getElementById('image-info');

    // Show dialog
    dialog.style.display = '';

    // Show preview
    try {
        const dims = await getImageDimensions(file);
        info.textContent = `${dims.width}×${dims.height}px`;

        // Draw preview
        const img = new Image();
        img.onload = () => {
            const ctx = previewCanvas.getContext('2d');
            previewCanvas.width = 200;
            previewCanvas.height = 120;
            ctx.fillStyle = '#07070e';
            ctx.fillRect(0, 0, 200, 120);
            // Fit image maintaining aspect ratio
            const scale = Math.min(200 / dims.width, 120 / dims.height);
            const w = dims.width * scale;
            const h = dims.height * scale;
            ctx.drawImage(img, (200 - w) / 2, (120 - h) / 2, w, h);
            URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
    } catch (err) {
        info.textContent = 'Error loading image';
    }
}

async function executeImageImport() {
    const dialog = document.getElementById('image-import-dialog');
    const mode = document.getElementById('img-mode').value;
    const duration = parseFloat(document.getElementById('img-duration').value);
    const fftSize = parseInt(document.getElementById('img-fft').value);
    const maxMag = parseInt(document.getElementById('img-magnitude').value);

    dialog.style.display = 'none';
    showStatus('Importing image...');

    try {
        const hopSize = fftSize / 4;
        const sampleRate = engine.ctx ? engine.ctx.sampleRate : 44100;
        const totalSamples = Math.floor(duration * sampleRate);
        const freqBins = fftSize / 2 + 1;
        const numFrames = Math.floor((totalSamples - fftSize) / hopSize) + 1;

        // Load image scaled to (numFrames x freqBins)
        const imageData = await loadImageAsPixels(pendingImageFile, numFrames, freqBins);

        // Convert to magnitude
        const magnitude = imageToMagnitude(imageData, mode, maxMag);

        // Generate random phase
        const phase = generateRandomPhase(numFrames, freqBins);

        // Create a silent audio buffer so the engine has something to work with
        const silentSamples = new Float32Array(totalSamples);
        if (!engine.ctx) await engine.init();
        engine.replaceBuffer(silentSamples, sampleRate);

        // Set up STFT params
        stftParams.fftSize = fftSize;
        stftParams.hopSize = hopSize;
        stftParams.window = hannWindow(fftSize);

        // Store as original magnitude/phase
        originalMagnitude = magnitude;
        originalPhase = phase;
        processedMagnitude = cloneMagnitude(magnitude);
        needsResynth = true;

        // Update file name
        document.getElementById('file-name').textContent = '🖼 ' + pendingImageFile.name;

        // Set renderers
        specRenderer.setData(processedMagnitude, numFrames, freqBins, sampleRate, fftSize, hopSize);
        waveRenderer.setData(silentSamples, sampleRate);
        waveRenderer.viewStartTime = 0;
        waveRenderer.viewEndTime = duration;
        waveRenderer.syncView(specRenderer);

        // Sync FFT size dropdown
        const fftSelect = document.getElementById('fft-size');
        if (fftSelect) fftSelect.value = String(fftSize);

        pendingImageFile = null;
        showStatus('Image imported — press Play to preview');
    } catch (err) {
        showStatus('Error: ' + err.message);
        console.error(err);
    }
}

function reprocessSpectrogram() {
    if (!originalMagnitude) return;

    showStatus('Processing effects...');
    setTimeout(() => {
        processedMagnitude = effectStack.apply(originalMagnitude);
        specRenderer.magnitude = processedMagnitude;
        specRenderer.render();
        needsResynth = true; // mark that audio needs re-rendering
        showStatus('Ready — press Play to preview');
    }, 10);
}

/** Live preview: resynthesize audio from the current edited spectrogram */
function resynthesizeForPreview() {
    if (!processedMagnitude || !originalPhase) return;

    showStatus('Resynthesizing preview...');
    const { fftSize, hopSize, window } = stftParams;
    const numFrames = processedMagnitude.length;
    const freqBins = processedMagnitude[0] ? processedMagnitude[0].length : 0;

    // Pad phase if magnitude was extended (e.g. by transform)
    let phase = originalPhase;
    if (phase.length < numFrames) {
        phase = [...phase];
        while (phase.length < numFrames) {
            phase.push(new Float64Array(freqBins)); // zero-phase = silence
        }
        originalPhase = phase;
    }

    const outputLength = (numFrames - 1) * hopSize + fftSize;
    const reconstructed = istft(processedMagnitude, phase, fftSize, hopSize, window, outputLength);

    // Hard clip to prevent speaker damage from over-amplified data
    for (let i = 0; i < reconstructed.length; i++) {
        if (reconstructed[i] > 1) reconstructed[i] = 1;
        else if (reconstructed[i] < -1) reconstructed[i] = -1;
    }

    engine.replaceBuffer(reconstructed, engine.sampleRate);
    needsResynth = false;
    showStatus('Playing preview');
}

/** Commit: flatten current edits as the new base and clear effect stack */
function commitEdits() {
    if (!processedMagnitude || !originalPhase) return;

    showStatus('Committing edits...');
    setTimeout(() => {
        // Resynthesize final audio
        const { fftSize, hopSize, window } = stftParams;
        const numFrames = processedMagnitude.length;
        const freqBins = processedMagnitude[0] ? processedMagnitude[0].length : 0;

        // Pad phase if magnitude was extended
        if (originalPhase.length < numFrames) {
            const phase = [...originalPhase];
            while (phase.length < numFrames) {
                phase.push(new Float64Array(freqBins));
            }
            originalPhase = phase;
        }

        const outputLength = (numFrames - 1) * hopSize + fftSize;
        const reconstructed = istft(processedMagnitude, originalPhase, fftSize, hopSize, window, outputLength);
        engine.replaceBuffer(reconstructed, engine.sampleRate);

        // Update waveform renderer with new audio
        waveRenderer.setData(reconstructed, engine.sampleRate);

        // Update original magnitude to the processed version
        originalMagnitude = cloneMagnitude(processedMagnitude);

        // Clear the effect stack (this is the "flatten")
        effectStack.clearAll();

        needsResynth = false;
        showStatus('Edits committed as new base');
    }, 10);
}

// ── Transport ─────────────────────────────────────────────────
function setupTransport() {
    document.getElementById('btn-play').addEventListener('click', () => {
        if (engine.ctx.state === 'suspended') engine.ctx.resume();

        // If spectrogram was edited, resynthesize before playing
        if (needsResynth && processedMagnitude && originalPhase) {
            resynthesizeForPreview();
        }

        // If selection exists, play from selection start and loop within
        if (currentSelection && !engine.playing) {
            engine.looping = true;
            document.getElementById('btn-loop').classList.add('active');
            engine.play(currentSelection.startTime, currentSelection.startTime, currentSelection.endTime);
        } else {
            engine.togglePlay();
        }
    });

    document.getElementById('btn-stop').addEventListener('click', () => {
        engine.stop();
        engine.pauseOffset = 0;
        specRenderer.cursorTime = 0;
        specRenderer.render();
        waveRenderer.syncView(specRenderer);
        engine.onPlayStateChange(false);
    });

    document.getElementById('btn-loop').addEventListener('click', (e) => {
        engine.looping = !engine.looping;
        e.target.classList.toggle('active', engine.looping);
    });

    // Commit: flatten edits as new base
    document.getElementById('btn-resynth').addEventListener('click', () => {
        commitEdits();
    });

    // Export WAV
    document.getElementById('btn-export-wav').addEventListener('click', () => {
        exportWav();
    });

    // Volume control
    const volumeSlider = document.getElementById('volume-slider');
    const volumeVal = document.getElementById('volume-val');
    const volumeIcon = document.getElementById('volume-icon');
    let preMuteVolume = 1;

    volumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        engine.setVolume(vol);
        volumeVal.textContent = Math.round(vol * 100) + '%';
        volumeIcon.textContent = vol === 0 ? '🔇' : vol < 0.5 ? '🔈' : '🔊';
    });

    volumeIcon.addEventListener('click', () => {
        if (parseFloat(volumeSlider.value) > 0) {
            preMuteVolume = parseFloat(volumeSlider.value);
            volumeSlider.value = 0;
            engine.setVolume(0);
            volumeVal.textContent = '0%';
            volumeIcon.textContent = '🔇';
        } else {
            volumeSlider.value = preMuteVolume;
            engine.setVolume(preMuteVolume);
            volumeVal.textContent = Math.round(preMuteVolume * 100) + '%';
            volumeIcon.textContent = preMuteVolume < 0.5 ? '🔈' : '🔊';
        }
    });
}

// ── Undo / Redo ───────────────────────────────────────────────
function setupUndoRedo() {
    document.getElementById('btn-undo').addEventListener('click', () => {
        if (magUndoStack.length > 0) { magUndo(); } else { effectStack.undo(); }
    });

    document.getElementById('btn-redo').addEventListener('click', () => {
        if (magRedoStack.length > 0) { magRedo(); } else { effectStack.redo(); }
    });
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    undoBtn.disabled = !effectStack.canUndo && magUndoStack.length === 0;
    redoBtn.disabled = !effectStack.canRedo && magRedoStack.length === 0;
}

// ── Keyboard Shortcuts ────────────────────────────────────────
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

        // Ctrl shortcuts
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (magUndoStack.length > 0) { magUndo(); } else { effectStack.undo(); }
            } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                e.preventDefault();
                if (magRedoStack.length > 0) { magRedo(); } else { effectStack.redo(); }
            } else if (e.key === 'c') {
                e.preventDefault();
                doCopy();
            } else if (e.key === 'v' && !e.shiftKey) {
                e.preventDefault();
                doPaste('overwrite');
            } else if (e.key === 'v' && e.shiftKey) {
                e.preventDefault();
                doPaste('insert');
            }
        }

        // Delete key
        if (e.key === 'Delete' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            doDelete();
        }

        // Escape = clear selection
        if (e.key === 'Escape') {
            setSelection(null);
            setRectSelection(null);
        }

        // Spacebar = Play/Pause
        if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (engine.ctx.state === 'suspended') engine.ctx.resume();
            if (needsResynth && processedMagnitude && originalPhase) {
                resynthesizeForPreview();
            }
            if (currentSelection && !engine.playing) {
                engine.looping = true;
                document.getElementById('btn-loop').classList.add('active');
                engine.play(currentSelection.startTime, currentSelection.startTime, currentSelection.endTime);
            } else {
                engine.togglePlay();
            }
        }
    });
}

// ── Toolbar (Tools) ───────────────────────────────────────────
function setupToolbar() {
    const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            if (!tool) return; // skip edit action buttons
            toolManager.selectTool(tool);
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show/hide brush params
            const brushParams = document.getElementById('brush-params');
            const isBrush = tool === TOOL_TYPES.BRUSH_AMP || tool === TOOL_TYPES.BRUSH_ATT;
            brushParams.style.display = isBrush ? 'block' : 'none';
        });
    });

    // Brush parameter controls
    const brushSize = document.getElementById('brush-size');
    const brushStrength = document.getElementById('brush-strength');
    const brushHardness = document.getElementById('brush-hardness');

    brushSize.addEventListener('input', (e) => {
        toolManager.brushSize = parseInt(e.target.value);
        document.getElementById('brush-size-val').textContent = e.target.value;
    });
    brushStrength.addEventListener('input', (e) => {
        toolManager.brushStrength = parseFloat(e.target.value);
        document.getElementById('brush-strength-val').textContent = parseFloat(e.target.value).toFixed(1);
    });
    brushHardness.addEventListener('input', (e) => {
        toolManager.brushHardness = parseFloat(e.target.value);
        document.getElementById('brush-hardness-val').textContent = parseFloat(e.target.value).toFixed(2);
    });

    // Edit action buttons
    document.getElementById('btn-copy').addEventListener('click', doCopy);
    document.getElementById('btn-paste').addEventListener('click', () => doPaste('overwrite'));
    document.getElementById('btn-paste-insert').addEventListener('click', () => doPaste('insert'));
    document.getElementById('btn-delete').addEventListener('click', doDelete);
}

// ── Canvas Interaction ────────────────────────────────────────
function setupCanvasInteraction() {
    const canvas = document.getElementById('spectrogram-canvas');

    // SELECT click → set playback position
    toolManager.onStartPointSet = (time) => {
        engine.startPoint = time;
        engine.pauseOffset = time;
        specRenderer.startPoint = time;
        specRenderer.cursorTime = time;
        specRenderer.render();
        waveRenderer.syncView(specRenderer);

        // If playing, seek to the clicked position
        if (engine.playing) {
            engine.play(time);
        }
    };

    // SELECT drag → time range selection
    toolManager.onSelectionChange = (sel, isPreview) => {
        setSelection(sel);
    };

    // RECT_SELECT → 2D selection
    toolManager.onRectSelectionChange = (rect, isPreview) => {
        setRectSelection(rect);
    };

    toolManager.onRegionCreate = (start, end) => {
        regionManager.addRegion(start, end);
    };

    toolManager.onBrushStroke = (strokes, mode) => {
        effectStack.addLayer('brush', { strokes, mode });
    };

    canvas.addEventListener('mousedown', (e) => {
        if (e.altKey || e.button === 1) return; // Let pan handler take it
        const time = specRenderer.xToTime(e.offsetX);
        const freq = specRenderer.yToFreq(e.offsetY);
        const frame = specRenderer.timeToFrame(time);
        const bin = specRenderer.freqToBin(freq);
        lastClickPos = { time, freq, frame, bin };
        toolManager.handleMouseDown(time, freq, frame, bin, e);
    });

    canvas.addEventListener('mousemove', (e) => {
        const time = specRenderer.xToTime(e.offsetX);
        const freq = specRenderer.yToFreq(e.offsetY);
        const frame = specRenderer.timeToFrame(time);
        const bin = specRenderer.freqToBin(freq);
        toolManager.handleMouseMove(time, freq, frame, bin, e);

        // Update status bar
        const freqStr = freq >= 1000 ? (freq / 1000).toFixed(1) + ' kHz' : freq.toFixed(0) + ' Hz';
        document.getElementById('status-pos').textContent = `${time.toFixed(3)}s | ${freqStr}`;

        // Live preview render during selection
        if (toolManager.activeTool === TOOL_TYPES.SELECT || toolManager.activeTool === TOOL_TYPES.RECT_SELECT) {
            specRenderer.render();
            waveRenderer.syncView(specRenderer);
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        const time = specRenderer.xToTime(e.offsetX);
        const freq = specRenderer.yToFreq(e.offsetY);
        const frame = specRenderer.timeToFrame(time);
        const bin = specRenderer.freqToBin(freq);
        toolManager.handleMouseUp(time, freq, frame, bin, e);
    });

    // Click on waveform to seek
    const waveCanvas = document.getElementById('waveform-canvas');
    waveCanvas.addEventListener('click', (e) => {
        const rect = waveCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = waveRenderer.viewStartTime +
            (x / waveCanvas.width) * (waveRenderer.viewEndTime - waveRenderer.viewStartTime);
        engine.seekTo(time);
        specRenderer.startPoint = time;
        specRenderer.cursorTime = time;
        specRenderer.render();
        waveRenderer.syncView(specRenderer);
    });
}

// ── Selection State ───────────────────────────────────────────
function setSelection(sel) {
    currentSelection = sel;
    specRenderer.selection = sel;
    specRenderer.render();
    waveRenderer.syncView(specRenderer);

    // Sync retrigger interval to match selection length
    if (sel) {
        const lenMs = Math.round((sel.endTime - sel.startTime) * 1000);
        const slider = document.getElementById('retrigger-interval');
        const max = parseInt(slider.max);
        if (lenMs <= max) {
            slider.value = lenMs;
            document.getElementById('retrigger-interval-val').textContent = lenMs + 'ms';
        }
    }

    updateEditButtons();
}

function setRectSelection(rect) {
    currentRectSelection = rect;
    specRenderer.rectSelection = rect;
    specRenderer.render();
    waveRenderer.syncView(specRenderer);
    updateEditButtons();
}

function updateEditButtons() {
    const hasSel = !!currentSelection;
    const hasRect = !!currentRectSelection;
    const hasClip = clipboard.hasContent;
    const hasMag = !!processedMagnitude;

    document.getElementById('btn-copy').disabled = !(hasMag && (hasSel || hasRect));
    document.getElementById('btn-paste').disabled = !(hasMag && hasClip);
    document.getElementById('btn-paste-insert').disabled = !(hasMag && hasClip && clipboard.type === 'time');
    document.getElementById('btn-delete').disabled = !(hasMag && hasSel);
}

// ── Clipboard Operations ──────────────────────────────────────
function doCopy() {
    if (!processedMagnitude) return;

    if (currentRectSelection) {
        // 2D rect copy
        const s = currentRectSelection;
        const sf = specRenderer.timeToFrame(s.startTime);
        const ef = specRenderer.timeToFrame(s.endTime);
        const sb = specRenderer.freqToBin(s.minFreq);
        const eb = specRenderer.freqToBin(s.maxFreq);
        const count = clipboard.copyRect(processedMagnitude, sf, ef, sb, eb);
        showStatus(`Copied 2D region (${count} frames × ${eb - sb} bins)`);
    } else if (currentSelection) {
        // 1D time copy
        const sf = specRenderer.timeToFrame(currentSelection.startTime);
        const ef = specRenderer.timeToFrame(currentSelection.endTime);
        const count = clipboard.copyTimeRange(processedMagnitude, originalPhase, sf, ef);
        showStatus(`Copied ${count} frames`);
    }
    updateEditButtons();
}

function doPaste(mode) {
    if (!processedMagnitude || !clipboard.hasContent) return;

    if (clipboard.type === 'rect') {
        // 2D paste — overwrite at last clicked position
        const atFrame = lastClickPos.frame;
        const atBin = lastClickPos.bin;
        pushMagUndo();
        const newMag = clipboard.pasteRectOverwrite(processedMagnitude, atFrame, atBin);
        applyMagnitudeChange(newMag);
        showStatus('Pasted 2D region (overwrite) at click position');
    } else {
        // 1D paste
        const atFrame = specRenderer.timeToFrame(specRenderer.startPoint);
        pushMagUndo();
        if (mode === 'insert') {
            const result = clipboard.pasteInsert(processedMagnitude, originalPhase, atFrame);
            applyMagnitudeChange(result.magnitude, result.phase, true);
            showStatus('Pasted (insert) — buffer extended');
        } else {
            const result = clipboard.pasteOverwrite(processedMagnitude, originalPhase, atFrame);
            applyMagnitudeChange(result.magnitude, result.phase, result.magnitude.length !== processedMagnitude.length);
            showStatus('Pasted (overwrite)');
        }
    }
}

function doDelete() {
    if (!processedMagnitude || !currentSelection) return;

    const sf = specRenderer.timeToFrame(currentSelection.startTime);
    const ef = specRenderer.timeToFrame(currentSelection.endTime);
    pushMagUndo();
    const result = clipboard.deleteRange(processedMagnitude, originalPhase, sf, ef);
    applyMagnitudeChange(result.magnitude, result.phase, true);
    setSelection(null);
    showStatus(`Deleted ${ef - sf} frames`);
}

function applyMagnitudeChange(newMag, newPhase, lengthChanged) {
    processedMagnitude = newMag;
    if (newPhase) originalPhase = newPhase;
    originalMagnitude = cloneMagnitude(newMag);
    needsResynth = true;

    const numFrames = newMag.length;
    const freqBins = newMag[0] ? newMag[0].length : specRenderer.freqBins;
    const sampleRate = specRenderer.sampleRate;
    const fftSize = stftParams.fftSize;
    const hopSize = stftParams.hopSize;

    specRenderer.setData(processedMagnitude, numFrames, freqBins, sampleRate, fftSize, hopSize);

    if (lengthChanged) {
        // Rebuild audio buffer length
        const newLength = (numFrames - 1) * hopSize + fftSize;
        const silentSamples = new Float32Array(newLength);
        engine.replaceBuffer(silentSamples, sampleRate);
        waveRenderer.setData(silentSamples, sampleRate);
    }

    waveRenderer.syncView(specRenderer);
    updateEditButtons();
}

function pushMagUndo() {
    magUndoStack.push({
        magnitude: cloneMagnitude(processedMagnitude),
        phase: originalPhase ? originalPhase.map(f => new Float64Array(f)) : null,
    });
    if (magUndoStack.length > MAX_MAG_UNDO) magUndoStack.shift();
    magRedoStack.length = 0; // clear redo on new action
}

function magUndo() {
    if (magUndoStack.length === 0) return;
    // Push current state to redo
    magRedoStack.push({
        magnitude: cloneMagnitude(processedMagnitude),
        phase: originalPhase ? originalPhase.map(f => new Float64Array(f)) : null,
    });
    const prev = magUndoStack.pop();
    const lengthChanged = prev.magnitude.length !== processedMagnitude.length;
    processedMagnitude = prev.magnitude;
    originalPhase = prev.phase;
    originalMagnitude = cloneMagnitude(prev.magnitude);
    needsResynth = true;

    const numFrames = processedMagnitude.length;
    const freqBins = processedMagnitude[0] ? processedMagnitude[0].length : specRenderer.freqBins;
    specRenderer.setData(processedMagnitude, numFrames, freqBins, specRenderer.sampleRate, stftParams.fftSize, stftParams.hopSize);

    if (lengthChanged) {
        const newLength = (numFrames - 1) * stftParams.hopSize + stftParams.fftSize;
        const silentSamples = new Float32Array(newLength);
        engine.replaceBuffer(silentSamples, specRenderer.sampleRate);
        waveRenderer.setData(silentSamples, specRenderer.sampleRate);
    }
    waveRenderer.syncView(specRenderer);
    updateUndoRedoButtons();
    showStatus('Undo (magnitude)');
}

function magRedo() {
    if (magRedoStack.length === 0) return;
    magUndoStack.push({
        magnitude: cloneMagnitude(processedMagnitude),
        phase: originalPhase ? originalPhase.map(f => new Float64Array(f)) : null,
    });
    const next = magRedoStack.pop();
    const lengthChanged = next.magnitude.length !== processedMagnitude.length;
    processedMagnitude = next.magnitude;
    originalPhase = next.phase;
    originalMagnitude = cloneMagnitude(next.magnitude);
    needsResynth = true;

    const numFrames = processedMagnitude.length;
    const freqBins = processedMagnitude[0] ? processedMagnitude[0].length : specRenderer.freqBins;
    specRenderer.setData(processedMagnitude, numFrames, freqBins, specRenderer.sampleRate, stftParams.fftSize, stftParams.hopSize);

    if (lengthChanged) {
        const newLength = (numFrames - 1) * stftParams.hopSize + stftParams.fftSize;
        const silentSamples = new Float32Array(newLength);
        engine.replaceBuffer(silentSamples, specRenderer.sampleRate);
        waveRenderer.setData(silentSamples, specRenderer.sampleRate);
    }
    waveRenderer.syncView(specRenderer);
    updateUndoRedoButtons();
    showStatus('Redo (magnitude)');
}

// ── Effect Layer Panel ────────────────────────────────────────
function setupEffectPanel() {
    const addBtn = document.getElementById('btn-add-effect');
    const effectSelect = document.getElementById('effect-type-select');

    // Populate effect dropdown from unified registry
    const effects = getEffectList();
    effectSelect.innerHTML = effects.map(e =>
        `<option value="${e.id}">${e.icon} ${e.label}</option>`
    ).join('');

    addBtn.addEventListener('click', () => {
        const effectId = effectSelect.value;
        const defaults = buildDefaultParams(effectId);
        effectStack.addLayer(effectId, defaults);
    });
}

/** Build default params from paramDefs metadata */
function buildDefaultParams(effectId) {
    const defs = getParamDefs(effectId);
    const params = {};
    for (const d of defs) {
        params[d.key] = d.default;
    }
    // Give seed-type params a random value each time
    if ('seed' in params) {
        params.seed = Math.floor(Math.random() * 10000);
    }
    return params;
}

/** Tracks which layer panels are currently expanded */
const expandedLayers = new Set();

function updateEffectLayerUI() {
    const container = document.getElementById('layer-list');
    container.innerHTML = '';

    effectStack.layers.forEach((layer, i) => {
        const el = document.createElement('div');
        el.className = 'layer-item' + (layer.bypass ? ' bypassed' : '');

        const isExpanded = expandedLayers.has(i);
        const defs = getParamDefs(layer.id);
        const hasParams = defs.length > 0;

        // Header row
        let html = `
            <div class="layer-header">
                ${hasParams ? `<button class="layer-expand-btn" data-idx="${i}" title="Parameters">${isExpanded ? '▾' : '▸'}</button>` : ''}
                <span class="layer-icon">${layer.icon}</span>
                <span class="layer-name">${layer.label}</span>
                <div class="layer-controls">
                    <label class="layer-mix-label">Mix
                        <input type="range" min="0" max="1" step="0.01" value="${layer.mix}"
                               class="layer-mix" data-idx="${i}">
                    </label>
                    <button class="layer-bypass-btn ${layer.bypass ? 'active' : ''}" data-idx="${i}" title="Bypass">⏻</button>
                    <button class="layer-remove-btn" data-idx="${i}" title="Remove">✕</button>
                </div>
            </div>
        `;

        // Expandable param panel
        if (hasParams && isExpanded) {
            html += `<div class="layer-params" data-idx="${i}">`;
            for (const d of defs) {
                const val = layer.params[d.key] !== undefined ? layer.params[d.key] : d.default;
                if (d.type === 'range') {
                    html += `
                        <div class="param-row">
                            <label class="param-label">${d.label}</label>
                            <input type="range" class="param-slider" data-idx="${i}" data-key="${d.key}"
                                   min="${d.min}" max="${d.max}" step="${d.step}" value="${val}">
                            <span class="param-val" id="pv-${i}-${d.key}">${formatParamVal(val, d)}</span>
                        </div>
                    `;
                } else if (d.type === 'select') {
                    html += `
                        <div class="param-row">
                            <label class="param-label">${d.label}</label>
                            <select class="param-select" data-idx="${i}" data-key="${d.key}">
                                ${d.options.map(o => `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                            </select>
                        </div>
                    `;
                }
            }
            html += '</div>';
        }

        el.innerHTML = html;
        container.appendChild(el);
    });

    // Bind events
    container.querySelectorAll('.layer-expand-btn').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.target.dataset.idx);
            if (expandedLayers.has(idx)) expandedLayers.delete(idx);
            else expandedLayers.add(idx);
            updateEffectLayerUI();
        });
    });

    container.querySelectorAll('.layer-mix').forEach(el => {
        el.addEventListener('input', (e) => {
            effectStack.setLayerMix(parseInt(e.target.dataset.idx), parseFloat(e.target.value));
        });
    });

    container.querySelectorAll('.layer-bypass-btn').forEach(el => {
        el.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            effectStack.setLayerBypass(idx, !effectStack.layers[idx].bypass);
        });
    });

    container.querySelectorAll('.layer-remove-btn').forEach(el => {
        el.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            expandedLayers.delete(idx);
            // Shift expanded indices
            const newExpanded = new Set();
            for (const ei of expandedLayers) {
                newExpanded.add(ei > idx ? ei - 1 : ei);
            }
            expandedLayers.clear();
            for (const ei of newExpanded) expandedLayers.add(ei);
            effectStack.removeLayer(idx);
        });
    });

    // Param sliders — push undo on drag start, update on input
    container.querySelectorAll('.param-slider').forEach(el => {
        el.addEventListener('mousedown', () => {
            effectStack.pushParamUndo();
        });
        el.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            const key = e.target.dataset.key;
            const val = parseFloat(e.target.value);
            effectStack.setLayerParam(idx, key, val);
            const valSpan = document.getElementById(`pv-${idx}-${key}`);
            if (valSpan) {
                const defs = getParamDefs(effectStack.layers[idx].id);
                const def = defs.find(d => d.key === key);
                valSpan.textContent = formatParamVal(val, def);
            }
        });
    });

    // Param selects — push undo on change
    container.querySelectorAll('.param-select').forEach(el => {
        el.addEventListener('change', (e) => {
            effectStack.pushParamUndo();
            const idx = parseInt(e.target.dataset.idx);
            const key = e.target.dataset.key;
            effectStack.setLayerParam(idx, key, e.target.value);
        });
    });
}

function formatParamVal(val, def) {
    if (!def) return val;
    if (def.step >= 1) return Math.round(val);
    if (def.step >= 0.1) return Number(val).toFixed(1);
    return Number(val).toFixed(2);
}

// ── Region List UI ────────────────────────────────────────────
function updateRegionList() {
    const container = document.getElementById('region-list');
    container.innerHTML = '';

    regionManager.regions.forEach((r, i) => {
        const el = document.createElement('div');
        el.className = 'region-item' + (i === regionManager.selectedIndex ? ' selected' : '');
        el.innerHTML = `
            <span class="region-color" style="background: ${r.color}"></span>
            <span class="region-name">${r.name}</span>
            <span class="region-time">${r.start.toFixed(3)}s - ${r.end.toFixed(3)}s</span>
            <button class="region-play-btn" data-idx="${i}" title="Play Region">▶</button>
            <button class="region-retrigger-btn" data-idx="${i}" title="Retrigger">🔁</button>
            <button class="region-remove-btn" data-idx="${i}" title="Remove">✕</button>
        `;

        el.addEventListener('click', () => regionManager.selectRegion(i));
        container.appendChild(el);
    });

    // Bind buttons
    container.querySelectorAll('.region-play-btn').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const r = regionManager.regions[parseInt(e.target.dataset.idx)];
            engine.play(r.start, r.start, r.end);
        });
    });

    container.querySelectorAll('.region-retrigger-btn').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.target.dataset.idx);
            const r = regionManager.regions[idx];
            const interval = parseFloat(document.getElementById('retrigger-interval').value);
            engine.startRetrigger(r.start, r.end, interval);
            e.target.classList.toggle('active');
        });
    });

    container.querySelectorAll('.region-remove-btn').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            regionManager.removeRegion(parseInt(e.target.dataset.idx));
        });
    });
}

// ── Filter Controls ───────────────────────────────────────────
function setupFilterControls() {
    document.getElementById('filter-type').addEventListener('change', (e) => {
        engine.setFilterType(e.target.value);
    });

    document.getElementById('filter-cutoff').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        engine.setFilterCutoff(val);
        document.getElementById('filter-cutoff-val').textContent = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;
    });

    document.getElementById('filter-resonance').addEventListener('input', (e) => {
        engine.setFilterResonance(parseFloat(e.target.value));
        document.getElementById('filter-resonance-val').textContent = parseFloat(e.target.value).toFixed(1);
    });
}

// ── Reverb Controls ───────────────────────────────────────────
function setupReverbControls() {
    document.getElementById('reverb-mix').addEventListener('input', (e) => {
        engine.setReverbMix(parseFloat(e.target.value));
        document.getElementById('reverb-mix-val').textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
    });

    document.getElementById('reverb-decay').addEventListener('input', (e) => {
        engine.setReverbDecay(parseFloat(e.target.value));
        document.getElementById('reverb-decay-val').textContent = parseFloat(e.target.value).toFixed(1) + 's';
    });
}

// ── Retrigger Controls ────────────────────────────────────────
function setupRetriggerControls() {
    const intervalSlider = document.getElementById('retrigger-interval');
    const intervalVal = document.getElementById('retrigger-interval-val');

    intervalSlider.addEventListener('input', (e) => {
        intervalVal.textContent = e.target.value + 'ms';
        // Sync retrigger interval → selection end (if selection exists)
        if (currentSelection) {
            const intervalSec = parseFloat(e.target.value) / 1000;
            const newEnd = currentSelection.startTime + intervalSec;
            const maxTime = specRenderer.duration || engine.duration || 10;
            setSelection({ startTime: currentSelection.startTime, endTime: Math.min(newEnd, maxTime) });
        }
    });

    document.getElementById('retrigger-fadein').addEventListener('input', (e) => {
        engine.retriggerFadeIn = parseFloat(e.target.value);
        document.getElementById('retrigger-fadein-val').textContent = e.target.value + 'ms';
    });

    document.getElementById('retrigger-fadeout').addEventListener('input', (e) => {
        engine.retriggerFadeOut = parseFloat(e.target.value);
        document.getElementById('retrigger-fadeout-val').textContent = e.target.value + 'ms';
    });

    document.getElementById('btn-stop-retrigger').addEventListener('click', () => {
        engine.stopRetrigger();
    });
}

// ── STFT Controls ─────────────────────────────────────────────
function setupSTFTControls() {
    document.getElementById('fft-size').addEventListener('change', async (e) => {
        stftParams.fftSize = parseInt(e.target.value);
        stftParams.hopSize = stftParams.fftSize / 4;
        stftParams.window = hannWindow(stftParams.fftSize);
        if (engine.buffer) {
            const mono = engine.getMonoSamples();
            await computeSTFT(mono, engine.sampleRate);
        }
    });

    document.getElementById('freq-scale').addEventListener('change', (e) => {
        specRenderer.logFreqScale = e.target.value === 'log';
        specRenderer.render();
    });

    document.getElementById('db-min').addEventListener('input', (e) => {
        specRenderer.minDb = parseInt(e.target.value);
        specRenderer.render();
        document.getElementById('db-min-val').textContent = e.target.value + ' dB';
    });

    document.getElementById('db-max').addEventListener('input', (e) => {
        specRenderer.maxDb = parseInt(e.target.value);
        specRenderer.render();
        document.getElementById('db-max-val').textContent = e.target.value + ' dB';
    });
}

// ── Resize ────────────────────────────────────────────────────
function setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            specRenderer.resize();
            waveRenderer.resize();
        }, 100);
    });
}

// ── Helpers ───────────────────────────────────────────────────
function showStatus(msg) {
    document.getElementById('status-msg').textContent = msg;
}

function updateTimeDisplay(time) {
    const min = Math.floor(time / 60);
    const sec = (time % 60).toFixed(2);
    document.getElementById('time-display').textContent =
        `${String(min).padStart(2, '0')}:${sec.padStart(5, '0')} / ${formatDuration(engine.duration)}`;
}

function formatDuration(d) {
    const min = Math.floor(d / 60);
    const sec = (d % 60).toFixed(2);
    return `${String(min).padStart(2, '0')}:${sec.padStart(5, '0')}`;
}

// ── Transform Panel ───────────────────────────────────────────
function setupTransformPanel() {
    const ids = ['rotation', 'scaleX', 'scaleY', 'translateX', 'translateY', 'shearX', 'shearY'];
    const formatters = {
        rotation: v => parseFloat(v).toFixed(1) + '°',
        scaleX: v => parseFloat(v).toFixed(2),
        scaleY: v => parseFloat(v).toFixed(2),
        translateX: v => v,
        translateY: v => v,
        shearX: v => parseFloat(v).toFixed(2),
        shearY: v => parseFloat(v).toFixed(2),
    };

    // Bind sliders to display values
    for (const id of ids) {
        const slider = document.getElementById(`transform-${id}`);
        const valEl = document.getElementById(`transform-${id}-val`);
        slider.addEventListener('input', () => {
            valEl.textContent = formatters[id](slider.value);
        });
    }

    function getTransformParams() {
        return {
            rotation: parseFloat(document.getElementById('transform-rotation').value),
            scaleX: parseFloat(document.getElementById('transform-scaleX').value),
            scaleY: parseFloat(document.getElementById('transform-scaleY').value),
            translateX: parseFloat(document.getElementById('transform-translateX').value),
            translateY: parseFloat(document.getElementById('transform-translateY').value),
            shearX: parseFloat(document.getElementById('transform-shearX').value),
            shearY: parseFloat(document.getElementById('transform-shearY').value),
        };
    }

    function resetSliders() {
        document.getElementById('transform-rotation').value = 0;
        document.getElementById('transform-scaleX').value = 1;
        document.getElementById('transform-scaleY').value = 1;
        document.getElementById('transform-translateX').value = 0;
        document.getElementById('transform-translateY').value = 0;
        document.getElementById('transform-shearX').value = 0;
        document.getElementById('transform-shearY').value = 0;
        for (const id of ids) {
            const slider = document.getElementById(`transform-${id}`);
            document.getElementById(`transform-${id}-val`).textContent = formatters[id](slider.value);
        }
    }

    // Apply button
    document.getElementById('btn-apply-transform').addEventListener('click', () => {
        if (!processedMagnitude) {
            showStatus('No spectrogram loaded');
            return;
        }
        const params = getTransformParams();
        if (isIdentityTransform(params)) {
            showStatus('Transform is identity — nothing to apply');
            return;
        }

        pushMagUndo();

        const result = applyAffineTransform(processedMagnitude, params, originalPhase);
        const lengthChanged = result.magnitude.length !== processedMagnitude.length;
        applyMagnitudeChange(result.magnitude, result.phase, lengthChanged);

        // Reset sliders after applying
        resetSliders();
        showStatus(`Transform applied (rotation: ${params.rotation}°, scale: ${params.scaleX}×${params.scaleY})`);
    });

    // Reset button
    document.getElementById('btn-reset-transform').addEventListener('click', resetSliders);
}

// ── Direct Numeric Input for Sliders ────────────────────────────
function setupDirectInput() {
    // Find all param-val spans that have an associated range input
    document.querySelectorAll('.param-group').forEach(group => {
        const span = group.querySelector('.param-val');
        const slider = group.querySelector('input[type="range"]');
        if (!span || !slider) return;

        span.addEventListener('click', (e) => {
            e.stopPropagation();
            if (span.querySelector('.param-val-input')) return; // already editing

            const currentText = span.textContent;
            // Extract numeric portion (strip units like ms, °, %, kHz, s, etc.)
            const numMatch = currentText.match(/[\-]?[0-9]*\.?[0-9]+/);
            const currentNum = numMatch ? numMatch[0] : slider.value;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'param-val-input';
            input.value = currentNum;

            span.textContent = '';
            span.appendChild(input);
            input.focus();
            input.select();

            const commit = () => {
                let val = parseFloat(input.value);
                if (isNaN(val)) {
                    // Revert
                    span.textContent = currentText;
                    return;
                }
                // Clamp to slider range
                const min = parseFloat(slider.min);
                const max = parseFloat(slider.max);
                val = Math.max(min, Math.min(max, val));
                // Snap to step
                const step = parseFloat(slider.step) || 1;
                val = Math.round(val / step) * step;
                // Handle floating point precision
                const decimals = (slider.step.includes('.')) ? slider.step.split('.')[1].length : 0;
                val = parseFloat(val.toFixed(decimals));

                slider.value = val;
                // Trigger input event so all listeners fire
                slider.dispatchEvent(new Event('input', { bubbles: true }));
            };

            input.addEventListener('keydown', (ke) => {
                if (ke.key === 'Enter') {
                    ke.preventDefault();
                    commit();
                } else if (ke.key === 'Escape') {
                    span.textContent = currentText;
                }
            });

            input.addEventListener('blur', commit);
        });
    });

    // Also handle the volume slider in transport bar
    const volumeVal = document.getElementById('volume-val');
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeVal && volumeSlider) {
        volumeVal.style.cursor = 'pointer';
        volumeVal.addEventListener('click', (e) => {
            e.stopPropagation();
            if (volumeVal.querySelector('.param-val-input')) return;

            const numMatch = volumeVal.textContent.match(/[0-9]+/);
            const currentNum = numMatch ? numMatch[0] : '100';
            const currentText = volumeVal.textContent;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'param-val-input';
            input.value = currentNum;

            volumeVal.textContent = '';
            volumeVal.appendChild(input);
            input.focus();
            input.select();

            const commit = () => {
                let val = parseInt(input.value);
                if (isNaN(val)) { volumeVal.textContent = currentText; return; }
                val = Math.max(0, Math.min(100, val));
                volumeSlider.value = val / 100;
                volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
            };

            input.addEventListener('keydown', (ke) => {
                if (ke.key === 'Enter') { ke.preventDefault(); commit(); }
                else if (ke.key === 'Escape') { volumeVal.textContent = currentText; }
            });
            input.addEventListener('blur', commit);
        });
    }
}

// ── WAV Export ────────────────────────────────────────────────
function exportWav() {
    if (!processedMagnitude || !originalPhase) {
        showStatus('No audio to export');
        return;
    }

    showStatus('Preparing WAV export...');
    setTimeout(() => {
        // Resynthesize if needed
        const { fftSize, hopSize, window } = stftParams;
        const numFrames = processedMagnitude.length;
        const freqBins = processedMagnitude[0] ? processedMagnitude[0].length : 0;

        // Pad phase if needed
        let phase = originalPhase;
        if (phase.length < numFrames) {
            phase = [...phase];
            while (phase.length < numFrames) {
                phase.push(new Float64Array(freqBins));
            }
        }

        const outputLength = (numFrames - 1) * hopSize + fftSize;
        const samples = istft(processedMagnitude, phase, fftSize, hopSize, window, outputLength);
        const sampleRate = engine.sampleRate || 44100;

        // Encode to WAV
        const wavBlob = encodeWav(samples, sampleRate);

        // Trigger download
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'spectro-sampler-export.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus(`Exported WAV (${(wavBlob.size / 1024 / 1024).toFixed(1)} MB)`);
    }, 50);
}

/**
 * Encode Float32Array samples to a 16-bit PCM WAV Blob
 */
function encodeWav(samples, sampleRate) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const dataLength = samples.length * bytesPerSample;
    const headerLength = 44;
    const buffer = new ArrayBuffer(headerLength + dataLength);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);                        // chunk size
    view.setUint16(20, 1, true);                         // PCM format
    view.setUint16(22, numChannels, true);                // channels
    view.setUint32(24, sampleRate, true);                 // sample rate
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
    view.setUint16(32, numChannels * bytesPerSample, true); // block align
    view.setUint16(34, bitsPerSample, true);              // bits per sample

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        let s = samples[i];
        // Clamp to [-1, 1]
        s = Math.max(-1, Math.min(1, s));
        // Convert to 16-bit integer
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
