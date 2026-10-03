/**
 * Glitch Image Design Tool v2 - Main Entry Point
 */

import { ImageLoader } from './ImageLoader.js';
import { Tiler } from './Tiler.js';
import { Renderer } from './Renderer.js';
import { InfluenceMap } from './InfluenceMap.js';
import { HistoryManager } from './HistoryManager.js';
import { GlitchEngine } from './GlitchEngine.js';
import { Quantizer } from './Quantizer.js';

console.log('Glitch Tool v2 Initializing...');

// --- State Management ---
const state = {
    // Data
    originalTiles: [],
    currentTiles: [],
    overlayTiles: [],
    gridW: 0,
    gridH: 0,

    // Config
    tileSize: 16,
    glitchMode: 'global', // 'global' | 'inpaint'

    // Tools
    activeTool: 'pen', // 'pen', 'eraser', 'protect'
    brushSize: 2,
    brushStrength: 0.6,

    // Params
    params: {
        p1: 0.05, p2: 0.06, p3: 0.08, p4: 0.03,
        p5: 0.03, p6: 0.02, p7: 0.02,
        colorAmount: 0.35,
        iterations: 5,
        boostScale: 0.8,
        glitchMode: 'global'
    },

    // Options
    showInfluence: true
};

// --- Modules ---
let renderer;
let influenceMap;
let historyManager;

// --- DOM Elements ---
const controls = {};

document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    initModules();
    setupEventListeners();
    console.log('DOM Ready');
});

function initDOM() {
    // Map IDs to controls object
    const ids = [
        'mainImageInput', 'overlayImageInput', 'tileSizeSelect', 'btnApply', 'btnExport',
        'btnUndo', 'btnRedo', 'mainCanvas', 'canvasWrapper',
        'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7',
        'colorAmount', 'iterations', 'brushSize', 'brushStrength',
        'showInfluence'
    ];
    ids.forEach(id => controls[id] = document.getElementById(id));

    // Tool Buttons
    controls.toolBtns = document.querySelectorAll('.tool-btn');

    // Radio buttons for mode
    controls.modeRadios = document.querySelectorAll('input[name="glitchMode"]');
}

function initModules() {
    renderer = new Renderer(controls.mainCanvas);
    historyManager = new HistoryManager();
    // influenceMap initialized when image loads
}

function setupEventListeners() {
    // 1. File Inputs
    controls.mainImageInput.addEventListener('change', async (e) => loadMainImage(e.target.files[0]));
    controls.overlayImageInput.addEventListener('change', async (e) => loadOverlayImage(e.target.files[0]));

    // 2. Settings
    controls.tileSizeSelect.addEventListener('change', (e) => {
        state.tileSize = parseInt(e.target.value, 10);
        // Reload image if exists
        if (state.sourceBitmap) initImage(state.sourceBitmap);
    });

    controls.showInfluence.addEventListener('change', (e) => {
        state.showInfluence = e.target.checked;
        render();
    });

    // 3. Parameters
    ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'colorAmount', 'iterations'].forEach(key => {
        controls[key].addEventListener('input', (e) => {
            state.params[key] = parseFloat(e.target.value);
        });
    });

    // 4. Mode
    controls.modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.glitchMode = e.target.value;
            state.params.glitchMode = e.target.value;
        });
    });

    // 5. Tools
    controls.toolBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            controls.toolBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.activeTool = e.target.dataset.tool;
        });
    });

    controls.brushSize.addEventListener('input', (e) => state.brushSize = parseInt(e.target.value, 10));
    controls.brushStrength.addEventListener('input', (e) => state.brushStrength = parseFloat(e.target.value));

    // 6. Actions
    controls.btnApply.addEventListener('click', applyGlitch);

    controls.btnUndo.addEventListener('click', () => {
        const restored = historyManager.undo(getCurrentSnapshot(), state.tileSize);
        if (restored) restoreSnapshot(restored);
    });

    controls.btnRedo.addEventListener('click', () => {
        const restored = historyManager.redo(getCurrentSnapshot(), state.tileSize);
        if (restored) restoreSnapshot(restored);
    });

    controls.btnExport.addEventListener('click', exportImage);

    // 8. Color Reduction
    controls.btnQuantize8 = document.getElementById('btnQuantize8');
    controls.btnQuantize16 = document.getElementById('btnQuantize16');

    if (controls.btnQuantize8) controls.btnQuantize8.addEventListener('click', () => executeQuantize(8));
    if (controls.btnQuantize16) controls.btnQuantize16.addEventListener('click', () => executeQuantize(16));

    // 9. Influence Filters
    const btnBlur = document.getElementById('btnBlur');
    const btnSharpen = document.getElementById('btnSharpen');

    if (btnBlur) btnBlur.addEventListener('click', () => {
        if (!influenceMap) return;
        saveSnapshot(); // Save influence state
        influenceMap.blur(1);
        render();
    });

    if (btnSharpen) btnSharpen.addEventListener('click', () => {
        if (!influenceMap) return;
        saveSnapshot();
        influenceMap.highPass(1.5);
        influenceMap.highPass(1.5);
        render();
    });

    const btnReGlitchInfluence = document.getElementById('btnReGlitchInfluence');
    if (btnReGlitchInfluence) btnReGlitchInfluence.addEventListener('click', () => {
        if (!influenceMap) return;
        saveSnapshot();
        influenceMap.glitch(0.8); // hardcoded amount for now
        render();
    });

    // 7. Canvas Interaction
    setupCanvasInteraction();
}

