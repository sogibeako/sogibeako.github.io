/**
 * 四角タイルジェネレーター - Main Script
 */

const AppState = {
  cells: [], // length 16, a-p
  pattern: [], // parsed 2D array of cell IDs
  customOffsets: { row: null, col: null },
  settings: {
    repeatX: 4,
    repeatY: 4,
    outputRotation: 0,
    offsetMode: 'none',
    offsetPercent: 50,
    offsetLoop: false,
    aspectW: 1,
    aspectH: 1,
    fitMode: 'cover',
    grout: {
      enabled: true,
      seamless: false,
      width: 4,
      color: '#cccccc',
      double: false,
      outerW: 2,
      outerC: '#888888',
      innerW: 1,
      innerC: '#ffffff'
    }
  }
};

const CropState = {
  isOpen: false,
  cellId: null,
  viewMode: 'full', // 'full' or 'crop'
  zoom: 1.0,
  panX: 0,
  panY: 0,
  rect: { x: 0, y: 0, w: 0, h: 0 },
  img: null,
  isDragging: false,
  isPanning: false,
  dragMode: null, // 'new', 'move', 't', 'b', 'l', 'r', 'tl', 'tr', 'bl', 'br'
  activeSelection: null,
  startX: 0, startY: 0,
  startRect: null,
  startPan: {x:0, y:0}
};

const UI = {
  cellList: document.getElementById('cell-list'),
  tplCell: document.getElementById('tpl-cell'),
  btnRow: document.getElementById('helper-buttons-row'),
  patternInput: document.getElementById('pattern-input'),
  patternError: document.getElementById('pattern-error'),
  previewCanvas: document.getElementById('preview-canvas'),
  statSize: document.getElementById('stat-size'),
  statRam: document.getElementById('stat-ram')
};

const CELL_IDS = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p'];

// ==========================================
// Initialization
// ==========================================
function init() {
  initCells();
  initHelpers();
  initCropModal();
  bindEvents();
  parsePattern(); // Make sure initial textarea content is parsed
  updateUIFromState(); // Sync UI with default AppState
  requestUpdate();
}

// ==========================================
// Crop Modal Logic
// ==========================================
function initCropModal() {
  const modal = document.getElementById('crop-modal');
  const canvas = document.getElementById('crop-canvas');
  
  document.querySelector('.btn-close-modal').addEventListener('click', closeCropModal);
  document.getElementById('btn-crop-cancel').addEventListener('click', closeCropModal);
  
  document.getElementById('btn-crop-save').addEventListener('click', () => {
    if(CropState.cellId && CropState.img) {
      const cell = AppState.cells.find(c => c.id === CropState.cellId);
      
      let finalX = Math.round(Math.min(CropState.rect.x, CropState.rect.x + CropState.rect.w));
      let finalY = Math.round(Math.min(CropState.rect.y, CropState.rect.y + CropState.rect.h));
      let finalW = Math.round(Math.abs(CropState.rect.w));
      let finalH = Math.round(Math.abs(CropState.rect.h));
      
      if (finalW < 10) finalW = 10;
      if (finalH < 10) finalH = 10;
      if (finalX < 0) finalX = 0;
      if (finalY < 0) finalY = 0;
      if (finalX + finalW > CropState.img.width) finalW = CropState.img.width - finalX;
      if (finalY + finalH > CropState.img.height) finalH = CropState.img.height - finalY;
      
      cell.crop = { x: finalX, y: finalY, w: finalW, h: finalH };
      processCellImageCache(cell.id);
    }
    closeCropModal();
  });
  
  document.getElementById('btn-crop-mode-toggle').addEventListener('click', (e) => {
    CropState.viewMode = CropState.viewMode === 'full' ? 'crop' : 'full';
    e.target.textContent = CropState.viewMode === 'full' ? '表示切替：全体' : '表示切替：枠内のみ';
    
    if (CropState.viewMode === 'crop') {
        const cw = CropState.img.width;
        const ch = CropState.img.height;
        const cwZoom = Math.max(1, (document.getElementById('crop-container').clientWidth - 40) / CropState.rect.w);
        const chZoom = Math.max(1, (document.getElementById('crop-container').clientHeight - 40) / CropState.rect.h);
        CropState.zoom = Math.min(cwZoom, chZoom);
        
        CropState.panX = -CropState.rect.x * CropState.zoom + (document.getElementById('crop-container').clientWidth - CropState.rect.w * CropState.zoom) / 2;
        CropState.panY = -CropState.rect.y * CropState.zoom + (document.getElementById('crop-container').clientHeight - CropState.rect.h * CropState.zoom) / 2;
    } else {
        resetCropView();
    }
    
    drawCropCanvas();
  });
  
  // Canvas Mouse Events
  canvas.addEventListener('mousedown', onCropMouseDown);
  window.addEventListener('mousemove', onCropMouseMove);
  window.addEventListener('mouseup', onCropMouseUp);
  
  document.getElementById('crop-container').addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomAmount = 0.1;
    const oldZoom = CropState.zoom;
    
    if (e.deltaY < 0) {
      CropState.zoom = Math.min(10.0, CropState.zoom + zoomAmount);
    } else {
      CropState.zoom = Math.max(0.05, CropState.zoom - zoomAmount);
    }
    
    // Zoom around center of container
    const container = document.getElementById('crop-container');
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    
    const scaleDiff = CropState.zoom / oldZoom;
    CropState.panX = cx - (cx - CropState.panX) * scaleDiff;
    CropState.panY = cy - (cy - CropState.panY) * scaleDiff;
    
    drawCropCanvas();
  });
  
  window.addEventListener('keydown', (e) => {
    if (!CropState.isOpen || !CropState.activeSelection || CropState.isDragging || CropState.isPanning) return;
    
    let dx = 0, dy = 0;
    const step = e.shiftKey ? 10 : 1;
    
    if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else return;
    
    e.preventDefault();
    
    let sr = { ...CropState.rect };
    
    if (CropState.activeSelection === 'move') {
       sr.x += dx;
       sr.y += dy;
    } else {
       if (CropState.activeSelection.includes('l')) { sr.x += dx; sr.w -= dx; }
       if (CropState.activeSelection.includes('r')) { sr.w += dx; }
       if (CropState.activeSelection.includes('t')) { sr.y += dy; sr.h -= dy; }
       if (CropState.activeSelection.includes('b')) { sr.h += dy; }
    }
    
    // Sanitize
    let nx = Math.min(sr.x, sr.x + sr.w);
    let ny = Math.min(sr.y, sr.y + sr.h);
    let nw = Math.abs(sr.w);
    let nh = Math.abs(sr.h);
    
    if (nw < 1) nw = 1;
    if (nh < 1) nh = 1;
    
    if (CropState.activeSelection === 'move') {
      if (nx < 0) nx = 0;
      if (ny < 0) ny = 0;
      if (nx + nw > CropState.img.width) nx = CropState.img.width - nw;
      if (ny + nh > CropState.img.height) ny = CropState.img.height - nh;
    } else {
      if (nx < 0) { nw += nx; nx = 0; }
      if (ny < 0) { nh += ny; ny = 0; }
      if (nx + nw > CropState.img.width) nw = CropState.img.width - nx;
      if (ny + nh > CropState.img.height) nh = CropState.img.height - ny;
    }
    
    CropState.rect = { x: nx, y: ny, w: nw, h: nh };
    
    // Automatically redraw Crop if in Crop mode to update zoom
    if (CropState.viewMode === 'crop') {
        const cwZoom = Math.max(1, (document.getElementById('crop-container').clientWidth - 40) / CropState.rect.w);
        const chZoom = Math.max(1, (document.getElementById('crop-container').clientHeight - 40) / CropState.rect.h);
        CropState.zoom = Math.min(cwZoom, chZoom);
        CropState.panX = -CropState.rect.x * CropState.zoom + (document.getElementById('crop-container').clientWidth - CropState.rect.w * CropState.zoom) / 2;
        CropState.panY = -CropState.rect.y * CropState.zoom + (document.getElementById('crop-container').clientHeight - CropState.rect.h * CropState.zoom) / 2;
    }
    
    drawCropCanvas();
  });
}

