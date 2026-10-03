/**
 * 16x16 Glitch Tile Canvas
 * Core Implementation (Optimized)
 */

// --- Constants ---
// --- Constants ---
const SPRITE_SIZE = 16;

const PRESETS = {
    default: [
        "#000000", "#0000AA", "#00AA00", "#00AAAA",
        "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA",
        "#555555", "#5555FF", "#55FF55", "#55FFFF",
        "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF"
    ],
    gameboy: [
        "#0f380f", "#306230", "#8bac0f", "#9bbc0f",
        "#0f380f", "#306230", "#8bac0f", "#9bbc0f",
        "#0f380f", "#306230", "#8bac0f", "#9bbc0f",
        "#0f380f", "#306230", "#8bac0f", "#9bbc0f"
    ],
    neon: [
        "#000000", "#FF00FF", "#00FFFF", "#FFFF00",
        "#FF0055", "#00FF55", "#5500FF", "#FFFFFF",
        "#111111", "#FF0099", "#00FF99", "#9900FF",
        "#222222", "#FF00CC", "#00FFCC", "#CC00FF"
    ],
    grayscale: [
        "#000000", "#111111", "#222222", "#333333",
        "#444444", "#555555", "#666666", "#777777",
        "#888888", "#999999", "#AAAAAA", "#BBBBBB",
        "#CCCCCC", "#DDDDDD", "#EEEEEE", "#FFFFFF"
    ]
};

let currentPaletteHex = [...PRESETS.default];

// Pre-calculate Uint32 colors (ABGR for little-endian) from currentPaletteHex
function updateUint32Colors() {
    return currentPaletteHex.map(hex => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (0xFF << 24) | (b << 16) | (g << 8) | r;
    });
}

let UINT32_COLORS = updateUint32Colors();

// --- State ---
const state = {
    sprites: [], // Array of { data: Uint8Array(256) }
    tileData: null, // Int32Array
    cols: 0,
    rows: 0,
    glitchProb: 0.10,
    updateInterval: 100,
    lastUpdate: 0,
    transparentMode: false,
    isLoaded: false
};

// --- Helpers ---

// --- Image Processing ---
// (No changes needed to processImage helper, keeping it brief/unchanged lines mostly)

function processImage(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Round down to nearest 16
    const w = Math.floor(image.width / SPRITE_SIZE) * SPRITE_SIZE;
    const h = Math.floor(image.height / SPRITE_SIZE) * SPRITE_SIZE;

    if (w < 16 || h < 16) {
        alert("Image too small. Must be at least 16x16.");
        return;
    }

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const newSprites = [];

    const cols = w / SPRITE_SIZE;
    const rows = h / SPRITE_SIZE;

    // Threshold 
    const THRESHOLD = 128;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const spriteData = new Uint8Array(SPRITE_SIZE * SPRITE_SIZE);

            // Extract 16x16 block
            for (let y = 0; y < SPRITE_SIZE; y++) {
                for (let x = 0; x < SPRITE_SIZE; x++) {
                    const px = (c * SPRITE_SIZE + x);
                    const py = (r * SPRITE_SIZE + y);
                    const idx = (py * w + px) * 4;

                    const rVal = data[idx];
                    const gVal = data[idx + 1];
                    const bVal = data[idx + 2];
                    const alpha = data[idx + 3];

                    // Luminance
                    const luma = 0.299 * rVal + 0.587 * gVal + 0.114 * bVal;

                    let val = (luma > THRESHOLD) ? 1 : 0;
                    if (alpha < 128) val = 0;

                    spriteData[y * SPRITE_SIZE + x] = val;
                }
            }
            newSprites.push({ data: spriteData });
        }
    }

    state.sprites = newSprites;
    state.isLoaded = true;
    initGrid();
}

// --- Grid Management ---

function initGrid() {
    if (!state.isLoaded) return;

    const canvas = document.getElementById('glitchCanvas');
    state.cols = Math.ceil(canvas.width / SPRITE_SIZE);
    state.rows = Math.ceil(canvas.height / SPRITE_SIZE);

    const count = state.cols * state.rows;
    state.tileData = new Int32Array(count * 3);

    for (let i = 0; i < count; i++) {
        randomizeTile(i);
    }
}

function randomizeTile(index) {
    if (state.sprites.length === 0) return;
    const base = index * 3;
    state.tileData[base] = Math.floor(Math.random() * state.sprites.length);     // Sprite
    state.tileData[base + 1] = Math.floor(Math.random() * 16); // Color Black (0-15 from Palette)
    state.tileData[base + 2] = Math.floor(Math.random() * 16); // Color White (0-15 from Palette)
}