// --- Image Loading ---

async function loadMainImage(file) {
    if (!file) return;
    try {
        state.sourceBitmap = await ImageLoader.load(file);
        initImage(state.sourceBitmap);
    } catch (err) {
        console.error(err);
        alert('Failed to load main image');
    }
}
// ... (rest of loadMainImage/loadOverlayImage logic)

function executeQuantize(colors) {
    if (!state.currentTiles.length) return;

    saveSnapshot(); // Save before quantizing

    Quantizer.quantize(state.currentTiles, colors, state.tileSize);
    render();
}


async function loadOverlayImage(file) {
    if (!file) return;
    try {
        const bitmap = await ImageLoader.load(file);
        // Tiling Logic for Overlay: Just slice it up.
        // Spec says: "A: Main image reference (Overlay same tile size)"
        const { tiles } = Tiler.createTiles(bitmap, state.tileSize);
        state.overlayTiles = tiles;
        console.log(`Overlay loaded: ${tiles.length} tiles`);
    } catch (err) {
        console.error(err);
        alert('Failed to load overlay image');
    }
}

function initImage(bitmap) {
    const { tiles, gridW, gridH } = Tiler.createTiles(bitmap, state.tileSize);

    state.originalTiles = tiles;
    state.currentTiles = Tiler.cloneTiles(tiles, state.tileSize);
    state.gridW = gridW;
    state.gridH = gridH;

    influenceMap = new InfluenceMap(gridW, gridH);
    historyManager.clear();

    // Initial Snapshot
    saveSnapshot();

    console.log(`Image initialized: ${gridW}x${gridH}`);
    render();
}

// --- Core Logic ---

function applyGlitch() {
    if (!state.currentTiles.length) return;

    // Save state before applying (Undo unit)
    saveSnapshot();

    const iterations = state.params.iterations || 1;

    // We run the iterations.
    // Note: Intermediate states are NOT saved to undo stack, per spec.
    // But we need to update state.currentTiles in loop.

    let workingTiles = state.currentTiles;

    for (let i = 0; i < iterations; i++) {
        workingTiles = GlitchEngine.apply(
            state.params,
            workingTiles,
            influenceMap.influence,
            influenceMap.protect,
            state.gridW,
            state.gridH,
            state.tileSize,
            state.overlayTiles
        );
    }

    state.currentTiles = workingTiles;
    render();
}

// --- Interaction ---

