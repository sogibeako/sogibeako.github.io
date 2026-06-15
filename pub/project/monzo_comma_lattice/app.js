const PRIMES = [2, 3, 5, 7, 11, 13];
const PRIME_INDEX = Object.fromEntries(PRIMES.map((p, i) => [p, i]));
const COLORS = ["#bd3b45", "#1d5fd0", "#149558", "#d4731c", "#7f4bb2", "#13808a", "#9b6b16"];

const COMMA_DATA = [
  { name: "Syntonic comma", ratio: "81/80", monzo: [-4, 4, -1, 0, 0, 0], show: true },
  { name: "Pythagorean comma", ratio: "531441/524288", monzo: [-19, 12, 0, 0, 0, 0], show: true },
  { name: "Diaschisma", ratio: "2048/2025", monzo: [11, -4, -2, 0, 0, 0], show: true },
  { name: "Schisma", ratio: "32805/32768", monzo: [-15, 8, 1, 0, 0, 0], show: false },
  { name: "Kleisma", ratio: "15625/15552", monzo: [-6, -5, 6, 0, 0, 0], show: false },
  { name: "Septimal comma", ratio: "64/63", monzo: [6, -2, 0, -1, 0, 0], show: true },
  { name: "Septimal diesis", ratio: "49/48", monzo: [-4, -1, 0, 2, 0, 0], show: false },
  { name: "Septimal kleisma", ratio: "225/224", monzo: [-5, 2, 2, -1, 0, 0], show: true },
  { name: "Undecimal comma", ratio: "33/32", monzo: [-5, 1, 0, 0, 1, 0], show: false },
  { name: "Marvel comma", ratio: "225/224", monzo: [-5, 2, 2, -1, 0, 0], show: false },
  { name: "Keema", ratio: "875/864", monzo: [-5, -3, 3, 1, 0, 0], show: false },
  { name: "Tridecimal third tone", ratio: "1053/1024", monzo: [-10, 4, 0, 0, 0, 1], show: false },
  { name: "65/64 comma", ratio: "65/64", monzo: [-6, 0, 1, 0, 0, 1], show: false },
];

const BASE_INTERVALS = [
  { label: "1/1", monzo: [0, 0, 0, 0, 0, 0] },
  { label: "16/15", monzo: [4, -1, -1, 0, 0, 0] },
  { label: "10/9", monzo: [1, -2, 1, 0, 0, 0] },
  { label: "9/8", monzo: [-3, 2, 0, 0, 0, 0] },
  { label: "6/5", monzo: [1, 1, -1, 0, 0, 0] },
  { label: "5/4", monzo: [-2, 0, 1, 0, 0, 0] },
  { label: "4/3", monzo: [2, -1, 0, 0, 0, 0] },
  { label: "45/32", monzo: [-5, 2, 1, 0, 0, 0] },
  { label: "3/2", monzo: [-1, 1, 0, 0, 0, 0] },
  { label: "8/5", monzo: [3, 0, -1, 0, 0, 0] },
  { label: "5/3", monzo: [0, -1, 1, 0, 0, 0] },
  { label: "9/5", monzo: [0, 2, -1, 0, 0, 0] },
  { label: "15/8", monzo: [-3, 1, 1, 0, 0, 0] },
  { label: "7/6", monzo: [-1, -1, 0, 1, 0, 0] },
  { label: "7/5", monzo: [0, 0, -1, 1, 0, 0] },
  { label: "7/4", monzo: [-2, 0, 0, 1, 0, 0] },
  { label: "11/8", monzo: [-3, 0, 0, 0, 1, 0] },
  { label: "11/9", monzo: [0, -2, 0, 0, 1, 0] },
  { label: "13/8", monzo: [-3, 0, 0, 0, 0, 1] },
  { label: "13/10", monzo: [-1, 0, -1, 0, 0, 1] },
];

const state = {
  xPrime: 3,
  yPrime: 5,
  edo: 31,
  edoEnabled: true,
  latticeEnabled: true,
  labelMode: "ratio",
  activeCommas: new Set(COMMA_DATA.filter((c) => c.show).map((_, i) => i)),
  basisA: 0,
  basisB: 1,
  viewZoom: 2.4,
  viewCenter: { x: 0, y: 0 },
  drag: null,
  camera: null,
};