function resetCropView() {
    const container = document.getElementById('crop-container');
    const pad = 40;
    const scaleW = (container.clientWidth - pad) / CropState.img.width;
    const scaleH = (container.clientHeight - pad) / CropState.img.height;
    
    CropState.zoom = Math.min(1, scaleW, scaleH);
    CropState.panX = (container.clientWidth - CropState.img.width * CropState.zoom) / 2;
    CropState.panY = (container.clientHeight - CropState.img.height * CropState.zoom) / 2;
}

function openCropModal(cellId) {
  const cell = AppState.cells.find(c => c.id === cellId);
  if (!cell || !cell.hasImage) return;
  
  CropState.isOpen = true;
  CropState.cellId = cellId;
  CropState.img = cell.originalImg;
  CropState.rect = { ...cell.crop };
  CropState.viewMode = 'full';
  document.getElementById('btn-crop-mode-toggle').textContent = '表示切替：全体';
  
  const modal = document.getElementById('crop-modal');
  modal.style.display = 'flex';
  
  // Set logical size to match container for easier drawing
  const canvas = document.getElementById('crop-canvas');
  const container = document.getElementById('crop-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  resetCropView();
  drawCropCanvas();
}

function closeCropModal() {
  CropState.isOpen = false;
  document.getElementById('crop-modal').style.display = 'none';
}

function onCropMouseDown(e) {
  if (!CropState.isOpen || !CropState.img) return;
  
  // Right click => Panning
  if (e.button === 2) {
    CropState.isPanning = true;
    CropState.startPan = { x: e.clientX - CropState.panX, y: e.clientY - CropState.panY };
    return;
  }
  
  if (e.button !== 0 || CropState.viewMode !== 'full') return;
  
  const pos = getCropMousePos(e);
  CropState.isDragging = true;
  CropState.startX = pos.x;
  CropState.startY = pos.y;
  
  const r = CropState.rect;
  const rX = Math.min(r.x, r.x + r.w);
  const rY = Math.min(r.y, r.y + r.h);
  const rW = Math.abs(r.w);
  const rH = Math.abs(r.h);
  
  const hit = 12 / CropState.zoom; // hit detection radius
  
  if (Math.abs(pos.x - rX) < hit && Math.abs(pos.y - rY) < hit) CropState.dragMode = 'tl';
  else if (Math.abs(pos.x - (rX + rW)) < hit && Math.abs(pos.y - rY) < hit) CropState.dragMode = 'tr';
  else if (Math.abs(pos.x - rX) < hit && Math.abs(pos.y - (rY + rH)) < hit) CropState.dragMode = 'bl';
  else if (Math.abs(pos.x - (rX + rW)) < hit && Math.abs(pos.y - (rY + rH)) < hit) CropState.dragMode = 'br';
  else if (Math.abs(pos.y - rY) < hit && pos.x >= rX && pos.x <= rX + rW) CropState.dragMode = 't';
  else if (Math.abs(pos.y - (rY + rH)) < hit && pos.x >= rX && pos.x <= rX + rW) CropState.dragMode = 'b';
  else if (Math.abs(pos.x - rX) < hit && pos.y >= rY && pos.y <= rY + rH) CropState.dragMode = 'l';
  else if (Math.abs(pos.x - (rX + rW)) < hit && pos.y >= rY && pos.y <= rY + rH) CropState.dragMode = 'r';
  else if (pos.x > rX && pos.x < rX + rW && pos.y > rY && pos.y < rY + rH) {
    CropState.dragMode = 'move';
  } else {
    CropState.dragMode = 'new';
    CropState.rect = { x: pos.x, y: pos.y, w: 0, h: 0 };
  }
  
  CropState.activeSelection = CropState.dragMode !== 'new' ? CropState.dragMode : null;
  CropState.startRect = { ...r };
  drawCropCanvas(); // Show selection highlight
}

function onCropMouseMove(e) {
  if (!CropState.isOpen || !CropState.img) return;
  
  if (CropState.isPanning) {
    CropState.panX = e.clientX - CropState.startPan.x;
    CropState.panY = e.clientY - CropState.startPan.y;
    drawCropCanvas();
    return;
  }
  
  if (!CropState.isDragging || CropState.viewMode !== 'full') return;
  
  const pos = getCropMousePos(e);
  
  if (CropState.dragMode === 'new') {
    CropState.rect.w = pos.x - CropState.startX;
    CropState.rect.h = pos.y - CropState.startY;
  } else if (CropState.dragMode === 'move') {
    const dx = pos.x - CropState.startX;
    const dy = pos.y - CropState.startY;
    CropState.rect.x = CropState.startRect.x + dx;
    CropState.rect.y = CropState.startRect.y + dy;
  } else if (CropState.dragMode) {
    // Edge/Corner resize
    const dx = pos.x - CropState.startX;
    const dy = pos.y - CropState.startY;
    let sr = CropState.startRect;
    let nx = sr.x, ny = sr.y, nw = sr.w, nh = sr.h;
    
    if (CropState.dragMode.includes('l')) { nx += dx; nw -= dx; }
    if (CropState.dragMode.includes('r')) { nw += dx; }
    if (CropState.dragMode.includes('t')) { ny += dy; nh -= dy; }
    if (CropState.dragMode.includes('b')) { nh += dy; }
    
    CropState.rect = { x: nx, y: ny, w: nw, h: nh };
  }
  
  drawCropCanvas();
}

function onCropMouseUp(e) {
  if (e.button === 2) {
    CropState.isPanning = false;
    return;
  }
  
  if (CropState.isDragging) {
    CropState.isDragging = false;
    CropState.dragMode = null;
    
    // Normalize rect to have positive w and h
    let finalX = Math.min(CropState.rect.x, CropState.rect.x + CropState.rect.w);
    let finalY = Math.min(CropState.rect.y, CropState.rect.y + CropState.rect.h);
    let finalW = Math.abs(CropState.rect.w);
    let finalH = Math.abs(CropState.rect.h);
    
    if (finalW < 1) finalW = 1;
    if (finalH < 1) finalH = 1;
    
    if (CropState.activeSelection === 'move') {
      if (finalX < 0) finalX = 0;
      if (finalY < 0) finalY = 0;
      if (finalX + finalW > CropState.img.width) finalX = CropState.img.width - finalW;
      if (finalY + finalH > CropState.img.height) finalY = CropState.img.height - finalH;
    } else {
      if (finalX < 0) { finalW += finalX; finalX = 0; }
      if (finalY < 0) { finalH += finalY; finalY = 0; }
      if (finalX + finalW > CropState.img.width) finalW = CropState.img.width - finalX;
      if (finalY + finalH > CropState.img.height) finalH = CropState.img.height - finalY;
    }
    
    CropState.rect = { x: finalX, y: finalY, w: finalW, h: finalH };
    drawCropCanvas();
  }
}

function getCropMousePos(e) {
  const canvas = document.getElementById('crop-canvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: ((e.clientX - rect.left) * scaleX - CropState.panX) / CropState.zoom,
    y: ((e.clientY - rect.top) * scaleY - CropState.panY) / CropState.zoom
  };
}

function drawCropCanvas() {
  if (!CropState.isOpen || !CropState.img) return;
  const canvas = document.getElementById('crop-canvas');
  const ctx = canvas.getContext('2d');
  
  // Re-sync canvas logical size just in case container resized
  const container = document.getElementById('crop-container');
  if(canvas.width !== container.clientWidth) canvas.width = container.clientWidth;
  if(canvas.height !== container.clientHeight) canvas.height = container.clientHeight;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(CropState.panX, CropState.panY);
  ctx.scale(CropState.zoom, CropState.zoom);
  
  let rx = Math.min(CropState.rect.x, CropState.rect.x + CropState.rect.w);
  let ry = Math.min(CropState.rect.y, CropState.rect.y + CropState.rect.h);
  let rw = Math.abs(CropState.rect.w);
  let rh = Math.abs(CropState.rect.h);
  
  if (CropState.viewMode === 'crop') {
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
  }
  
  // Draw base image
  ctx.drawImage(CropState.img, 0, 0);
  
  if (CropState.viewMode === 'full') {
    // Draw semi-transparent dim over outside
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.rect(0, 0, CropState.img.width, CropState.img.height);
    if (rw > 0 && rh > 0) {
      // Cut out the crop rect from dim
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx, ry + rh);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.lineTo(rx + rw, ry);
      ctx.lineTo(rx, ry);
    }
    ctx.fill('evenodd');
    
    // Draw border
    ctx.strokeStyle = CropState.activeSelection === 'move' ? '#5cf082' : '#4a90e2';
    ctx.lineWidth = 2 / CropState.zoom;
    ctx.strokeRect(rx, ry, rw, rh);
    
    // Highlight specific edges if selected
    if (CropState.activeSelection && CropState.activeSelection !== 'move') {
        ctx.strokeStyle = '#5cf082';
        ctx.lineWidth = 3 / CropState.zoom;
        ctx.beginPath();
        if (CropState.activeSelection.includes('t')) { ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry); }
        if (CropState.activeSelection.includes('b')) { ctx.moveTo(rx, ry + rh); ctx.lineTo(rx + rw, ry + rh); }
        if (CropState.activeSelection.includes('l')) { ctx.moveTo(rx, ry); ctx.lineTo(rx, ry + rh); }
        if (CropState.activeSelection.includes('r')) { ctx.moveTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + rh); }
        ctx.stroke();
    }
    
    // Draw corner handles
    const hs = 8 / CropState.zoom;
    const fillStyleNormal = '#fff';
    const fillStyleActive = '#5cf082';
    
    ctx.fillStyle = CropState.activeSelection === 'tl' ? fillStyleActive : fillStyleNormal;
    ctx.fillRect(rx - hs/2, ry - hs/2, hs, hs);
    
    ctx.fillStyle = CropState.activeSelection === 'tr' ? fillStyleActive : fillStyleNormal;
    ctx.fillRect(rx + rw - hs/2, ry - hs/2, hs, hs);
    
    ctx.fillStyle = CropState.activeSelection === 'bl' ? fillStyleActive : fillStyleNormal;
    ctx.fillRect(rx - hs/2, ry + rh - hs/2, hs, hs);
    
    ctx.fillStyle = CropState.activeSelection === 'br' ? fillStyleActive : fillStyleNormal;
    ctx.fillRect(rx + rw - hs/2, ry + rh - hs/2, hs, hs);
  }
  
  ctx.restore();
}

