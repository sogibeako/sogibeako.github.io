(function () {
  "use strict";

  const Core = window.NesCore;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const mainCanvas = $("#mainCanvas");
  const mainContext = mainCanvas.getContext("2d", { alpha: false });
  const gridCanvas = $("#gridCanvas");
  const gridContext = gridCanvas.getContext("2d");
  const loupeCanvas = $("#loupeCanvas");
  const loupeContext = loupeCanvas.getContext("2d");
  const layers = [document.createElement("canvas"), document.createElement("canvas")];
  const layerContexts = layers.map((canvas) => {
    canvas.width = Core.WIDTH;
    canvas.height = Core.HEIGHT;
    return canvas.getContext("2d", { willReadFrequently: true });
  });

  const state = {
    activeLayer: 0,
    activeTool: "pencil",
    brushSize: 4,
    selectedMaster: 0x20,
    outputSelection: null,
    layerOpacity: [1, 1],
    layerVisible: [true, true],
    view: "source",
    dirty: true,
    conversion: null,
    prepResults: [null, null],
    edgeResults: [null, null],
    loupeEnabled: false,
    loupeZoom: 4,
    drawing: false,
    lastPoint: null,
    undo: [],
    hasImported: false
  };

  function hexColor(index) { return `#${Core.MASTER_HEX[index & 63]}`; }

  function toast(message) {
    const element = $("#toast");
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("show"), 2400);
  }

  function markDirty() {
    state.dirty = true;
    $("#dirtyStatus").textContent = "再変換が必要";
    $("#dirtyStatus").style.color = "var(--warning)";
    if (state.view !== "source") setView("source");
  }

  function snapshot() {
    const entry = layerContexts.map((context) => context.getImageData(0, 0, Core.WIDTH, Core.HEIGHT));
    state.undo.push(entry);
    if (state.undo.length > 12) state.undo.shift();
    $("#undoButton").disabled = false;
  }

  function restoreSnapshot() {
    const entry = state.undo.pop();
    if (!entry) return;
    entry.forEach((image, index) => layerContexts[index].putImageData(image, 0, 0));
    $("#undoButton").disabled = state.undo.length === 0;
    state.hasImported = hasVisiblePixels();
    state.prepResults = [null, null];
    state.edgeResults = [null, null];
    showPrepResult();
    showEdgeResult();
    updateEmptyGuide();
    markDirty();
    render();
  }

  function hasVisiblePixels() {
    return layerContexts.some((context) => {
      const data = context.getImageData(0, 0, Core.WIDTH, Core.HEIGHT).data;
      for (let i = 3; i < data.length; i += 4) if (data[i]) return true;
      return false;
    });
  }

  function updateEmptyGuide() {
    $("#emptyGuide").style.display = state.hasImported || hasVisiblePixels() ? "none" : "flex";
  }

  function compose(layerIndices, opaqueBackground) {
    const canvas = document.createElement("canvas");
    canvas.width = Core.WIDTH;
    canvas.height = Core.HEIGHT;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (opaqueBackground) {
      context.fillStyle = "#000000";
      context.fillRect(0, 0, Core.WIDTH, Core.HEIGHT);
    }
    layerIndices.forEach((index) => {
      if (!state.layerVisible[index]) return;
      context.globalAlpha = state.layerOpacity[index];
      context.drawImage(layers[index], 0, 0);
    });
    context.globalAlpha = 1;
    return context.getImageData(0, 0, Core.WIDTH, Core.HEIGHT);
  }

  function renderSource() {
    const image = compose([0, 1], true);
    mainContext.putImageData(image, 0, 0);
  }

  function renderNes() {
    if (!state.conversion) return renderSource();
    mainContext.putImageData(new ImageData(state.conversion.preview, Core.WIDTH, Core.HEIGHT), 0, 0);
  }

  function renderTiles() {
    mainContext.fillStyle = "#05070b";
    mainContext.fillRect(0, 0, Core.WIDTH, Core.HEIGHT);
    if (!state.conversion) {
      mainContext.fillStyle = "#8fa1b4";
      mainContext.font = "10px sans-serif";
      mainContext.textAlign = "center";
      mainContext.fillText("先にNES形式へ変換してください", 128, 120);
      return;
    }
    const chr = state.conversion.background.tiles.chr;
    const colors = ["#071018", "#256f72", "#55d6be", "#ecf3f8"];
    for (let tile = 0; tile < state.conversion.background.tiles.storedCount; tile += 1) {
      const baseX = 64 + (tile & 15) * 8;
      const baseY = 56 + (tile >> 4) * 8;
      for (let y = 0; y < 8; y += 1) {
        const low = chr[tile * 16 + y];
        const high = chr[tile * 16 + y + 8];
        for (let x = 0; x < 8; x += 1) {
          const bit = 7 - x;
          const slot = ((low >> bit) & 1) | (((high >> bit) & 1) << 1);
          mainContext.fillStyle = colors[slot];
          mainContext.fillRect(baseX + x, baseY + y, 1, 1);
        }
      }
    }
  }

  function render() {
    mainContext.imageSmoothingEnabled = false;
    if (state.view === "source") renderSource();
    else if (state.view === "nes") renderNes();
    else renderTiles();
    $("#viewStatus").textContent = `${state.view === "source" ? "編集ビュー" : state.view === "nes" ? "NESプレビュー" : "タイル表示"}・レイヤー${state.activeLayer + 1}`;
  }

  function drawGrid() {
    gridContext.clearRect(0, 0, Core.WIDTH, Core.HEIGHT);
    gridContext.strokeStyle = "rgba(255,255,255,.22)";
    gridContext.lineWidth = 0.45;
    for (let x = 8; x < Core.WIDTH; x += 8) {
      gridContext.beginPath(); gridContext.moveTo(x, 0); gridContext.lineTo(x, Core.HEIGHT); gridContext.stroke();
    }
    for (let y = 8; y < Core.HEIGHT; y += 8) {
      gridContext.beginPath(); gridContext.moveTo(0, y); gridContext.lineTo(Core.WIDTH, y); gridContext.stroke();
    }
    gridContext.strokeStyle = "rgba(85,214,190,.45)";
    gridContext.lineWidth = 0.7;
    for (let x = 16; x < Core.WIDTH; x += 16) {
      gridContext.beginPath(); gridContext.moveTo(x, 0); gridContext.lineTo(x, Core.HEIGHT); gridContext.stroke();
    }
    for (let y = 16; y < Core.HEIGHT; y += 16) {
      gridContext.beginPath(); gridContext.moveTo(0, y); gridContext.lineTo(Core.WIDTH, y); gridContext.stroke();
    }
  }

  function setView(view) {
    state.view = view;
    $$(".view-tab").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    mainCanvas.style.cursor = view === "source" ? "crosshair" : "default";
    if (view !== "source") hideLoupe();
    render();
  }

  function hideLoupe() {
    $("#loupePanel").classList.remove("visible");
    $("#loupePanel").setAttribute("aria-hidden", "true");
  }

  function updateLoupe(point) {
    if (!state.loupeEnabled || state.view !== "source") {
      hideLoupe();
      return;
    }
    const zoom = state.loupeZoom;
    const sourceSize = loupeCanvas.width / zoom;
    const sourceX = Math.max(0, Math.min(Core.WIDTH - sourceSize, Math.floor(point.x - sourceSize / 2)));
    const sourceY = Math.max(0, Math.min(Core.HEIGHT - sourceSize, Math.floor(point.y - sourceSize / 2)));
    loupeContext.imageSmoothingEnabled = false;
    loupeContext.clearRect(0, 0, loupeCanvas.width, loupeCanvas.height);
    loupeContext.drawImage(mainCanvas, sourceX, sourceY, sourceSize, sourceSize, 0, 0, loupeCanvas.width, loupeCanvas.height);
    loupeContext.strokeStyle = "rgba(255,255,255,.18)";
    loupeContext.lineWidth = 1;
    for (let pixel = 0; pixel <= sourceSize; pixel += 1) {
      const position = Math.round(pixel * zoom) + 0.5;
      loupeContext.beginPath(); loupeContext.moveTo(position, 0); loupeContext.lineTo(position, loupeCanvas.height); loupeContext.stroke();
      loupeContext.beginPath(); loupeContext.moveTo(0, position); loupeContext.lineTo(loupeCanvas.width, position); loupeContext.stroke();
    }
    const cursorX = Math.floor((point.x - sourceX) * zoom);
    const cursorY = Math.floor((point.y - sourceY) * zoom);
    loupeContext.strokeStyle = "#55d6be";
    loupeContext.lineWidth = 2;
    loupeContext.strokeRect(cursorX + 1, cursorY + 1, zoom - 2, zoom - 2);
    const panel = $("#loupePanel");
    panel.classList.toggle("left", point.x > Core.WIDTH / 2);
    panel.classList.add("visible");
    panel.setAttribute("aria-hidden", "false");
    $("#loupeLabel").textContent = `LOUPE ×${zoom} · ${point.x}, ${point.y}`;
  }

  function makeMasterPalette() {
    const container = $("#masterPalette");
    Core.MASTER_HEX.forEach((hex, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "master-swatch" + ([0x0e,0x0f,0x1d,0x1e,0x1f,0x2e,0x2f,0x3e,0x3f].includes(index) ? " dim" : "");
      button.style.background = `#${hex}`;
      button.title = `$${index.toString(16).padStart(2, "0").toUpperCase()} #${hex}`;
      button.dataset.index = index;
      button.addEventListener("click", () => selectMaster(index));
      container.appendChild(button);
    });
    selectMaster(state.selectedMaster);
  }

  function selectMaster(index) {
    state.selectedMaster = index;
    $$(".master-swatch").forEach((button) => button.classList.toggle("active", Number(button.dataset.index) === index));
    $("#selectedColor").style.background = hexColor(index);
    $("#selectedColorCode").textContent = `$${index.toString(16).padStart(2, "0").toUpperCase()}`;
    if (state.outputSelection && state.conversion) {
      const { kind, group, slot } = state.outputSelection;
      if (kind === "bg") {
        if (slot === 0) {
          state.conversion.background.palettes.forEach((palette) => { palette[0] = index; });
          state.conversion.background.universal = index;
          if (state.conversion.sprites) state.conversion.sprites.palettes.forEach((palette) => { palette[0] = index; });
        } else state.conversion.background.palettes[group][slot] = index;
      } else if (state.conversion.sprites) {
        if (slot === 0) {
          state.conversion.sprites.palettes.forEach((palette) => { palette[0] = index; });
          state.conversion.background.palettes.forEach((palette) => { palette[0] = index; });
          state.conversion.background.universal = index;
        } else state.conversion.sprites.palettes[group][slot] = index;
      }
      rebuildPreview();
      renderPaletteGroups();
      state.outputSelection = null;
      toast("変換パレットの色を置き換えました");
    }
  }

  function renderPrepPalette(palette) {
    const container = $("#prepPalette");
    container.innerHTML = "";
    palette.forEach((color) => {
      const swatch = document.createElement("span");
      swatch.className = "prep-color";
      swatch.style.background = hexColor(color);
      swatch.title = `$${color.toString(16).padStart(2, "0").toUpperCase()}`;
      container.appendChild(swatch);
    });
  }

  function showPrepResult() {
    const result = state.prepResults[state.activeLayer];
    $("#prepStatus").textContent = result ? `${result.beforeCount} → ${result.afterCount}色` : "未適用";
    renderPrepPalette(result ? result.palette : []);
  }

  function clearActivePrepResult() {
    state.prepResults[state.activeLayer] = null;
    showPrepResult();
  }

  function showEdgeResult() {
    const result = state.edgeResults[state.activeLayer];
    $("#edgeStatus").textContent = result ? `${result.changedPixels.toLocaleString()}px 変更` : "未適用";
  }

  function clearActiveEdgeResult() {
    state.edgeResults[state.activeLayer] = null;
    showEdgeResult();
  }

  function enhanceActiveLayerEdges() {
    const context = layerContexts[state.activeLayer];
    const image = context.getImageData(0, 0, Core.WIDTH, Core.HEIGHT);
    const result = Core.enhanceEdges(image.data, Number($("#edgeStrength").value));
    if (!result.changedPixels) {
      toast("強調できる輪郭が見つかりませんでした");
      return;
    }
    snapshot();
    context.putImageData(new ImageData(result.rgba, Core.WIDTH, Core.HEIGHT), 0, 0);
    state.edgeResults[state.activeLayer] = { changedPixels: result.changedPixels, strength: result.strength };
    clearActivePrepResult();
    showEdgeResult();
    markDirty();
    render();
    toast(`レイヤー${state.activeLayer + 1}の輪郭を強調しました`);
  }

  function optimizeActiveLayerColors() {
    const context = layerContexts[state.activeLayer];
    const image = context.getImageData(0, 0, Core.WIDTH, Core.HEIGHT);
    const result = Core.reduceToNesColors(image.data, Number($("#prepColorCount").value));
    if (!result.afterCount) {
      toast("選択レイヤーに整理できる色がありません");
      return;
    }
    snapshot();
    context.putImageData(new ImageData(result.rgba, Core.WIDTH, Core.HEIGHT), 0, 0);
    state.prepResults[state.activeLayer] = result;
    showPrepResult();
    state.hasImported = true;
    updateEmptyGuide();
    markDirty();
    render();
    toast(`レイヤー${state.activeLayer + 1}を${result.afterCount}色のNESパレットへ整理しました`);
  }

  function renderPaletteGroups() {
    renderPaletteContainer($("#bgPalettes"), state.conversion?.background.palettes, "bg");
    renderPaletteContainer($("#spritePalettes"), state.conversion?.sprites?.palettes, "sprite");
  }

  function renderPaletteContainer(container, palettes, kind) {
    container.innerHTML = "";
    if (!palettes) {
      container.className = "palette-groups empty-palettes";
      container.textContent = kind === "bg" ? "変換後に表示されます" : "スプライト変換時に表示";
      return;
    }
    container.className = "palette-groups";
    palettes.forEach((palette, group) => {
      const groupElement = document.createElement("div");
      groupElement.className = "palette-group";
      palette.forEach((color, slot) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "output-swatch";
        button.style.background = hexColor(color);
        button.title = `P${group} / 色${slot} / $${color.toString(16).padStart(2, "0").toUpperCase()}`;
        button.addEventListener("click", () => {
          state.outputSelection = { kind, group, slot };
          $$(".output-swatch").forEach((swatch) => swatch.classList.remove("selected"));
          button.classList.add("selected");
          toast("置き換えるNES色を左のマスターパレットから選択してください");
        });
        groupElement.appendChild(button);
      });
      container.appendChild(groupElement);
    });
  }

  function getPoint(event) {
    const rect = mainCanvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(Core.WIDTH - 1, Math.floor((event.clientX - rect.left) * Core.WIDTH / rect.width))),
      y: Math.max(0, Math.min(Core.HEIGHT - 1, Math.floor((event.clientY - rect.top) * Core.HEIGHT / rect.height)))
    };
  }

  function paintPoint(point) {
    const context = layerContexts[state.activeLayer];
    const size = state.brushSize;
    const x = Math.floor(point.x / size) * size;
    const y = Math.floor(point.y / size) * size;
    if (state.activeTool === "eraser") context.clearRect(x, y, size, size);
    else {
      context.fillStyle = hexColor(state.selectedMaster);
      context.fillRect(x, y, size, size);
    }
  }

  function drawLine(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let step = 0; step <= steps; step += Math.max(1, state.brushSize / 2)) {
      paintPoint({ x: Math.round(from.x + dx * step / steps), y: Math.round(from.y + dy * step / steps) });
    }
  }

  function pickColor(point) {
    const pixel = layerContexts[state.activeLayer].getImageData(point.x, point.y, 1, 1).data;
    if (pixel[3] < 16) return toast("この位置は透明です");
    selectMaster(Core.nearestMaster(pixel[0], pixel[1], pixel[2]));
    setTool("pencil");
  }

  function floodFill(point) {
    const context = layerContexts[state.activeLayer];
    const image = context.getImageData(0, 0, Core.WIDTH, Core.HEIGHT);
    const data = image.data;
    const start = (point.y * Core.WIDTH + point.x) * 4;
    const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
    const replacement = Core.MASTER_RGB[state.selectedMaster];
    if (target[0] === replacement.r && target[1] === replacement.g && target[2] === replacement.b && target[3] === 255) return;
    const queue = [point.y * Core.WIDTH + point.x];
    const visited = new Uint8Array(Core.WIDTH * Core.HEIGHT);
    while (queue.length) {
      const pixel = queue.pop();
      if (visited[pixel]) continue;
      visited[pixel] = 1;
      const offset = pixel * 4;
      if (data[offset] !== target[0] || data[offset + 1] !== target[1] || data[offset + 2] !== target[2] || data[offset + 3] !== target[3]) continue;
      data[offset] = replacement.r; data[offset + 1] = replacement.g; data[offset + 2] = replacement.b; data[offset + 3] = 255;
      const x = pixel % Core.WIDTH;
      const y = Math.floor(pixel / Core.WIDTH);
      if (x) queue.push(pixel - 1);
      if (x < Core.WIDTH - 1) queue.push(pixel + 1);
      if (y) queue.push(pixel - Core.WIDTH);
      if (y < Core.HEIGHT - 1) queue.push(pixel + Core.WIDTH);
    }
    context.putImageData(image, 0, 0);
  }

  function setTool(tool) {
    state.activeTool = tool;
    $$(".tool-button").forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
  }

  function beginDrawing(event) {
    if (state.view !== "source" || event.button !== 0) return;
    const point = getPoint(event);
    if (state.activeTool === "eyedropper") return pickColor(point);
    snapshot();
    if (state.activeTool === "fill") floodFill(point);
    else {
      state.drawing = true;
      state.lastPoint = point;
      mainCanvas.setPointerCapture(event.pointerId);
      paintPoint(point);
    }
    state.hasImported = true;
    clearActivePrepResult();
    clearActiveEdgeResult();
    updateEmptyGuide();
    markDirty();
    render();
    updateLoupe(point);
  }

  function moveDrawing(event) {
    const point = getPoint(event);
    $("#cursorStatus").textContent = `x: ${point.x.toString().padStart(3, "0")} / y: ${point.y.toString().padStart(3, "0")}`;
    if (state.drawing) {
      drawLine(state.lastPoint, point);
      state.lastPoint = point;
      render();
    }
    updateLoupe(point);
  }

  function endDrawing() { state.drawing = false; state.lastPoint = null; }

  function loadImageFile(file) {
    if (!file || !/^image\/(png|jpeg)$/.test(file.type)) return toast("PNGまたはJPGを選択してください");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        snapshot();
        const context = layerContexts[state.activeLayer];
        context.clearRect(0, 0, Core.WIDTH, Core.HEIGHT);
        const mode = $("#fitMode").value;
        let width = image.width;
        let height = image.height;
        if (mode === "stretch") { width = Core.WIDTH; height = Core.HEIGHT; }
        else if (mode !== "native") {
          const scale = mode === "cover" ? Math.max(Core.WIDTH / image.width, Core.HEIGHT / image.height) : Math.min(Core.WIDTH / image.width, Core.HEIGHT / image.height);
          width = image.width * scale; height = image.height * scale;
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, (Core.WIDTH - width) / 2, (Core.HEIGHT - height) / 2, width, height);
        context.imageSmoothingEnabled = false;
        state.hasImported = true;
        clearActivePrepResult();
        clearActiveEdgeResult();
        updateEmptyGuide();
        markDirty();
        render();
        toast(`${file.name} をレイヤー${state.activeLayer + 1}へ読み込みました`);
      };
      image.onerror = () => toast("画像を読み込めませんでした");
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function applyLayerAlpha(imageData, opacity) {
    const copy = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
    for (let i = 3; i < copy.data.length; i += 4) copy.data[i] = Math.round(copy.data[i] * opacity);
    return copy;
  }

  function convert() {
    const button = $("#convertButton");
    button.disabled = true;
    button.textContent = "変換中…";
    requestAnimationFrame(() => {
      try {
        const mode = $("#overlayMode").value;
        const backgroundImage = compose(mode === "merge" ? [0, 1] : [0], true);
        const options = {
          dither: $("#ditherMode").value,
          ditherStrength: Number($("#ditherStrength").value)
        };
        const background = Core.quantizeBackground(backgroundImage.data, options);
        background.tiles = Core.buildBackgroundTiles(background.pixelSlots, background.blockPalettes);
        let sprites = null;
        let spriteSource = null;
        if (mode === "sprites") {
          spriteSource = applyLayerAlpha(layerContexts[1].getImageData(0, 0, Core.WIDTH, Core.HEIGHT), state.layerVisible[1] ? state.layerOpacity[1] : 0);
          sprites = Core.quantizeSprites(spriteSource.data, background.universal, options);
        }
        state.conversion = { background, sprites, spriteSource, mode, preview: null, rom: null };
        rebuildPreview();
        state.dirty = false;
        state.outputSelection = null;
        $("#dirtyStatus").textContent = "ROM生成可能";
        $("#dirtyStatus").style.color = "var(--success)";
        $("#paletteEditBadge").textContent = "クリックで編集";
        renderPaletteGroups();
        updateDiagnostics();
        setView("nes");
        toast("NES形式への変換が完了しました");
      } catch (error) {
        console.error(error);
        toast(`変換エラー: ${error.message}`);
      } finally {
        button.disabled = false;
        button.textContent = "NES形式に変換";
      }
    });
  }

  function rebuildPreview() {
    const conversion = state.conversion;
    if (!conversion) return;
    const backgroundPreview = Core.renderBackground(conversion.background);
    conversion.preview = conversion.sprites
      ? Core.renderSprites(backgroundPreview, conversion.sprites, conversion.spriteSource.data)
      : backgroundPreview;
    conversion.rom = Core.buildRom(conversion.background, conversion.sprites);
    render();
  }

  function updateDiagnostics() {
    const conversion = state.conversion;
    const tiles = conversion.background.tiles;
    const sprites = conversion.sprites;
    $("#tileMetric").textContent = `${tiles.storedCount} / 256`;
    $("#spriteMetric").textContent = `${sprites ? sprites.spriteCount : 0} / 64`;
    $("#scanlineMetric").textContent = `${sprites ? sprites.maxPerScanline : 0} / 8`;
    const diagnostics = [];
    let severity = "ok";
    if (tiles.approximatedCount) {
      diagnostics.push({ type: "warn", text: `異なる背景タイルが${tiles.uniqueCount}種類あります。超過した${tiles.approximatedCount}種類を近いタイルへ自動統合しました。` });
      severity = "warn";
    } else diagnostics.push({ type: "ok", text: `背景タイルは${tiles.uniqueCount}種類で、256種類の上限内です。` });
    if (sprites) {
      if (sprites.omittedCount) {
        diagnostics.push({ type: "error", text: `スプライトが64枚を超え、${sprites.omittedCount}枚はROMに入りません。上レイヤーを減らすか背景統合を選んでください。` });
        severity = "error";
      } else diagnostics.push({ type: "ok", text: `スプライトは${sprites.spriteCount}枚で、全画面64枚の上限内です。` });
      if (sprites.maxPerScanline > 8) {
        diagnostics.push({ type: "warn", text: `同じ走査線に最大${sprites.maxPerScanline}枚あります。実機では9枚目以降がちらつくか消えます。` });
        if (severity === "ok") severity = "warn";
      } else diagnostics.push({ type: "ok", text: `走査線あたり最大${sprites.maxPerScanline}枚で、8枚の上限内です。` });
    } else diagnostics.push({ type: "ok", text: "上側レイヤーは背景に統合済みです。スプライト制限の影響を受けません。" });
    diagnostics.push({ type: "ok", text: "Mapper 0・24 KiB（ヘッダー除く）のiNES ROMを生成しました。" });
    $("#diagnosticList").innerHTML = diagnostics.map((item) => `<p class="diagnostic ${item.type}">${item.text}</p>`).join("");
    const badge = $("#romBadge");
    badge.className = `status-badge ${severity}`;
    badge.textContent = severity === "ok" ? "READY" : severity === "warn" ? "CHECK" : "LIMIT";
  }

  function downloadRom() {
    if (!state.conversion || state.dirty) {
      convert();
      toast("変換後、もう一度ROM書き出しを押してください");
      return;
    }
    const blob = new Blob([state.conversion.rom], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nes-picture.nes";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("nes-picture.nes を書き出しました");
  }

  function bindEvents() {
    $$(".layer-tab").forEach((button) => button.addEventListener("click", () => {
      state.activeLayer = Number(button.dataset.layer);
      $$(".layer-tab").forEach((item) => item.classList.toggle("active", item === button));
      $("#layerOpacity").value = Math.round(state.layerOpacity[state.activeLayer] * 100);
      showPrepResult();
      showEdgeResult();
      render();
    }));
    $$(".tool-button").forEach((button) => button.addEventListener("click", () => setTool(button.dataset.tool)));
    $$(".view-tab").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    $("#brushSize").addEventListener("change", (event) => { state.brushSize = Number(event.target.value); });
    $("#edgeStrength").addEventListener("input", (event) => { $("#edgeStrengthValue").textContent = `${event.target.value}%`; });
    $("#enhanceEdgesButton").addEventListener("click", enhanceActiveLayerEdges);
    $("#optimizeColorsButton").addEventListener("click", optimizeActiveLayerColors);
    $("#layerOpacity").addEventListener("input", (event) => { state.layerOpacity[state.activeLayer] = Number(event.target.value) / 100; markDirty(); render(); });
    $("#showLayer1").addEventListener("change", (event) => { state.layerVisible[0] = event.target.checked; markDirty(); render(); });
    $("#showLayer2").addEventListener("change", (event) => { state.layerVisible[1] = event.target.checked; markDirty(); render(); });
    $("#showGrid").addEventListener("change", (event) => { gridCanvas.style.display = event.target.checked ? "block" : "none"; });
    $("#showLoupe").addEventListener("change", (event) => {
      state.loupeEnabled = event.target.checked;
      if (!state.loupeEnabled) hideLoupe();
      else toast("編集キャンバス上へカーソルを移動するとルーペを表示します");
    });
    $("#loupeZoom").addEventListener("change", (event) => { state.loupeZoom = Number(event.target.value); });
    $("#ditherStrength").addEventListener("input", (event) => { $("#ditherValue").textContent = `${event.target.value}%`; markDirty(); });
    $("#ditherMode").addEventListener("change", markDirty);
    $("#overlayMode").addEventListener("change", markDirty);
    $("#imageInput").addEventListener("change", (event) => loadImageFile(event.target.files[0]));
    $("#clearLayerButton").addEventListener("click", () => {
      snapshot();
      layerContexts[state.activeLayer].clearRect(0, 0, Core.WIDTH, Core.HEIGHT);
      clearActivePrepResult();
      clearActiveEdgeResult();
      state.hasImported = hasVisiblePixels();
      updateEmptyGuide(); markDirty(); render();
    });
    $("#undoButton").addEventListener("click", restoreSnapshot);
    $("#convertButton").addEventListener("click", convert);
    $("#downloadRomButton").addEventListener("click", downloadRom);
    mainCanvas.addEventListener("pointerdown", beginDrawing);
    mainCanvas.addEventListener("pointermove", moveDrawing);
    mainCanvas.addEventListener("pointerup", endDrawing);
    mainCanvas.addEventListener("pointercancel", endDrawing);
    mainCanvas.addEventListener("pointerleave", () => { $("#cursorStatus").textContent = "x: -- / y: --"; hideLoupe(); });
    const drop = $("#fileDrop");
    ["dragenter", "dragover"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove("drag"); }));
    drop.addEventListener("drop", (event) => loadImageFile(event.dataTransfer.files[0]));
    window.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); restoreSnapshot(); }
    });
  }

  function initialize() {
    makeMasterPalette();
    drawGrid();
    bindEvents();
    $("#undoButton").disabled = true;
    renderPaletteGroups();
    render();
    updateEmptyGuide();
    window.NesPictureStudio = { state, convert, layers, compose };
  }

  initialize();
})();
