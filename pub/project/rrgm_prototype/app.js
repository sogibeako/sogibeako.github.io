(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    canvas: $("timelineCanvas"),
    ruler: $("ruler"),
    play: $("playBtn"),
    stop: $("stopBtn"),
    home: $("homeBtn"),
    bpm: $("bpmInput"),
    ppq: $("ppqInput"),
    loop: $("loopInput"),
    readout: $("positionReadout"),
    selected: $("selectedLabel"),
    range: $("rangeLabel"),
    cellName: $("cellName"),
    cellLength: $("cellLength"),
    meterLabel: $("meterLabel"),
    meterPattern: $("meterPatternInput"),
    applyMeter: $("applyMeterBtn"),
    json: $("jsonOutput"),
    laneList: $("laneList"),
    graphView: $("graphView"),
    addGraphNode: $("addGraphNodeBtn"),
    linkGraphNodes: $("linkGraphNodesBtn"),
    equalParts: $("equalPartsInput"),
    equal: $("equalBtn"),
    ratio: $("ratioInput"),
    ratioBtn: $("ratioBtn"),
    glue: $("glueBtn"),
    glueDivide: $("glueDivideBtn"),
    restore: $("restoreBtn"),
    bake: $("bakeBtn"),
    event: $("eventBtn"),
    fill: $("fillBtn"),
    save: $("saveBtn"),
    newBtn: $("newBtn"),
    undo: $("undoBtn"),
    redo: $("redoBtn"),
    copyUrl: $("copyUrlBtn"),
  };

  const ctx = els.canvas.getContext("2d");
  let audio = null;
  let audioPlayStart = 0;
  let uiPlayStartMs = 0;
  let playOffsetSeconds = 0;
  let playing = false;
  let raf = 0;
  let drag = null;
  let scheduledKeys = new Set();
  let uiDirty = true;
  let undoStack = [];
  let redoStack = [];

  class R {
    constructor(num, den = 1n) {
      if (den === 0n) throw new Error("zero denominator");
      const sign = den < 0n ? -1n : 1n;
      const g = gcd(abs(num), abs(den));
      this.n = (num / g) * sign;
      this.d = abs(den) / g;
    }
    static parse(value) {
      if (value instanceof R) return value;
      const text = String(value).trim();
      if (text.includes("/")) {
        const [a, b] = text.split("/").map((v) => BigInt(v.trim()));
        return new R(a, b);
      }
      if (text.includes(".")) {
        const [whole, part] = text.split(".");
        const den = 10n ** BigInt(part.length);
        return new R(BigInt(whole || "0") * den + BigInt(part), den);
      }
      return new R(BigInt(text || "0"), 1n);
    }
    add(v) { const x = R.parse(v); return new R(this.n * x.d + x.n * this.d, this.d * x.d); }
    sub(v) { const x = R.parse(v); return new R(this.n * x.d - x.n * this.d, this.d * x.d); }
    mul(v) { const x = R.parse(v); return new R(this.n * x.n, this.d * x.d); }
    div(v) { const x = R.parse(v); return new R(this.n * x.d, this.d * x.n); }
    cmp(v) { const x = R.parse(v); const a = this.n * x.d; const b = x.n * this.d; return a === b ? 0 : a > b ? 1 : -1; }
    valueOf() { return Number(this.n) / Number(this.d); }
    toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
  }

  const abs = (v) => v < 0n ? -v : v;
  const gcd = (a, b) => {
    while (b) [a, b] = [b, a % b];
    return a || 1n;
  };

  const clone = (obj) => JSON.parse(JSON.stringify(obj));
  const secPerWhole = () => 4 * 60 / Number(els.bpm.value || 80);
  const secondsFor = (r) => R.parse(r).valueOf() * secPerWhole();
  const rx = (r) => R.parse(r).valueOf() / R.parse(project.cells[0].length).valueOf() * metrics.width + metrics.left;
  const xToR = (x) => {
    const ppq = Math.max(24, Number(els.ppq.value || 1920));
    const ticksPerWhole = ppq * 4;
    const cellLength = R.parse(project.cells[0].length).valueOf();
    const fraction = Math.max(0, Math.min(1, (x - metrics.left) / metrics.width));
    const ticks = Math.round(fraction * cellLength * ticksPerWhole);
    return new R(BigInt(ticks), BigInt(ticksPerWhole));
  };

  const metrics = { left: 46, right: 22, width: 100, top: 30 };

  let project = makeInitialProject();
  let selectedId = "seg1_3";
  let selectedGlueId = "";
  let selectedRange = { start: "1/2", end: "23/20" };
  let selectedEventIds = new Set();
  let selectedGraphNodeIds = new Set(["node1"]);

  function makeInitialProject() {
    return {
      version: "0.1.0-prototype",
      title: "RRGM First Prototype",
      global: { bpm: 80, ppq: 1920, variables: [] },
      bars: [
        { id: "bar1", index: 0, meter: { numerator: "4", denominator: "4" }, start: "0", length: "1" },
        { id: "bar2", index: 1, meter: { numerator: "6", denominator: "7" }, start: "1", length: "6/7" },
      ],
      lanes: [{ id: "lane1", name: "Main Rhythm", cells: ["cell1"] }],
      cells: [{
        id: "cell1",
        name: "Current Timeline Cell",
        length: "2",
        segments: [
          makeSegment("seg1", "0", "3/4", "3/4 x5", equalChildren("seg1", "0", "3/4", 5)),
          makeSegment("seg2", "3/4", "1", "1 x5", equalChildren("seg2", "3/4", "1", 5)),
          makeSegment("seg3", "7/4", "1/4", "tail", []),
        ],
        glueSegments: [{
          id: "glue1",
          type: "glue",
          cellId: "cell1",
          sourceRange: { start: "1/2", end: "23/20" },
          length: "13/20",
          children: equalChildren("glue1", "1/2", "13/20", 3).map((seg, index) => withEvent(seg, index)),
          event: { id: "evt_glue1", timeOffset: "0", duration: "1/48", velocity: 96, instrumentId: "kick1", midiNote: 36 },
        }],
        repeat: { mode: "count", count: 4 },
      }],
      graph: {
        nodes: [{ id: "node1", cellId: "cell1", position: { x: 60, y: 40 } }],
        edges: [],
      },
      instruments: [{ type: "sample", id: "kick1", name: "Synthetic Kick", bufferId: "internal_kick", gain: 0.9 }],
      samples: [{ id: "internal_kick", name: "generated-kick", source: "local" }],
      view: { zoom: 1, scrollX: 0, scrollY: 0 },
    };
  }

  function makeSegment(id, start, length, label, children = []) {
    return { id, start, length, label, children };
  }

  function withEvent(seg, index = 0) {
    return {
      ...seg,
      event: {
        id: `evt_${seg.id}`,
        timeOffset: "0",
        duration: "1/48",
        velocity: index % 2 ? 78 : 112,
        instrumentId: "kick1",
        midiNote: 36,
      },
    };
  }

  function equalChildren(prefix, start, length, parts) {
    const base = R.parse(length).div(String(parts));
    const list = [];
    for (let i = 0; i < parts; i += 1) {
      list.push(makeSegment(`${prefix}_${i + 1}`, R.parse(start).add(base.mul(String(i))).toString(), base.toString(), `${i + 1}/${parts}`));
    }
    return list;
  }

  function ratioChildren(prefix, start, length, ratios) {
    const total = ratios.reduce((sum, r) => sum.add(r), new R(0n));
    let cursor = R.parse(start);
    return ratios.map((ratio, index) => {
      const childLength = R.parse(length).mul(ratio).div(total);
      const child = makeSegment(`${prefix}_r${index + 1}`, cursor.toString(), childLength.toString(), ratio.toString());
      cursor = cursor.add(childLength);
      return child;
    });
  }

  function allSegments() {
    const out = [];
    const visit = (seg, depth = 0, parent = "") => {
      out.push({ seg, depth, parent });
      (seg.children || []).forEach((child) => visit(child, depth + 1, seg.id));
    };
    project.cells[0].segments.forEach((seg) => visit(seg));
    return out;
  }

  function allEventTargets() {
    const targets = [];
    allSegments().forEach(({ seg, depth }) => {
      if (depth > 0) {
        const y = segmentRowY(depth);
        targets.push({
          node: seg,
          depth,
          kind: "segment",
          x1: rx(seg.start),
          x2: rx(R.parse(seg.start).add(seg.length)),
          y1: y,
          y2: y + 42,
        });
      }
    });
    project.cells[0].glueSegments.forEach((glue) => {
      targets.push({
        node: glue,
        depth: 0,
        kind: "glue",
        x1: rx(glue.sourceRange.start),
        x2: rx(glue.sourceRange.end),
        y1: 278,
        y2: 328,
      });
      (glue.children || []).forEach((child) => {
        targets.push({
          node: child,
          depth: 0,
          kind: "glueChild",
          x1: rx(child.start),
          x2: rx(R.parse(child.start).add(child.length)),
          y1: 304,
          y2: 328,
        });
      });
    });
    return targets;
  }

  function segmentRowY(depth) {
    return ({ 0: 88, 1: 150, 2: 212 })[Math.min(depth, 2)];
  }

  function eventXForSegment(seg) {
    return (rx(seg.start) + rx(R.parse(seg.start).add(seg.length))) / 2;
  }

  function selectedEventTargets() {
    return allEventTargets().filter(({ node }) => selectedEventIds.has(node.id));
  }

  function rangeFromSelectedEvents() {
    return rangeFromEventTargets(selectedEventTargets());
  }

  function rangeFromEventTargets(targets) {
    if (targets.length < 2) return null;
    let start = null;
    let end = null;
    targets.forEach(({ node }) => {
      const bounds = eventBounds(node);
      if (!bounds) return;
      const { eventStart, eventEnd } = bounds;
      start = start && start.cmp(eventStart) < 0 ? start : eventStart;
      end = end && end.cmp(eventEnd) > 0 ? end : eventEnd;
    });
    return start && end && end.cmp(start) > 0 ? { start: start.toString(), end: end.toString() } : null;
  }

  function eventBounds(node) {
    const nodeStart = node.start ?? node.sourceRange?.start;
    const nodeEnd = node.sourceRange?.end ?? (nodeStart && node.length ? R.parse(nodeStart).add(node.length).toString() : null);
    if (!nodeStart || !nodeEnd) return null;
    const eventStart = R.parse(nodeStart);
    const eventEnd = R.parse(nodeEnd);
    return { eventStart, eventEnd };
  }

  function eventsInRange(range) {
    if (!range) return [];
    const margin = new R(1n, BigInt(Math.max(384, Number(els.ppq.value || 1920) * 2)));
    const start = R.parse(range.start).sub(margin);
    const end = R.parse(range.end).add(margin);
    return allEventTargets().filter(({ node }) => {
      const bounds = eventBounds(node);
      if (!bounds) return false;
      return bounds.eventStart.cmp(end) < 0 && bounds.eventEnd.cmp(start) > 0;
    });
  }

  function findSegment(id) {
    return allSegments().find((entry) => entry.seg.id === id)?.seg || null;
  }

  function findParent(id) {
    return allSegments().find((entry) => entry.seg.children?.some((child) => child.id === id))?.seg || null;
  }

  function activeGlue() {
    return selectedGlueId
      ? project.cells[0].glueSegments.find((g) => g.id === selectedGlueId)
      : project.cells[0].glueSegments[0];
  }

  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    els.canvas.width = Math.floor(rect.width * dpr);
    els.canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const rect = els.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    metrics.width = width - metrics.left - metrics.right;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#111619";
    ctx.fillRect(0, 0, width, height);
    drawGrid(width, height);
    drawBars();
    drawSegments();
    drawGlue();
    drawSelection();
    drawPlayhead();
    if (uiDirty || !playing) {
      updateInspector();
      uiDirty = false;
    }
  }

  function drawGrid(width, height) {
    ctx.strokeStyle = "#293136";
    ctx.lineWidth = 1;
    ctx.font = "12px Consolas, monospace";
    ctx.fillStyle = "#aeb9b4";
    for (let i = 0; i <= 8; i += 1) {
      const r = new R(BigInt(i), 4n);
      const x = rx(r);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.fillText(r.toString(), x + 4, 18);
    }
  }

  function drawBars() {
    project.bars.forEach((bar, index) => {
      const x = rx(bar.start);
      const w = rx(R.parse(bar.start).add(bar.length)) - x;
      ctx.fillStyle = index % 2 ? "rgba(126, 183, 255, 0.07)" : "rgba(145, 220, 173, 0.05)";
      ctx.fillRect(x, 28, w, 34);
      ctx.strokeStyle = "#3a444a";
      ctx.strokeRect(x, 28, w, 34);
      ctx.fillStyle = "#edf2ef";
      ctx.font = "12px Consolas, monospace";
      ctx.fillText(`${bar.index + 1}: ${bar.meter.numerator}/${bar.meter.denominator}`, x + 8, 50);
    });
  }

  function drawSegments() {
    allSegments().forEach(({ seg, depth, parent }) => {
      const y = segmentRowY(depth);
      const x = rx(seg.start);
      const w = Math.max(2, rx(R.parse(seg.start).add(seg.length)) - x);
      const selected = seg.id === selectedId || selectedEventIds.has(seg.id);
      ctx.fillStyle = depth === 0 ? "rgba(73, 87, 96, 0.72)" : "rgba(126, 183, 255, 0.38)";
      ctx.strokeStyle = selected ? "#f2c66d" : depth === 0 ? "#697983" : "#7eb7ff";
      ctx.lineWidth = selected ? 3 : 1;
      roundRect(x, y, w, 42, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#edf2ef";
      ctx.font = "12px Consolas, monospace";
      ctx.fillText(seg.length, x + 7, y + 25);
      if (parent) {
        ctx.fillStyle = "#aeb9b4";
        ctx.fillText(seg.label || seg.id, x + 7, y + 39);
      }
      if (seg.event) drawEvent(x + w / 2, y + 6, seg.event.velocity, selectedEventIds.has(seg.id));
    });
  }

  function drawGlue() {
    project.cells[0].glueSegments.forEach((glue) => {
      const start = glue.sourceRange.start;
      const end = glue.sourceRange.end;
      const x = rx(start);
      const w = rx(end) - x;
      const y = 278;
      ctx.fillStyle = "rgba(242, 198, 109, 0.25)";
      ctx.strokeStyle = glue.id === selectedGlueId ? "#ff827c" : "#f2c66d";
      ctx.lineWidth = glue.id === selectedGlueId ? 3 : 1;
      roundRect(x, y, w, 50, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f2c66d";
      ctx.font = "12px Consolas, monospace";
      ctx.fillText(`${glue.id} ${glue.length}`, x + 8, y + 18);
      (glue.children || []).forEach((child, index) => {
        const cx = rx(child.start);
        const cw = rx(R.parse(child.start).add(child.length)) - cx;
        ctx.fillStyle = "rgba(242, 198, 109, 0.42)";
        ctx.fillRect(cx, y + 26, cw, 16);
        ctx.strokeStyle = selectedEventIds.has(child.id) ? "#edf2ef" : "rgba(255,255,255,0.28)";
        ctx.lineWidth = selectedEventIds.has(child.id) ? 3 : 1;
        ctx.strokeRect(cx, y + 26, cw, 16);
        ctx.lineWidth = 1;
        ctx.fillStyle = "#111315";
        ctx.fillText(String(index + 1), cx + Math.max(4, cw / 2 - 3), y + 39);
        if (child.event) drawEvent(cx + cw / 2, y + 26, child.event.velocity, selectedEventIds.has(child.id));
      });
      if (glue.event) drawEvent(x + 12, y + 8, glue.event.velocity, selectedEventIds.has(glue.id));
    });
  }

  function drawSelection() {
    if (!selectedRange) return;
    const x = rx(selectedRange.start);
    const w = rx(selectedRange.end) - x;
    ctx.fillStyle = "rgba(255, 130, 124, 0.12)";
    ctx.strokeStyle = "rgba(255, 130, 124, 0.7)";
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x, 70, w, 274);
    ctx.setLineDash([]);
  }

  function drawPlayhead() {
    const seconds = currentSeconds();
    const cellSeconds = secondsFor(project.cells[0].length);
    const pos = R.parse(project.cells[0].length).mul(String(Math.min(1, seconds / cellSeconds || 0)));
    const x = rx(pos);
    ctx.strokeStyle = "#91dcad";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 24);
    ctx.lineTo(x, 356);
    ctx.stroke();
  }

  function drawEvent(x, y, velocity, selected = false) {
    if (selected) {
      ctx.strokeStyle = "#edf2ef";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y + 10, Math.max(8, velocity / 16), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#ff827c";
    ctx.beginPath();
    ctx.arc(x, y + 10, Math.max(4, velocity / 18), 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
  }

  function updateInspector() {
    const seg = findSegment(selectedId);
    const glue = activeGlue();
    const eventRange = rangeFromSelectedEvents();
    const selectedEvents = selectedEventIds.size ? ` / notes ${selectedEventIds.size}` : "";
    const cell = project.cells[0];
    els.cellName.textContent = cell.name;
    els.cellLength.textContent = cell.length;
    els.meterLabel.textContent = project.bars.map((bar) => `${bar.meter.numerator}/${bar.meter.denominator}`).join(" + ");
    els.meterPattern.value = els.meterLabel.textContent;
    els.selected.textContent = selectedGlueId && glue ? `${selectedGlueId} / ${glue.length}${selectedEvents}` : seg ? `${seg.id} / ${seg.length}${selectedEvents}` : `none${selectedEvents}`;
    els.range.textContent = eventRange ? `${eventRange.start} - ${eventRange.end} from notes` : selectedRange ? `${selectedRange.start} - ${selectedRange.end}` : "none";
    els.json.value = JSON.stringify(exportProject(), null, 2);
    renderRuler();
    renderLanes();
    renderGraph();
    updateHistoryButtons();
  }

  function markDirty() {
    uiDirty = true;
  }

  function historyState() {
    return {
      project: exportProject(),
      selectedId,
      selectedGlueId,
      selectedRange: clone(selectedRange),
      selectedEventIds: [...selectedEventIds],
      selectedGraphNodeIds: [...selectedGraphNodeIds],
      bpm: Number(els.bpm.value || 80),
      ppq: Number(els.ppq.value || 1920),
    };
  }

  function restoreState(state) {
    project = clone(state.project);
    selectedId = state.selectedId || "";
    selectedGlueId = state.selectedGlueId || "";
    selectedRange = clone(state.selectedRange || { start: "0", end: "0" });
    selectedEventIds = new Set(state.selectedEventIds || []);
    selectedGraphNodeIds = new Set(state.selectedGraphNodeIds || []);
    els.bpm.value = state.bpm || project.global.bpm || 80;
    els.ppq.value = state.ppq || project.global.ppq || 1920;
    markDirty();
    draw();
  }

  function commitHistory() {
    undoStack.push(historyState());
    if (undoStack.length > 80) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(historyState());
    restoreState(undoStack.pop());
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(historyState());
    restoreState(redoStack.pop());
  }

  function updateHistoryButtons() {
    els.undo.disabled = undoStack.length === 0;
    els.redo.disabled = redoStack.length === 0;
  }

  function renderRuler() {
    els.ruler.innerHTML = "";
    for (let i = 0; i < 8; i += 1) {
      const span = document.createElement("span");
      span.textContent = `${new R(BigInt(i), 4n)} - ${new R(BigInt(i + 1), 4n)}`;
      els.ruler.appendChild(span);
    }
  }

  function renderLanes() {
    els.laneList.innerHTML = "";
    project.lanes.forEach((lane) => {
      const row = document.createElement("div");
      row.className = "lane-row";
      row.innerHTML = `<strong>${lane.name}</strong><div class="lane-track"></div>`;
      const track = row.querySelector(".lane-track");
      lane.cells.forEach((cellId, i) => {
        const cell = document.createElement("div");
        cell.className = "lane-cell";
        cell.style.left = `${i * 24}%`;
        cell.style.width = "42%";
        track.appendChild(cell);
      });
      els.laneList.appendChild(row);
    });
  }

  function parseMeterPattern(pattern) {
    const tokens = String(pattern || "").split(/\s*(?:\+|,)\s*/).map((v) => v.trim()).filter(Boolean);
    if (!tokens.length) return null;
    let cursor = new R(0n);
    const bars = [];
    for (const token of tokens) {
      const slash = token.lastIndexOf("/");
      if (slash <= 0 || slash === token.length - 1) return null;
      const numerator = token.slice(0, slash).trim();
      const denominator = token.slice(slash + 1).trim();
      const length = R.parse(numerator).div(denominator);
      bars.push({
        id: `bar${bars.length + 1}`,
        index: bars.length,
        meter: { numerator, denominator },
        start: cursor.toString(),
        length: length.toString(),
      });
      cursor = cursor.add(length);
    }
    return { bars, length: cursor.toString() };
  }

  function applyMeterPattern() {
    const parsed = parseMeterPattern(els.meterPattern.value);
    if (!parsed) return;
    commitHistory();
    project.bars = parsed.bars;
    project.cells[0].length = parsed.length;
    selectedRange = { start: "0", end: parsed.length };
    selectedEventIds.clear();
    markDirty();
    draw();
  }

  function renderGraph() {
    els.graphView.innerHTML = "";
    const minHeight = Math.max(150, ...project.graph.nodes.map((node) => node.position.y + 96));
    const minWidth = Math.max(360, ...project.graph.nodes.map((node) => node.position.x + 170));
    els.graphView.style.minHeight = `${minHeight}px`;
    els.graphView.style.minWidth = `${minWidth}px`;
    project.graph.edges.forEach((edge) => {
      const from = project.graph.nodes.find((node) => node.id === edge.from);
      const to = project.graph.nodes.find((node) => node.id === edge.to);
      if (!from || !to) return;
      const x1 = from.position.x + 116;
      const y1 = from.position.y + 34;
      const x2 = to.position.x;
      const y2 = to.position.y + 34;
      const length = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      const line = document.createElement("div");
      line.className = "edge";
      line.style.left = `${x1}px`;
      line.style.top = `${y1}px`;
      line.style.width = `${length}px`;
      line.style.transform = `rotate(${angle}deg)`;
      els.graphView.appendChild(line);
    });
    project.graph.nodes.forEach((node) => {
      const cell = project.cells.find((item) => item.id === node.cellId);
      const el = document.createElement("button");
      el.type = "button";
      el.className = `node${selectedGraphNodeIds.has(node.id) ? " selected" : ""}`;
      el.style.left = `${node.position.x}px`;
      el.style.top = `${node.position.y}px`;
      el.innerHTML = `${cell?.name || node.cellId}<br><span>${cell?.length || "?"}</span>`;
      el.addEventListener("click", (event) => {
        if (!event.ctrlKey && !event.shiftKey && !event.metaKey) selectedGraphNodeIds.clear();
        if (selectedGraphNodeIds.has(node.id)) selectedGraphNodeIds.delete(node.id);
        else selectedGraphNodeIds.add(node.id);
        markDirty();
        draw();
      });
      els.graphView.appendChild(el);
    });
  }

  function addGraphCell() {
    commitHistory();
    const number = project.cells.length + 1;
    const id = `cell${number}`;
    project.cells.push({
      id,
      name: `Cell ${number}`,
      length: project.cells[0].length,
      segments: [],
      glueSegments: [],
      repeat: { mode: "count", count: 1 },
    });
    project.graph.nodes.push({
      id: `node${number}`,
      cellId: id,
      position: { x: 60 + (number - 1) * 180, y: 40 + ((number - 1) % 2) * 58 },
    });
    selectedGraphNodeIds = new Set([`node${number}`]);
    markDirty();
    draw();
  }

  function linkGraphCells() {
    const ids = [...selectedGraphNodeIds];
    if (ids.length !== 2) return;
    const [from, to] = ids;
    if (project.graph.edges.some((edge) => edge.from === from && edge.to === to)) return;
    commitHistory();
    project.graph.edges.push({ id: `edge${project.graph.edges.length + 1}`, from, to, behavior: "wait" });
    markDirty();
    draw();
  }

  function exportProject() {
    const out = clone(project);
    out.global.bpm = Number(els.bpm.value || 80);
    out.global.ppq = Number(els.ppq.value || 1920);
    return out;
  }

  function hitEventAt(x, y) {
    let best = null;
    allEventTargets().forEach((target) => {
      const pad = target.kind === "glueChild" ? 8 : 5;
      if (x < target.x1 - pad || x > target.x2 + pad || y < target.y1 - pad || y > target.y2 + pad) return;
      const dx = x < target.x1 ? target.x1 - x : x > target.x2 ? x - target.x2 : 0;
      const dy = y < target.y1 ? target.y1 - y : y > target.y2 ? y - target.y2 : 0;
      const distance = Math.hypot(dx, dy);
      const priority = target.kind === "glueChild" ? 0 : target.kind === "segment" ? 1 : 2;
      if (!best || distance < best.distance || (distance === best.distance && priority < best.priority)) best = { ...target, distance, priority };
    });
    return best;
  }

  function selectAt(clientX, clientY, additive = false) {
    const rect = els.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const eventHit = hitEventAt(x, y);
    if (eventHit) {
      if (!additive) selectedEventIds.clear();
      if (selectedEventIds.has(eventHit.node.id)) selectedEventIds.delete(eventHit.node.id);
      else selectedEventIds.add(eventHit.node.id);
      selectedId = eventHit.kind === "segment" || eventHit.kind === "glueChild" ? eventHit.node.id : "";
      selectedGlueId = eventHit.kind === "glue" ? eventHit.node.id : "";
      const eventRange = rangeFromSelectedEvents();
      if (eventRange) selectedRange = eventRange;
      markDirty();
      draw();
      return;
    }
    if (additive) return;
    if (!additive) selectedEventIds.clear();
    selectedGlueId = "";
    if (y > 268 && y < 340) {
      const glue = project.cells[0].glueSegments.find((g) => x >= rx(g.sourceRange.start) && x <= rx(g.sourceRange.end));
      if (glue) {
        selectedGlueId = glue.id;
        selectedId = "";
        markDirty();
        draw();
        return;
      }
    }
    const rows = y < 132 ? 0 : y < 194 ? 1 : 2;
    const hit = allSegments().reverse().find(({ seg, depth }) => {
      if (Math.min(depth, 2) !== rows) return false;
      const sx = rx(seg.start);
      const ex = rx(R.parse(seg.start).add(seg.length));
      return x >= sx && x <= ex;
    });
    if (hit) {
      selectedId = hit.seg.id;
      markDirty();
      draw();
    }
  }

  function targetsInDragRect(dragRect) {
    if (!dragRect) return eventsInRange(selectedRange);
    const pad = 2;
    return allEventTargets().filter((target) => {
      const xHit = target.x1 <= dragRect.x2 + pad && target.x2 >= dragRect.x1 - pad;
      const yHit = target.y1 <= dragRect.y2 + pad && target.y2 >= dragRect.y1 - pad;
      return xHit && yHit;
    });
  }

  function snapSelectionToEvents(dragRect = null) {
    const targets = targetsInDragRect(dragRect);
    if (targets.length < 2) return false;
    selectedEventIds = new Set(targets.map(({ node }) => node.id));
    const eventRange = rangeFromEventTargets(targets);
    if (!eventRange) return false;
    selectedRange = eventRange;
    selectedId = "";
    selectedGlueId = "";
    return true;
  }

  function applyEqual() {
    const seg = findSegment(selectedId);
    if (!seg) return;
    commitHistory();
    const parts = Math.max(2, Math.min(16, Number(els.equalParts.value || 2)));
    seg.children = equalChildren(seg.id, seg.start, seg.length, parts);
    markDirty();
    draw();
  }

  function applyRatio() {
    const seg = findSegment(selectedId);
    if (!seg) return;
    const ratios = els.ratio.value.split(":").map((v) => R.parse(v.trim())).filter((v) => v.cmp("0") > 0);
    if (ratios.length < 2) return;
    commitHistory();
    seg.children = ratioChildren(seg.id, seg.start, seg.length, ratios);
    markDirty();
    draw();
  }

  function createGlue() {
    const sourceRange = rangeFromSelectedEvents() || selectedRange;
    if (!sourceRange) return;
    commitHistory();
    const length = R.parse(sourceRange.end).sub(sourceRange.start).toString();
    const id = `glue${project.cells[0].glueSegments.length + 1}`;
    project.cells[0].glueSegments.push({
      id,
      type: "glue",
      cellId: "cell1",
      sourceRange: clone(sourceRange),
      length,
      children: [],
      event: {
        id: `evt_${id}`,
        timeOffset: "0",
        duration: length,
        velocity: 104,
        instrumentId: "kick1",
        midiNote: 36,
      },
    });
    selectedGlueId = id;
    selectedId = "";
    selectedRange = clone(sourceRange);
    selectedEventIds.clear();
    markDirty();
    draw();
  }

  function splitGlue() {
    const glue = activeGlue();
    if (!glue) return;
    commitHistory();
    glue.children = equalChildren(glue.id, glue.sourceRange.start, glue.length, 3).map((seg, index) => withEvent(seg, index));
    selectedEventIds.clear();
    markDirty();
    draw();
  }

  function restoreGlue() {
    const glue = activeGlue();
    if (!glue) return;
    commitHistory();
    project.cells[0].glueSegments = project.cells[0].glueSegments.filter((g) => g.id !== glue.id);
    selectedGlueId = "";
    selectedEventIds.clear();
    markDirty();
    draw();
  }

  function bakeGlue() {
    const glue = activeGlue();
    if (!glue) return;
    commitHistory();
    const baked = makeSegment(`baked_${glue.id}`, glue.sourceRange.start, glue.length, `baked ${glue.id}`, clone(glue.children || []));
    project.cells[0].segments.push(baked);
    project.cells[0].glueSegments = project.cells[0].glueSegments.filter((g) => g.id !== glue.id);
    selectedId = baked.id;
    selectedGlueId = "";
    selectedEventIds.clear();
    markDirty();
    draw();
  }

  function toggleEvent() {
    const target = selectedGlueId ? activeGlue() : findSegment(selectedId);
    if (!target) return;
    commitHistory();
    target.event = target.event ? undefined : {
      id: `evt_${target.id}`,
      timeOffset: "0",
      duration: "1/48",
      velocity: 100,
      instrumentId: "kick1",
      midiNote: 36,
    };
    if (target.event) selectedEventIds.add(target.id);
    else selectedEventIds.delete(target.id);
    markDirty();
    draw();
  }

  function fillVisibleEvents() {
    const glue = activeGlue();
    const targets = glue?.children?.length ? glue.children : allSegments().filter((x) => x.depth === 1).map((x) => x.seg);
    commitHistory();
    targets.forEach((seg, index) => {
      seg.event = {
        id: `evt_${seg.id}`,
        timeOffset: "0",
        duration: "1/48",
        velocity: index % 2 ? 74 : 108,
        instrumentId: "kick1",
        midiNote: 36,
      };
    });
    selectedEventIds = new Set(targets.map((seg) => seg.id));
    markDirty();
    draw();
  }

  function collectEvents() {
    const events = [];
    const push = (seg, source) => {
      if (!seg.event) return;
      const start = seg.start ?? seg.sourceRange?.start;
      if (!start) return;
      const offset = seg.event.timeOffset || "0";
      events.push({
        key: `${source}:${seg.id}`,
        time: secondsFor(R.parse(start).add(offset)),
        duration: secondsFor(seg.event.duration || "1/48"),
        velocity: seg.event.velocity || 96,
      });
    };
    allSegments().forEach(({ seg }) => push(seg, "seg"));
    project.cells[0].glueSegments.forEach((glue) => {
      push(glue, "glue");
      (glue.children || []).forEach((child) => push(child, "glueChild"));
    });
    return events.sort((a, b) => a.time - b.time);
  }

  function ensureAudio() {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    return audio;
  }

  function triggerKick(when, velocity) {
    const ac = ensureAudio();
    const osc = ac.createOscillator();
    const click = ac.createOscillator();
    const gain = ac.createGain();
    const clickGain = ac.createGain();
    const drive = Math.max(0.25, velocity / 127);
    osc.type = "sine";
    click.type = "triangle";
    osc.frequency.setValueAtTime(120, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.09);
    click.frequency.setValueAtTime(940, when);
    click.frequency.exponentialRampToValueAtTime(260, when + 0.045);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.85 * drive, when + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    clickGain.gain.setValueAtTime(0.0001, when);
    clickGain.gain.exponentialRampToValueAtTime(0.18 * drive, when + 0.003);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.055);
    osc.connect(gain).connect(ac.destination);
    click.connect(clickGain).connect(ac.destination);
    osc.start(when);
    click.start(when);
    osc.stop(when + 0.18);
    click.stop(when + 0.06);
  }

  function play() {
    const ac = ensureAudio();
    ac.resume().catch(() => {});
    playing = true;
    audioPlayStart = ac.currentTime - playOffsetSeconds;
    uiPlayStartMs = performance.now() - playOffsetSeconds * 1000;
    scheduledKeys = new Set();
    tick();
  }

  function stop() {
    const seconds = currentSeconds();
    playing = false;
    playOffsetSeconds = seconds;
    cancelAnimationFrame(raf);
    draw();
  }

  function home() {
    playOffsetSeconds = 0;
    if (playing) {
      audioPlayStart = ensureAudio().currentTime;
      uiPlayStartMs = performance.now();
      scheduledKeys = new Set();
    }
    draw();
  }

  function currentSeconds() {
    if (!playing) return playOffsetSeconds;
    const cellSeconds = secondsFor(project.cells[0].length);
    let t = (performance.now() - uiPlayStartMs) / 1000;
    if (els.loop.checked && cellSeconds > 0) t %= cellSeconds;
    return Math.min(t, cellSeconds);
  }

  function formatPosition(seconds, cellSeconds) {
    if (!Number.isFinite(seconds) || !Number.isFinite(cellSeconds) || cellSeconds <= 0) return "0";
    const ppq = Math.max(24, Number(els.ppq.value || 1920));
    const ticksPerWhole = ppq * 4;
    const cellLength = R.parse(project.cells[0].length).valueOf();
    const ticks = Math.round((seconds / cellSeconds) * cellLength * ticksPerWhole);
    return new R(BigInt(ticks), BigInt(ticksPerWhole)).toString();
  }

  function tick() {
    if (!playing) return;
    const ac = ensureAudio();
    const cellSeconds = secondsFor(project.cells[0].length);
    const now = currentSeconds();
    const absoluteNow = ac.currentTime - audioPlayStart;
    const loopIndex = Math.max(0, Math.floor(absoluteNow / cellSeconds));
    const lookahead = 0.16;
    const events = collectEvents();
    [loopIndex, loopIndex + 1].forEach((loop) => {
      events.forEach((event) => {
        const eventAbsolute = loop * cellSeconds + event.time;
        const delta = eventAbsolute - absoluteNow;
        const key = `${loop}:${event.key}:${event.time.toFixed(5)}`;
        if (delta >= -0.015 && delta < lookahead && !scheduledKeys.has(key)) {
          triggerKick(ac.currentTime + Math.max(0, delta), event.velocity);
          scheduledKeys.add(key);
        }
      });
    });
    if (scheduledKeys.size > 400) {
      const recent = [...scheduledKeys].slice(-120);
      scheduledKeys = new Set(recent);
    }
    if (els.loop.checked && absoluteNow >= (loopIndex + 1) * cellSeconds) {
      for (const key of [...scheduledKeys]) {
        if (!key.startsWith(`${loopIndex}:`) && !key.startsWith(`${loopIndex + 1}:`)) scheduledKeys.delete(key);
      }
    }
    if (!els.loop.checked && now >= cellSeconds) {
      playing = false;
      playOffsetSeconds = cellSeconds;
      return draw();
    }
    els.readout.textContent = `${now.toFixed(3)}s / ${formatPosition(now, cellSeconds)}`;
    draw();
    raf = requestAnimationFrame(tick);
  }

  function saveJson() {
    const blob = new Blob([JSON.stringify(exportProject(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rrgm-prototype.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function shareUrl() {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify(exportProject()))));
    location.hash = `project=${payload}`;
    navigator.clipboard?.writeText(location.href);
  }

  function loadFromHash() {
    const m = location.hash.match(/project=([^&]+)/);
    if (!m) return;
    try {
      project = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
      els.bpm.value = project.global.bpm || 80;
      els.ppq.value = project.global.ppq || 1920;
    } catch {
      project = makeInitialProject();
    }
  }

  els.canvas.addEventListener("pointerdown", (event) => {
    const rect = els.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const additive = event.ctrlKey || event.metaKey || event.shiftKey;
    if (!additive) selectedEventIds.clear();
    drag = { startX: x, startY: y, currentX: x, currentY: y, additive };
    els.canvas.setPointerCapture(event.pointerId);
  });

  els.canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    if (drag.additive) return;
    const rect = els.canvas.getBoundingClientRect();
    drag.currentX = event.clientX - rect.left;
    drag.currentY = event.clientY - rect.top;
    const a = clampR(xToR(Math.min(drag.startX, drag.currentX)));
    const b = clampR(xToR(Math.max(drag.startX, drag.currentX)));
    if (b.sub(a).cmp("1/64") > 0) {
      selectedRange = { start: a.toString(), end: b.toString() };
      markDirty();
    }
    draw();
  });

  els.canvas.addEventListener("pointerup", (event) => {
    const moved = drag && Math.abs(drag.currentX - drag.startX) > 6;
    const additive = !!drag?.additive;
    const dragRect = drag ? {
      x1: Math.min(drag.startX, drag.currentX),
      x2: Math.max(drag.startX, drag.currentX),
      y1: Math.min(drag.startY, drag.currentY),
      y2: Math.max(drag.startY, drag.currentY),
    } : null;
    drag = null;
    if (moved && !additive) snapSelectionToEvents(dragRect);
    if (!moved) selectAt(event.clientX, event.clientY, additive);
    markDirty();
    draw();
  });

  function clampR(r) {
    if (r.cmp("0") < 0) return R.parse("0");
    if (r.cmp(project.cells[0].length) > 0) return R.parse(project.cells[0].length);
    return r;
  }

  els.equal.addEventListener("click", applyEqual);
  els.ratioBtn.addEventListener("click", applyRatio);
  els.applyMeter.addEventListener("click", applyMeterPattern);
  els.addGraphNode.addEventListener("click", addGraphCell);
  els.linkGraphNodes.addEventListener("click", linkGraphCells);
  els.glue.addEventListener("click", createGlue);
  els.glueDivide.addEventListener("click", splitGlue);
  els.restore.addEventListener("click", restoreGlue);
  els.bake.addEventListener("click", bakeGlue);
  els.event.addEventListener("click", toggleEvent);
  els.fill.addEventListener("click", fillVisibleEvents);
  els.play.addEventListener("click", play);
  els.stop.addEventListener("click", stop);
  els.home.addEventListener("click", home);
  els.save.addEventListener("click", saveJson);
  els.copyUrl.addEventListener("click", shareUrl);
  els.undo.addEventListener("click", undo);
  els.redo.addEventListener("click", redo);
  els.newBtn.addEventListener("click", () => {
    commitHistory();
    project = makeInitialProject();
    selectedId = "seg1_3";
    selectedGlueId = "";
    selectedRange = { start: "1/2", end: "23/20" };
    selectedEventIds = new Set();
    markDirty();
    draw();
  });
  els.bpm.addEventListener("change", () => {
    commitHistory();
    markDirty();
    draw();
  });
  els.ppq.addEventListener("change", () => {
    commitHistory();
    markDirty();
    draw();
  });
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey) {
      event.preventDefault();
      undo();
    }
    if ((event.ctrlKey || event.metaKey) && (key === "y" || (key === "z" && event.shiftKey))) {
      event.preventDefault();
      redo();
    }
  });
  window.addEventListener("resize", resizeCanvas);

  loadFromHash();
  resizeCanvas();
})();