function handleResize() {
    const canvas = document.getElementById('glitchCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initGrid();
}

// --- Main Loop ---

function loop(timestamp) {
    if (!state.isLoaded) {
        requestAnimationFrame(loop);
        return;
    }

    const elapsed = timestamp - state.lastUpdate;
    if (elapsed > state.updateInterval) {
        // Update tiles
        const count = state.cols * state.rows;

        for (let i = 0; i < count; i++) {
            if (Math.random() < state.glitchProb) {
                randomizeTile(i);
            }
        }
        state.lastUpdate = timestamp;
    }

    draw();
    requestAnimationFrame(loop);
}

function draw() {
    const canvas = document.getElementById('glitchCanvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const w = canvas.width;
    const h = canvas.height;

    const imgData = ctx.getImageData(0, 0, w, h);
    const buf = new ArrayBuffer(imgData.data.length);
    const buf8 = new Uint8ClampedArray(buf);
    const buf32 = new Uint32Array(buf);

    const bgFill = state.transparentMode ? 0x00000000 : 0xFF000000;
    buf32.fill(bgFill);

    const nCols = state.cols;
    const nRows = state.rows;
    const sprites = state.sprites;
    const tileData = state.tileData;

    // Use current global UINT32_COLORS
    // If palette changed, UINT32_COLORS is already updated.

    for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
            const tileIdx = r * nCols + c;
            const base = tileIdx * 3;

            const spriteIdx = tileData[base];
            const colBlackIdx = tileData[base + 1];
            const colWhiteIdx = tileData[base + 2];

            const sprite = sprites[spriteIdx];
            if (!sprite) continue;

            const cBlack = UINT32_COLORS[colBlackIdx];
            const cWhite = UINT32_COLORS[colWhiteIdx];

            const startX = c * SPRITE_SIZE;
            const startY = r * SPRITE_SIZE;

            const maxY = Math.min(SPRITE_SIZE, h - startY);
            const maxX = Math.min(SPRITE_SIZE, w - startX);

            for (let sy = 0; sy < maxY; sy++) {
                const rowOffset = (startY + sy) * w;
                for (let sx = 0; sx < maxX; sx++) {
                    const val = sprite.data[sy * SPRITE_SIZE + sx];

                    if (state.transparentMode && val === 0) {
                        continue;
                    }

                    const color = (val === 1) ? cWhite : cBlack;
                    buf32[rowOffset + startX + sx] = color;
                }
            }
        }
    }

    imgData.data.set(buf8);
    ctx.putImageData(imgData, 0, 0);
}

// --- UI Handling ---

function setupUI() {
    const fileInput = document.getElementById('uploadInput');
    fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            const img = new Image();
            img.onload = () => processImage(img);
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });

    const probInput = document.getElementById('glitchProb');
    const probDisplay = document.getElementById('probValue');

    probInput.value = state.glitchProb * 100;
    probInput.addEventListener('input', e => {
        state.glitchProb = parseInt(e.target.value) / 100;
        probDisplay.textContent = e.target.value + '%';
    });

    const intervalInput = document.getElementById('updateInterval');
    const intervalDisplay = document.getElementById('intervalValue');

    intervalInput.value = state.updateInterval;
    intervalInput.addEventListener('input', e => {
        state.updateInterval = parseInt(e.target.value);
        intervalDisplay.textContent = e.target.value + 'ms';
    });

    const transCheckbox = document.getElementById('transparentMode');
    transCheckbox.addEventListener('change', e => {
        state.transparentMode = e.target.checked;
    });

    // UI Toggle logic
    const uiOverlay = document.getElementById('uiOverlay');
    const canvas = document.getElementById('glitchCanvas');

    canvas.addEventListener('click', () => {
        uiOverlay.classList.toggle('ui-hidden');
    });

    // Palette Logic
    const paletteSelect = document.getElementById('paletteSelect');
    const customContainer = document.getElementById('customPaletteContainer');
    const paletteGrid = document.getElementById('paletteGrid');

    // Init custom grid
    for (let i = 0; i < 16; i++) {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = PRESETS.default[i];
        input.addEventListener('input', (e) => {
            currentPaletteHex[i] = e.target.value;
            UINT32_COLORS = updateUint32Colors();
        });
        paletteGrid.appendChild(input);
    }

    paletteSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
            currentPaletteHex = [...PRESETS[val]];
            UINT32_COLORS = updateUint32Colors();
            const inputs = paletteGrid.querySelectorAll('input');
            currentPaletteHex.forEach((c, i) => inputs[i].value = c);
        }
    });
}

// --- Initialization ---

window.addEventListener('load', () => {
    const canvas = document.getElementById('glitchCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    setupUI();

    state.lastUpdate = performance.now();
    requestAnimationFrame(loop);

    window.addEventListener('resize', handleResize);
});