// Ensure context menu doesn't show up on right click in crop canvas
document.addEventListener('DOMContentLoaded', () => {
    const cc = document.getElementById('crop-canvas');
    if(cc) cc.addEventListener('contextmenu', e => e.preventDefault());
});

function initCells() {
  UI.cellList.innerHTML = '';
  CELL_IDS.forEach(id => {
    AppState.cells.push({
      id: id,
      originalImg: null, // HTMLImageElement
      hasImage: false,
      crop: { x: 0, y: 0, w: 0, h: 0 },
      transform: { rotate: 0, flip: 'none' },
      color: { hue: 0, sat: 0, bri: 0 },
      cachedCanvas: document.createElement('canvas'), // オフスクリーンキャッシュ
    });

    // UI作成
    const clone = UI.tplCell.content.cloneNode(true);
    const item = clone.querySelector('.cell-item');
    item.dataset.id = id;
    item.classList.add('is-empty');
    item.querySelector('.cell-badge').textContent = id;
    
    // イベントバインド等
    const fileInput = item.querySelector('.cell-file');
    fileInput.addEventListener('change', (e) => handleImageUpload(e, id));
    
    const btnClear = item.querySelector('.btn-clear-cell');
    btnClear.addEventListener('click', () => clearCell(id));
    
    const btnCrop = item.querySelector('.btn-crop-cell');
    btnCrop.addEventListener('click', () => openCropModal(id));

    // 各種設定の変更イベント
    const controls = ['rot', 'flip', 'hue', 'sat', 'bri'];
    controls.forEach(ctrl => {
      const el = item.querySelector(`.ctrl-${ctrl}`);
      el.addEventListener('input', () => {
        updateCellData(id, item);
      });
    });

    const btnResetColor = item.querySelector('.btn-reset-color');
    btnResetColor.addEventListener('click', () => {
      item.querySelector('.ctrl-hue').value = 0;
      item.querySelector('.ctrl-sat').value = 0;
      item.querySelector('.ctrl-bri').value = 0;
      updateCellData(id, item);
    });

    UI.cellList.appendChild(item);
  });
}

