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
    groupLabel: $("groupLabel"),
    mergeLabel: $("mergeLabel"),
    groupName: $("groupNameInput"),
    renameGroup: $("renameGroupBtn"),
    groupUp: $("groupUpBtn"),
    groupDown: $("groupDownBtn"),
    groupMerge: $("groupMergeBtn"),
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
  const secPerWhole = () => 4 * 60 / Number(els.bpm.value || activeBlock().bpm || project.settings.bpm || 80);
  const secondsFor = (r) => R.parse(r).valueOf() * secPerWhole();
  const rx = (r) => R.parse(r).valueOf() / R.parse(activeCell().length).valueOf() * metrics.width + metrics.left;
  const xToR = (x) => {
    const ppq = Math.max(24, Number(els.ppq.value || 1920));
    const ticksPerWhole = ppq * 4;
    const cellLength = R.parse(activeCell().length).valueOf();
    const fraction = Math.max(0, Math.min(1, (x - metrics.left) / metrics.width));
    const ticks = Math.round(fraction * cellLength * ticksPerWhole);
    return new R(BigInt(ticks), BigInt(ticksPerWhole));
  };

  const metrics = { left: 46, right: 22, width: 100, top: 30 };

  let project = makeInitialProject();
  let selectedId = "seg1_3";
  let selectedGlueId = "";
  let selectedMeasureId = "";
  let selectedGroupId = "root";
  let selectedRange = { start: "1/2", end: "23/20" };
  let selectedBand = null;
  let selectedEventIds = new Set();
  let selectedGraphNodeIds = new Set(["node1"]);

  function activeBlock() {
    return project.graph.blocks[project.graph.startBlockId];
  }

  function activeLayer() {
    return activeBlock().layers[0];
  }

  function activeCell() {
    return activeLayer().cells[0];
  }

  function makeInitialProject() {
    return {
      version: "0.1.0-prototype",
      title: "Cell Rhythm Machine",
      settings: { bpm: 80, ppq: 1920, variables: [] },
      graph: {
        baseBpm: 80,
        startBlockId: "block_A",
        blocks: {
          block_A: {
            id: "block_A",
            name: "Block A",
            bpm: 80,
            measures: [
              { id: "measure_001", index: 0, meter: { numerator: "4", denominator: "4" }, start: "0", length: "1" },
              { id: "measure_002", index: 1, meter: { numerator: "6", denominator: "7" }, start: "1", length: "6/7" },
            ],
            layers: [{
              id: "layer_001",
              name: "Main Layer",
              cells: [{
                id: "cell_001",
                type: "normal",
                name: "Root Cell",
                start: "0",
                length: "13/7",
                segments: [
                  makeSegment("seg1", "0", "3/4", "3/4 x5", equalChildren("seg1", "0", "3/4", 5)),
                  makeSegment("seg2", "3/4", "1", "1 x5", equalChildren("seg2", "3/4", "1", 5)),
                  makeSegment("seg3", "7/4", "3/28", "tail", []),
                ],
                divisionRows: [],
                groupNames: { root: "Root Group" },
                glueSegments: [{
                  id: "glue1",
                  type: "glue",
                  cellId: "cell_001",
                  sourceRange: { start: "1/2", end: "23/20" },
                  length: "13/20",
                  event: { id: "evt_glue1", timeOffset: "0", duration: "1/48", velocity: 96, instrumentId: "kick1", midiNote: 36 },
                }],
              }],
            }],
            repeat: { mode: "count", count: 4 },
          },
        },
        edges: [],
        view: {
          nodes: [{ id: "node1", blockId: "block_A", position: { x: 60, y: 40 } }],
        },
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
    const visit = (seg, depth = 0, parent = "", groupId = "root") => {
      out.push({ seg, depth, parent, rowId: groupId, groupId });
      (seg.children || []).forEach((child) => visit(child, depth + 1, seg.id, groupId));
    };
    cellGroups().forEach((group) => {
      out.push({ seg: group.row, depth: 0, parent: "", rowId: group.id, groupId: group.id, isDivisionRow: true });
      (group.children || []).forEach((child) => visit(child, 1, group.id, group.id));
    });
    return out;
  }

  function cellGroups() {
    const rows = activeCell().divisionRows || [];
    const byId = new Map(rows.map((row) => [row.id, row]));
    const rawOrder = activeCell().groupOrder?.length ? activeCell().groupOrder : ["root", ...rows.map((row) => row.id)];
    const order = [];
    rawOrder.forEach((id) => {
      if (id === "root" || byId.has(id)) order.push(id);
    });
    if (!order.includes("root")) order.unshift("root");
    rows.forEach((row) => {
      if (!order.includes(row.id)) order.push(row.id);
    });
    activeCell().groupOrder = order;
    return order.map((id) => {
      if (id === "root") {
        return {
          id: "root",
          label: groupName("root"),
          row: makeSegment("root", "0", activeCell().length, "Root Group", []),
          children: activeCell().segments,
        };
      }
      const row = byId.get(id);
      return { id, label: groupName(id, row.label || id), row, children: row.children || [] };
    }).filter((group) => group.id === "root" || group.row);
  }

  function groupName(id, fallback = "Cell Group") {
    return activeCell().groupNames?.[id] || fallback;
  }

  function setGroupName(id, name) {
    if (!activeCell().groupNames) activeCell().groupNames = {};
    activeCell().groupNames[id] = name || (id === "root" ? "Root Group" : id);
    const row = (activeCell().divisionRows || []).find((item) => item.id === id);
    if (row) row.label = activeCell().groupNames[id];
  }

  function allEventTargets() {
    const targets = [];
    allSegments().forEach(({ seg, depth, rowId }) => {
      if (depth > 0) {
        const y = groupRowY(rowId || "root", depth);
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
    activeCell().glueSegments.forEach((glue) => {
      const y = glueY(glue);
      targets.push({
        node: glue,
        depth: 0,
        kind: "glue",
        x1: rx(glue.sourceRange.start),
        x2: rx(glue.sourceRange.end),
        y1: y,
        y2: y + 40,
      });
    });
    return targets;
  }

  function segmentRowY(depth) {
    return ({ 0: 88, 1: 150, 2: 212 })[Math.min(depth, 2)];
  }

  function groupRowY(groupId, depth = 0) {
    const groups = cellGroups();
    const index = Math.max(0, groups.findIndex((group) => group.id === groupId));
    return 88 + index * 92 + Math.min(depth, 2) * 42;
  }

  function glueY(glue) {
    const track = Number(glue.track || 0);
    const groupCount = cellGroups().length;
    return 88 + groupCount * 92 + 20 + track * 24;
  }

  function nextGlueTrack() {
    const tracks = activeCell().glueSegments.map((glue) => Number(glue.track || 0));
    return tracks.length ? Math.max(...tracks) + 1 : 0;
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

  function selectedSourceRefs() {
    const refs = [];
    selectedEventTargets().forEach(({ node, kind }) => {
      refs.push({
        id: node.id,
        type: kind === "glue" ? "glue" : "cell",
        groupId: kind === "glue" ? null : groupForSegment(node.id),
      });
    });
    if (!refs.length && selectedRange) {
      refs.push({ id: selectedGroupId || "range", type: "range", groupId: selectedGroupId || "root" });
    }
    return refs;
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

  function groupForSegment(id) {
    return allSegments().find((entry) => entry.seg.id === id)?.groupId || selectedGroupId || "root";
  }

  function findMeasure(id) {
    return activeBlock().measures.find((measure) => measure.id === id) || null;
  }

  function appendDivisionRow(source, children, label) {
    if (!activeCell().divisionRows) activeCell().divisionRows = [];
    const id = `row_${activeCell().divisionRows.length + 1}`;
    const row = makeSegment(id, source.start, source.length, label || `row ${activeCell().divisionRows.length + 1}`, children);
    row.type = "divisionRow";
    row.sourceId = source.id || "";
    if (source.sourceMeasureId) row.sourceMeasureId = source.sourceMeasureId;
    if (source.meter) row.sourceMeasureId = source.id;
    activeCell().divisionRows.push(row);
    activeCell().groupOrder = [...cellGroups().map((group) => group.id), id].filter((value, index, list) => list.indexOf(value) === index);
    return row;
  }

  function moveSelectedGroup(direction) {
    const order = cellGroups().map((group) => group.id);
    const index = order.indexOf(selectedGroupId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= order.length) return;
    commitHistory();
    [order[index], order[next]] = [order[next], order[index]];
    activeCell().groupOrder = order;
    markDirty();
    draw();
  }

  function renameSelectedGroup() {
    const name = els.groupName.value.trim();
    if (!selectedGroupId || !name) return;
    commitHistory();
    setGroupName(selectedGroupId, name);
    markDirty();
    draw();
  }

  function groupChildren(groupId) {
    const group = cellGroups().find((item) => item.id === groupId);
    return group ? group.children || [] : [];
  }

  function groupsOverlap(groupA, groupB) {
    const aCells = groupChildren(groupA);
    const bCells = groupChildren(groupB);
    return aCells.some((a) => bCells.some((b) => rangesOverlap(a, b)));
  }

  function mergeTargetFor(groupId) {
    const order = cellGroups().map((group) => group.id);
    const sourceIndex = order.indexOf(groupId);
    if (sourceIndex < 0) return null;
    const candidates = [order[sourceIndex - 1], order[sourceIndex + 1]].filter(Boolean);
    return candidates.find((id) => !groupsOverlap(groupId, id)) || null;
  }

  function rangesOverlap(a, b) {
    const aStart = R.parse(a.start);
    const aEnd = aStart.add(a.length);
    const bStart = R.parse(b.start);
    const bEnd = bStart.add(b.length);
    return aStart.cmp(bEnd) < 0 && bStart.cmp(aEnd) < 0;
  }

  function deleteSelectedGroup() {
    if (!selectedGroupId || selectedGroupId === "root") return false;
    commitHistory();
    activeCell().divisionRows = (activeCell().divisionRows || []).filter((row) => row.id !== selectedGroupId);
    activeCell().groupOrder = (activeCell().groupOrder || []).filter((id) => id !== selectedGroupId);
    selectedGroupId = "root";
    selectedId = "";
    selectedEventIds.clear();
    selectedRange = null;
    selectedBand = null;
    markDirty();
    draw();
    return true;
  }

  function mergeSelectedGroup() {
    const order = cellGroups().map((group) => group.id);
    const sourceId = selectedGroupId;
    const sourceIndex = order.indexOf(sourceId);
    if (sourceIndex < 0) return;
    const targetId = mergeTargetFor(sourceId);
    if (!targetId) return;
    commitHistory();
    const sourceChildren = clone(groupChildren(sourceId));
    if (targetId === "root") {
      activeCell().segments.push(...sourceChildren);
    } else {
      const target = (activeCell().divisionRows || []).find((row) => row.id === targetId);
      if (!target) return;
      target.children = [...(target.children || []), ...sourceChildren].sort(compareByStart);
      target.start = minStart(target.children);
      target.length = spanLength(target.children);
      target.label = `${target.label || target.id} + ${sourceId}`;
    }
    if (sourceId === "root") {
      activeCell().segments = [];
    } else {
      activeCell().divisionRows = (activeCell().divisionRows || []).filter((row) => row.id !== sourceId);
    }
    activeCell().groupOrder = order.filter((id) => id !== sourceId);
    selectedGroupId = targetId;
    selectedId = "";
    selectedEventIds.clear();
    markDirty();
    draw();
  }

  function compareByStart(a, b) {
    return R.parse(a.start).cmp(b.start);
  }

  function minStart(cells) {
    if (!cells.length) return "0";
    return cells.map((cell) => R.parse(cell.start)).sort((a, b) => a.cmp(b))[0].toString();
  }

  function spanLength(cells) {
    if (!cells.length) return "0";
    const starts = cells.map((cell) => R.parse(cell.start));
    const ends = cells.map((cell) => R.parse(cell.start).add(cell.length));
    const min = starts.sort((a, b) => a.cmp(b))[0];
    const max = ends.sort((a, b) => b.cmp(a))[0];
    return max.sub(min).toString();
  }

  function activeGlue() {
    return selectedGlueId ? activeCell().glueSegments.find((g) => g.id === selectedGlueId) : null;
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
    ctx.lineWidth = 1;
    ctx.font = "12px Consolas, monospace";
    activeBlock().measures.forEach((measure) => drawMeasureGrid(measure, height));
  }

  function drawMeasureGrid(measure, height) {
    const start = R.parse(measure.start);
    const end = start.add(measure.length);
    const denominator = parseMeterValue(measure.meter.denominator);
    const unit = new R(1n).div(denominator);
    let cursor = start;
    let guard = 0;
    while (cursor.cmp(end) <= 0 && guard < 256) {
      drawGridLine(cursor, cursor.cmp(start) === 0 ? "measure" : "subdivision", height);
      cursor = cursor.add(unit);
      guard += 1;
    }
    drawGridLine(end, "measure", height);
  }

  function drawGridLine(position, kind, height) {
    const x = rx(position);
    const isMeasure = kind === "measure";
    ctx.strokeStyle = isMeasure ? "#52616a" : "#293136";
    ctx.lineWidth = isMeasure ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.fillStyle = isMeasure ? "#edf2ef" : "#aeb9b4";
    ctx.font = "12px Consolas, monospace";
    ctx.fillText(position.toString(), x + 4, 18);
  }

  function drawBars() {
    activeBlock().measures.forEach((bar, index) => {
      const x = rx(bar.start);
      const w = rx(R.parse(bar.start).add(bar.length)) - x;
      const selected = bar.id === selectedMeasureId;
      ctx.fillStyle = selected ? "rgba(242, 198, 109, 0.2)" : index % 2 ? "rgba(126, 183, 255, 0.07)" : "rgba(145, 220, 173, 0.05)";
      ctx.fillRect(x, 28, w, 34);
      ctx.strokeStyle = selected ? "#f2c66d" : "#3a444a";
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(x, 28, w, 34);
      ctx.lineWidth = 1;
      ctx.fillStyle = "#edf2ef";
      ctx.font = "12px Consolas, monospace";
      ctx.fillText(`${bar.index + 1}: ${bar.meter.numerator}/${bar.meter.denominator}`, x + 8, 50);
    });
  }

  function drawSegments() {
    allSegments().forEach(({ seg, depth, parent, rowId, isDivisionRow }) => {
      const y = groupRowY(rowId || "root", depth);
      const x = rx(seg.start);
      const w = Math.max(2, rx(R.parse(seg.start).add(seg.length)) - x);
      const selected = seg.id === selectedId || selectedEventIds.has(seg.id) || (isDivisionRow && rowId === selectedGroupId);
      ctx.fillStyle = isDivisionRow ? "rgba(73, 87, 96, 0.45)" : "rgba(126, 183, 255, 0.38)";
      ctx.strokeStyle = selected ? "#f2c66d" : isDivisionRow ? "#52616a" : "#7eb7ff";
      ctx.lineWidth = selected ? 3 : 1;
      roundRect(x, y, w, isDivisionRow ? 22 : 42, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#edf2ef";
      ctx.font = "12px Consolas, monospace";
      ctx.fillText(isDivisionRow ? seg.label || seg.id : seg.length, x + 7, y + (isDivisionRow ? 15 : 25));
      if (parent && !isDivisionRow) {
        ctx.fillStyle = "#aeb9b4";
        ctx.fillText(seg.label || seg.id, x + 7, y + 39);
      }
      if (seg.event) drawEvent(x + w / 2, y + 6, seg.event.velocity, selectedEventIds.has(seg.id));
    });
  }

  function drawGlue() {
    activeCell().glueSegments.forEach((glue) => {
      const start = glue.sourceRange.start;
      const end = glue.sourceRange.end;
      const x = rx(start);
      const w = rx(end) - x;
      const y = glueY(glue);
      ctx.fillStyle = "rgba(242, 198, 109, 0.25)";
      ctx.strokeStyle = glue.id === selectedGlueId ? "#ff827c" : "#f2c66d";
      ctx.lineWidth = glue.id === selectedGlueId ? 3 : 1;
      roundRect(x, y, w, 38, 6);
      ctx.fill();
      ctx.stroke();
      if (w > 42) {
        ctx.fillStyle = "#f2c66d";
        ctx.font = "12px Consolas, monospace";
        ctx.fillText(glue.length, x + 8, y + 18);
        if (w > 88 && glue.sources?.length) {
          ctx.fillStyle = "#aeb9b4";
          ctx.font = "11px Consolas, monospace";
          ctx.fillText(sourceLabel(glue.sources), x + 8, y + 32);
        }
      }
      if (glue.event) drawEvent(x + 12, y + 8, glue.event.velocity, selectedEventIds.has(glue.id));
    });
  }

  function sourceLabel(sources) {
    const first = sources?.[0];
    if (!first) return "";
    const suffix = sources.length > 1 ? ` +${sources.length - 1}` : "";
    return `${first.type}:${first.id}${suffix}`;
  }

  function drawSelection() {
    if (!selectedRange) return;
    const x = rx(selectedRange.start);
    const w = rx(selectedRange.end) - x;
    const band = selectionBand();
    ctx.fillStyle = "rgba(255, 130, 124, 0.12)";
    ctx.strokeStyle = "rgba(255, 130, 124, 0.7)";
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x, band.y, w, band.h);
    ctx.setLineDash([]);
  }

  function selectionBand() {
    if (drag && !drag.additive) {
      const y1 = Math.min(drag.startY, drag.currentY);
      const y2 = Math.max(drag.startY, drag.currentY);
      return { y: y1, h: Math.max(2, y2 - y1) };
    }
    if (selectedBand) return { y: selectedBand.y, h: selectedBand.h };
    return { y: 70, h: 120 };
  }

  function drawPlayhead() {
    const seconds = currentSeconds();
    const cellSeconds = secondsFor(activeCell().length);
    const pos = R.parse(activeCell().length).mul(String(Math.min(1, seconds / cellSeconds || 0)));
    const x = rx(pos);
    ctx.strokeStyle = "#91dcad";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 24);
    ctx.lineTo(x, Math.max(120, els.canvas.getBoundingClientRect().height - 8));
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
    const measure = findMeasure(selectedMeasureId);
    const eventRange = rangeFromSelectedEvents();
    const selectedEvents = selectedEventIds.size ? ` / notes ${selectedEventIds.size}` : "";
    const cell = activeCell();
    const group = cellGroups().find((item) => item.id === selectedGroupId) || cellGroups()[0];
    els.cellName.textContent = cell.name;
    els.cellLength.textContent = cell.length;
    els.meterLabel.textContent = activeBlock().measures.map((bar) => `${bar.meter.numerator}/${bar.meter.denominator}`).join(" + ");
    els.meterPattern.value = els.meterLabel.textContent;
    els.groupLabel.textContent = group?.label || "Root Group";
    els.groupName.value = group?.label || "Root Group";
    const mergeTarget = mergeTargetFor(selectedGroupId);
    els.mergeLabel.textContent = mergeTarget ? `can merge -> ${groupName(mergeTarget, mergeTarget)}` : "blocked";
    els.groupMerge.disabled = !mergeTarget;
    els.selected.textContent = selectedGlueId && glue
      ? `${selectedGlueId} / ${glue.length}${selectedEvents}`
      : seg
        ? `${seg.id} / ${seg.length}${selectedEvents}`
        : measure
          ? `${measure.id} / ${measure.meter.numerator}/${measure.meter.denominator} source`
          : `none${selectedEvents}`;
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
      selectedMeasureId,
      selectedGroupId,
      selectedRange: clone(selectedRange),
      selectedBand: clone(selectedBand),
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
    selectedMeasureId = state.selectedMeasureId || "";
    selectedGroupId = state.selectedGroupId || "root";
    selectedRange = clone(state.selectedRange || { start: "0", end: "0" });
    selectedBand = clone(state.selectedBand || null);
    selectedEventIds = new Set(state.selectedEventIds || []);
    selectedGraphNodeIds = new Set(state.selectedGraphNodeIds || []);
    els.bpm.value = state.bpm || activeBlock().bpm || project.settings.bpm || 80;
    els.ppq.value = state.ppq || project.settings.ppq || 1920;
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
    activeBlock().layers.forEach((lane) => {
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
    try {
      for (const token of tokens) {
        const slash = token.lastIndexOf("/");
        if (slash <= 0 || slash === token.length - 1) return null;
        const numerator = token.slice(0, slash).trim();
        const denominator = token.slice(slash + 1).trim();
        const length = parseMeterValue(numerator).div(parseMeterValue(denominator));
        bars.push({
          id: `measure_${String(bars.length + 1).padStart(3, "0")}`,
          index: bars.length,
          meter: { numerator, denominator },
          start: cursor.toString(),
          length: length.toString(),
        });
        cursor = cursor.add(length);
      }
    } catch {
      return null;
    }
    return { bars, length: cursor.toString() };
  }

  function parseMeterValue(expr) {
    const text = String(expr || "").trim();
    if (!text) throw new Error("empty meter expression");
    if (text.startsWith("(") && text.endsWith(")")) return parseMeterValue(text.slice(1, -1));
    const slash = text.indexOf("/");
    if (slash > 0) {
      const left = text.slice(0, slash);
      const right = text.slice(slash + 1);
      return parseMeterValue(left).div(parseMeterValue(right));
    }
    if (!/^-?\d+(?:\.\d+)?$/.test(text)) throw new Error("unsupported meter expression");
    return R.parse(text);
  }

  function applyMeterPattern() {
    const parsed = parseMeterPattern(els.meterPattern.value);
    if (!parsed) return;
    commitHistory();
    activeBlock().measures = parsed.bars;
    activeCell().length = parsed.length;
    selectedRange = { start: "0", end: parsed.length };
    selectedBand = { y: 28, h: 34 };
    selectedMeasureId = "";
    selectedEventIds.clear();
    markDirty();
    draw();
  }

  function renderGraph() {
    els.graphView.innerHTML = "";
    const graphNodes = project.graph.view.nodes;
    const minHeight = Math.max(150, ...graphNodes.map((node) => node.position.y + 96));
    const minWidth = Math.max(360, ...graphNodes.map((node) => node.position.x + 170));
    els.graphView.style.minHeight = `${minHeight}px`;
    els.graphView.style.minWidth = `${minWidth}px`;
    project.graph.edges.forEach((edge) => {
      const from = graphNodes.find((node) => node.id === edge.fromNode);
      const to = graphNodes.find((node) => node.id === edge.toNode);
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
    graphNodes.forEach((node) => {
      const block = project.graph.blocks[node.blockId];
      const el = document.createElement("button");
      el.type = "button";
      el.className = `node${selectedGraphNodeIds.has(node.id) ? " selected" : ""}`;
      el.style.left = `${node.position.x}px`;
      el.style.top = `${node.position.y}px`;
      const layerCount = block?.layers?.length || 0;
      el.innerHTML = `${block?.name || node.blockId}<br><span>${block?.measures?.length || 0} measures / ${layerCount} layer</span>`;
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
    const number = Object.keys(project.graph.blocks).length + 1;
    const id = `block_${String.fromCharCode(64 + number) || number}`;
    project.graph.blocks[id] = {
      id,
      name: `Block ${number}`,
      bpm: Number(els.bpm.value || activeBlock().bpm || 80),
      measures: clone(activeBlock().measures),
      layers: [{
        id: `layer_${number.toString().padStart(3, "0")}`,
        name: `Layer ${number}`,
        cells: [{
          id: `cell_${number.toString().padStart(3, "0")}`,
          type: "normal",
          name: `Root Cell ${number}`,
          start: "0",
          length: activeCell().length,
          segments: [],
          glueSegments: [],
        }],
      }],
      repeat: { mode: "count", count: 1 },
    };
    project.graph.view.nodes.push({
      id: `node${number}`,
      blockId: id,
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
    if (project.graph.edges.some((edge) => edge.fromNode === from && edge.toNode === to)) return;
    commitHistory();
    const fromBlock = project.graph.view.nodes.find((node) => node.id === from)?.blockId;
    const toBlock = project.graph.view.nodes.find((node) => node.id === to)?.blockId;
    project.graph.edges.push({
      id: `edge${project.graph.edges.length + 1}`,
      from: fromBlock,
      to: toBlock,
      fromNode: from,
      toNode: to,
      mode: "sequence",
      probability: 1,
      mergePolicy: "wait",
    });
    markDirty();
    draw();
  }

  function exportProject() {
    const out = clone(project);
    out.settings.bpm = Number(els.bpm.value || 80);
    out.settings.ppq = Number(els.ppq.value || 1920);
    out.graph.baseBpm = out.settings.bpm;
    out.graph.blocks[out.graph.startBlockId].bpm = out.settings.bpm;
    out.schemaView = makeSchemaView(out);
    return out;
  }

  function makeSchemaView(snapshot) {
    const block = snapshot.graph.blocks[snapshot.graph.startBlockId];
    const cell = block.layers[0].cells[0];
    const names = cell.groupNames || {};
    const groups = cellGroups().map((group) => ({
      id: group.id,
      name: names[group.id] || group.label,
      order: cell.groupOrder?.indexOf(group.id) ?? 0,
      sourceId: group.row.sourceId || null,
      sourceMeasureId: group.row.sourceMeasureId || null,
      cells: clone(group.children || []),
    }));
    return {
      version: "0.2-cell-groups",
      measures: clone(block.measures || []),
      cellGroups: groups,
      glueCells: clone(cell.glueSegments || []),
      events: collectEvents().map(({ key, time, duration, velocity }) => ({ key, time, duration, velocity })),
    };
  }

  function hitEventAt(x, y) {
    let best = null;
    allEventTargets().forEach((target) => {
      const pad = 5;
      if (x < target.x1 - pad || x > target.x2 + pad || y < target.y1 - pad || y > target.y2 + pad) return;
      const dx = x < target.x1 ? target.x1 - x : x > target.x2 ? x - target.x2 : 0;
      const dy = y < target.y1 ? target.y1 - y : y > target.y2 ? y - target.y2 : 0;
      const distance = Math.hypot(dx, dy);
      const priority = target.kind === "segment" ? 1 : 2;
      if (!best || distance < best.distance || (distance === best.distance && priority < best.priority)) best = { ...target, distance, priority };
    });
    return best;
  }

  function selectAt(clientX, clientY, additive = false) {
    const rect = els.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (!additive && y >= 28 && y <= 62) {
      const measure = activeBlock().measures.find((bar) => x >= rx(bar.start) && x <= rx(R.parse(bar.start).add(bar.length)));
      if (measure) {
        selectedMeasureId = measure.id;
        selectedId = "";
        selectedGlueId = "";
        selectedEventIds.clear();
        selectedRange = { start: measure.start, end: R.parse(measure.start).add(measure.length).toString() };
        selectedBand = { y: 28, h: 34 };
        markDirty();
        draw();
        return;
      }
    }
    const eventHit = hitEventAt(x, y);
    if (eventHit) {
      selectedGroupId = eventHit.kind === "segment" ? groupForSegment(eventHit.node.id) : selectedGroupId;
      selectedMeasureId = "";
      if (!additive) selectedEventIds.clear();
      if (selectedEventIds.has(eventHit.node.id)) selectedEventIds.delete(eventHit.node.id);
      else selectedEventIds.add(eventHit.node.id);
      selectedId = eventHit.kind === "segment" ? eventHit.node.id : "";
      selectedGlueId = eventHit.kind === "glue" ? eventHit.node.id : "";
      const eventRange = rangeFromSelectedEvents();
      if (eventRange) selectedRange = eventRange;
      selectedBand = { y: eventHit.y1, h: Math.max(2, eventHit.y2 - eventHit.y1) };
      markDirty();
      draw();
      return;
    }
    if (additive) return;
    if (!additive) selectedEventIds.clear();
    selectedMeasureId = "";
    selectedGlueId = "";
    const glue = activeCell().glueSegments.find((g) => {
      const gy = glueY(g);
      return y >= gy && y <= gy + 40 && x >= rx(g.sourceRange.start) && x <= rx(g.sourceRange.end);
    });
    if (glue) {
      selectedGlueId = glue.id;
      selectedId = "";
      selectedBand = { y: glueY(glue), h: 40 };
      markDirty();
      draw();
      return;
    }
    const hit = allSegments().reverse().find(({ seg, depth, rowId }) => {
      const gy = groupRowY(rowId || "root", depth);
      if (y < gy || y > gy + (depth === 0 ? 24 : 44)) return false;
      const sx = rx(seg.start);
      const ex = rx(R.parse(seg.start).add(seg.length));
      return x >= sx && x <= ex;
    });
    if (hit) {
      selectedGroupId = hit.groupId || hit.rowId || "root";
      selectedId = hit.depth === 0 ? "" : hit.seg.id;
      selectedMeasureId = "";
      const gy = groupRowY(hit.rowId || "root", hit.depth);
      selectedBand = { y: gy, h: hit.depth === 0 ? 24 : 44 };
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
    selectedMeasureId = "";
    if (dragRect) selectedBand = { y: dragRect.y1, h: Math.max(2, dragRect.y2 - dragRect.y1) };
    return true;
  }

  function deleteSelectedCells() {
    const ids = new Set([...selectedEventIds]);
    if (selectedId) ids.add(selectedId);
    const hasGlue = !!selectedGlueId;
    if (!ids.size && !hasGlue) {
      deleteSelectedGroup();
      return;
    }
    commitHistory();
    if (hasGlue) {
      activeCell().glueSegments = activeCell().glueSegments.filter((glue) => glue.id !== selectedGlueId);
    }
    ids.forEach((id) => {
      if (activeCell().glueSegments.some((glue) => glue.id === id)) {
        activeCell().glueSegments = activeCell().glueSegments.filter((glue) => glue.id !== id);
        return;
      }
      removeSegmentById(activeCell().segments, id);
      activeCell().divisionRows = (activeCell().divisionRows || []).filter((row) => row.id !== id);
      activeCell().groupOrder = (activeCell().groupOrder || []).filter((groupId) => groupId !== id);
      (activeCell().divisionRows || []).forEach((row) => removeSegmentById(row.children || [], id));
    });
    selectedId = "";
    selectedGlueId = "";
    selectedGroupId = "root";
    selectedEventIds.clear();
    selectedRange = null;
    markDirty();
    draw();
  }

  function removeSegmentById(list, id) {
    const index = list.findIndex((seg) => seg.id === id);
    if (index >= 0) {
      list.splice(index, 1);
      return true;
    }
    return list.some((seg) => removeSegmentById(seg.children || [], id));
  }

  function applyEqual() {
    const seg = findSegment(selectedId);
    const glue = !seg && selectedGlueId ? activeGlue() : null;
    const measure = !seg && !glue ? findMeasure(selectedMeasureId) : null;
    if (!seg && !glue && !measure) return;
    commitHistory();
    const parts = Math.max(2, Math.min(16, Number(els.equalParts.value || 2)));
    if (seg) {
      const children = equalChildren(seg.id, seg.start, seg.length, parts);
      if (seg.children?.length) {
        const row = appendDivisionRow(seg, children, `${seg.id} / ${parts}`);
        selectedId = row.id;
        selectedGroupId = row.id;
      } else {
        seg.children = children;
      }
    } else if (glue) {
      const replacements = divideGlue(glue, equalChildren(glue.id, glue.sourceRange.start, glue.length, parts));
      selectedGlueId = replacements?.[0]?.id || "";
      selectedId = "";
      selectedEventIds.clear();
    } else {
      const row = appendDivisionRow(measure, equalChildren(`cell_${measure.id}_${activeCell().divisionRows?.length || 0}`, measure.start, measure.length, parts), `${measure.meter.numerator}/${measure.meter.denominator} / ${parts}`);
      selectedId = row.id;
      selectedGroupId = row.id;
    }
    markDirty();
    draw();
  }

  function applyRatio() {
    const seg = findSegment(selectedId);
    const glue = !seg && selectedGlueId ? activeGlue() : null;
    const measure = !seg && !glue ? findMeasure(selectedMeasureId) : null;
    if (!seg && !glue && !measure) return;
    const ratios = els.ratio.value.split(":").map((v) => R.parse(v.trim())).filter((v) => v.cmp("0") > 0);
    if (ratios.length < 2) return;
    commitHistory();
    if (seg) {
      const children = ratioChildren(seg.id, seg.start, seg.length, ratios);
      if (seg.children?.length) {
        const row = appendDivisionRow(seg, children, `${seg.id} / ratio`);
        selectedId = row.id;
        selectedGroupId = row.id;
      } else {
        seg.children = children;
      }
    } else if (glue) {
      const replacements = divideGlue(glue, ratioChildren(glue.id, glue.sourceRange.start, glue.length, ratios));
      selectedGlueId = replacements?.[0]?.id || "";
      selectedId = "";
      selectedEventIds.clear();
    } else {
      const row = appendDivisionRow(measure, ratioChildren(`cell_${measure.id}_${activeCell().divisionRows?.length || 0}`, measure.start, measure.length, ratios), `${measure.meter.numerator}/${measure.meter.denominator} / ratio`);
      selectedId = row.id;
      selectedGroupId = row.id;
    }
    markDirty();
    draw();
  }

  function createGlue() {
    const sourceRange = rangeFromSelectedEvents() || selectedRange;
    if (!sourceRange) return;
    commitHistory();
    const length = R.parse(sourceRange.end).sub(sourceRange.start).toString();
    const id = `glue${activeCell().glueSegments.length + 1}`;
    activeCell().glueSegments.push({
      id,
      type: "glue",
      cellId: activeCell().id,
      sourceRange: clone(sourceRange),
      sources: selectedSourceRefs(),
      length,
      track: nextGlueTrack(),
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
    selectedMeasureId = "";
    selectedRange = clone(sourceRange);
    selectedBand = { y: glueY(activeGlue()), h: 40 };
    selectedEventIds.clear();
    markDirty();
    draw();
  }

  function divideGlue(glue, parts) {
    const index = activeCell().glueSegments.findIndex((item) => item.id === glue.id);
    if (index < 0 || parts.length < 2) return null;
    const replacements = parts.map((part, partIndex) => {
      const id = `${glue.id}_${partIndex + 1}`;
      const baseTrack = Number(glue.track || 0);
      const next = {
        id,
        type: "glue",
        cellId: glue.cellId,
        track: baseTrack + (partIndex % 2) * 0.45,
        sources: clone(glue.sources || []),
        sourceRange: {
          start: part.start,
          end: R.parse(part.start).add(part.length).toString(),
        },
        length: part.length,
      };
      if (glue.event) {
        next.event = {
          ...clone(glue.event),
          id: `evt_${id}`,
          duration: glue.event.duration === glue.length ? part.length : glue.event.duration,
        };
      }
      return next;
    });
    activeCell().glueSegments.splice(index, 1, ...replacements);
    return replacements;
  }

  function splitGlue() {
    const glue = activeGlue();
    if (!glue) return;
    commitHistory();
    const replacements = divideGlue(glue, equalChildren(glue.id, glue.sourceRange.start, glue.length, 3));
    selectedGlueId = replacements?.[0]?.id || "";
    selectedEventIds.clear();
    selectedId = "";
    markDirty();
    draw();
  }

  function restoreGlue() {
    const glue = activeGlue();
    if (!glue) return;
    commitHistory();
    activeCell().glueSegments = activeCell().glueSegments.filter((g) => g.id !== glue.id);
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
    const targets = selectedGlueId ? [activeGlue()].filter(Boolean) : allSegments().filter((x) => x.depth === 1).map((x) => x.seg);
    if (!targets.length) return;
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
    activeCell().glueSegments.forEach((glue) => push(glue, "glue"));
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
    const cellSeconds = secondsFor(activeCell().length);
    let t = (performance.now() - uiPlayStartMs) / 1000;
    if (els.loop.checked && cellSeconds > 0) t %= cellSeconds;
    return Math.min(t, cellSeconds);
  }

  function formatPosition(seconds, cellSeconds) {
    if (!Number.isFinite(seconds) || !Number.isFinite(cellSeconds) || cellSeconds <= 0) return "0";
    const ppq = Math.max(24, Number(els.ppq.value || 1920));
    const ticksPerWhole = ppq * 4;
    const cellLength = R.parse(activeCell().length).valueOf();
    const ticks = Math.round((seconds / cellSeconds) * cellLength * ticksPerWhole);
    return new R(BigInt(ticks), BigInt(ticksPerWhole)).toString();
  }

  function tick() {
    if (!playing) return;
    const ac = ensureAudio();
    const cellSeconds = secondsFor(activeCell().length);
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
    a.download = "cell-rhythm-machine.json";
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
      els.bpm.value = activeBlock().bpm || project.settings.bpm || 80;
      els.ppq.value = project.settings.ppq || 1920;
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
      selectedBand = {
        y: Math.min(drag.startY, drag.currentY),
        h: Math.max(2, Math.abs(drag.currentY - drag.startY)),
      };
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

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    if (event.target?.matches?.("input, textarea, select, [contenteditable='true']")) return;
    if (!selectedId && !selectedGlueId && selectedEventIds.size === 0 && selectedGroupId === "root") return;
    event.preventDefault();
    deleteSelectedCells();
  });

  function clampR(r) {
    if (r.cmp("0") < 0) return R.parse("0");
    if (r.cmp(activeCell().length) > 0) return R.parse(activeCell().length);
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
  els.event.addEventListener("click", toggleEvent);
  els.fill.addEventListener("click", fillVisibleEvents);
  els.renameGroup.addEventListener("click", renameSelectedGroup);
  els.groupName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      renameSelectedGroup();
    }
  });
  els.groupUp.addEventListener("click", () => moveSelectedGroup(-1));
  els.groupDown.addEventListener("click", () => moveSelectedGroup(1));
  els.groupMerge.addEventListener("click", mergeSelectedGroup);
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
    selectedMeasureId = "";
    selectedGroupId = "root";
    selectedRange = { start: "1/2", end: "23/20" };
    selectedBand = null;
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
