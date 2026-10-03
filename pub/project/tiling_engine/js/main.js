// Main application logic

const preloadedImages = {};

function preloadImages(imageDefs, callback) {
    const keys = Object.keys(imageDefs);
    let loaded = 0;

    if (keys.length === 0) {
        callback();
        return;
    }

    keys.forEach(key => {
        const img = new Image();
        img.onload = () => {
            preloadedImages[key] = img;
            loaded++;
            if (loaded === keys.length) {
                callback();
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load image: ${imageDefs[key].src}`);
            // Provide a dummy canvas for fallback
            const dummy = document.createElement("canvas");
            dummy.width = 100;
            dummy.height = 100;
            const ctx = dummy.getContext('2d');
            ctx.fillStyle = "#ff00ff";
            ctx.fillRect(0, 0, 100, 100);
            preloadedImages[key] = dummy;

            loaded++;
            if (loaded === keys.length) {
                callback();
            }
        };
        img.src = imageDefs[key].src;
    });
}

const defMap = {
    "penrose": () => window.tilingDefPenrose,
    "pinwheel": () => window.tilingDefPinwheel,
    "sierpinski": () => window.tilingDefSierpinski,
    "danzer7": () => window.tilingDefDanzer
};

function init() {
    const canvas = document.getElementById('tiling-canvas');
    const genInput = document.getElementById('gen-input');
    const renderBtn = document.getElementById('render-btn');
    const patternSelect = document.getElementById('pattern-select');

    // Make drawing responsive to high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    function getActiveDef() {
        const selected = patternSelect.value;
        if (defMap[selected]) {
            return defMap[selected]();
        }
        return window.tilingDefPenrose; // Fallback
    }

    function loadAndRender() {
        const activeDef = getActiveDef();
        genInput.value = activeDef.render.generations; // Update UI to reflect default generations
        preloadImages(activeDef.images, () => {
            updateRender(activeDef);
        });
    }

    renderBtn.addEventListener('click', () => {
        const activeDef = getActiveDef();
        activeDef.render.generations = parseInt(genInput.value, 10);
        updateRender(activeDef);
    });

    patternSelect.addEventListener('change', () => {
        loadAndRender();
    });

    function updateRender(activeDef) {
        const engine = new TilingEngine(activeDef);
        const renderer = new Renderer(canvas, activeDef, preloadedImages);

        console.log(`Generating tiling up to generation ${activeDef.render.generations}...`);
        const tiles = engine.generate(activeDef.render.generations);

        console.log(`Rendering ${tiles.length} tiles...`);
        renderer.render(tiles);
    }

    // Initial load
    loadAndRender();
}

window.addEventListener('DOMContentLoaded', init);