function initHelpers() {
  UI.btnRow.innerHTML = '';
  CELL_IDS.forEach(id => {
    const btn = document.createElement('button');
    btn.className = 'helper-btn';
    btn.textContent = id;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      const ta = UI.patternInput;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      ta.value = val.substring(0, start) + id + " " + val.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      ta.focus();
      parsePattern();
    });
    UI.btnRow.appendChild(btn);
  });
  
  // テンプレートボタン
  document.querySelectorAll('.btn-template').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.target.dataset.template;
      if (type === '2x2') UI.patternInput.value = "a b\nb a";
      if (type === '4x4') UI.patternInput.value = "a b a b\nb a b a\na b a b\nb a b a";
      if (type === 'alternating') UI.patternInput.value = "a b\nc d";
      parsePattern();
    });
  });
  
  // Custom Offset helpers
  document.getElementById('pattern-input').placeholder = "例: a b 25\nまたは列ズレなら:\na b\n25 -25";
}

function bindEvents() {
  UI.patternInput.addEventListener('input', parsePattern);
  
  // Settings change events
  const settingIds = [
    'repeat-x', 'repeat-y', 'output-rotation', 'offset-mode', 'offset-percent', 'offset-loop',
    'aspect-w', 'aspect-h', 'fit-mode',
    'grout-enabled', 'grout-seamless', 'grout-width', 'grout-color', 
    'grout-double', 'grout-outer-w', 'grout-outer-c', 'grout-inner-w', 'grout-inner-c'
  ];
  
  settingIds.forEach(sid => {
    const el = document.getElementById(`setting-${sid}`);
    if(el) {
      el.addEventListener('input', updateSettings);
      el.addEventListener('change', updateSettings);
    }
  });

  // Grout UI toggle
  document.getElementById('setting-grout-enabled').addEventListener('change', (e) => {
    document.getElementById('grout-settings-wrapper').style.opacity = e.target.checked ? '1' : '0.5';
    document.getElementById('grout-settings-wrapper').style.pointerEvents = e.target.checked ? 'auto' : 'none';
  });

  document.getElementById('setting-grout-double').addEventListener('change', (e) => {
    document.getElementById('double-grout-wrapper').style.opacity = e.target.checked ? '1' : '0.5';
    document.getElementById('double-grout-wrapper').style.pointerEvents = e.target.checked ? 'auto' : 'none';
  });
  
  // Update display values
  document.getElementById('setting-offset-percent').addEventListener('input', e => {
    document.getElementById('val-offset-percent').textContent = e.target.value + '%';
  });
  document.getElementById('setting-grout-width').addEventListener('input', e => {
    document.getElementById('val-grout-width').textContent = e.target.value + 'px';
  });
}