function setupCanvasInteraction() {
    const canvas = controls.mainCanvas;
    let isDrawing = false;
    let rect;

    const startStroke = (e) => {
        if (!state.currentTiles.length) return;
        isDrawing = true;
        rect = canvas.getBoundingClientRect();

        // Save state at start of stroke
        saveSnapshot();

        handleStroke(e);
    };

    const moveStroke = (e) => {
        if (!isDrawing) return;
        handleStroke(e);
    };

    const endStroke = () => {
        if (isDrawing) {
            isDrawing = false;
            // Stroke is done. The changes to influenceMap are already done.
            // We saved snapshot at mousedown.
            // Actually, if we are just painting influence, visual updates, we might not need to save snapshot of TILES yet?
            // Spec says: "mousedown start snapshot -> mouseup end stroke".
            // If the tools only modify InfluenceMap, then snapshot should include InfluenceMap.

            // Re-render to finalize visual (just in case)
            render();
        }
    };

    const handleStroke = (e) => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert screen px to tile coordinates
        // Canvas might be scaled/CSS sized. 
        // Assuming 1:1 for now or canvas.width = displayed width.
        // Actually renderer sets canvas.width/height = grid * tileSize.
        // Layout: canvas-wrapper might scroll.

        // We need to map client coordinates to canvas internal coordinates.
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        const tileX = Math.floor(canvasX / state.tileSize);
        const tileY = Math.floor(canvasY / state.tileSize);

        if (tileX < 0 || tileX >= state.gridW || tileY < 0 || tileY >= state.gridH) return;

        // Apply Tool
        if (state.activeTool === 'pen') {
            influenceMap.strokeInfluence(tileX, tileY, state.brushSize, state.brushStrength, 'brush');
        } else if (state.activeTool === 'eraser') {
            // Restore tiles in radius
            const r = Math.ceil(state.brushSize);
            for (let ty = tileY - r; ty <= tileY + r; ty++) {
                for (let tx = tileX - r; tx <= tileX + r; tx++) {
                    const idx = ty * state.gridW + tx;
                    if (idx >= 0 && idx < state.currentTiles.length) {
                        const d = Math.sqrt((tx - tileX) ** 2 + (ty - tileY) ** 2);
                        if (d <= r) {
                            if (influenceMap.protect[idx] === 1) continue; // Respect protect

                            // Restore tile
                            state.currentTiles[idx] = Tiler.cloneTiles([state.originalTiles[idx]], state.tileSize)[0];
                            // Reset influence
                            influenceMap.influence[idx] = 0;
                        }
                    }
                }
            }
        } else if (state.activeTool === 'unmask') {
            // Mask Eraser: Clears Influence AND Protect. Does not revert tiles.
            const r = Math.ceil(state.brushSize);
            for (let ty = tileY - r; ty <= tileY + r; ty++) {
                for (let tx = tileX - r; tx <= tileX + r; tx++) {
                    const idx = ty * state.gridW + tx;
                    if (idx >= 0 && idx < state.gridW * state.gridH) {
                        const d = Math.sqrt((tx - tileX) ** 2 + (ty - tileY) ** 2);
                        if (d <= r) {
                            influenceMap.influence[idx] = 0;
                            influenceMap.protect[idx] = 0;
                        }
                    }
                }
            }
        } else if (state.activeTool === 'protect') {
            influenceMap.strokeProtect(tileX, tileY, state.brushSize, true); // true = protect
        }

        render();
    };

    canvas.addEventListener('mousedown', startStroke);
    window.addEventListener('mousemove', moveStroke);
    window.addEventListener('mouseup', endStroke);
}

// --- Helpers ---

function getCurrentSnapshot() {
    return {
        tiles: state.currentTiles,
        influence: influenceMap ? influenceMap.influence : null,
        protect: influenceMap ? influenceMap.protect : null
    };
}

function saveSnapshot() {
    if (!historyManager || !state.currentTiles.length) return;
    historyManager.push(getCurrentSnapshot(), state.tileSize);
}

function restoreSnapshot(snapshot) {
    if (!snapshot) return;
    state.currentTiles = snapshot.tiles;
    if (influenceMap) {
        influenceMap.restoreMaps(snapshot.influence, snapshot.protect);
    }
    render();
}

function render() {
    if (!renderer || !state.currentTiles.length) return;
    renderer.render(state.currentTiles, state.gridW, state.gridH, state.tileSize);

    if (state.showInfluence && influenceMap) {
        renderer.drawOverlay(
            influenceMap.influence,
            influenceMap.protect,
            state.gridW,
            state.gridH,
            state.tileSize,
            true
        );
    }
}

function exportImage() {
    if (!state.currentTiles.length) return;

    // Create a temporary canvas for export (without overlay)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = state.gridW * state.tileSize;
    exportCanvas.height = state.gridH * state.tileSize;
    const ctx = exportCanvas.getContext('2d');

    state.currentTiles.forEach((tile, i) => {
        const x = (i % state.gridW) * state.tileSize;
        const y = Math.floor(i / state.gridW) * state.tileSize;
        ctx.drawImage(tile.canvas, x, y);
    });

    const link = document.createElement('a');
    link.download = `glitch-export-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
}