const els = {
  svg: document.querySelector("#latticeSvg"),
  xAxis: document.querySelector("#xAxis"),
  yAxis: document.querySelector("#yAxis"),
  edoValue: document.querySelector("#edoValue"),
  edoEnabled: document.querySelector("#edoEnabled"),
  latticeEnabled: document.querySelector("#latticeEnabled"),
  labelMode: document.querySelector("#labelMode"),
  commaList: document.querySelector("#commaList"),
  basisA: document.querySelector("#basisA"),
  basisB: document.querySelector("#basisB"),
  zoomIn: document.querySelector("#zoomIn"),
  zoomOut: document.querySelector("#zoomOut"),
  resetZoom: document.querySelector("#resetZoom"),
  zoomValue: document.querySelector("#zoomValue"),
  primeMap: document.querySelector("#primeMap"),
  pointCount: document.querySelector("#pointCount"),
  commaCount: document.querySelector("#commaCount"),
  edoCount: document.querySelector("#edoCount"),
};

function init() {
  populateAxisSelects();
  populateCommaControls();
  populateBasisControls();
  bindEvents();
  render();
}

function populateAxisSelects() {
  for (const select of [els.xAxis, els.yAxis]) {
    select.innerHTML = "";
    for (const prime of PRIMES.slice(1)) {
      const option = document.createElement("option");
      option.value = String(prime);
      option.textContent = `${prime}-axis`;
      select.appendChild(option);
    }
  }
  els.xAxis.value = String(state.xPrime);
  els.yAxis.value = String(state.yPrime);
}

function populateCommaControls() {
  els.commaList.innerHTML = "";
  COMMA_DATA.forEach((comma, index) => {
    const row = document.createElement("label");
    row.className = "comma-item";
    row.innerHTML = `
      <input type="checkbox" data-comma="${index}" ${state.activeCommas.has(index) ? "checked" : ""}>
      <span class="comma-name">
        <strong>${comma.name}</strong>
        <small>${comma.ratio} / ${formatMonzo(comma.monzo)}</small>
      </span>
      <span class="comma-chip" style="background:${COLORS[index % COLORS.length]}"></span>
    `;
    els.commaList.appendChild(row);
  });
  syncCommaControls();
}