// ==========================================
// Image & Cell Handlers
// ==========================================
function handleImageUpload(e, cellId) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const cell = AppState.cells.find(c => c.id === cellId);
      
      cell.originalImg = img;
      cell.hasImage = true;
      
      // Init crop to center max square
      const minDimension = Math.min(img.width, img.height);
      const sx = (img.width - minDimension) / 2;
      const sy = (img.height - minDimension) / 2;
      cell.crop = { x: sx, y: sy, w: minDimension, h: minDimension };
      
      const itemDom = UI.cellList.querySelector(`.cell-item[data-id="${cellId}"]`);
      itemDom.classList.remove('is-empty');
      itemDom.querySelector('.empty-state').style.display = 'none';
      itemDom.querySelector('.cell-thumb-canvas').style.display = 'block';
      itemDom.querySelector('.btn-crop-cell').disabled = false;
      
      processCellImageCache(cellId);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function clearCell(cellId) {
  const cell = AppState.cells.find(c => c.id === cellId);
  cell.originalImg = null;
  cell.hasImage = false;
  
  const itemDom = UI.cellList.querySelector(`.cell-item[data-id="${cellId}"]`);
  itemDom.classList.add('is-empty');
  itemDom.querySelector('.empty-state').style.display = 'block';
  itemDom.querySelector('.btn-crop-cell').disabled = true;
  const thumb = itemDom.querySelector('.cell-thumb-canvas');
  thumb.style.display = 'none';
  const ctx = thumb.getContext('2d');
  ctx.clearRect(0,0, thumb.width, thumb.height);
  
  requestUpdate();
}

function updateCellData(cellId, itemDom) {
  const cell = AppState.cells.find(c => c.id === cellId);
  cell.transform.rotate = parseInt(itemDom.querySelector('.ctrl-rot').value);
  cell.transform.flip = itemDom.querySelector('.ctrl-flip').value;
  cell.color.hue = parseInt(itemDom.querySelector('.ctrl-hue').value);
  cell.color.sat = parseInt(itemDom.querySelector('.ctrl-sat').value);
  cell.color.bri = parseInt(itemDom.querySelector('.ctrl-bri').value);
  
  processCellImageCache(cellId);
}

function processCellImageCache(cellId) {
  const cell = AppState.cells.find(c => c.id === cellId);
  if (!cell.hasImage || !cell.originalImg) return;

  const CSIZE = 512;
  cell.cachedCanvas.width = CSIZE;
  cell.cachedCanvas.height = CSIZE;
  const ctx = cell.cachedCanvas.getContext('2d');
  
  const tr = cell.transform;
  const cl = cell.color;
  
  ctx.save();
  ctx.clearRect(0, 0, CSIZE, CSIZE);
  
  // Transform
  ctx.translate(CSIZE/2, CSIZE/2);
  ctx.rotate(tr.rotate * Math.PI / 180);
  
  let scaleX = 1, scaleY = 1;
  if(tr.flip === 'x' || tr.flip === 'xy') scaleX = -1;
  if(tr.flip === 'y' || tr.flip === 'xy') scaleY = -1;
  ctx.scale(scaleX, scaleY);
  
  // Color Filters
  let filters = [];
  if(cl.hue !== 0) filters.push(`hue-rotate(${cl.hue}deg)`);
  if(cl.sat !== 0) {
    const satVal = cl.sat > 0 ? 100 + cl.sat : 100 + cl.sat; // 0-200% map
    filters.push(`saturate(${100 + cl.sat}%)`);
  }
  if(cl.bri !== 0) {
    filters.push(`brightness(${100 + cl.bri}%)`);
  }
  
  if(filters.length > 0) {
    ctx.filter = filters.join(' ');
  }
  
  // Draw (using crop box)
  if (cell.crop) {
    ctx.drawImage(cell.originalImg, cell.crop.x, cell.crop.y, cell.crop.w, cell.crop.h, -CSIZE/2, -CSIZE/2, CSIZE, CSIZE);
  } else {
    ctx.drawImage(cell.originalImg, -CSIZE/2, -CSIZE/2, CSIZE, CSIZE);
  }
  ctx.restore();
  
  // Update Thumbnail
  const itemDom = UI.cellList.querySelector(`.cell-item[data-id="${cellId}"]`);
  const thumbCtx = itemDom.querySelector('.cell-thumb-canvas').getContext('2d');
  thumbCtx.clearRect(0, 0, 64, 64);
  thumbCtx.drawImage(cell.cachedCanvas, 0, 0, 64, 64);
  
  requestUpdate();
}

