(function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadPatchData() {
    const patch = window.DANZER_PDF_PATCH;
    if (!patch) {
      throw new Error("danzer_patch_data.js was not loaded.");
    }
    const count = window.DANZER_PATCH_CHUNK_COUNT || 0;
    for (let i = 0; i < count; i++) {
      const suffix = String(i).padStart(3, "0");
      await loadScript(`chunks/danzer_patch_chunk_${suffix}.js`);
    }
    return patch;
  }

  function start(patch) {

  const canvas = document.getElementById("patchCanvas");
  const ctx = canvas.getContext("2d");
  const zoomLabel = document.getElementById("zoomLabel");
  const hoverLabel = document.getElementById("hoverLabel");
  const modeSelect = document.getElementById("modeSelect");
  const parentTypeSelect = document.getElementById("parentTypeSelect");
  const groupNameInput = document.getElementById("groupNameInput");
  const edgeToggle = document.getElementById("edgeToggle");
  const dimToggle = document.getElementById("dimToggle");
  const triangleCount = document.getElementById("triangleCount");
  const selectedCount = document.getElementById("selectedCount");
  const groupCount = document.getElementById("groupCount");
  const childCounts = document.getElementById("childCounts");
  const parentInfo = document.getElementById("parentInfo");
  const matchInfo = document.getElementById("matchInfo");
  const groupList = document.getElementById("groupList");
  const exportText = document.getElementById("exportText");
  const colorMapControls = document.getElementById("colorMapControls");
  const statusMessage = document.getElementById("statusMessage");

  const storageKey = "danzer-pdf-mapper-groups-v1";
  const triangles = patch.triangles.map((triangle) => {
    const points = triangle.points.map((point) => ({ x: point[0], y: point[1] }));
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return {
      id: triangle.id,
      color: triangle.color,
      points,
      centroid: {
        x: (points[0].x + points[1].x + points[2].x) / 3,
        y: (points[0].y + points[1].y + points[2].y) / 3,
      },
      bbox: {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      },
    };
  });

  const state = {
    scale: 1,
    offset: { x: 0, y: 0 },
    polygon: [],
    parentPolygon: [],
    selected: new Set(),
    clickedTriangleIds: new Set(),
    clickAnchorTriangleIds: [],
    parentTriangleId: null,
    currentMatch: null,
    hoverId: null,
    groups: loadGroups(),
    dragging: false,
    dragStart: null,
    dragOffset: null,
    dpr: 1,
  };

  triangleCount.textContent = String(triangles.length);
  buildColorMapControls();
  const colorMapSelects = Array.from(document.querySelectorAll("[data-color-map]"));

  function observedColors() {
    return Array.from(new Set(triangles.map((triangle) => triangle.color))).sort();
  }

  function colorLabel(color) {
    return color.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function buildColorMapControls() {
    const defaults = { orange: "A", yellow: "B", navy: "C" };
    const fallbackTypes = ["A", "B", "C"];
    colorMapControls.innerHTML = "";
    observedColors().forEach((color, index) => {
      const label = document.createElement("label");
      const swatchRow = document.createElement("span");
      const swatch = document.createElement("span");
      const text = document.createElement("span");
      const select = document.createElement("select");

      swatchRow.className = "color-label";
      swatch.className = "color-swatch";
      swatch.style.backgroundColor = patch.colors[color] || patch.colors.unknown || "#9ca3af";
      text.textContent = colorLabel(color);
      select.dataset.colorMap = color;

      fallbackTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
      });
      select.value = defaults[color] || fallbackTypes[index % fallbackTypes.length];

      swatchRow.append(swatch, text);
      label.append(swatchRow, select);
      colorMapControls.appendChild(label);
    });
  }

  function loadGroups() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function saveGroups() {
    localStorage.setItem(storageKey, JSON.stringify(state.groups));
  }

  function getColorMap() {
    const result = {};
    colorMapSelects.forEach((select) => {
      result[select.dataset.colorMap] = select.value;
    });
    return result;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    state.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * state.dpr));
    canvas.height = Math.max(1, Math.round(rect.height * state.dpr));
    draw();
  }

  function fitPatch() {
    const rect = canvas.getBoundingClientRect();
    const pad = 28;
    const sx = (rect.width - pad * 2) / patch.page.width;
    const sy = (rect.height - pad * 2) / patch.page.height;
    state.scale = Math.max(0.05, Math.min(sx, sy));
    state.offset.x = (rect.width - patch.page.width * state.scale) / 2;
    state.offset.y = (rect.height - patch.page.height * state.scale) / 2;
    draw();
  }

  function screenToWorld(x, y) {
    return {
      x: (x - state.offset.x) / state.scale,
      y: (y - state.offset.y) / state.scale,
    };
  }

  function worldToScreen(point) {
    return {
      x: point.x * state.scale + state.offset.x,
      y: point.y * state.scale + state.offset.y,
    };
  }

  function eventPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function visibleWorldRect() {
    const rect = canvas.getBoundingClientRect();
    const a = screenToWorld(0, 0);
    const b = screenToWorld(rect.width, rect.height);
    return {
      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    };
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#070b12";
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    const colors = patch.colors;
    const view = visibleWorldRect();
    const hasSelection = state.selected.size > 0;
    const dimOutside = dimToggle.checked && hasSelection;

    for (const triangle of triangles) {
      if (triangle.bbox.maxX < view.minX || triangle.bbox.minX > view.maxX ||
          triangle.bbox.maxY < view.minY || triangle.bbox.minY > view.maxY) {
        continue;
      }
      const isSelected = state.selected.has(triangle.id);
      const isHover = triangle.id === state.hoverId;
      ctx.globalAlpha = dimOutside && !isSelected ? 0.24 : 1;
      ctx.beginPath();
      ctx.moveTo(triangle.points[0].x, triangle.points[0].y);
      ctx.lineTo(triangle.points[1].x, triangle.points[1].y);
      ctx.lineTo(triangle.points[2].x, triangle.points[2].y);
      ctx.closePath();
      ctx.fillStyle = colors[triangle.color] || colors.unknown;
      ctx.fill();
      if (edgeToggle.checked || isSelected || isHover) {
        ctx.globalAlpha = isHover ? 1 : 0.5;
        ctx.lineWidth = (isHover ? 2 : 0.65) / state.scale;
        ctx.strokeStyle = isHover ? "#ffffff" : "#0b1220";
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    drawSavedGroups();
    drawParentPolygon();
    drawCurrentPolygon();
    ctx.restore();

    zoomLabel.textContent = `${Math.round(state.scale * 100)}%`;
    updateStats();
  }

  function drawSavedGroups() {
    state.groups.forEach((group, index) => {
      const hue = (index * 67) % 360;
      ctx.beginPath();
      group.parentPolygon.forEach((point, pointIndex) => {
        if (pointIndex === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.lineWidth = 2.2 / state.scale;
      ctx.strokeStyle = `hsl(${hue} 90% 70%)`;
      ctx.stroke();
    });
  }

  function drawParentPolygon() {
    if (state.parentPolygon.length < 3) return;
    ctx.beginPath();
    state.parentPolygon.forEach((point, pointIndex) => {
      if (pointIndex === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#f472b6";
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3.4 / state.scale;
    ctx.strokeStyle = "#f9a8d4";
    ctx.stroke();
  }

  function drawCurrentPolygon() {
    if (state.polygon.length === 0) return;
    ctx.beginPath();
    state.polygon.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    if (state.polygon.length > 2) ctx.closePath();
    ctx.lineWidth = 2.5 / state.scale;
    ctx.strokeStyle = "#f8d66d";
    ctx.stroke();

    state.polygon.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5 / state.scale, 0, Math.PI * 2);
      ctx.fillStyle = "#f8d66d";
      ctx.fill();
      ctx.lineWidth = 1 / state.scale;
      ctx.strokeStyle = "#111827";
      ctx.stroke();
    });
  }

  function pointInTriangle(point, triangle) {
    const [a, b, c] = triangle.points;
    const d1 = sign(point, a, b);
    const d2 = sign(point, b, c);
    const d3 = sign(point, c, a);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  function sign(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  }

  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const pi = polygon[i];
      const pj = polygon[j];
      const intersects = ((pi.y > point.y) !== (pj.y > point.y)) &&
        point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function setParentFromTriangle(triangle) {
    if (!triangle) return;
    state.parentTriangleId = triangle.id;
    state.parentPolygon = triangle.points.map((point) => ({ x: point.x, y: point.y }));
    state.polygon = [];
    state.selected.clear();
    state.clickAnchorTriangleIds = [];
    rebuildClickedTriangleIds();
    const mappedType = getColorMap()[triangle.color];
    if (mappedType) parentTypeSelect.value = mappedType;
    modeSelect.value = "polygon";
    setStatus(`Parent #${triangle.id} selected. Trace child candidates next.`, "ok");
    draw();
  }

  function rebuildClickedTriangleIds() {
    state.clickedTriangleIds.clear();
    state.clickAnchorTriangleIds.forEach((id) => {
      if (id !== null && id !== undefined) state.clickedTriangleIds.add(id);
    });
  }

  function hitTriangle(world) {
    for (let i = triangles.length - 1; i >= 0; i--) {
      const triangle = triangles[i];
      if (world.x < triangle.bbox.minX || world.x > triangle.bbox.maxX ||
          world.y < triangle.bbox.minY || world.y > triangle.bbox.maxY) {
        continue;
      }
      if (pointInTriangle(world, triangle)) return triangle;
    }
    return null;
  }

  function snapToNearestVertex(world) {
    let best = null;
    let bestDist = 10 / state.scale;
    triangles.forEach((triangle) => {
      triangle.points.forEach((point) => {
        const dist = Math.hypot(point.x - world.x, point.y - world.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = point;
        }
      });
    });
    return best ? { x: best.x, y: best.y } : world;
  }

  function selectInsidePolygon() {
    state.selected.clear();
    if (state.polygon.length < 3) {
      state.clickedTriangleIds.forEach((id) => state.selected.add(id));
      draw();
      return;
    }
    triangles.forEach((triangle) => {
      if (pointInPolygon(triangle.centroid, state.polygon)) {
        state.selected.add(triangle.id);
      }
    });
    state.clickedTriangleIds.forEach((id) => state.selected.add(id));
    draw();
  }

  function triangleEdgeKey(a, b) {
    const ak = `${round(a.x)},${round(a.y)}`;
    const bk = `${round(b.x)},${round(b.y)}`;
    return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
  }

  function cross(origin, a, b) {
    return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
  }

  function convexHull(points) {
    const unique = Array.from(new Map(points.map((point) => [
      `${round(point.x)},${round(point.y)}`,
      { x: round(point.x), y: round(point.y) },
    ])).values()).sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    if (unique.length <= 1) return unique;

    const lower = [];
    unique.forEach((point) => {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 1e-7) {
        lower.pop();
      }
      lower.push(point);
    });

    const upper = [];
    for (let i = unique.length - 1; i >= 0; i--) {
      const point = unique[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 1e-7) {
        upper.pop();
      }
      upper.push(point);
    }

    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  function perpendicularDistance(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length < 1e-9) return Math.hypot(point.x - a.x, point.y - a.y);
    return Math.abs((point.x - a.x) * dy - (point.y - a.y) * dx) / length;
  }

  function polygonTolerance(points) {
    const lengths = polygonEdgeLengths(points);
    const longest = Math.max(...lengths, 1);
    return Math.max(1.25, longest * 0.025);
  }

  function simplifyPolygon(points, tolerance = polygonTolerance(points)) {
    let simplified = points.slice();
    let changed = true;
    while (changed && simplified.length > 3) {
      changed = false;
      for (let i = 0; i < simplified.length; i++) {
        const prev = simplified[(i - 1 + simplified.length) % simplified.length];
        const current = simplified[i];
        const next = simplified[(i + 1) % simplified.length];
        const distance = perpendicularDistance(current, prev, next);
        if (distance <= tolerance) {
          simplified.splice(i, 1);
          changed = true;
          break;
        }
      }
    }
    return simplified;
  }

  function polygonEdgeLengths(points) {
    return points.map((point, index) => {
      const next = points[(index + 1) % points.length];
      return Math.hypot(point.x - next.x, point.y - next.y);
    });
  }

  function normalizedSortedLengths(points) {
    const lengths = polygonEdgeLengths(points).sort((a, b) => a - b);
    const longest = lengths[lengths.length - 1] || 1;
    return lengths.map((value) => value / longest);
  }

  function compareSimilarity(parentPolygon, childOuterPolygon) {
    const simplifiedParent = simplifyPolygon(parentPolygon);
    const simplifiedChild = simplifyPolygon(childOuterPolygon);
    if (simplifiedParent.length < 3 || simplifiedChild.length < 3) {
      return {
        ok: false,
        score: null,
        reason: "Need parent and child outer polygons.",
        parentSides: simplifiedParent.length,
        outerSides: simplifiedChild.length,
        rawParentSides: parentPolygon.length,
        rawOuterSides: childOuterPolygon.length,
      };
    }
    if (simplifiedParent.length !== simplifiedChild.length) {
      return {
        ok: false,
        score: null,
        reason: "Different outer side counts.",
        parentSides: simplifiedParent.length,
        outerSides: simplifiedChild.length,
        rawParentSides: parentPolygon.length,
        rawOuterSides: childOuterPolygon.length,
      };
    }

    const parentLengths = normalizedSortedLengths(simplifiedParent);
    const childLengths = normalizedSortedLengths(simplifiedChild);
    let maxDiff = 0;
    for (let i = 0; i < parentLengths.length; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(parentLengths[i] - childLengths[i]));
    }
    return {
      ok: maxDiff <= 0.025,
      score: round(maxDiff),
      reason: maxDiff <= 0.025 ? "Outer hull is similar by normalized side lengths." : "Outer hull side ratios differ.",
      parentSides: simplifiedParent.length,
      outerSides: simplifiedChild.length,
      rawParentSides: parentPolygon.length,
      rawOuterSides: childOuterPolygon.length,
    };
  }

  function selectedOuterHull() {
    const edges = new Map();
    const addEdge = (a, b, triangleId) => {
      const key = triangleEdgeKey(a, b);
      const item = edges.get(key) || { a, b, owners: [] };
      item.owners.push(triangleId);
      edges.set(key, item);
    };

    state.selected.forEach((id) => {
      const triangle = triangles[id];
      if (!triangle) return;
      for (let i = 0; i < triangle.points.length; i++) {
        addEdge(triangle.points[i], triangle.points[(i + 1) % triangle.points.length], id);
      }
    });

    const boundaryPoints = [];
    edges.forEach((edge) => {
      if (edge.owners.length === 1) {
        boundaryPoints.push(edge.a, edge.b);
      }
    });
    return convexHull(boundaryPoints);
  }

  function currentMatchPayload() {
    const outerHull = selectedOuterHull();
    const simplifiedOuterHull = simplifyPolygon(outerHull);
    const parentPolygon = state.parentPolygon.length >= 3 ? state.parentPolygon : state.polygon;
    const match = compareSimilarity(parentPolygon, outerHull);
    state.currentMatch = {
      ...match,
      outerHull: outerHull.map((point) => [round(point.x), round(point.y)]),
      simplifiedOuterHull: simplifiedOuterHull.map((point) => [round(point.x), round(point.y)]),
    };
    return state.currentMatch;
  }

  function basisCoordinates(point, polygon) {
    if (polygon.length !== 3) return null;
    const [a, b, c] = polygon;
    const ux = b.x - a.x;
    const uy = b.y - a.y;
    const vx = c.x - a.x;
    const vy = c.y - a.y;
    const px = point.x - a.x;
    const py = point.y - a.y;
    const det = ux * vy - uy * vx;
    if (Math.abs(det) < 1e-9) return null;
    return [
      round((px * vy - py * vx) / det),
      round((ux * py - uy * px) / det),
    ];
  }

  function arrayPolygonToPoints(polygon) {
    return (polygon || []).map((point) => (
      Array.isArray(point) ? { x: point[0], y: point[1] } : { x: point.x, y: point.y }
    ));
  }

  function round(value) {
    return Math.round(value * 1000000) / 1000000;
  }

  function setStatus(message, tone = "") {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("ok", tone === "ok");
    statusMessage.classList.toggle("warn", tone === "warn");
  }

  function buildGroupPayload(group) {
    const colorMap = group.colorMap;
    const selectedTriangles = group.triangleIds.map((id) => triangles[id]).filter(Boolean);
    const childCountsValue = { A: 0, B: 0, C: 0 };
    const outerFrame = arrayPolygonToPoints(
      (group.outerMatch && group.outerMatch.simplifiedOuterHull) ||
      (group.outerMatch && group.outerMatch.outerHull) ||
      []
    );
    const children = selectedTriangles.map((triangle) => {
      const childType = colorMap[triangle.color] || "?";
      if (childCountsValue[childType] !== undefined) childCountsValue[childType]++;
      const points = triangle.points.map((point) => [round(point.x), round(point.y)]);
      const localPoints = triangle.points.map((point) => basisCoordinates(point, group.parentPolygon));
      const outerLocalPoints = triangle.points.map((point) => basisCoordinates(point, outerFrame));
      return {
        id: triangle.id,
        color: triangle.color,
        type: childType,
        points,
        localPoints: localPoints.every(Boolean) ? localPoints : undefined,
        outerLocalPoints: outerLocalPoints.every(Boolean) ? outerLocalPoints : undefined,
      };
    });

    return {
      name: group.name,
      parentType: group.parentType,
      parentTriangleId: group.parentTriangleId,
      parentColor: group.parentColor,
      parentPolygon: group.parentPolygon.map((point) => [round(point.x), round(point.y)]),
      childSelectionPolygon: (group.childSelectionPolygon || []).map((point) => [round(point.x), round(point.y)]),
      colorMap,
      outerMatch: group.outerMatch,
      childCounts: childCountsValue,
      children,
    };
  }

  function saveCurrentGroup() {
    if (state.selected.size === 0) selectInsidePolygon();
    const parentPolygon = state.parentPolygon.length >= 3 ? state.parentPolygon : state.polygon;
    if (parentPolygon.length < 3 || state.selected.size === 0) {
      setStatus("Pick a parent and select child candidates before saving.", "warn");
      return;
    }
    const outerMatch = currentMatchPayload();

    const group = {
      name: groupNameInput.value.trim() || `candidate-${state.groups.length + 1}`,
      parentType: parentTypeSelect.value,
      parentTriangleId: state.parentTriangleId,
      parentColor: state.parentTriangleId !== null ? triangles[state.parentTriangleId]?.color : undefined,
      parentPolygon: parentPolygon.map((point) => ({ x: point.x, y: point.y })),
      childSelectionPolygon: state.polygon.map((point) => ({ x: point.x, y: point.y })),
      colorMap: getColorMap(),
      outerMatch,
      triangleIds: Array.from(state.selected).sort((a, b) => a - b),
      createdAt: new Date().toISOString(),
    };

    const existing = state.groups.findIndex((item) => item.name === group.name);
    if (existing >= 0) state.groups[existing] = group;
    else state.groups.push(group);
    saveGroups();
    refreshGroupList();
    updateExport();
    setStatus(
      outerMatch.ok
        ? `${group.parentType} is defined: outer shape ratios match.`
        : `${group.parentType} not defined yet: ${outerMatch.reason}`,
      outerMatch.ok ? "ok" : "warn"
    );
    draw();
  }

  function loadSelectedGroup() {
    const group = state.groups[groupList.selectedIndex];
    if (!group) return;
    state.parentPolygon = group.parentPolygon.map((point) => ({ x: point.x, y: point.y }));
    state.polygon = (group.childSelectionPolygon || []).map((point) => ({ x: point.x, y: point.y }));
    state.selected = new Set(group.triangleIds);
    state.clickedTriangleIds.clear();
    state.clickAnchorTriangleIds = [];
    state.parentTriangleId = group.parentTriangleId ?? null;
    rebuildClickedTriangleIds();
    parentTypeSelect.value = group.parentType;
    groupNameInput.value = group.name;
    colorMapSelects.forEach((select) => {
      const value = group.colorMap[select.dataset.colorMap];
      if (value) select.value = value;
    });
    updateExport();
    draw();
  }

  function deleteSelectedGroup() {
    if (groupList.selectedIndex < 0) return;
    state.groups.splice(groupList.selectedIndex, 1);
    saveGroups();
    refreshGroupList();
    updateExport();
    draw();
  }

  function refreshGroupList() {
    groupList.innerHTML = "";
    const definedTypes = new Set();
    state.groups.forEach((group) => {
      if (group.outerMatch && group.outerMatch.ok) definedTypes.add(group.parentType);
      const option = document.createElement("option");
      const mark = group.outerMatch && group.outerMatch.ok ? "defined" : "candidate";
      option.textContent = `${group.name} (${group.parentType}, ${group.triangleIds.length}, ${mark})`;
      groupList.appendChild(option);
    });
    groupCount.textContent = String(state.groups.length);
    if (definedTypes.size > 0) {
      setStatus(`Defined parent types: ${Array.from(definedTypes).sort().join(", ")}`, "ok");
    }
  }

  function currentExportPayload() {
    const definedTypes = Array.from(new Set(
      state.groups
        .filter((group) => group.outerMatch && group.outerMatch.ok)
        .map((group) => group.parentType)
    )).sort();
    return {
      source: patch.source,
      page: patch.page,
      lengthClusters: patch.lengthClusters,
      definedTypes,
      groups: state.groups.map(buildGroupPayload),
    };
  }

  function updateExport() {
    exportText.value = JSON.stringify(currentExportPayload(), null, 2);
  }

  function updateStats() {
    selectedCount.textContent = String(state.selected.size);
    groupCount.textContent = String(state.groups.length);
    const map = getColorMap();
    const counts = { A: 0, B: 0, C: 0 };
    state.selected.forEach((id) => {
      const triangle = triangles[id];
      const type = triangle ? map[triangle.color] : null;
      if (counts[type] !== undefined) counts[type]++;
    });
    childCounts.textContent = `A ${counts.A} / B ${counts.B} / C ${counts.C}`;
    const parentTriangle = state.parentTriangleId !== null ? triangles[state.parentTriangleId] : null;
    parentInfo.textContent = parentTriangle ? `#${parentTriangle.id} ${parentTriangle.color}` : "None";
    const parentPolygon = state.parentPolygon.length >= 3 ? state.parentPolygon : state.polygon;
    const match = state.selected.size > 0 && parentPolygon.length >= 3 ? currentMatchPayload() : null;
    if (!match) {
      matchInfo.textContent = "No selection";
    } else if (match.ok) {
      matchInfo.textContent = `OK (${match.parentSides}->${match.outerSides}, ${match.score})`;
    } else {
      matchInfo.textContent = `${match.reason} (${match.parentSides}->${match.outerSides})`;
    }
  }

  function downloadExport() {
    const blob = new Blob([exportText.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "triangle-parent-child-groups.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copyExport() {
    updateExport();
    try {
      await navigator.clipboard.writeText(exportText.value);
    } catch (_error) {
      exportText.focus();
      exportText.select();
    }
  }

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (modeSelect.value === "polygon" && state.polygon.length > 0) {
      state.polygon.pop();
      state.clickAnchorTriangleIds.pop();
      rebuildClickedTriangleIds();
      selectInsidePolygon();
    }
  });

  canvas.addEventListener("mousedown", (event) => {
    const pos = eventPosition(event);
    if (event.button === 1 || event.altKey || modeSelect.value === "inspect") {
      state.dragging = true;
      state.dragStart = pos;
      state.dragOffset = { ...state.offset };
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    const pos = eventPosition(event);
    if (state.dragging) {
      state.offset.x = state.dragOffset.x + pos.x - state.dragStart.x;
      state.offset.y = state.dragOffset.y + pos.y - state.dragStart.y;
      draw();
      return;
    }
    const world = screenToWorld(pos.x, pos.y);
    const hit = hitTriangle(world);
    state.hoverId = hit ? hit.id : null;
    hoverLabel.textContent = hit ? `#${hit.id} ${hit.color}` : "No triangle";
    draw();
  });

  window.addEventListener("mouseup", () => {
    state.dragging = false;
  });

  canvas.addEventListener("click", (event) => {
    if (state.dragStart) {
      const pos = eventPosition(event);
      const moved = Math.hypot(pos.x - state.dragStart.x, pos.y - state.dragStart.y);
      state.dragStart = null;
      if (moved > 4) return;
    }

    const pos = eventPosition(event);
    const world = screenToWorld(pos.x, pos.y);
    if (modeSelect.value === "parent") {
      setParentFromTriangle(hitTriangle(world));
    } else if (modeSelect.value === "polygon") {
      const hit = hitTriangle(world);
      state.clickAnchorTriangleIds.push(hit ? hit.id : null);
      rebuildClickedTriangleIds();
      state.polygon.push(snapToNearestVertex(world));
      selectInsidePolygon();
    } else {
      const hit = hitTriangle(world);
      state.selected.clear();
      if (hit) state.selected.add(hit.id);
      draw();
    }
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const pos = eventPosition(event);
    const before = screenToWorld(pos.x, pos.y);
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    state.scale = Math.max(0.03, Math.min(16, state.scale * factor));
    state.offset.x = pos.x - before.x * state.scale;
    state.offset.y = pos.y - before.y * state.scale;
    draw();
  }, { passive: false });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && modeSelect.value === "polygon" && state.polygon.length > 0) {
      event.preventDefault();
      state.polygon.pop();
      state.clickAnchorTriangleIds.pop();
      rebuildClickedTriangleIds();
      selectInsidePolygon();
    }
  });

  document.getElementById("fitButton").addEventListener("click", fitPatch);
  document.getElementById("clearPolygonButton").addEventListener("click", () => {
    state.polygon = [];
    state.selected.clear();
    state.clickedTriangleIds.clear();
    state.clickAnchorTriangleIds = [];
    state.parentTriangleId = null;
    state.parentPolygon = [];
    setStatus("Cleared. Pick a parent triangle, then trace child candidates.");
    draw();
  });
  document.getElementById("selectInsideButton").addEventListener("click", selectInsidePolygon);
  document.getElementById("saveGroupButton").addEventListener("click", saveCurrentGroup);
  document.getElementById("loadGroupButton").addEventListener("click", loadSelectedGroup);
  document.getElementById("deleteGroupButton").addEventListener("click", deleteSelectedGroup);
  document.getElementById("copyButton").addEventListener("click", copyExport);
  document.getElementById("downloadButton").addEventListener("click", downloadExport);
  edgeToggle.addEventListener("change", draw);
  dimToggle.addEventListener("change", draw);
  colorMapSelects.forEach((select) => select.addEventListener("change", () => {
    updateStats();
    updateExport();
  }));

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  fitPatch();
  refreshGroupList();
  updateExport();
  }

  loadPatchData().then(start).catch((error) => {
    const message = document.createElement("pre");
    message.style.cssText = "margin:16px;color:#fecaca;white-space:pre-wrap";
    message.textContent = error.stack || String(error);
    document.body.appendChild(message);
  });
}());