function populateBasisControls() {
  for (const select of [els.basisA, els.basisB]) {
    select.innerHTML = "";
    COMMA_DATA.forEach((comma, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${comma.name} (${comma.ratio})`;
      select.appendChild(option);
    });
  }
  els.basisA.value = String(state.basisA);
  els.basisB.value = String(state.basisB);
}

function bindEvents() {
  els.xAxis.addEventListener("change", () => {
    state.xPrime = Number(els.xAxis.value);
    if (state.xPrime === state.yPrime) state.yPrime = nextPrime(state.xPrime);
    syncPlane();
    render();
  });
  els.yAxis.addEventListener("change", () => {
    state.yPrime = Number(els.yAxis.value);
    if (state.xPrime === state.yPrime) state.xPrime = nextPrime(state.yPrime);
    syncPlane();
    render();
  });
  document.querySelectorAll("[data-plane]").forEach((button) => {
    button.addEventListener("click", () => {
      const [x, y] = button.dataset.plane.split(",").map(Number);
      state.xPrime = x;
      state.yPrime = y;
      syncPlane();
      render();
    });
  });
  els.edoValue.addEventListener("input", () => {
    const value = els.edoValue.value.trim();
    if (/^\d+$/.test(value)) {
      const next = Number(value);
      if (next >= 5 && next <= 200) {
        state.edo = next;
        render();
      }
    }
  });
  els.edoValue.addEventListener("change", () => {
    commitEdoInput();
  });
  els.edoValue.addEventListener("blur", () => {
    commitEdoInput();
  });
  els.edoEnabled.addEventListener("change", () => {
    state.edoEnabled = els.edoEnabled.checked;
    render();
  });
  els.latticeEnabled.addEventListener("change", () => {
    state.latticeEnabled = els.latticeEnabled.checked;
    render();
  });
  els.labelMode.addEventListener("change", () => {
    state.labelMode = els.labelMode.value;
    render();
  });
  els.commaList.addEventListener("change", (event) => {
    const input = event.target.closest("[data-comma]");
    if (!input) return;
    const index = Number(input.dataset.comma);
    if (input.checked) state.activeCommas.add(index);
    else state.activeCommas.delete(index);
    render();
  });
  els.basisA.addEventListener("change", () => {
    state.basisA = Number(els.basisA.value);
    render();
  });
  els.basisB.addEventListener("change", () => {
    state.basisB = Number(els.basisB.value);
    render();
  });
  els.zoomIn.addEventListener("click", () => {
    zoomAtCenter(1.25);
  });
  els.zoomOut.addEventListener("click", () => {
    zoomAtCenter(0.8);
  });
  els.resetZoom.addEventListener("click", () => {
    resetView();
  });
  els.svg.addEventListener("wheel", (event) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomAtPointer(factor, event.clientX, event.clientY);
  }, { passive: false });
  els.svg.addEventListener("pointerdown", (event) => {
    els.svg.setPointerCapture(event.pointerId);
    els.svg.classList.add("dragging");
    state.drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      center: { ...state.viewCenter },
    };
  });
  els.svg.addEventListener("pointermove", (event) => {
    if (!state.drag || !state.camera) return;
    const dx = event.clientX - state.drag.x;
    const dy = event.clientY - state.drag.y;
    state.viewCenter = {
      x: state.drag.center.x - dx / state.camera.scale,
      y: state.drag.center.y + dy / state.camera.scale,
    };
    render();
  });
  els.svg.addEventListener("pointerup", endDrag);
  els.svg.addEventListener("pointercancel", endDrag);
  window.addEventListener("resize", render);
}

function syncPlane() {
  els.xAxis.value = String(state.xPrime);
  els.yAxis.value = String(state.yPrime);
  document.querySelectorAll("[data-plane]").forEach((button) => {
    button.classList.toggle("active", button.dataset.plane === `${state.xPrime},${state.yPrime}`);
  });
}

function render() {
  syncPlane();
  syncPlaneScopedControls();
  if (document.activeElement !== els.edoValue) {
    els.edoValue.value = String(state.edo);
  }
  els.edoEnabled.checked = state.edoEnabled;
  els.latticeEnabled.checked = state.latticeEnabled;
  els.labelMode.value = state.labelMode;
  els.basisA.value = String(state.basisA);
  els.basisB.value = String(state.basisB);
  els.zoomValue.textContent = `${Math.round(state.viewZoom * 100)}%`;
  els.pointCount.textContent = String(visibleIntervals().length);
  els.commaCount.textContent = String(visibleActiveCommaIndices().length);
  els.edoCount.textContent = String(state.edo);
  renderPrimeMap();

  const rect = els.svg.getBoundingClientRect();
  const width = Math.max(720, Math.round(rect.width || 900));
  const height = Math.max(520, Math.round(rect.height || 620));
  els.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  els.svg.innerHTML = "";

  const pad = { left: 54, right: 34, top: 38, bottom: 44 };
  const projected = collectProjectedPoints();
  const bounds = computeBounds(projected);
  const fitScale = Math.min(
    (width - pad.left - pad.right) / Math.max(1, bounds.maxX - bounds.minX),
    (height - pad.top - pad.bottom) / Math.max(1, bounds.maxY - bounds.minY)
  );
  const scale = fitScale * state.viewZoom;
  const centerX = state.viewCenter.x;
  const centerY = state.viewCenter.y;
  const map = (x, y) => ({
    x: width / 2 + (x - centerX) * scale,
    y: height / 2 - (y - centerY) * scale,
  });
  state.camera = { width, height, scale, centerX, centerY };
  const visibleBounds = visibleWorldBounds(width, height, scale, centerX, centerY);

  drawGrid(width, height, visibleBounds, map);
  if (state.latticeEnabled) drawGeneratedLattice(visibleBounds, map);
  drawCommaRays(visibleBounds, map);
  drawIntervals(projected, map);
  drawAxisLabels(width, height);
}

function collectProjectedPoints() {
  const points = [];
  for (const interval of visibleIntervals()) {
    points.push({ kind: "interval", ...interval, ...project(interval.monzo) });
  }
  for (const index of visibleActiveCommaIndices()) {
    const comma = COMMA_DATA[index];
    const p = project(primitiveVector(comma.monzo));
    points.push({ kind: "comma", index, ...comma, ...p });
  }
  const basisA = project(COMMA_DATA[state.basisA].monzo);
  const basisB = project(COMMA_DATA[state.basisB].monzo);
  for (let m = -4; m <= 4; m++) {
    for (let n = -4; n <= 4; n++) {
      points.push({ kind: "lattice", x: m * basisA.x + n * basisB.x, y: m * basisA.y + n * basisB.y });
    }
  }
  points.push({ kind: "origin", x: 0, y: 0 });
  return points;
}

function computeBounds(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const spanX = Math.max(7, maxX - minX);
  const spanY = Math.max(7, maxY - minY);
  const marginX = spanX * 0.16;
  const marginY = spanY * 0.16;
  return { minX: minX - marginX, maxX: maxX + marginX, minY: minY - marginY, maxY: maxY + marginY };
}

function drawGrid(width, height, bounds, map) {
  const grid = svgEl("g");
  for (let x = Math.ceil(bounds.minX); x <= Math.floor(bounds.maxX); x++) {
    const a = map(x, bounds.minY);
    const b = map(x, bounds.maxY);
    grid.appendChild(line(a.x, a.y, b.x, b.y, x === 0 ? "axis-line" : "minor-grid"));
    if (x !== 0) grid.appendChild(text(a.x + 3, height - 15, String(x), "hint-label"));
  }
  for (let y = Math.ceil(bounds.minY); y <= Math.floor(bounds.maxY); y++) {
    const a = map(bounds.minX, y);
    const b = map(bounds.maxX, y);
    grid.appendChild(line(a.x, a.y, b.x, b.y, y === 0 ? "axis-line" : "minor-grid"));
    if (y !== 0) grid.appendChild(text(12, a.y - 3, String(y), "hint-label"));
  }
  els.svg.appendChild(grid);
}

function drawGeneratedLattice(bounds, map) {
  ensureVisibleBasis();
  const a = project(COMMA_DATA[state.basisA].monzo);
  const b = project(COMMA_DATA[state.basisB].monzo);
  if (det(a, b) === 0) return;
  const group = svgEl("g");
  for (let i = -8; i <= 8; i++) {
    drawInfiniteLine(group, add(scaleVec(a, i), scaleVec(b, -10)), b, bounds, map, "lattice-line");
    drawInfiniteLine(group, add(scaleVec(b, i), scaleVec(a, -10)), a, bounds, map, "lattice-line");
  }
  els.svg.appendChild(group);
}

function drawCommaRays(bounds, map) {
  const group = svgEl("g");
  for (const index of visibleActiveCommaIndices()) {
    const comma = COMMA_DATA[index];
    const p = project(primitiveVector(comma.monzo));
    if (p.x === 0 && p.y === 0) continue;
    drawInfiniteLine(group, { x: 0, y: 0 }, p, bounds, map, "comma-ray");

    const actual = project(comma.monzo);
    const actualPos = map(actual.x, actual.y);
    const dot = svgEl("circle");
    dot.setAttribute("cx", actualPos.x);
    dot.setAttribute("cy", actualPos.y);
    dot.setAttribute("r", 5.2);
    dot.setAttribute("class", "comma-point");
    dot.appendChild(title(`${comma.name}\n${comma.ratio}\n${formatMonzo(comma.monzo)}`));
    group.appendChild(dot);

    const labelPos = map(actual.x, actual.y);
    const label = text(labelPos.x + 5, labelPos.y - 5, comma.name, "comma-label");
    group.appendChild(label);
  }
  els.svg.appendChild(group);
}

function drawIntervals(points, map) {
  const group = svgEl("g");
  const labelBuckets = new Map();
  for (const point of points.filter((p) => p.kind === "interval")) {
    const pos = map(point.x, point.y);
    const key = `${Math.round(pos.x / 18)},${Math.round(pos.y / 13)}`;
    const offset = labelBuckets.get(key) || 0;
    labelBuckets.set(key, offset + 1);
    const dot = svgEl("circle");
    dot.setAttribute("cx", pos.x);
    dot.setAttribute("cy", pos.y);
    dot.setAttribute("r", point.label === "1/1" ? 5.8 : 4.3);
    dot.setAttribute("class", point.label === "1/1" ? "interval-point interval-origin" : "interval-point");
    dot.appendChild(title(`${point.label}\n${formatMonzo(point.monzo)}\n${cents(point.monzo).toFixed(2)} cents`));
    group.appendChild(dot);

    const intervalText = intervalLabel(point);
    const labelY = state.labelMode === "none" ? pos.y - 4 - offset * 11 : pos.y - 6 - offset * 11;
    if (intervalText) {
      group.appendChild(text(pos.x + 7, labelY, intervalText, "point-label"));
    }
    if (state.edoEnabled) {
      const edoY = intervalText ? pos.y + 7 - offset * 11 : pos.y + 9 - offset * 11;
      group.appendChild(text(pos.x + 7, edoY, String(edoStep(point.monzo)), "edo-label"));
    }
  }
  els.svg.appendChild(group);
}

function drawAxisLabels(width, height) {
  els.svg.appendChild(text(width - 116, height - 18, `x: ${state.xPrime}-exponent`, "hint-label"));
  els.svg.appendChild(text(14, 22, `y: ${state.yPrime}-exponent`, "hint-label"));
  els.svg.appendChild(text(14, height - 18, "wheel: zoom / drag: pan / 1/1: reset", "hint-label"));
}

function drawInfiniteLine(group, origin, direction, bounds, map, className, stroke) {
  const tValues = [];
  if (direction.x !== 0) {
    tValues.push((bounds.minX - origin.x) / direction.x, (bounds.maxX - origin.x) / direction.x);
  }
  if (direction.y !== 0) {
    tValues.push((bounds.minY - origin.y) / direction.y, (bounds.maxY - origin.y) / direction.y);
  }
  const valid = tValues
    .map((t) => ({ x: origin.x + direction.x * t, y: origin.y + direction.y * t }))
    .filter((p) => p.x >= bounds.minX - 0.001 && p.x <= bounds.maxX + 0.001 && p.y >= bounds.minY - 0.001 && p.y <= bounds.maxY + 0.001);
  if (valid.length < 2) return;
  const p1 = map(valid[0].x, valid[0].y);
  const p2 = map(valid[1].x, valid[1].y);
  group.appendChild(line(p1.x, p1.y, p2.x, p2.y, className, stroke));
}

function renderPrimeMap() {
  els.primeMap.innerHTML = "";
  const val = edoPrimeMap(state.edo);
  for (const prime of visiblePrimes()) {
    const span = document.createElement("span");
    span.textContent = `${prime} -> ${val[PRIME_INDEX[prime]]}`;
    els.primeMap.appendChild(span);
  }
}

function intervalLabel(point) {
  if (state.labelMode === "monzo") return formatMonzo(point.monzo);
  if (state.labelMode === "none") return "";
  return point.label;
}

function edoStep(monzo) {
  const val = edoPrimeMap(state.edo);
  const raw = monzo.reduce((sum, exp, i) => sum + exp * val[i], 0);
  return mod(raw, state.edo);
}

function edoPrimeMap(edo) {
  return PRIMES.map((prime) => Math.round(edo * Math.log2(prime)));
}

function project(monzo) {
  return {
    x: monzo[PRIME_INDEX[state.xPrime]] || 0,
    y: monzo[PRIME_INDEX[state.yPrime]] || 0,
  };
}

function primitiveVector(monzo) {
  const g = monzo.reduce((acc, n) => gcd(acc, Math.abs(n)), 0) || 1;
  return monzo.map((n) => n / g);
}

function formatMonzo(monzo) {
  return `[${monzo.join(" ")}>`;
}

function cents(monzo) {
  return 1200 * monzo.reduce((sum, exp, i) => sum + exp * Math.log2(PRIMES[i]), 0);
}

function svgEl(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

function line(x1, y1, x2, y2, className, stroke) {
  const el = svgEl("line");
  el.setAttribute("x1", x1);
  el.setAttribute("y1", y1);
  el.setAttribute("x2", x2);
  el.setAttribute("y2", y2);
  el.setAttribute("class", className);
  if (stroke) el.setAttribute("stroke", stroke);
  return el;
}

function text(x, y, value, className) {
  const el = svgEl("text");
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("class", className);
  el.textContent = value;
  return el;
}

function title(value) {
  const el = svgEl("title");
  el.textContent = value;
  return el;
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nextPrime(prime) {
  const axisPrimes = PRIMES.slice(1);
  return axisPrimes[(axisPrimes.indexOf(prime) + 1) % axisPrimes.length];
}

function det(a, b) {
  return a.x * b.y - a.y * b.x;
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scaleVec(a, scalar) {
  return { x: a.x * scalar, y: a.y * scalar };
}

function visiblePrimes() {
  return [2, state.xPrime, state.yPrime];
}

function isInCurrentPlane(monzo) {
  const allowed = new Set(visiblePrimes().map((prime) => PRIME_INDEX[prime]));
  return monzo.every((exp, index) => allowed.has(index) || exp === 0);
}

function visibleIntervals() {
  return BASE_INTERVALS.filter((interval) => isInCurrentPlane(interval.monzo));
}

function visibleCommaIndices() {
  return COMMA_DATA
    .map((comma, index) => ({ comma, index }))
    .filter(({ comma }) => isInCurrentPlane(comma.monzo))
    .map(({ index }) => index);
}

function visibleActiveCommaIndices() {
  const visible = new Set(visibleCommaIndices());
  return [...state.activeCommas].filter((index) => visible.has(index));
}

function syncPlaneScopedControls() {
  syncCommaControls();
  syncBasisControls();
  ensureVisibleBasis();
}

function syncCommaControls() {
  const visible = new Set(visibleCommaIndices());
  els.commaList.querySelectorAll("[data-comma]").forEach((input) => {
    const index = Number(input.dataset.comma);
    const row = input.closest(".comma-item");
    const inPlane = visible.has(index);
    row.classList.toggle("hidden", !inPlane);
    input.disabled = !inPlane;
  });
}

function syncBasisControls() {
  const visible = new Set(visibleCommaIndices());
  for (const select of [els.basisA, els.basisB]) {
    [...select.options].forEach((option) => {
      option.disabled = !visible.has(Number(option.value));
    });
  }
}

function ensureVisibleBasis() {
  const visible = visibleCommaIndices();
  if (!visible.length) return;
  if (!visible.includes(state.basisA)) state.basisA = visible[0];
  if (!visible.includes(state.basisB) || state.basisB === state.basisA) {
    state.basisB = visible.find((index) => index !== state.basisA) ?? state.basisA;
  }
}

function commitEdoInput() {
  const value = Number(els.edoValue.value);
  state.edo = clamp(Number.isFinite(value) ? Math.round(value) : state.edo, 5, 200);
  els.edoValue.value = String(state.edo);
  render();
}

function visibleWorldBounds(width, height, scale, centerX, centerY) {
  return {
    minX: centerX - width / 2 / scale,
    maxX: centerX + width / 2 / scale,
    minY: centerY - height / 2 / scale,
    maxY: centerY + height / 2 / scale,
  };
}

function zoomAtCenter(factor) {
  state.viewZoom = clamp(state.viewZoom * factor, 0.55, 8);
  render();
}

function zoomAtPointer(factor, clientX, clientY) {
  if (!state.camera) return zoomAtCenter(factor);
  const before = screenToWorld(clientX, clientY);
  state.viewZoom = clamp(state.viewZoom * factor, 0.55, 8);
  render();
  const after = screenToWorld(clientX, clientY);
  state.viewCenter = {
    x: state.viewCenter.x + before.x - after.x,
    y: state.viewCenter.y + before.y - after.y,
  };
  render();
}

function screenToWorld(clientX, clientY) {
  const rect = els.svg.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  return {
    x: state.camera.centerX + (sx - state.camera.width / 2) / state.camera.scale,
    y: state.camera.centerY - (sy - state.camera.height / 2) / state.camera.scale,
  };
}

function resetView() {
  state.viewZoom = 2.4;
  state.viewCenter = { x: 0, y: 0 };
  render();
}

function endDrag(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  state.drag = null;
  els.svg.classList.remove("dragging");
}

init();