// ==========================================
// Settings & Logic
// ==========================================
function parsePattern() {
  const text = UI.patternInput.value.trim();
  UI.patternError.textContent = '';
  
  if(!text) {
    AppState.pattern = [];
    AppState.customOffsets = { row: null, col: null };
    requestUpdate();
    return;
  }
  
  const lines = text.split('\n');
  let newPattern = [];
  let colCount = -1;
  
  let rowOffsets = [];
  let colOffsets = [];
  let hasRowOffsets = false;
  let hasColOffsets = false;
  
  for(let i=0; i<lines.length; i++) {
    const line = lines[i].trim();
    if(!line) continue;
    
    // 全角スペース対応、連続スペース除去
    const tokens = line.replace(/　/g, ' ').split(/\s+/);
    
    // Check if line is completely numbers (Column offsets)
    const allNumbers = tokens.every(t => t !== '' && !isNaN(parseFloat(t)) && isFinite(t));
    if (allNumbers && tokens.length > 0) {
        if(hasRowOffsets) {
            UI.patternError.textContent = `エラー: 行ズレと列ズレの個別指定は同時設定できません。`;
            return;
        }
        colOffsets = tokens.map(t => parseFloat(t));
        hasColOffsets = true;
        continue;
    }
    
    // Check if last token is number (Row offset)
    let rOff = 0;
    if (tokens.length > 1) {
        const lastToken = tokens[tokens.length - 1];
        if (!isNaN(parseFloat(lastToken)) && isFinite(lastToken) && !CELL_IDS.includes(lastToken)) {
            if(hasColOffsets) {
                UI.patternError.textContent = `エラー: 行ズレと列ズレの個別指定は同時設定できません。`;
                return;
            }
            rOff = parseFloat(tokens.pop());
            hasRowOffsets = true;
        }
    }
    rowOffsets.push(rOff);
    
    if (colCount === -1) {
      colCount = tokens.length;
    } else if (tokens.length !== colCount) {
      UI.patternError.textContent = `エラー: ${i+1}行目の列数が一致しません。すべて ${colCount} 列にしてください。`;
      return;
    }
    
    for(let t of tokens) {
      if(!CELL_IDS.includes(t)) {
         UI.patternError.textContent = `エラー: 不明な記号 '${t}' があります。a〜pのみ使用可能です。`;
         return;
      }
    }
    newPattern.push(tokens);
  }
  
  // Validate colOffsets length if provided
  if (hasColOffsets && colOffsets.length !== colCount) {
      UI.patternError.textContent = `エラー: 列ズレ指定の数 (${colOffsets.length}) が列数 (${colCount}) と一致しません。`;
      return;
  }
  
  AppState.pattern = newPattern;
  AppState.customOffsets = { row: hasRowOffsets ? rowOffsets : null, col: hasColOffsets ? colOffsets : null };
  requestUpdate();
}

function updateSettings() {
  const s = AppState.settings;
  const getInt = (id) => parseInt(document.getElementById(`setting-${id}`).value) || 0;
  
  s.repeatX = Math.max(1, getInt('repeat-x'));
  s.repeatY = Math.max(1, getInt('repeat-y'));
  s.outputRotation = getInt('output-rotation');
  s.offsetMode = document.getElementById('setting-offset-mode').value;
  s.offsetPercent = getInt('offset-percent');
  s.offsetLoop = document.getElementById('setting-offset-loop').checked;
  
  s.aspectW = Math.max(1, getInt('aspect-w'));
  s.aspectH = Math.max(1, getInt('aspect-h'));
  s.fitMode = document.getElementById('setting-fit-mode').value;
  
  const g = s.grout;
  g.enabled = document.getElementById('setting-grout-enabled').checked;
  g.seamless = document.getElementById('setting-grout-seamless').checked;
  g.width = getInt('grout-width');
  g.color = document.getElementById('setting-grout-color').value;
  g.double = document.getElementById('setting-grout-double').checked;
  g.outerW = getInt('grout-outer-w');
  g.outerC = document.getElementById('setting-grout-outer-c').value;
  g.innerW = getInt('grout-inner-w');
  g.innerC = document.getElementById('setting-grout-inner-c').value;
  
  requestUpdate();
}

// ==========================================
// Rendering
// ==========================================
let updateTimer = null;
function requestUpdate() {
  // デバウンス処理
  if (updateTimer) clearTimeout(updateTimer);
  updateTimer = setTimeout(renderPreview, 50);
}

function renderPreview() {
  renderCanvas(UI.previewCanvas, 1024, false); // For preview (max 1024)
}

function processFullRender() {
  const exportSize = parseInt(document.getElementById('export-size').value) || 2048;
  const exportScale = parseFloat(document.getElementById('export-scale').value) || 1.0;
  const targetSize = Math.round(exportSize * exportScale);
  const canvas = document.createElement('canvas'); // Offscreen for full resolution export
  renderCanvas(canvas, targetSize, true);
  return canvas;
}

