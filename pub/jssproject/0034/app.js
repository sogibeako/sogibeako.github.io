'use strict';

// Standalone image-only edition, extracted from archive/claude-famicom-emu.

(() => {
  const panel = document.getElementById('image-glitch-panel');
  const input = document.getElementById('ig-input');
  const alternateInput = document.getElementById('ig-alt-input');
  const jsonInput = document.getElementById('ig-json-input');
  const loadDefaultJsonBtn = document.getElementById('ig-load-default-json');
  const loadDefaultSubtileBtn = document.getElementById('ig-load-default-subtile');
  const canvas = document.getElementById('ig-canvas');
  const fullscreenCanvas = document.getElementById('ig-fullscreen-canvas');
  const fullscreenContext = fullscreenCanvas.getContext('2d');
  const preview = document.getElementById('ig-preview');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const empty = document.getElementById('ig-empty');
  const status = document.getElementById('ig-status');
  const rerollBtn = document.getElementById('ig-reroll');
  const originalBtn = document.getElementById('ig-original');
  const saveBtn = document.getElementById('ig-save');
  const saveFramesBtn = document.getElementById('ig-save-frames');
  const saveJsonBtn = document.getElementById('ig-save-json');
  const tileInput = document.getElementById('ig-tile');
  const alternateRateInput = document.getElementById('ig-alt-rate');
  const alternatePaletteInput = document.getElementById('ig-alt-palette');
  const addressInput = document.getElementById('ig-address');
  const dataInput = document.getElementById('ig-data');
  const stripesInput = document.getElementById('ig-stripes');
  const addressFloatInput = document.getElementById('ig-address-float');
  const addressMinInput = document.getElementById('ig-address-min');
  const addressMaxInput = document.getElementById('ig-address-max');
  const dataFloatInput = document.getElementById('ig-data-float');
  const dataMinInput = document.getElementById('ig-data-min');
  const dataMaxInput = document.getElementById('ig-data-max');
  const stripesFloatInput = document.getElementById('ig-stripes-float');
  const stripesMinInput = document.getElementById('ig-stripes-min');
  const stripesMaxInput = document.getElementById('ig-stripes-max');
  const stripeStyleInput = document.getElementById('ig-stripe-style');
  const jitterInput = document.getElementById('ig-jitter');
  const autoSpeedInput = document.getElementById('ig-auto-speed');
  const countInput = document.getElementById('ig-count');
  const fullscreenModeInput = document.getElementById('ig-fullscreen-mode');
  const addressOut = document.getElementById('ig-address-out');
  const alternateRateOut = document.getElementById('ig-alt-rate-out');
  const dataOut = document.getElementById('ig-data-out');
  const stripesOut = document.getElementById('ig-stripes-out');
  const jitterOut = document.getElementById('ig-jitter-out');
  const autoSpeedOut = document.getElementById('ig-auto-speed-out');
  const stripePresetBtn = document.getElementById('ig-stripe-preset');
  const alternateState = document.getElementById('ig-alt-state');
  const alternateClearBtn = document.getElementById('ig-alt-clear');
  const halfRateInput = document.getElementById('ig-half-rate');
  const collapseRateInput = document.getElementById('ig-collapse-rate');
  const pairRateInput = document.getElementById('ig-pair-rate');
  const halfRateOut = document.getElementById('ig-half-rate-out');
  const collapseRateOut = document.getElementById('ig-collapse-rate-out');
  const pairRateOut = document.getElementById('ig-pair-rate-out');
  const autoBtn = document.getElementById('ig-auto');
  const collapseAlternateInput = document.getElementById('ig-collapse-alt');
  const pickTileBtn = document.getElementById('ig-pick-tile');
  const pickClearBtn = document.getElementById('ig-pick-clear');
  const tileSelection = document.getElementById('ig-tile-selection');
  const groupColorInput = document.getElementById('ig-group-color');
  const pickColorBtn = document.getElementById('ig-pick-color');
  const addGroupColorBtn = document.getElementById('ig-add-group-color');
  const groupColorsElement = document.getElementById('ig-group-colors');
  const activeGroupColorElement = document.getElementById('ig-active-group-color');
  const colorToleranceInput = document.getElementById('ig-color-tolerance');
  const colorToleranceOut = document.getElementById('ig-color-tolerance-out');
  const colorMatchCount = document.getElementById('ig-color-match-count');
  const colorAlternateRateInput = document.getElementById('ig-color-alt-rate');
  const colorPaletteRateInput = document.getElementById('ig-color-palette-rate');
  const colorTintRateInput = document.getElementById('ig-color-tint-rate');
  const colorAlternateRateOut = document.getElementById('ig-color-alt-rate-out');
  const colorPaletteRateOut = document.getElementById('ig-color-palette-rate-out');
  const colorTintRateOut = document.getElementById('ig-color-tint-rate-out');
  const tintColorInput = document.getElementById('ig-tint-color');
  const sourcePicker = document.getElementById('ig-source-picker');
  const pickerTitle = document.getElementById('ig-picker-title');
  const pickerHelp = document.getElementById('ig-picker-help');
  const pickerStatus = document.getElementById('ig-picker-status');
  const pickerCloseBtn = document.getElementById('ig-picker-close');
  const pickerMainCanvas = document.getElementById('ig-picker-main');
  const pickerAlternateCanvas = document.getElementById('ig-picker-alt');
  const pickerAlternateEmpty = document.getElementById('ig-picker-alt-empty');
  const pickerMainSelection = document.getElementById('ig-picker-main-selection');
  const pickerAlternateSelection = document.getElementById('ig-picker-alt-selection');

  let source = null;
  let alternateSource = null;
  let alternateName = '';
  let alternateLayout = '';
  let sourceName = 'image';
  let faultSeed = randomSeed();
  let lastFrame = 0;
  let busy = false;
  let paletteCache = null;
  let autoTimer = 0;
  let autoFrame = 0;
  let collapsePick = null; // { x, y, bank } in source-image pixels
  let pickerMode = 'tile';
  let lastPlan = null;
  let groupColors = ['#808080'];
  let activeGroupColor = '#808080';
  const faultFloatConfigs = [
    {
      key: 'address', base: addressInput, toggle: addressFloatInput,
      min: addressMinInput, max: addressMaxInput, output: addressOut, limit: 10,
    },
    {
      key: 'data', base: dataInput, toggle: dataFloatInput,
      min: dataMinInput, max: dataMaxInput, output: dataOut, limit: 8,
    },
    {
      key: 'stripes', base: stripesInput, toggle: stripesFloatInput,
      min: stripesMinInput, max: stripesMaxInput, output: stripesOut, limit: 8,
    },
  ];

  function randomSeed() {
    if (globalThis.crypto && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0] || 1;
    }
    return (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function togglePreviewFullscreen() {
    if (!source) return;
    try {
      if (document.fullscreenElement === preview) {
        await document.exitFullscreen();
      } else if (preview.requestFullscreen) {
        await preview.requestFullscreen();
      } else {
        status.textContent = 'このブラウザは全画面表示に対応していません';
      }
    } catch (error) {
      console.error('[image-glitch] fullscreen failed:', error);
      status.textContent = '全画面表示へ切り替えられませんでした';
    }
    syncFullscreenPresentation();
  }

  function drawFullscreenTiles() {
    if (!source || document.fullscreenElement !== preview || fullscreenModeInput.value !== 'tile') return;
    const width = Math.max(1, Math.floor(window.innerWidth || canvas.width));
    const height = Math.max(1, Math.floor(window.innerHeight || canvas.height));
    if (fullscreenCanvas.width !== width) fullscreenCanvas.width = width;
    if (fullscreenCanvas.height !== height) fullscreenCanvas.height = height;
    fullscreenContext.imageSmoothingEnabled = false;
    fullscreenContext.clearRect(0, 0, width, height);
    const pattern = fullscreenContext.createPattern(canvas, 'repeat');
    if (pattern) {
      fullscreenContext.fillStyle = pattern;
      fullscreenContext.fillRect(0, 0, width, height);
    }
  }

  function syncFullscreenPresentation() {
    const fullscreen = document.fullscreenElement === preview;
    const mode = fullscreenModeInput.value;
    preview.classList.toggle('fullscreen-cover', fullscreen && mode === 'cover');
    preview.classList.toggle('fullscreen-contain', fullscreen && mode === 'contain');
    preview.classList.toggle('fullscreen-tile', fullscreen && mode === 'tile');
    const tiled = fullscreen && mode === 'tile' && !!source;
    // Keep the source canvas alive and measurable behind the tiled display.
    // Hiding it here made its DOM rectangle collapse to zero, which could
    // destabilize the normal preview and selection overlay after fullscreen.
    canvas.hidden = !source;
    fullscreenCanvas.hidden = !tiled;
    canvas.setAttribute('aria-label', fullscreen ? '全画面表示を終了' : '画像プレビューを全画面表示');
    if (tiled) {
      drawFullscreenTiles();
    } else if (fullscreenCanvas.width !== 1 || fullscreenCanvas.height !== 1) {
      // The tiled surface is only a fullscreen presentation layer.
      // Discard its pixels when leaving tile mode so it cannot leak into
      // the normal preview layout and so the large display buffer is freed.
      fullscreenCanvas.width = 1;
      fullscreenCanvas.height = 1;
    }
  }

  function handleFullscreenKey(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    togglePreviewFullscreen();
  }

  canvas.addEventListener('click', togglePreviewFullscreen);
  canvas.addEventListener('keydown', handleFullscreenKey);
  fullscreenCanvas.addEventListener('click', togglePreviewFullscreen);
  fullscreenCanvas.addEventListener('keydown', handleFullscreenKey);
  fullscreenModeInput.addEventListener('change', syncFullscreenPresentation);
  document.addEventListener('fullscreenchange', () => {
    syncFullscreenPresentation();
    requestAnimationFrame(() => {
      // Recalculate only after :fullscreen styles have been removed/applied.
      // The canvas bitmap dimensions are never changed by fullscreen mode.
      updateTileSelection();
    });
  });

  function drawPickerImage(targetCanvas, image) {
    if (!image) {
      targetCanvas.width = 1;
      targetCanvas.height = 1;
      targetCanvas.hidden = true;
      return;
    }
    targetCanvas.hidden = false;
    targetCanvas.width = image.width;
    targetCanvas.height = image.height;
    targetCanvas.getContext('2d').putImageData(image, 0, 0);
  }

  function updatePickerSelection() {
    for (const [bank, pickerCanvas, marker] of [
      [0, pickerMainCanvas, pickerMainSelection],
      [1, pickerAlternateCanvas, pickerAlternateSelection],
    ]) {
      if (pickerMode !== 'tile' || !collapsePick || collapsePick.bank !== bank || pickerCanvas.hidden) {
        marker.style.display = 'none';
        continue;
      }
      const tile = Number(tileInput.value);
      const x = Math.floor(collapsePick.x / tile) * tile;
      const y = Math.floor(collapsePick.y / tile) * tile;
      const canvasRect = pickerCanvas.getBoundingClientRect();
      const wrapRect = pickerCanvas.parentElement.getBoundingClientRect();
      const scaleX = canvasRect.width / pickerCanvas.width;
      const scaleY = canvasRect.height / pickerCanvas.height;
      marker.style.display = 'block';
      marker.style.left = `${canvasRect.left - wrapRect.left + x * scaleX}px`;
      marker.style.top = `${canvasRect.top - wrapRect.top + y * scaleY}px`;
      marker.style.width = `${Math.min(tile, pickerCanvas.width - x) * scaleX}px`;
      marker.style.height = `${Math.min(tile, pickerCanvas.height - y) * scaleY}px`;
    }
  }

  function refreshSourcePicker() {
    drawPickerImage(pickerMainCanvas, source);
    drawPickerImage(pickerAlternateCanvas, alternateSource);
    pickerAlternateEmpty.hidden = !!alternateSource;
    updatePickerSelection();
  }

  function openSourcePicker(mode) {
    if (!source || busy) return;
    stopAuto();
    pickerMode = mode;
    pickerTitle.textContent = mode === 'tile' ? '原画から元タイルを選択' : '原画から基準色を選択';
    pickerHelp.textContent = mode === 'tile'
      ? '主画像または別タイル画像のタイルをクリックしてください。表示中のグリッチではなく、読み込んだ原画から選べます。'
      : '主画像または別タイル画像の好きな画素をクリックしてください。その色に近い平均色のタイルをまとめます。';
    pickerStatus.textContent = mode === 'tile'
      ? '黄色い枠が現在固定されている元タイルです。'
      : `現在の基準色: ${groupColorInput.value.toUpperCase()}`;
    refreshSourcePicker();
    if (!sourcePicker.open) sourcePicker.showModal();
  }

  function rgbToHex(red, green, blue) {
    return `#${[red, green, blue].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
  }

  function normalizeColor(color) {
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : '#808080';
  }

  function renderGroupColors() {
    groupColorsElement.replaceChildren();
    for (const color of groupColors) {
      const candidate = document.createElement('span');
      candidate.className = 'color-candidate';
      candidate.classList.toggle('active', color === activeGroupColor);
      candidate.title = `${color.toUpperCase()} — 再抽選候補`;

      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'candidate-swatch';
      swatch.style.setProperty('--candidate-color', color);
      swatch.setAttribute('aria-label', `${color.toUpperCase()} を編集色にする`);
      swatch.addEventListener('click', () => {
        groupColorInput.value = color;
        syncColorMatchCount(color);
      });

      const code = document.createElement('span');
      code.textContent = color.toUpperCase();

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'candidate-remove';
      remove.textContent = '×';
      remove.disabled = groupColors.length === 1;
      remove.setAttribute('aria-label', `${color.toUpperCase()} を候補から削除`);
      remove.addEventListener('click', () => removeGroupColor(color));

      candidate.append(swatch, code, remove);
      groupColorsElement.appendChild(candidate);
    }
    activeGroupColorElement.textContent = `再抽選色: ${activeGroupColor.toUpperCase()}（候補 ${groupColors.length}色）`;
  }

  function addGroupColor(color = groupColorInput.value) {
    const normalized = normalizeColor(color);
    groupColorInput.value = normalized;
    if (!groupColors.includes(normalized)) groupColors.push(normalized);
    renderGroupColors();
    if (source) {
      const plan = renderFrame(lastFrame);
      status.textContent = `${normalized.toUpperCase()} を基準色候補へ追加 — ${eventSummary(plan)}`;
    }
  }

  function removeGroupColor(color) {
    if (groupColors.length <= 1) return;
    groupColors = groupColors.filter((candidate) => candidate !== color);
    if (!groupColors.includes(activeGroupColor)) activeGroupColor = groupColors[0];
    renderGroupColors();
    if (source) {
      const plan = renderFrame(lastFrame);
      status.textContent = `${color.toUpperCase()} を基準色候補から削除 — ${eventSummary(plan)}`;
    }
  }

  function selectFromPicker(bank, event) {
    const image = bank ? alternateSource : source;
    const pickerCanvas = bank ? pickerAlternateCanvas : pickerMainCanvas;
    if (!image || pickerCanvas.hidden) return;
    const rect = pickerCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(image.width - 1, Math.floor((event.clientX - rect.left) * image.width / rect.width)));
    const y = Math.max(0, Math.min(image.height - 1, Math.floor((event.clientY - rect.top) * image.height / rect.height)));
    if (pickerMode === 'color') {
      const pixel = (y * image.width + x) * 4;
      groupColorInput.value = rgbToHex(image.data[pixel], image.data[pixel + 1], image.data[pixel + 2]);
      const pickedColor = groupColorInput.value;
      if (!groupColors.includes(pickedColor)) groupColors.push(pickedColor);
      renderGroupColors();
      syncLabels();
      const plan = renderFrame(lastFrame);
      sourcePicker.close();
      status.textContent = `基準色 ${pickedColor.toUpperCase()} を${bank ? '別タイル画像' : '主画像'}から候補へ追加 — ${eventSummary(plan)}`;
      return;
    }
    const tile = Number(tileInput.value);
    const tilesX = Math.ceil(source.width / tile);
    const tileIndex = Math.floor(y / tile) * tilesX + Math.floor(x / tile);
    collapsePick = { x, y, bank };
    updateTileSelection();
    const plan = renderFrame(lastFrame);
    sourcePicker.close();
    status.textContent = `元タイル #${tileIndex + 1}（${bank ? '別タイル画像' : '主画像'}）を固定 — ${eventSummary(plan)}`;
  }

  function updateTileSelection() {
    if (!source || !collapsePick) {
      tileSelection.style.display = 'none';
      pickClearBtn.disabled = true;
      return;
    }
    const tile = Number(tileInput.value);
    const x = Math.floor(collapsePick.x / tile) * tile;
    const y = Math.floor(collapsePick.y / tile) * tile;
    const canvasRect = canvas.getBoundingClientRect();
    const previewRect = canvas.parentElement.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    tileSelection.style.display = 'block';
    tileSelection.style.left = `${canvasRect.left - previewRect.left + x * scaleX}px`;
    tileSelection.style.top = `${canvasRect.top - previewRect.top + y * scaleY}px`;
    tileSelection.style.width = `${Math.min(tile, canvas.width - x) * scaleX}px`;
    tileSelection.style.height = `${Math.min(tile, canvas.height - y) * scaleY}px`;
    pickClearBtn.disabled = busy;
  }

  pickTileBtn.addEventListener('click', () => openSourcePicker('tile'));
  pickColorBtn.addEventListener('click', () => openSourcePicker('color'));
  addGroupColorBtn.addEventListener('click', () => addGroupColor());
  pickerCloseBtn.addEventListener('click', () => sourcePicker.close());
  pickerMainCanvas.addEventListener('click', (event) => selectFromPicker(0, event));
  pickerAlternateCanvas.addEventListener('click', (event) => selectFromPicker(1, event));
  renderGroupColors();
  pickClearBtn.addEventListener('click', () => {
    collapsePick = null;
    updateTileSelection();
    updatePickerSelection();
    renderFrame(lastFrame);
    status.textContent = '単一模様の元をランダム選択へ戻しました';
  });
  function setEnabled(enabled) {
    rerollBtn.disabled = !enabled;
    originalBtn.disabled = !enabled;
    saveBtn.disabled = !enabled;
    saveFramesBtn.disabled = !enabled;
    saveJsonBtn.disabled = !enabled;
    stripePresetBtn.disabled = !enabled;
    halfRateInput.disabled = !enabled;
    collapseRateInput.disabled = !enabled;
    pairRateInput.disabled = !enabled;
    autoBtn.disabled = !enabled;
    collapseAlternateInput.disabled = !enabled;
    pickTileBtn.disabled = !enabled;
    pickColorBtn.disabled = !enabled;
    colorToleranceInput.disabled = !enabled;
    groupColorInput.disabled = !enabled;
    addGroupColorBtn.disabled = !enabled;
    tintColorInput.disabled = !enabled;
    colorTintRateInput.disabled = !enabled;
    pickClearBtn.disabled = !enabled || !collapsePick;
    input.disabled = busy;
    alternateInput.disabled = busy;
    jsonInput.disabled = busy;
    loadDefaultJsonBtn.disabled = busy;
    loadDefaultSubtileBtn.disabled = busy;
    syncAlternateUi(enabled);
    syncFaultFloatUi();
  }

  function syncAlternateUi(mainEnabled = !!source) {
    const available = mainEnabled && !!alternateSource;
    alternateRateInput.disabled = !available;
    alternatePaletteInput.disabled = !available;
    alternateClearBtn.disabled = !available;
    colorAlternateRateInput.disabled = !available;
    colorPaletteRateInput.disabled = !available;
    alternateState.textContent = alternateSource
      ? `別タイル: ${alternateName}${alternateLayout ? `（${alternateLayout}）` : ''}`
      : '別タイル: 未読込';
  }

  function syncLabels() {
    syncFaultCountOutputs(lastPlan);
    alternateRateOut.textContent = `${alternateRateInput.value}%`;
    jitterOut.textContent = `${jitterInput.value}%`;
    halfRateOut.textContent = `${halfRateInput.value}%`;
    collapseRateOut.textContent = `${collapseRateInput.value}%`;
    pairRateOut.textContent = `${pairRateInput.value}%`;
    colorToleranceOut.textContent = colorToleranceInput.value;
    colorAlternateRateOut.textContent = `${colorAlternateRateInput.value}%`;
    colorPaletteRateOut.textContent = `${colorPaletteRateInput.value}%`;
    colorTintRateOut.textContent = `${colorTintRateInput.value}%`;
    autoSpeedOut.textContent = `${autoSpeedInput.value}ms`;
  }

  function getFaultRange(config) {
    const first = Math.max(0, Math.min(config.limit, Number.parseInt(config.min.value, 10) || 0));
    const second = Math.max(0, Math.min(config.limit, Number.parseInt(config.max.value, 10) || 0));
    return first <= second ? [first, second] : [second, first];
  }

  function resolveFaultCount(config, random) {
    if (!config.toggle.checked) {
      return Math.max(0, Math.min(config.limit, Number.parseInt(config.base.value, 10) || 0));
    }
    const [minimum, maximum] = getFaultRange(config);
    return minimum + Math.floor(random() * (maximum - minimum + 1));
  }

  function syncFaultCountOutputs(plan = null) {
    for (const config of faultFloatConfigs) {
      if (!config.toggle.checked) {
        config.output.textContent = `${config.base.value} 本`;
        continue;
      }
      const [minimum, maximum] = getFaultRange(config);
      const actual = plan ? plan[`${config.key}Count`] : null;
      config.output.textContent = actual === null || actual === undefined
        ? `${minimum}–${maximum} 本`
        : `${minimum}–${maximum} 本（現在 ${actual}）`;
    }
  }

  function syncFaultFloatUi() {
    for (const config of faultFloatConfigs) {
      config.toggle.disabled = busy;
      config.base.disabled = busy || config.toggle.checked;
      config.min.disabled = busy || !config.toggle.checked;
      config.max.disabled = busy || !config.toggle.checked;
    }
    syncFaultCountOutputs(lastPlan);
  }
  syncLabels();

  function cleanBaseName(name) {
    return (name.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'image').slice(0, 80);
  }

  function tessellateBitmap(targetContext, bitmap, targetWidth, targetHeight) {
    const tileWidth = Math.max(1, bitmap.width);
    const tileHeight = Math.max(1, bitmap.height);
    const columns = Math.max(1, Math.ceil(targetWidth / tileWidth));
    const rows = Math.max(1, Math.ceil(targetHeight / tileHeight));
    targetContext.clearRect(0, 0, targetWidth, targetHeight);
    targetContext.imageSmoothingEnabled = false;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        // No destination size is supplied: every copy keeps the decoded
        // bitmap's original dimensions and aspect ratio. Canvas clips the
        // overhanging right/bottom edges to the main image's working area.
        targetContext.drawImage(bitmap, column * tileWidth, row * tileHeight);
      }
    }
    return {
      tileWidth,
      tileHeight,
      columns,
      rows,
      coverageWidth: columns * tileWidth,
      coverageHeight: rows * tileHeight,
    };
  }

  async function loadMainImageBlob(blob, displayName, options = {}) {
    const {
      render = true,
      seed = randomSeed(),
      frameIndex = 0,
      faultPlan = null,
    } = options;
    stopAuto();
    status.textContent = '画像を読み込んでいます…';
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const maxSide = 2048;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    source = ctx.getImageData(0, 0, canvas.width, canvas.height);
    paletteCache = null;
    alternateSource = null;
    alternateName = '';
    alternateLayout = '';
    collapsePick = null;
    updateTileSelection();
    sourceName = cleanBaseName(displayName);
    faultSeed = Number(seed) >>> 0;
    lastFrame = Math.max(0, Number.parseInt(frameIndex, 10) || 0);
    lastPlan = faultPlan;
    empty.hidden = true;
    canvas.hidden = false;
    setEnabled(true);
    if (render) {
      renderFrame(lastFrame);
    } else {
      syncColorMatchCount();
      syncFaultCountOutputs(lastPlan);
      drawFullscreenTiles();
    }
    if (sourcePicker.open) refreshSourcePicker();
    const resized = scale < 1 ? `（処理用に ${canvas.width}×${canvas.height} へ縮小）` : '';
    return `${displayName} — ${canvas.width}×${canvas.height}${resized}`;
  }

  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    try {
      status.textContent = await loadMainImageBlob(file, file.name);
    } catch (error) {
      console.error('[image-glitch] image load failed:', error);
      status.textContent = 'この画像を読み込めませんでした';
    }
  });

  async function loadAlternateImageBlob(blob, displayName, options = {}) {
    stopAuto();
    if (!source) {
      throw new Error('MAIN_IMAGE_REQUIRED');
    }
    status.textContent = '別タイル画像を読み込んでいます…';
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const alternateCanvas = document.createElement('canvas');
    alternateCanvas.width = source.width;
    alternateCanvas.height = source.height;
    const alternateCtx = alternateCanvas.getContext('2d', { willReadFrequently: true });
    const tessellation = tessellateBitmap(alternateCtx, bitmap, source.width, source.height);
    bitmap.close();
    alternateSource = alternateCtx.getImageData(0, 0, source.width, source.height);
    paletteCache = null;
    alternateName = displayName;
    alternateLayout = `${tessellation.tileWidth}×${tessellation.tileHeight}・${tessellation.columns}×${tessellation.rows}枚`;
    if (options.reseed !== false) {
      faultSeed = randomSeed();
      lastFrame = 0;
    }
    syncAlternateUi(true);
    if (sourcePicker.open) refreshSourcePicker();
    if (options.render !== false) renderFrame(lastFrame);
    return `${displayName}（${tessellation.tileWidth}×${tessellation.tileHeight}）を ${tessellation.columns}×${tessellation.rows} 枚テッセレーションし、${tessellation.coverageWidth}×${tessellation.coverageHeight} から主画像範囲を切り取りました`;
  }

  alternateInput.addEventListener('change', async () => {
    const file = alternateInput.files && alternateInput.files[0];
    alternateInput.value = '';
    if (!file) return;
    if (!source) {
      status.textContent = '先に主画像を開いてください';
      return;
    }
    try {
      status.textContent = await loadAlternateImageBlob(file, file.name);
    } catch (error) {
      console.error('[image-glitch] alternate image load failed:', error);
      status.textContent = '別タイル画像を読み込めませんでした';
    }
  });

  function applyJsonSettings(settings) {
    if (!settings || typeof settings !== 'object') return;
    for (const [id, value] of Object.entries(settings)) {
      const control = document.getElementById(id);
      if (!control || !/^(INPUT|SELECT)$/.test(control.tagName) || control.type === 'file') continue;
      if (control.type === 'checkbox') {
        control.checked = !!value;
      } else if (control.tagName === 'SELECT') {
        const nextValue = String(value);
        if ([...control.options].some((option) => option.value === nextValue)) control.value = nextValue;
      } else {
        control.value = String(value);
      }
    }
  }

  function restoreJsonState(state) {
    if (!state || typeof state !== 'object') return;
    if (Number.isFinite(Number(state.faultSeed))) faultSeed = Number(state.faultSeed) >>> 0;
    lastFrame = Math.max(0, Number.parseInt(state.frameIndex, 10) || 0);
    const restoredColors = Array.isArray(state.groupColors)
      ? state.groupColors.filter((color) => /^#[0-9a-f]{6}$/i.test(color))
      : [];
    if (restoredColors.length) groupColors = [...new Set(restoredColors.map((color) => color.toLowerCase()))];
    activeGroupColor = /^#[0-9a-f]{6}$/i.test(state.activeGroupColor || '')
      ? state.activeGroupColor.toLowerCase()
      : groupColors[0];
    if (!groupColors.includes(activeGroupColor)) groupColors.unshift(activeGroupColor);
    groupColorInput.value = activeGroupColor;
    const pick = state.collapsePick;
    collapsePick = source && pick && Number.isFinite(Number(pick.x)) && Number.isFinite(Number(pick.y))
      ? {
          x: Math.max(0, Math.min(source.width - 1, Math.floor(Number(pick.x)))),
          y: Math.max(0, Math.min(source.height - 1, Math.floor(Number(pick.y)))),
          bank: alternateSource && Number(pick.bank) === 1 ? 1 : 0,
        }
      : null;
  }

  async function importJsonSession(json, displayName = 'JSON') {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new Error('INVALID_JSON_SESSION');
    }
    if (json.format && json.format !== 'image-rom-glitcher-session') {
      throw new Error('UNSUPPORTED_JSON_FORMAT');
    }
    stopAuto();
    let restoredOriginalImage = false;
    let restoredLegacyFrame = false;
    const originalDataUrl = json.source && json.source.dataUrl;
    const legacyFrameDataUrl = json.renderedFrame && json.renderedFrame.dataUrl;
    const embeddedSourceDataUrl = typeof originalDataUrl === 'string' && originalDataUrl.startsWith('data:image/')
      ? originalDataUrl
      : (!source && typeof legacyFrameDataUrl === 'string' && legacyFrameDataUrl.startsWith('data:image/')
          ? legacyFrameDataUrl
          : null);
    if (embeddedSourceDataUrl) {
      const frameResponse = await fetch(embeddedSourceDataUrl);
      const frameBlob = await frameResponse.blob();
      await loadMainImageBlob(
        frameBlob,
        (json.source && json.source.name) || `${displayName}_image.png`,
        {
          render: false,
          seed: json.state && json.state.faultSeed,
          frameIndex: json.state && json.state.frameIndex,
          faultPlan: json.faultPlan || null,
        }
      );
      restoredOriginalImage = embeddedSourceDataUrl === originalDataUrl;
      restoredLegacyFrame = !restoredOriginalImage;
    }
    const alternateDataUrl = json.alternate && json.alternate.dataUrl;
    if (
      source
      && typeof alternateDataUrl === 'string'
      && alternateDataUrl.startsWith('data:image/')
    ) {
      const alternateResponse = await fetch(alternateDataUrl);
      await loadAlternateImageBlob(
        await alternateResponse.blob(),
        json.alternate.name || `${displayName}_subtile.png`,
        { reseed: false, render: false }
      );
      alternateLayout = json.alternate.layout || alternateLayout;
    }
    applyJsonSettings(json.settings);
    restoreJsonState(json.state);
    lastPlan = json.faultPlan || null;
    renderGroupColors();
    syncLabels();
    syncFaultFloatUi();
    syncAlternateUi(!!source);
    updateTileSelection();
    updatePickerSelection();
    if (source) {
      setEnabled(true);
      if (restoredLegacyFrame) {
        syncColorMatchCount(activeGroupColor, lastPlan && lastPlan.colorGroupMask);
        syncFaultCountOutputs(lastPlan);
        drawFullscreenTiles();
      } else {
        renderFrame(lastFrame);
      }
      status.textContent = restoredOriginalImage
        ? `${displayName} — 原画・別タイル・設定を復元しました`
        : restoredLegacyFrame
          ? `${displayName} — 旧形式の設定と内包フレームを読み込みました`
          : `${displayName} — 現在の主画像へ設定を適用しました`;
    } else {
      status.textContent = `${displayName} — 設定を読み込みました。続けて主画像を開いてください`;
    }
  }

  async function importJsonText(text, displayName) {
    await importJsonSession(JSON.parse(text), displayName);
  }

  jsonInput.addEventListener('change', async () => {
    const file = jsonInput.files && jsonInput.files[0];
    jsonInput.value = '';
    if (!file) return;
    try {
      await importJsonText(await file.text(), file.name);
    } catch (error) {
      console.error('[image-glitch] JSON import failed:', error);
      status.textContent = 'このJSONを読み込めませんでした';
    }
  });

  loadDefaultJsonBtn.addEventListener('click', async () => {
    try {
      status.textContent = 'default.jsonを読み込んでいます…';
      const response = await fetch('src/default.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await importJsonText(await response.text(), 'default.json');
    } catch (error) {
      console.error('[image-glitch] default JSON load failed:', error);
      status.textContent = 'src/default.jsonを読み込めませんでした';
    }
  });

  loadDefaultSubtileBtn.addEventListener('click', async () => {
    if (!source) {
      status.textContent = '先に主画像またはdefault.jsonを読み込んでください';
      return;
    }
    try {
      status.textContent = 'subTile_default.pngを読み込んでいます…';
      const response = await fetch('src/subTile_default.png', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      status.textContent = await loadAlternateImageBlob(
        await response.blob(),
        'subTile_default.png',
        { reseed: false }
      );
    } catch (error) {
      console.error('[image-glitch] default subtile load failed:', error);
      status.textContent = 'src/subTile_default.pngを読み込めませんでした';
    }
  });

  alternateClearBtn.addEventListener('click', () => {
    alternateSource = null;
    paletteCache = null;
    alternateName = '';
    alternateLayout = '';
    if (collapsePick) collapsePick.bank = 0;
    syncAlternateUi(true);
    if (sourcePicker.open) refreshSourcePicker();
    renderFrame(lastFrame);
    status.textContent = '別タイルバンクを外しました';
  });

  function chooseUniqueBits(random, count, bitCount) {
    const pool = Array.from({ length: bitCount }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(count, bitCount));
  }

  function makeFaultPlan(frameIndex) {
    const tile = Number(tileInput.value);
    const tilesX = Math.ceil(source.width / tile);
    const tilesY = Math.ceil(source.height / tile);
    const tileCount = Math.max(1, tilesX * tilesY);
    const addressBits = Math.max(1, Math.ceil(Math.log2(tileCount)));
    const seed = faultSeed >>> 0;
    const addressRandom = mulberry32((seed ^ 0xA341316C) >>> 0);
    const dataRandom = mulberry32((seed ^ 0xC8013EA4) >>> 0);
    const stripeRandom = mulberry32((seed ^ 0xAD90777D) >>> 0);
    const eventRandom = mulberry32((seed ^ 0x7E95761E) >>> 0);
    const tileRandom = mulberry32((seed ^ 0x6C8E9CF5) >>> 0);
    const frameRandom = mulberry32((faultSeed ^ Math.imul(frameIndex + 1, 0x9E3779B1)) >>> 0);
    const countRandom = mulberry32((faultSeed ^ Math.imul(frameIndex + 1, 0x85EBCA6B) ^ 0xD1B54A35) >>> 0);
    const jitter = Number(jitterInput.value) / 100;
    const alternateRate = alternateSource ? Number(alternateRateInput.value) / 100 : 0;
    const halfRate = Number(halfRateInput.value) / 100;
    const collapseRate = Number(collapseRateInput.value) / 100;
    const pairRate = Number(pairRateInput.value) / 100;
    const colorAlternateRate = alternateSource ? Number(colorAlternateRateInput.value) / 100 : 0;
    const colorPaletteRate = alternateSource ? Number(colorPaletteRateInput.value) / 100 : 0;
    const colorTintRate = Number(colorTintRateInput.value) / 100;
    const requestedAddressCount = resolveFaultCount(faultFloatConfigs[0], countRandom);
    const requestedDataCount = resolveFaultCount(faultFloatConfigs[1], countRandom);
    const requestedStripeCount = resolveFaultCount(faultFloatConfigs[2], countRandom);

    const addressFaults = chooseUniqueBits(addressRandom, requestedAddressCount, addressBits).map((bit) => ({
      bit,
      stuck: addressRandom() < 0.5 ? 0 : 1,
      intermittent: addressRandom(),
    }));
    const dataFaults = chooseUniqueBits(dataRandom, requestedDataCount, 8).map((bit) => ({
      bit,
      channel: Math.floor(dataRandom() * 3),
      stuck: dataRandom() < 0.72 ? 0 : 1,
      intermittent: dataRandom(),
    }));
    // On an NES, each CHR byte represents one 8-pixel tile row. PPU D0-D7
    // therefore correspond to repeated horizontal positions inside every tile;
    // a stuck data pin produces the characteristic 8px-period vertical stripe.
    const stripeFaults = chooseUniqueBits(stripeRandom, requestedStripeCount, 8).map((bit) => ({
      bit,
      column: 7 - bit,
      colorBit: stripeRandom() < 0.55 ? 7 : 6,
      stuck: stripeRandom() < 0.72 ? 0 : 1,
      tintChannel: Math.floor(stripeRandom() * 3),
      intermittent: stripeRandom(),
      dashed: stripeStyleInput.value === 'dashed' || (stripeStyleInput.value === 'mixed' && stripeRandom() < 0.58),
      dashPeriod: 2 + Math.floor(stripeRandom() * 5),
      dashOn: 1 + Math.floor(stripeRandom() * 2),
      dashPhase: Math.floor(stripeRandom() * 6),
    }));

    // With zero jitter every frame uses the same electrical state. As jitter rises,
    // flaky contacts can reconnect or flip their floating-bus value each frame.
    for (const fault of [...addressFaults, ...dataFaults, ...stripeFaults]) {
      fault.active = true;
      if (frameIndex > 0 && frameRandom() < jitter * 0.7) fault.active = frameRandom() > 0.35;
      if (frameIndex > 0 && frameRandom() < jitter * 0.38) fault.stuck ^= 1;
    }
    const allowAlternatePattern = !!alternateSource && collapseAlternateInput.checked;
    let collapseTile = collapsePick
      ? Math.min(tileCount - 1, Math.floor(collapsePick.y / tile) * tilesX + Math.floor(collapsePick.x / tile))
      : Math.floor(eventRandom() * tileCount);
    let collapseBank = collapsePick
      ? (allowAlternatePattern && collapsePick.bank ? 1 : 0)
      // Choosing the one collapse-pattern bank is a separate whole-screen
      // event. It must not flip at an arbitrary alternate-mix percentage.
      : (allowAlternatePattern && eventRandom() < 0.5 ? 1 : 0);
    // These are whole-screen bus events. One draw is made per fault seed
    // ("接触を再抽選"), never independently for each tile or jitter frame.
    const halfEvent = eventRandom() < halfRate;
    const collapseEvent = eventRandom() < collapseRate;
    const pairEvent = eventRandom() < pairRate;
    const colorAlternateEvent = eventRandom() < colorAlternateRate;
    const colorPaletteEvent = eventRandom() < colorPaletteRate;
    const colorTintEvent = eventRandom() < colorTintRate;
    const selectedGroupColor = groupColors[Math.floor(eventRandom() * groupColors.length)] || '#808080';
    if (!collapsePick && frameIndex > 0 && frameRandom() < jitter * 0.35) collapseTile = Math.floor(frameRandom() * tileCount);
    if (!collapsePick && allowAlternatePattern && frameIndex > 0 && frameRandom() < jitter * 0.6) {
      collapseBank = frameRandom() < 0.5 ? 1 : 0;
    }
    const tileBanks = new Uint8Array(tileCount);
    for (let tileIndex = 0; tileIndex < tileCount; tileIndex++) {
      let useAlternate = tileRandom() < alternateRate;
      if (frameIndex > 0 && frameRandom() < jitter * 0.6) useAlternate = frameRandom() < alternateRate;
      tileBanks[tileIndex] = useAlternate ? 1 : 0;
    }
    // The colour-group event observes the tile addresses after the address
    // bus fault. RGB/stripe data faults are still applied later per pixel.
    const colorGroupMask = makeColorGroupMask(
      tile,
      tilesX,
      tileCount,
      selectedGroupColor,
      addressFaults
    );
    return {
      tile, tilesX, tilesY, tileCount, addressFaults, dataFaults, stripeFaults,
      tileBanks, halfEvent, collapseEvent, pairEvent, collapseTile, collapseBank,
      colorGroupMask, colorAlternateEvent, colorPaletteEvent, colorTintEvent,
      selectedGroupColor,
      addressCount: addressFaults.length, dataCount: dataFaults.length, stripesCount: stripeFaults.length,
    };
  }

  function forceBit(value, bit, stuck) {
    const mask = 1 << bit;
    return stuck ? (value | mask) : (value & ~mask);
  }

  function buildTilePalettes(image, tile, tilesX, tileCount) {
    const sums = new Float64Array(tileCount * 4 * 4);
    const counts = new Uint32Array(tileCount * 4);
    const src = image.data;
    for (let y = 0; y < image.height; y++) {
      const tileY = Math.floor(y / tile);
      for (let x = 0; x < image.width; x++) {
        const tileIndex = tileY * tilesX + Math.floor(x / tile);
        const i = (y * image.width + x) * 4;
        const luminance = (src[i] * 54 + src[i + 1] * 183 + src[i + 2] * 19) >> 8;
        const bucket = Math.min(3, luminance >> 6);
        const countIndex = tileIndex * 4 + bucket;
        const sumIndex = countIndex * 4;
        counts[countIndex]++;
        sums[sumIndex] += src[i];
        sums[sumIndex + 1] += src[i + 1];
        sums[sumIndex + 2] += src[i + 2];
        sums[sumIndex + 3] += src[i + 3];
      }
    }
    const colors = new Uint8ClampedArray(tileCount * 4 * 4);
    for (let tileIndex = 0; tileIndex < tileCount; tileIndex++) {
      for (let bucket = 0; bucket < 4; bucket++) {
        const countIndex = tileIndex * 4 + bucket;
        const colorIndex = countIndex * 4;
        let nearestBucket = bucket;
        if (!counts[countIndex]) {
          let nearestDistance = Infinity;
          for (let candidate = 0; candidate < 4; candidate++) {
            if (counts[tileIndex * 4 + candidate] && Math.abs(candidate - bucket) < nearestDistance) {
              nearestBucket = candidate;
              nearestDistance = Math.abs(candidate - bucket);
            }
          }
        }
        const nearestCountIndex = tileIndex * 4 + nearestBucket;
        const nearestColorIndex = nearestCountIndex * 4;
        const count = counts[nearestCountIndex] || 1;
        colors[colorIndex] = sums[nearestColorIndex] / count;
        colors[colorIndex + 1] = sums[nearestColorIndex + 1] / count;
        colors[colorIndex + 2] = sums[nearestColorIndex + 2] / count;
        colors[colorIndex + 3] = counts[nearestCountIndex] ? sums[nearestColorIndex + 3] / count : 255;
      }
    }
    return colors;
  }

  function buildTileAverages(image, tile, tilesX, tileCount) {
    const sums = new Float64Array(tileCount * 4);
    const counts = new Uint32Array(tileCount);
    for (let y = 0; y < image.height; y++) {
      const tileY = Math.floor(y / tile);
      for (let x = 0; x < image.width; x++) {
        const tileIndex = tileY * tilesX + Math.floor(x / tile);
        const pixel = (y * image.width + x) * 4;
        const alpha = image.data[pixel + 3] / 255;
        if (alpha <= 0) continue;
        counts[tileIndex]++;
        const sum = tileIndex * 4;
        sums[sum] += image.data[pixel] * alpha;
        sums[sum + 1] += image.data[pixel + 1] * alpha;
        sums[sum + 2] += image.data[pixel + 2] * alpha;
        sums[sum + 3] += alpha;
      }
    }
    const averages = new Float64Array(tileCount * 3);
    for (let tileIndex = 0; tileIndex < tileCount; tileIndex++) {
      const sum = tileIndex * 4;
      const weight = sums[sum + 3] || counts[tileIndex] || 1;
      averages[tileIndex * 3] = sums[sum] / weight;
      averages[tileIndex * 3 + 1] = sums[sum + 1] / weight;
      averages[tileIndex * 3 + 2] = sums[sum + 2] / weight;
    }
    return averages;
  }

  function hexToRgb(hex) {
    const value = Number.parseInt(hex.slice(1), 16);
    return [(value >>> 16) & 255, (value >>> 8) & 255, value & 255];
  }

  function makeColorGroupMask(
    tile,
    tilesX,
    tileCount,
    color = activeGroupColor,
    addressFaults = null
  ) {
    const mask = new Uint8Array(tileCount);
    if (!source) return mask;
    const averages = getBaseTilePalettes(tile, tilesX, tileCount).mainAverages;
    const [targetRed, targetGreen, targetBlue] = hexToRgb(color);
    const tolerance = Number(colorToleranceInput.value);
    for (let destinationTile = 0; destinationTile < tileCount; destinationTile++) {
      const visibleTile = addressFaults
        ? applyAddressFaults(destinationTile, addressFaults, tileCount)
        : destinationTile;
      const offset = visibleTile * 3;
      const redDistance = averages[offset] - targetRed;
      const greenDistance = averages[offset + 1] - targetGreen;
      const blueDistance = averages[offset + 2] - targetBlue;
      // Weighted RGB distance: green differences are perceived most strongly.
      const distance = Math.sqrt(
        redDistance * redDistance * 0.30
        + greenDistance * greenDistance * 0.59
        + blueDistance * blueDistance * 0.11
      );
      if (distance <= tolerance) mask[destinationTile] = 1;
    }
    return mask;
  }

  function syncColorMatchCount(color = activeGroupColor, mask = null) {
    if (!source) {
      colorMatchCount.textContent = `対象: 主画像の読込後に計算（候補 ${groupColors.length}色）`;
      return;
    }
    const tile = Number(tileInput.value);
    const tilesX = Math.ceil(source.width / tile);
    const tileCount = tilesX * Math.ceil(source.height / tile);
    const currentAddressFaults = lastPlan && lastPlan.tile === tile
      ? lastPlan.addressFaults
      : null;
    const selectedMask = mask || makeColorGroupMask(
      tile,
      tilesX,
      tileCount,
      color,
      currentAddressFaults
    );
    let matches = 0;
    for (const selected of selectedMask) matches += selected;
    colorMatchCount.textContent = `対象: ${matches} / ${tileCount} タイル（再抽選色 ${color.toUpperCase()}）`;
  }

  function getBaseTilePalettes(tile, tilesX, tileCount) {
    if (
      paletteCache && paletteCache.source === source && paletteCache.alternateSource === alternateSource
      && paletteCache.tile === tile
    ) return paletteCache;
    paletteCache = {
      source,
      alternateSource,
      tile,
      main: buildTilePalettes(source, tile, tilesX, tileCount),
      alternate: alternateSource ? buildTilePalettes(alternateSource, tile, tilesX, tileCount) : null,
      mainAverages: buildTileAverages(source, tile, tilesX, tileCount),
      alternateAverages: alternateSource ? buildTileAverages(alternateSource, tile, tilesX, tileCount) : null,
    };
    return paletteCache;
  }

  function applyAddressFaults(tileIndex, addressFaults, tileCount) {
    let mapped = tileIndex;
    for (const fault of addressFaults) {
      if (fault.active) mapped = forceBit(mapped, fault.bit, fault.stuck);
    }
    return mapped % tileCount;
  }

  function getPostAddressPalettes(plan, mainOnly = false) {
    const { tile, tilesX, tileCount, addressFaults, tileBanks } = plan;
    const base = getBaseTilePalettes(tile, tilesX, tileCount);
    const colors = new Uint8ClampedArray(tileCount * 4 * 4);
    for (let destinationTile = 0; destinationTile < tileCount; destinationTile++) {
      const mappedTile = applyAddressFaults(destinationTile, addressFaults, tileCount);
      const bankColors = !mainOnly && base.alternate && tileBanks[destinationTile] ? base.alternate : base.main;
      const sourceOffset = mappedTile * 4 * 4;
      colors.set(bankColors.subarray(sourceOffset, sourceOffset + 4 * 4), destinationTile * 4 * 4);
    }
    return colors;
  }

  function renderFrame(frameIndex) {
    if (!source) return;
    const plan = makeFaultPlan(frameIndex);
    const out = new ImageData(source.width, source.height);
    const src = source.data;
    const dst = out.data;
    const {
      tile, tilesX, tileCount, addressFaults, dataFaults, stripeFaults, tileBanks,
      halfEvent, collapseEvent, pairEvent, collapseTile, collapseBank,
      colorGroupMask, colorAlternateEvent, colorPaletteEvent, colorTintEvent,
    } = plan;
    // Palette lookup is rebuilt from the post-address-fault tile references,
    // before the whole-screen degeneration events are applied.
    // During collapse, "keep original tile colours" always means the
    // post-address main-image palette. Otherwise the per-tile alternate-mix
    // percentage can leak alternate palettes back into the collapsed frame,
    // even when its single pattern happens to come from the main image.
    const collapseKeepsMainPalette = collapseEvent
      && alternatePaletteInput.checked;
    const tilePalettes = collapseEvent
      ? getPostAddressPalettes(plan, collapseKeepsMainPalette)
      : null;
    const colorGroupPalettes = colorPaletteEvent ? getPostAddressPalettes(plan, true) : null;
    const alternateMixPalettes = alternateSource && alternatePaletteInput.checked
      ? getPostAddressPalettes(plan, true)
      : null;
    const tintColor = hexToRgb(tintColorInput.value);

    for (let y = 0; y < source.height; y++) {
      const tileY = Math.floor(y / tile);
      const inY = y % tile;
      for (let x = 0; x < source.width; x++) {
        const tileX = Math.floor(x / tile);
        const inX = x % tile;
        const destinationTile = tileY * tilesX + tileX;
        let sourceTile = destinationTile;
        // First corrupt the address bus. Whole-screen tile degeneration events
        // are deliberately evaluated afterwards, matching the requested order.
        sourceTile = applyAddressFaults(sourceTile, addressFaults, tileCount);
        if (collapseEvent) sourceTile = collapseTile;
        // NES tile numbers are 1-based: 2n copies 2n-1. Applied to the
        // already-corrupted tile address, odd zero-based indices copy back one.
        if (pairEvent && sourceTile % 2 === 1) sourceTile--;
        const sampleInY = halfEvent && inY >= tile / 2 ? inY - Math.ceil(tile / 2) : inY;
        const sx = Math.min(source.width - 1, (sourceTile % tilesX) * tile + inX);
        const sy = Math.min(source.height - 1, Math.floor(sourceTile / tilesX) * tile + sampleInY);
        const si = (sy * source.width + sx) * 4;
        const di = (y * source.width + x) * 4;
        const colorMatch = colorGroupMask[destinationTile] === 1;
        const bank = collapseEvent ? collapseBank : tileBanks[destinationTile];
        let readData = alternateSource && bank ? alternateSource.data : src;
        const regularAlternateMix = !!alternateSource
          && !collapseEvent
          && tileBanks[destinationTile] === 1
          && !(colorMatch && (colorAlternateEvent || colorPaletteEvent));
        if (colorMatch && alternateSource && (colorAlternateEvent || colorPaletteEvent)) {
          readData = alternateSource.data;
        }
        if (colorMatch && colorPaletteEvent) {
          const luminance = (readData[si] * 54 + readData[si + 1] * 183 + readData[si + 2] * 19) >> 8;
          const bucket = Math.min(3, luminance >> 6);
          const paletteIndex = (destinationTile * 4 + bucket) * 4;
          dst[di] = colorGroupPalettes[paletteIndex];
          dst[di + 1] = colorGroupPalettes[paletteIndex + 1];
          dst[di + 2] = colorGroupPalettes[paletteIndex + 2];
          dst[di + 3] = colorGroupPalettes[paletteIndex + 3];
        } else if (regularAlternateMix && alternateMixPalettes) {
          const luminance = (readData[si] * 54 + readData[si + 1] * 183 + readData[si + 2] * 19) >> 8;
          const bucket = Math.min(3, luminance >> 6);
          const paletteIndex = (destinationTile * 4 + bucket) * 4;
          dst[di] = alternateMixPalettes[paletteIndex];
          dst[di + 1] = alternateMixPalettes[paletteIndex + 1];
          dst[di + 2] = alternateMixPalettes[paletteIndex + 2];
          dst[di + 3] = alternateMixPalettes[paletteIndex + 3];
        } else if (collapseEvent && !(colorMatch && colorAlternateEvent)) {
          const luminance = (readData[si] * 54 + readData[si + 1] * 183 + readData[si + 2] * 19) >> 8;
          const bucket = Math.min(3, luminance >> 6);
          const paletteIndex = (destinationTile * 4 + bucket) * 4;
          dst[di] = tilePalettes[paletteIndex];
          dst[di + 1] = tilePalettes[paletteIndex + 1];
          dst[di + 2] = tilePalettes[paletteIndex + 2];
          dst[di + 3] = tilePalettes[paletteIndex + 3];
        } else {
          dst[di] = readData[si];
          dst[di + 1] = readData[si + 1];
          dst[di + 2] = readData[si + 2];
          dst[di + 3] = readData[si + 3];
        }
        if (colorMatch && colorTintEvent) applyTint(dst, di, tintColor);
        for (const fault of dataFaults) {
          if (fault.active) dst[di + fault.channel] = forceBit(dst[di + fault.channel], fault.bit, fault.stuck);
        }
        for (const fault of stripeFaults) {
          if (!fault.active || x % 8 !== fault.column) continue;
          if (fault.dashed) {
            const segment = Math.floor(y / 8);
            if ((segment + fault.dashPhase) % fault.dashPeriod >= Math.min(fault.dashOn, fault.dashPeriod - 1)) continue;
          }
          // Force the same brightness bit on all channels, then offset one
          // channel. This retains the source image while creating the strong
          // black/white/colour pinstripes observed from nes-picture.nes.
          for (let channel = 0; channel < 3; channel++) {
            dst[di + channel] = forceBit(dst[di + channel], fault.colorBit, fault.stuck);
          }
          dst[di + fault.tintChannel] = forceBit(
            dst[di + fault.tintChannel],
            Math.max(4, fault.colorBit - 1),
            fault.stuck ^ 1
          );
        }
      }
    }
    ctx.putImageData(out, 0, 0);
    drawFullscreenTiles();
    lastFrame = frameIndex;
    lastPlan = plan;
    const colorChanged = activeGroupColor !== plan.selectedGroupColor;
    activeGroupColor = plan.selectedGroupColor;
    if (colorChanged) renderGroupColors();
    else activeGroupColorElement.textContent = `再抽選色: ${activeGroupColor.toUpperCase()}（候補 ${groupColors.length}色）`;
    syncColorMatchCount(activeGroupColor, plan.colorGroupMask);
    syncFaultCountOutputs(plan);
    updateTileSelection();
    return plan;
  }

  function applyTint(data, offset, target) {
    const luminance = (data[offset] * 54 + data[offset + 1] * 183 + data[offset + 2] * 19) / 256;
    const shade = 0.28 + luminance / 255 * 1.12;
    data[offset] = Math.min(255, target[0] * shade);
    data[offset + 1] = Math.min(255, target[1] * shade);
    data[offset + 2] = Math.min(255, target[2] * shade);
  }

  function eventSummary(plan) {
    const events = [];
    if (plan.halfEvent) events.push('上下コピー');
    if (plan.collapseEvent) events.push('単一模様');
    if (plan.pairEvent) events.push('偶数コピー');
    if (plan.colorAlternateEvent) events.push('近色→別画像色');
    if (plan.colorPaletteEvent) events.push('近色→別模様');
    if (plan.colorTintEvent) events.push('近色→指定色');
    return events.length ? events.join('＋') : '全体イベントなし';
  }

  function rerenderFromControl() {
    if (!source || busy) return;
    renderFrame(lastFrame);
  }
  for (const control of [
    tileInput, alternateRateInput, halfRateInput, collapseRateInput, pairRateInput,
    colorToleranceInput, colorAlternateRateInput, colorPaletteRateInput, colorTintRateInput,
    addressInput, dataInput, stripesInput, jitterInput, autoSpeedInput,
  ]) {
    control.addEventListener('input', () => {
      syncLabels();
      if (control === tileInput || control === colorToleranceInput) syncColorMatchCount();
      if (control !== autoSpeedInput) rerenderFromControl();
    });
  }
  groupColorInput.addEventListener('input', () => {
    syncColorMatchCount(groupColorInput.value);
  });
  for (const config of faultFloatConfigs) {
    config.toggle.addEventListener('change', () => {
      syncFaultFloatUi();
      rerenderFromControl();
    });
    for (const rangeInput of [config.min, config.max]) {
      rangeInput.addEventListener('input', () => {
        syncFaultCountOutputs(lastPlan);
        rerenderFromControl();
      });
    }
  }
  tintColorInput.addEventListener('input', rerenderFromControl);
  stripeStyleInput.addEventListener('change', rerenderFromControl);
  collapseAlternateInput.addEventListener('change', rerenderFromControl);
  alternatePaletteInput.addEventListener('change', rerenderFromControl);
  window.addEventListener?.('resize', () => {
    updateTileSelection();
    if (sourcePicker.open) updatePickerSelection();
    drawFullscreenTiles();
  });

  let autoRunning = false;
  function stopAuto() {
    autoRunning = false;
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = 0;
    autoBtn.classList.remove('running');
    autoBtn.textContent = '自動変化 ▶';
  }
  function autoStep() {
    if (!autoRunning || !source || busy || !panel.classList.contains('show')) {
      stopAuto();
      return;
    }
    if (autoFrame % 10 === 0) faultSeed = randomSeed();
    const plan = renderFrame(autoFrame++);
    status.textContent = `自動変化 frame ${autoFrame} — ${eventSummary(plan)}`;
    autoTimer = setTimeout(autoStep, Number(autoSpeedInput.value));
  }
  function startAuto() {
    if (!source || busy || autoRunning) return;
    autoRunning = true;
    autoFrame = 0;
    autoBtn.classList.add('running');
    autoBtn.textContent = '自動変化 ■ 停止';
    autoStep();
  }
  autoBtn.addEventListener('click', () => autoRunning ? stopAuto() : startAuto());

  rerollBtn.addEventListener('click', () => {
    faultSeed = randomSeed();
    const plan = renderFrame(0);
    status.textContent = `seed ${faultSeed.toString(16).toUpperCase().padStart(8, '0')} — ${eventSummary(plan)}`;
  });
  stripePresetBtn.addEventListener('click', () => {
    tileInput.value = '8';
    addressInput.value = '0';
    dataInput.value = '0';
    stripesInput.value = '4';
    addressFloatInput.checked = false;
    dataFloatInput.checked = false;
    stripesFloatInput.checked = false;
    syncFaultFloatUi();
    jitterInput.value = '35';
    syncLabels();
    faultSeed = randomSeed();
    renderFrame(0);
    status.textContent = 'nes-picture.nes のPPU D線断線に近い8px周期の縦縞設定';
  });
  originalBtn.addEventListener('click', () => {
    if (!source) return;
    stopAuto();
    ctx.putImageData(source, 0, 0);
    drawFullscreenTiles();
    status.textContent = '原画を表示中（再抽選するとグリッチ表示に戻ります）';
  });

  function canvasBlob() {
    return new Promise((resolve, reject) => canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('PNG encode failed')),
      'image/png'
    ));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  saveBtn.addEventListener('click', async () => {
    if (!source || busy) return;
    try {
      const blob = await canvasBlob();
      downloadBlob(blob, `${sourceName}_glitch.png`);
      status.textContent = '現在のフレームをPNG保存しました';
    } catch (error) {
      console.error(error);
      status.textContent = 'PNG保存に失敗しました';
    }
  });

  function collectJsonSettings() {
    const settings = {};
    for (const control of panel.querySelectorAll('input[id], select[id]')) {
      if (control.type === 'file') continue;
      if (control.type === 'checkbox') {
        settings[control.id] = control.checked;
      } else if (control.type === 'range' || control.type === 'number') {
        settings[control.id] = Number(control.value);
      } else {
        settings[control.id] = control.value;
      }
    }
    return settings;
  }

  function serializeFaultPlan(plan) {
    if (!plan) return null;
    return {
      ...plan,
      tileBanks: Array.from(plan.tileBanks),
      colorGroupMask: Array.from(plan.colorGroupMask),
    };
  }

  function imageDataToPngDataUrl(imageData) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = imageData.width;
    exportCanvas.height = imageData.height;
    const exportContext = exportCanvas.getContext('2d');
    exportContext.putImageData(imageData, 0, 0);
    return exportCanvas.toDataURL('image/png');
  }

  saveJsonBtn.addEventListener('click', async () => {
    if (!source || busy) return;
    try {
      const json = {
        format: 'image-rom-glitcher-session',
        version: 2,
        exportedAt: new Date().toISOString(),
        source: {
          name: sourceName,
          width: source.width,
          height: source.height,
          mimeType: 'image/png',
          dataUrl: imageDataToPngDataUrl(source),
        },
        alternate: alternateSource ? {
          name: alternateName,
          layout: alternateLayout,
          width: alternateSource.width,
          height: alternateSource.height,
          mimeType: 'image/png',
          dataUrl: imageDataToPngDataUrl(alternateSource),
        } : null,
        state: {
          faultSeed,
          frameIndex: lastFrame,
          collapsePick: collapsePick ? { ...collapsePick } : null,
          groupColors: [...groupColors],
          activeGroupColor,
        },
        settings: collectJsonSettings(),
        faultPlan: serializeFaultPlan(lastPlan),
      };
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      downloadBlob(blob, `${sourceName}_glitch.json`);
      status.textContent = '原画・別タイル・現在のパラメータをJSON保存しました';
    } catch (error) {
      console.error('[image-glitch] JSON export failed:', error);
      status.textContent = 'JSON保存に失敗しました';
    }
  });

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function u16(value) {
    return new Uint8Array([value & 255, (value >>> 8) & 255]);
  }
  function u32(value) {
    return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
  }
  function joinBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) { result.set(part, offset); offset += part.length; }
    return result;
  }

  // Minimal ZIP writer using the "stored" method. PNG is already compressed, so
  // recompressing it would only cost time and memory in the browser.
  function makeZip(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    for (const file of files) {
      const name = encoder.encode(file.name);
      const crc = crc32(file.data);
      const local = joinBytes([
        u32(0x04034B50), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(crc), u32(file.data.length), u32(file.data.length), u16(name.length), u16(0), name, file.data,
      ]);
      const central = joinBytes([
        u32(0x02014B50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(crc), u32(file.data.length), u32(file.data.length), u16(name.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(offset), name,
      ]);
      localParts.push(local);
      centralParts.push(central);
      offset += local.length;
    }
    const central = joinBytes(centralParts);
    const end = joinBytes([
      u32(0x06054B50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(central.length), u32(offset), u16(0),
    ]);
    return new Blob([...localParts, central, end], { type: 'application/zip' });
  }

  saveFramesBtn.addEventListener('click', async () => {
    if (!source || busy) return;
    stopAuto();
    const count = Math.max(1, Math.min(24, Number.parseInt(countInput.value, 10) || 1));
    countInput.value = count;
    busy = true;
    setEnabled(false);
    const files = [];
    try {
      for (let frame = 0; frame < count; frame++) {
        renderFrame(frame);
        status.textContent = `フレーム ${frame + 1} / ${count} を生成中…`;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const data = new Uint8Array(await (await canvasBlob()).arrayBuffer());
        files.push({ name: `${sourceName}_glitch_${String(frame + 1).padStart(3, '0')}.png`, data });
      }
      downloadBlob(makeZip(files), `${sourceName}_glitch_frames.zip`);
      status.textContent = `${count}フレームをZIP保存しました`;
    } catch (error) {
      console.error('[image-glitch] frame export failed:', error);
      status.textContent = '複数フレームの保存に失敗しました';
    } finally {
      busy = false;
      setEnabled(true);
    }
  });
})();