function renderCanvas(targetCanvas, targetMaxSize, isExport) {
  const s = AppState.settings;
  const pattern = AppState.pattern;
  
  if(pattern.length === 0) {
    const ctx = targetCanvas.getContext('2d');
    targetCanvas.width = targetMaxSize;
    targetCanvas.height = targetMaxSize;
    ctx.clearRect(0,0,targetCanvas.width, targetCanvas.height);
    if (!isExport) {
       UI.statSize.textContent = `0 x 0`;
       UI.statRam.textContent = '0';
    }
    return;
  }
  
  const ctx = targetCanvas.getContext('2d');
  
  // Calculate raw pixels sizes based on a base resolution
  const BASE_CELL_SIZE = 512; // Our cached images are 512x512
  
  const patRows = pattern.length;
  const patCols = pattern[0].length;
  
  // Cell dimensions considering aspect ratio setting map directly
  let cellW = BASE_CELL_SIZE * s.aspectW;
  let cellH = BASE_CELL_SIZE * s.aspectH;
  
  // Keep area roughly the same as BASE_CELL_SIZE^2 to prevent gigantic canvases early on
  const aspectScaling = Math.sqrt(1 / (s.aspectW * s.aspectH));
  cellW *= aspectScaling;
  cellH *= aspectScaling;

  const groutW = s.grout.enabled ? s.grout.width * 2 * aspectScaling : 0; // Scale grout loosely relative to base size

  // 1 unit dimension
  const unitW = patCols * (cellW + groutW);
  const unitH = patRows * (cellH + groutW);
  
  const wrapW = unitW * s.repeatX;
  const wrapH = unitH * s.repeatY;
  
  // Total canvas dimension before global rotation
  const totalW = s.grout.seamless ? wrapW : wrapW + groutW; // extra grout at the end if not seamless
  const totalH = s.grout.seamless ? wrapH : wrapH + groutW;
  
  let finalW = totalW;
  let finalH = totalH;
  if(s.outputRotation === 90 || s.outputRotation === 270) {
    finalW = totalH;
    finalH = totalW;
  }
  
  // Now implement scaling if targetMaxSize limits us
  let scale = 1;
  if(Math.max(finalW, finalH) > targetMaxSize) {
    scale = targetMaxSize / Math.max(finalW, finalH);
  }
  
  const outW = Math.round(finalW * scale);
  const outH = Math.round(finalH * scale);
  
  targetCanvas.width = outW;
  targetCanvas.height = outH;

  // Render stats update
  if (!isExport) {
    UI.statSize.textContent = `${Math.round(finalW)} x ${Math.round(finalH)}` + (scale < 1 ? ` (縮小表示)` : '');
    const ramMB = (outW * outH * 4) / 1024 / 1024;
    UI.statRam.textContent = ramMB.toFixed(1);
  }

  // Draw Grout Background
  ctx.save();
  ctx.scale(scale, scale);
  
  // Apply Global Rotation
  if (s.outputRotation !== 0) {
    ctx.translate(finalW/2, finalH/2);
    ctx.rotate(s.outputRotation * Math.PI / 180);
    ctx.translate(-totalW/2, -totalH/2);
  }

  // Grout Base
  if(s.grout.enabled) {
    ctx.fillStyle = s.grout.color;
    ctx.fillRect(0, 0, totalW, totalH);
  } else {
    ctx.clearRect(0,0, totalW, totalH);
  }

  // Offset logic prep
  const rX = s.repeatX * patCols;
  const rY = s.repeatY * patRows;
  
  const drawBaseX = s.grout.seamless ? 0 : groutW;
  const drawBaseY = s.grout.seamless ? 0 : groutW;
  
  // Draw cells
  for(let gRow = 0; gRow < rY; gRow++) {
    for(let gCol = 0; gCol < rX; gCol++) {
      
      const patR = gRow % patRows;
      const patC = gCol % patCols;
      const cellId = pattern[patR][patC];
      
      const cell = AppState.cells.find(c => c.id === cellId);
      
      let startX = gCol * (cellW + groutW);
      let startY = gRow * (cellH + groutW);
      
      // Apply offset
      let shiftX = 0, shiftY = 0;
      
      if (AppState.customOffsets.row) {
          const patRowOffset = AppState.customOffsets.row[patR] || 0;
          shiftX = (patRowOffset / 100.0) * (cellW + groutW);
      } else if (AppState.customOffsets.col) {
          const patColOffset = AppState.customOffsets.col[patC] || 0;
          shiftY = (patColOffset / 100.0) * (cellH + groutW);
      } else {
          // UI Settings
          const offsetAmount = s.offsetPercent / 100.0;
          if (s.offsetMode === 'row' && gRow % 2 !== 0) {
            shiftX = offsetAmount * (cellW + groutW);
          } else if (s.offsetMode === 'col' && gCol % 2 !== 0) {
            shiftY = offsetAmount * (cellH + groutW);
          }
      }
      
      let tileX = startX + shiftX;
      let tileY = startY + shiftY;
      
      if (s.offsetLoop) {
          tileX = ((tileX % wrapW) + wrapW) % wrapW;
          tileY = ((tileY % wrapH) + wrapH) % wrapH;
      }
      
      // Draw Cell Image if it exists
      if (cell && cell.hasImage) {
        const drawTile = (dx, dy) => {
          ctx.save();
          ctx.translate(drawBaseX + dx, drawBaseY + dy);
          
          // Anti-aliasing gap fix for zero-grout seamless tiles
          const bleed = (groutW === 0) ? 0.5 / scale : 0;
          if (bleed > 0 && cellW > 0 && cellH > 0) {
              const sfX = (cellW + bleed * 2) / cellW;
              const sfY = (cellH + bleed * 2) / cellH;
              ctx.translate(cellW/2, cellH/2);
              ctx.scale(sfX, sfY);
              ctx.translate(-cellW/2, -cellH/2);
          }
          
          ctx.beginPath();
          ctx.rect(0, 0, cellW, cellH);
          ctx.closePath();
          ctx.clip(); // Ensure we don't draw outside bounds due to cover/contain
          
          // Draw inner logic based on fitMode
          if (s.fitMode === 'stretch') {
            ctx.drawImage(cell.cachedCanvas, 0, 0, cellW, cellH);
          } else {
            // cover or contain logic for a square cache into a rectangle
            const arCache = 1; // square
            const arCell = cellW / cellH;
            
            let dw = cellW, dh = cellH, vx = 0, vy = 0;
            
            if (s.fitMode === 'cover') {
               if (arCache > arCell) { // cache wider => match height, crop sides
                  dh = cellH;
                  dw = dh * arCache;
                  vx = (cellW - dw) / 2;
               } else { // cell wider => match width, crop top/bottom
                  dw = cellW;
                  dh = dw / arCache;
                  vy = (cellH - dh) / 2;
               }
            } else if (s.fitMode === 'contain') {
               if (arCache > arCell) { // cache wider => match width, black bars top/bottom
                  dw = cellW;
                  dh = dw / arCache;
                  vy = (cellH - dh) / 2;
               } else {
                  dh = cellH;
                  dw = dh * arCache;
                  vx = (cellW - dw) / 2;
               }
               // Draw black background if contain leaves gaps
               ctx.fillStyle = '#000';
               ctx.fillRect(0,0,cellW, cellH);
            }
            
            ctx.drawImage(cell.cachedCanvas, vx, vy, dw, dh);
          }
          
          // If double grout enabled, draw the inner border here right on the edge of the cell
          if (s.grout.enabled && s.grout.double) {
               const gr = s.grout;
               // outer ring (touches grout)
               ctx.lineWidth = gr.outerW * 2 * aspectScaling;
               ctx.strokeStyle = gr.outerC;
               ctx.strokeRect(0, 0, cellW, cellH);
               
               // inner ring (touches image)
               ctx.lineWidth = gr.innerW * 2 * aspectScaling;
               ctx.strokeStyle = gr.innerC;
               ctx.strokeRect(gr.outerW * aspectScaling, gr.outerW * aspectScaling, cellW - gr.outerW*2*aspectScaling, cellH - gr.outerW*2*aspectScaling);
          }
          
          ctx.restore();
        };

        drawTile(tileX, tileY);

        if (s.offsetLoop) {
            const eps = 0.05; // Fix float precision wrap around
            if (tileX + cellW > wrapW + eps) drawTile(tileX - wrapW, tileY);
            if (tileY + cellH > wrapH + eps) drawTile(tileX, tileY - wrapH);
            if (tileX + cellW > wrapW + eps && tileY + cellH > wrapH + eps) drawTile(tileX - wrapW, tileY - wrapH);
        }
      }
    }
  }

  // Draw Grout Overlays (lines) for gaps to create a cleaner grid and override image spillage 
  // if they didn't clip well, though clip() should handle it.
  
  ctx.restore();
}

// Export logic
document.getElementById('btn-export-png').addEventListener('click', () => {
   if(AppState.pattern.length === 0) {
      alert('パターンが定義されていません。');
      return;
   }
   const canvas = processFullRender();
   const url = canvas.toDataURL('image/png');
   const a = document.createElement('a');
   a.href = url;
   a.download = `tile_pattern_${new Date().getTime()}.png`;
   a.click();
});

// JSON IO
document.getElementById('btn-save-settings').addEventListener('click', () => {
    // We cannot easily save the large base64 images within a pure settings JSON if we want to keep it lightweight.
    // So we'll save just the raw settings. Users must re-upload images.
    const data = {
        pattern: UI.patternInput.value,
        settings: AppState.settings,
        cellAdjustments: AppState.cells.map(c => ({
            id: c.id,
            transform: c.transform,
            color: c.color,
            crop: c.crop
        }))
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tile_settings.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('btn-load-settings').addEventListener('click', () => {
    document.getElementById('input-load-settings').click();
});

document.getElementById('input-load-settings').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if(data.settings) AppState.settings = data.settings;
            if(data.pattern) UI.patternInput.value = data.pattern;
            
            if(data.cellAdjustments) {
                data.cellAdjustments.forEach(ca => {
                    const c = AppState.cells.find(x => x.id === ca.id);
                    if(c) {
                        c.transform = ca.transform;
                        c.color = ca.color;
                        if(ca.crop) c.crop = ca.crop;
                    }
                });
            }
            // Update UI
            updateUIFromState();
            parsePattern();
        } catch(err) {
            alert('設定ファイルの読み込みに失敗しました。');
            console.error(err);
        }
    };
    reader.readAsText(file);
});

function updateUIFromState() {
   const s = AppState.settings;
   const setVal = (id, val) => { const el = document.getElementById(`setting-${id}`); if(el) el.value = val; };
   const setChk = (id, val) => { const el = document.getElementById(`setting-${id}`); if(el) el.checked = val; };
   
   setVal('repeat-x', s.repeatX);
   setVal('repeat-y', s.repeatY);
   setVal('output-rotation', s.outputRotation);
   setVal('offset-mode', s.offsetMode);
   setVal('offset-percent', s.offsetPercent);
   setChk('offset-loop', s.offsetLoop);
   document.getElementById('val-offset-percent').textContent = s.offsetPercent + '%';
   
   setVal('aspect-w', s.aspectW);
   setVal('aspect-h', s.aspectH);
   setVal('fit-mode', s.fitMode);
   
   setChk('grout-enabled', s.grout.enabled);
   setChk('grout-seamless', s.grout.seamless);
   setVal('grout-width', s.grout.width);
   document.getElementById('val-grout-width').textContent = s.grout.width + 'px';
   setVal('grout-color', s.grout.color);
   
   setChk('grout-double', s.grout.double);
   setVal('grout-outer-w', s.grout.outerW);
   setVal('grout-outer-c', s.grout.outerC);
   setVal('grout-inner-w', s.grout.innerW);
   setVal('grout-inner-c', s.grout.innerC);
   
   // Sync cell adjustments to inputs
   AppState.cells.forEach(c => {
       const dom = UI.cellList.querySelector(`.cell-item[data-id="${c.id}"]`);
       if(!dom) return;
       dom.querySelector('.ctrl-rot').value = c.transform.rotate;
       dom.querySelector('.ctrl-flip').value = c.transform.flip;
       dom.querySelector('.ctrl-hue').value = c.color.hue;
       dom.querySelector('.ctrl-sat').value = c.color.sat;
       dom.querySelector('.ctrl-bri').value = c.color.bri;
       processCellImageCache(c.id);
   });
   
   // trigger grout events to update visibility
   document.getElementById('setting-grout-enabled').dispatchEvent(new Event('change'));
   document.getElementById('setting-grout-double').dispatchEvent(new Event('change'));
}

// 初期化実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
