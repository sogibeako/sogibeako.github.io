/**
 * CatDiagram2.js v0.1
 * 圏論図式の表示・編集・ASCII出力を行うモジュール。
 */

const CatDiagram = (() => {
  // --- Geometry Utilities ---
  
  function getCenter(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function distance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  function midpoint(p1, p2) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }

  function normalVector(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = distance(p1, p2);
    if (len === 0) return { x: 0, y: -1 };
    // Rotate 90 degrees: (x,y) -> (-y, x)
    return { x: -dy / len, y: dx / len };
  }

  function intersectRectRay(rect, center, target, padding = 4) {
    const w = rect.width / 2 + padding;
    const h = rect.height / 2 + padding;
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    
    if (dx === 0 && dy === 0) return { x: center.x, y: center.y };
    
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    let x, y;
    if (absDx * h > absDy * w) {
      // Intersects left/right
      x = center.x + Math.sign(dx) * w;
      y = center.y + dy * (Math.sign(dx) * w / dx);
    } else {
      // Intersects top/bottom
      y = center.y + Math.sign(dy) * h;
      x = center.x + dx * (Math.sign(dy) * h / dy);
    }
    return { x, y };
  }

  function makeCurvedPath(start, end, curve) {
    if (!curve || curve === 0) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    }
    const mid = midpoint(start, end);
    const normal = normalVector(start, end);
    const control = {
      x: mid.x + normal.x * curve,
      y: mid.y + normal.y * curve
    };
    return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
  }

  // --- Layout Calculation ---

  function computeInitialLayout(data) {
    const opts = data.options || {};
    const layout = opts.layout || "grid";
    
    if (layout === "grid") {
      const grid = opts.grid || { cellWidth: 160, cellHeight: 120 };
      const offsetX = grid.offsetX || 100;
      const offsetY = grid.offsetY || 100;
      
      for (const node of data.nodes) {
        if (typeof node.row === "number" && typeof node.col === "number") {
          node.x = offsetX + node.col * grid.cellWidth;
          node.y = offsetY + node.row * grid.cellHeight;
        }
      }
    }
  }

  // --- Rendering ---

  async function render(containerSelector, data, renderOptions = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) throw new Error(`Container ${containerSelector} not found`);
    
    // Setup HTML
    container.innerHTML = `
      <div class="cat-diagram">
        <svg class="cat-arrows">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
            </marker>
            <marker id="arrowhead-dashed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
            </marker>
            <marker id="double-arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <rect x="-2" y="0" width="14" height="12" fill="var(--cat-bg, #fdfdfd)" />
              <path d="M 0 2 L 10 6 L 0 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" />
            </marker>
          </defs>
        </svg>
        <div class="cat-nodes"></div>
        <div class="cat-arrow-labels"></div>
      </div>
    `;
    
    const svgLayer = container.querySelector('.cat-arrows');
    const nodesLayer = container.querySelector('.cat-nodes');
    const labelsLayer = container.querySelector('.cat-arrow-labels');

    computeInitialLayout(data);

    // Calculate auto-crop offsets for embed mode
    let offsetX = 0;
    let offsetY = 0;
    if (!renderOptions.builderMode && data.nodes && data.nodes.length > 0) {
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      for (const node of data.nodes) {
        if (node.x < minX) minX = node.x;
        if (node.x > maxX) maxX = node.x;
        if (node.y < minY) minY = node.y;
        if (node.y > maxY) maxY = node.y;
      }
      
      // Add padding for curved arrows and labels
      const paddingX = 60;
      const paddingY = 60;
      
      offsetX = -minX + paddingX;
      offsetY = -minY + paddingY;
      
      const width = maxX - minX + paddingX * 2;
      const height = maxY - minY + paddingY * 2;
      
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.display = "inline-block";
      container.style.verticalAlign = "middle";
    }

    // 1. Render Nodes (HTML)
    const nodeElements = {};
    for (const node of data.nodes) {
      const el = document.createElement('div');
      el.className = 'cat-node';
      el.id = `cat-node-${node.id}`;
      el.style.left = `${node.x + offsetX}px`;
      el.style.top = `${node.y + offsetY}px`;
      
      // MathJax 処理のために `\(` `\)` で囲む
      // すでに囲まれているかもしれないので簡単なチェック
      let labelTex = node.label;
      if (!labelTex.startsWith('\\(') && !labelTex.startsWith('$')) {
        labelTex = `\\( ${labelTex} \\)`;
      }
      el.innerHTML = `<span class="cat-node-label">${labelTex}</span>`;
      nodesLayer.appendChild(el);
      nodeElements[node.id] = el;
    }

    // 2. Wait for MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
      await window.MathJax.typesetPromise([nodesLayer]);
    }

    // 3. Measure Nodes
    const nodeBounds = {};
    const layerRect = nodesLayer.getBoundingClientRect();
    for (const node of data.nodes) {
      const el = nodeElements[node.id];
      const rect = el.getBoundingClientRect();
      // layer に対する相対座標でのサイズを記憶
      nodeBounds[node.id] = {
        width: rect.width,
        height: rect.height,
        // center in layout coordinates
        cx: node.x + offsetX,
        cy: node.y + offsetY
      };
    }

    // Ensure all arrows have IDs
    if (data.arrows) {
      data.arrows.forEach((a, i) => {
        if (!a.id) a.id = "A" + Date.now() + Math.random().toString(36).substr(2, 5) + i;
      });
    }

    // 4. Calculate Arrows and SVG paths
    const arrowGeometries = [];
    let svgContent = svgLayer.innerHTML; // keep defs

    let unresolvedArrows = data.arrows ? data.arrows.map((a, i) => ({ i, arrow: a })) : [];
    let progress = true;

    while (unresolvedArrows.length > 0 && progress) {
      progress = false;
      const nextUnresolved = [];

      for (const item of unresolvedArrows) {
        const { i, arrow } = item;
        const fromBounds = nodeBounds[arrow.from];
        const toBounds = nodeBounds[arrow.to];

        if (!fromBounds || !toBounds) {
          nextUnresolved.push(item);
          continue;
        }

        progress = true;

        const isSelfLoop = arrow.from === arrow.to;
        let start, end, d, mid;

        if (isSelfLoop) {
          const padding = 2;
          start = { x: fromBounds.cx - 15, y: fromBounds.cy - fromBounds.height/2 - padding };
          end = { x: fromBounds.cx + 15, y: fromBounds.cy - fromBounds.height/2 - padding };
          const cp1 = { x: start.x - 20, y: start.y - 50 };
          const cp2 = { x: end.x + 20, y: end.y - 50 };
          
          if (arrow.shift) {
            start.y -= arrow.shift; end.y -= arrow.shift;
            cp1.y -= arrow.shift; cp2.y -= arrow.shift;
          }
          
          d = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
          mid = { x: fromBounds.cx, y: start.y - 40 }; 
        } else {
          const p1 = { x: fromBounds.cx, y: fromBounds.cy };
          const p2 = { x: toBounds.cx, y: toBounds.cy };

          const padding = 6;
          start = intersectRectRay({ width: fromBounds.width, height: fromBounds.height }, p1, p2, padding);
          end = intersectRectRay({ width: toBounds.width, height: toBounds.height }, p2, p1, padding);

          const shift = arrow.shift || 0;
          if (shift !== 0) {
            const norm = normalVector(start, end);
            start.x += norm.x * shift; start.y += norm.y * shift;
            end.x += norm.x * shift; end.y += norm.y * shift;
          }

          const curve = arrow.curve || 0;
          d = makeCurvedPath(start, end, curve);
          
          if (curve !== 0) {
            const norm = normalVector(start, end);
            const m = midpoint(start, end);
            const cx = m.x + norm.x * curve;
            const cy = m.y + norm.y * curve;
            mid = {
              x: 0.25 * start.x + 0.5 * cx + 0.25 * end.x,
              y: 0.25 * start.y + 0.5 * cy + 0.25 * end.y
            };
            const pushDist = (curve > 0 ? 12 : -12);
            mid.x += norm.x * pushDist; mid.y += norm.y * pushDist;
          } else {
            mid = midpoint(start, end);
            const norm = normalVector(start, end);
            mid.x += norm.x * 12; mid.y += norm.y * 12;
          }
        }

        const isSelected = renderOptions.selectedArrowIdx === i;
        const strokeColor = isSelected ? "#007bff" : "currentColor";
        const strokeWidth = isSelected ? "2.5" : "1.5";
        const pathId = `cat-arrow-path-${i}`;
        
        // Apply label offset
        mid.x += (arrow.labelOffsetX || 0);
        mid.y += (arrow.labelOffsetY || 0);

        let strokeDash = "";
        if (arrow.style === "dashed" || arrow.kind === "natural") strokeDash = "stroke-dasharray='4,4'";

        if (arrow.style === "double") {
          const totalWidth = isSelected ? 6.5 : 5.5;
          const innerWidth = 2.5;
          svgContent += `<path d="${d}" stroke="${strokeColor}" stroke-width="${totalWidth}" fill="none" />`;
          svgContent += `<path d="${d}" stroke="var(--cat-bg, #fdfdfd)" stroke-width="${innerWidth}" fill="none" />`;
          svgContent += `<path id="${pathId}" data-arrow-index="${i}" d="${d}" stroke="transparent" fill="none" style="pointer-events: auto; cursor: pointer;" stroke-width="8" />`;
          svgContent += `<path d="${d}" stroke="none" fill="none" marker-end="url(#double-arrowhead)" stroke-width="1.5" style="pointer-events: none;" />`;
        } else {
          svgContent += `<path id="${pathId}" data-arrow-index="${i}" d="${d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" marker-end="url(#arrowhead)" ${strokeDash} style="pointer-events: auto; cursor: pointer;" />`;
        }

        arrowGeometries.push({ i, arrow, start, end, mid });
        
        nodeBounds[arrow.id] = {
          width: 20, height: 20, cx: mid.x, cy: mid.y
        };
      }
      unresolvedArrows = nextUnresolved;
    }
    
    svgLayer.innerHTML = svgContent;

    // 5. Render Arrow Labels
    for (const geom of arrowGeometries) {
      if (!geom.arrow.label) continue;
      
      const el = document.createElement('div');
      el.className = 'cat-arrow-label';
      el.dataset.arrowIndex = geom.i;
      el.style.left = `${geom.mid.x}px`;
      el.style.top = `${geom.mid.y}px`;
      el.style.cursor = 'pointer';
      
      let labelTex = geom.arrow.label;
      if (!labelTex.startsWith('\\(') && !labelTex.startsWith('$')) {
        labelTex = `\\( ${labelTex} \\)`;
      }
      el.innerHTML = labelTex;
      labelsLayer.appendChild(el);
    }

    if (renderOptions.showGuides) {
      const xMap = new Map();
      const yMap = new Map();
      for (const node of data.nodes) {
        xMap.set(node.x + offsetX, (xMap.get(node.x + offsetX) || 0) + 1);
        yMap.set(node.y + offsetY, (yMap.get(node.y + offsetY) || 0) + 1);
      }
      
      let guideSvg = "";
      for (const [x, count] of xMap.entries()) {
        if (count > 1) {
          guideSvg += `<line x1="${x}" y1="-2000" x2="${x}" y2="2000" stroke="rgba(255, 0, 0, 0.4)" stroke-width="1" stroke-dasharray="5,5" style="pointer-events:none;" />`;
        }
      }
      for (const [y, count] of yMap.entries()) {
        if (count > 1) {
          guideSvg += `<line x1="-2000" y1="${y}" x2="2000" y2="${y}" stroke="rgba(255, 0, 0, 0.4)" stroke-width="1" stroke-dasharray="5,5" style="pointer-events:none;" />`;
        }
      }
      svgLayer.innerHTML += guideSvg;
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
      await window.MathJax.typesetPromise([labelsLayer]);
    }

    return {
      exportAscii: () => toAscii(data),
      exportJson: () => JSON.stringify(data, null, 2)
    };
  }

  // --- ASCII Export ---

  function toAscii(data) {
    if (!data.nodes || data.nodes.length === 0) return "";
    
    // 簡易的なASCIIジェネレータ。
    // row/col がある場合はそれを使い、無い場合は x/y をソートして疑似グリッド化する。
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;
    
    const nodeMap = new Map();
    const hasGrid = data.nodes.some(n => n.row !== undefined);
    
    if (hasGrid) {
      for (const node of data.nodes) {
        minRow = Math.min(minRow, node.row);
        maxRow = Math.max(maxRow, node.row);
        minCol = Math.min(minCol, node.col);
        maxCol = Math.max(maxCol, node.col);
        nodeMap.set(`${node.row},${node.col}`, node);
      }
    } else {
      // 座標に基づくヒューリスティックグリッド化は複雑なため、今回は未実装。
      return "[ASCII Export: Needs grid layout data (row/col)]";
    }

    let result = "";
    
    for (let r = minRow; r <= maxRow; r++) {
      let nodeLine = "";
      let vertArrowLine = "";
      
      for (let c = minCol; c <= maxCol; c++) {
        const node = nodeMap.get(`${r},${c}`);
        
        let nodeStr = "        "; // 8 chars default spacing
        if (node) {
          // Label formatting
          let lbl = node.label.replace(/\\mathcal{([A-Z])}/g, "$1").replace(/\\operatorname{([^}]+)}/, "$1");
          nodeStr = lbl.padEnd(8, " ");
        }
        
        // Find horizontal arrows from this node
        let horizArrowStr = "        ";
        let downArrowStr = "        ";
        
        if (node) {
          const rightArrow = data.arrows.find(a => a.from === node.id && nodeMap.get(`${r},${c+1}`) && a.to === nodeMap.get(`${r},${c+1}`).id);
          if (rightArrow) {
            let label = rightArrow.label || "";
            // ASCII用簡易変換
            label = label.replace(/\\/g, "");
            horizArrowStr = ` --${label}--> `;
            horizArrowStr = horizArrowStr.padEnd(8, " ");
          }
          
          const downArrow = data.arrows.find(a => a.from === node.id && nodeMap.get(`${r+1},${c}`) && a.to === nodeMap.get(`${r+1},${c}`).id);
          if (downArrow) {
            downArrowStr = `${downArrow.label || "|"}`.padEnd(8, " ");
            vertArrowLine += "v       " + horizArrowStr; // roughly... this is very hard to align perfectly without a full grid engine
          } else {
            vertArrowLine += "        " + horizArrowStr;
          }
        }
        
        nodeLine += nodeStr + horizArrowStr;
      }
      result += nodeLine.trimEnd() + "\n";
      
      // vertical arrows display logic
      let hasDown = false;
      let midLine1 = "";
      let midLine2 = "";
      for (let c = minCol; c <= maxCol; c++) {
        const node = nodeMap.get(`${r},${c}`);
        const downArrow = node ? data.arrows.find(a => a.from === node.id && nodeMap.get(`${r+1},${c}`) && a.to === nodeMap.get(`${r+1},${c}`).id) : null;
        if (downArrow) {
          hasDown = true;
          let label = (downArrow.label || "").replace(/\\/g, "");
          midLine1 += `|       `.padEnd(16, " ");
          midLine2 += `${label}       `.padEnd(16, " ");
        } else {
          midLine1 += "                ";
          midLine2 += "                ";
        }
      }
      if (hasDown && r < maxRow) {
        result += midLine1.trimEnd() + "\n";
        result += midLine2.trimEnd() + "\n";
        result += midLine1.replace(/\|/g, "v").trimEnd() + "\n";
      }
    }
    
    return result;
  }

  return {
    render,
    toAscii
  };
})();

// --- Templates ---
const CatTemplates = {
  square(args) {
    return {
      options: { layout: "grid", grid: { cellWidth: 160, cellHeight: 120 } },
      nodes: [
        { id: "A", label: args.A || "A", row: 0, col: 0 },
        { id: "B", label: args.B || "B", row: 0, col: 1 },
        { id: "C", label: args.C || "C", row: 1, col: 0 },
        { id: "D", label: args.D || "D", row: 1, col: 1 }
      ],
      arrows: [
        { from: "A", to: "B", label: args.top || "f" },
        { from: "A", to: "C", label: args.left || "g" },
        { from: "B", to: "D", label: args.right || "h" },
        { from: "C", to: "D", label: args.bottom || "k" }
      ]
    };
  },
  
  triangle(args) {
    return {
      options: { layout: "manual" },
      nodes: [
        { id: "A", label: args.A || "A", x: 200, y: 50 },
        { id: "B", label: args.B || "B", x: 100, y: 150 },
        { id: "C", label: args.C || "C", x: 300, y: 150 }
      ],
      arrows: [
        { from: "A", to: "B", label: args.f || "f" },
        { from: "A", to: "C", label: args.g || "g" },
        { from: "B", to: "C", label: args.h || "h" }
      ]
    };
  },

  adjunction(args) {
    return {
      options: { layout: "manual" },
      nodes: [
        { id: "C", label: args.C || "\\mathcal{C}", x: 100, y: 100 },
        { id: "D", label: args.D || "\\mathcal{D}", x: 340, y: 100 },
        { id: "note", label: args.notation || "F \\dashv G", x: 220, y: 170, shape: "none" }
      ],
      arrows: [
        { id: "F", from: "C", to: "D", label: args.F || "F", curve: -30, kind: "functor" },
        { id: "G", from: "D", to: "C", label: args.G || "G", curve: -30, kind: "functor" }
      ]
    };
  },
  
  monoidal_pentagon() {
    return {
      options: { layout: "manual" },
      nodes: [
        { id: "N1", label: "((A \\otimes B) \\otimes C) \\otimes D", x: 400, y: 50 },
        { id: "N2", label: "(A \\otimes (B \\otimes C)) \\otimes D", x: 150, y: 150 },
        { id: "N3", label: "(A \\otimes B) \\otimes (C \\otimes D)", x: 650, y: 150 },
        { id: "N4", label: "A \\otimes ((B \\otimes C) \\otimes D)", x: 250, y: 350 },
        { id: "N5", label: "A \\otimes (B \\otimes (C \\otimes D))", x: 550, y: 350 }
      ],
      arrows: [
        { id: "A1", from: "N1", to: "N2", label: "\\alpha \\otimes 1" },
        { id: "A2", from: "N1", to: "N3", label: "\\alpha" },
        { id: "A3", from: "N2", to: "N4", label: "\\alpha" },
        { id: "A4", from: "N3", to: "N5", label: "\\alpha" },
        { id: "A5", from: "N4", to: "N5", label: "1 \\otimes \\alpha" }
      ]
    };
  },
  
  monoidal_triangle() {
    return {
      options: { layout: "manual" },
      nodes: [
        { id: "N1", label: "(A \\otimes I) \\otimes B", x: 200, y: 100 },
        { id: "N2", label: "A \\otimes (I \\otimes B)", x: 600, y: 100 },
        { id: "N3", label: "A \\otimes B", x: 400, y: 250 }
      ],
      arrows: [
        { id: "A1", from: "N1", to: "N2", label: "\\alpha" },
        { id: "A2", from: "N1", to: "N3", label: "\\rho \\otimes 1" },
        { id: "A3", from: "N2", to: "N3", label: "1 \\otimes \\lambda" }
      ]
    };
  },

  natural_transformation() {
    return {
      options: { layout: "manual" },
      nodes: [
        { id: "C", label: "\\mathcal{C}", x: 200, y: 200 },
        { id: "D", label: "\\mathcal{D}", x: 500, y: 200 }
      ],
      arrows: [
        { id: "F", from: "C", to: "D", label: "F", curve: -40 },
        { id: "G", from: "C", to: "D", label: "G", curve: 40 },
        { id: "alpha", from: "F", to: "G", label: "\\alpha", style: "double", labelOffsetX: 0, labelOffsetY: 0 }
      ]
    };
  },

  leftKanExtension(args) {
    return {
      options: { layout: "grid", grid: { cellWidth: 160, cellHeight: 120 } },
      nodes: [
        { id: "A", label: args.A || "\\mathcal{A}", row: 0, col: 0 },
        { id: "C1", label: args.C || "\\mathcal{C}", row: 0, col: 1 },
        { id: "B", label: args.B || "\\mathcal{B}", row: 1, col: 0 },
        { id: "C2", label: args.C || "\\mathcal{C}", row: 1, col: 1 }
      ],
      arrows: [
        { from: "A", to: "C1", label: args.F || "F", kind: "functor" },
        { from: "A", to: "B", label: args.K || "K", kind: "functor" },
        { from: "B", to: "C2", label: args.Lan || "\\operatorname{Lan}_K F", kind: "functor" },
        { from: "C1", to: "C2", label: args.alpha || "\\alpha", kind: "natural", style: "dashed" }
      ]
    };
  }
};

// --- Builder ---
class CatDiagramBuilder {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    this.data = options.initialData || { nodes: [], arrows: [] };
    this.canvasId = "cat-canvas-" + Math.random().toString(36).substr(2, 9);
    
    // Current state
    this.currentTool = "select";
    this.selectedNodeIds = new Set();
    this.selectedArrowIdx = null;
    this.pendingArrowStart = null;
    this.isDrawingArrow = false;
    this.isDraggingNode = false;
    this.dragStartPositions = new Map();
    this.dragStartMouse = { x: 0, y: 0 };
    this.isSelectingBox = false;
    this.selectionBoxStart = null;
    this.internalClipboard = null;

    this.history = [];
    this.historyIndex = -1;
    this.saveHistory();

    this.initUI();
    this.bindEvents();
    this.render();
  }

  initUI() {
    this.container.innerHTML = `
      <div id="cat-builder">
        <div class="toolbar">
          <button data-tool="select" class="active">選択</button>
          <button data-tool="node">ノード追加</button>
          <button data-tool="arrow">矢印追加</button>
          <select id="templateSelect">
            <option value="">テンプレート挿入</option>
            <option value="square">可換四角形 (Square)</option>
            <option value="triangle">三角図式 (Triangle)</option>
            <option value="adjunction">随伴 (Adjunction)</option>
            <option value="monoidal_pentagon">モノイダル・五角形</option>
            <option value="monoidal_triangle">モノイダル・三角形</option>
            <option value="natural_transformation">自然変換 (2-射)</option>
          </select>
          <button id="exportJson">JSONコピー</button>
        </div>
        <div id="builder-main">
          <div id="${this.canvasId}" class="cat-diagram-container"></div>
          <aside id="cat-inspector">
            <h3 id="inspector-title">選択なし</h3>
            <div id="inspector-content">
              <!-- Dynamically filled -->
            </div>
          </aside>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const tools = this.container.querySelectorAll('[data-tool]');
    tools.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tools.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentTool = e.target.dataset.tool;
        this.pendingArrowStart = null;
      });
    });

    const canvas = this.container.querySelector(`#${this.canvasId}`);
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    const tplSelect = this.container.querySelector('#templateSelect');
    tplSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val && CatTemplates[val]) {
        this.data = CatTemplates[val]({});
        // Convert to manual for editing
        this.data.nodes.forEach(n => {
          if (n.row !== undefined) {
            n.x = 100 + n.col * 160;
            n.y = 100 + n.row * 120;
            delete n.row;
            delete n.col;
          }
        });
        this.data.options = { layout: "manual" };
        this.saveHistory();
        this.render();
        tplSelect.value = "";
      }
    });

    this.container.querySelector('#exportJson').addEventListener('click', () => {
      navigator.clipboard.writeText(JSON.stringify(this.data, null, 2));
      alert("JSONをコピーしました");
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        this.copySelection();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        this.cutSelection();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        this.pasteSelection();
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelection();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        this.redo();
        e.preventDefault();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (this.selectedNodeIds.size > 0) {
          const step = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          
          for (const id of this.selectedNodeIds) {
            const node = this.data.nodes.find(n => n.id === id);
            if (node) {
              node.x += dx;
              node.y += dy;
            }
          }
          this.saveHistory();
          this.render();
          this.updateInspector();
          e.preventDefault();
        }
      }
    });
  }

  copySelection() {
    if (this.selectedNodeIds.size === 0) return;
    const nodes = [];
    const arrows = [];
    
    for (const id of this.selectedNodeIds) {
      const node = this.data.nodes.find(n => n.id === id);
      if (node) nodes.push(JSON.parse(JSON.stringify(node)));
    }
    
    for (const arrow of this.data.arrows || []) {
      if (this.selectedNodeIds.has(arrow.from) && this.selectedNodeIds.has(arrow.to)) {
        arrows.push(JSON.parse(JSON.stringify(arrow)));
      }
    }
    
    this.internalClipboard = { nodes, arrows };
  }

  deleteSelection() {
    if (this.selectedArrowIdx !== null) {
      this.data.arrows.splice(this.selectedArrowIdx, 1);
      this.selectedArrowIdx = null;
    }
    
    if (this.selectedNodeIds.size > 0) {
      this.data.nodes = this.data.nodes.filter(n => !this.selectedNodeIds.has(n.id));
      if (this.data.arrows) {
        this.data.arrows = this.data.arrows.filter(a => !this.selectedNodeIds.has(a.from) && !this.selectedNodeIds.has(a.to));
      }
      this.selectedNodeIds.clear();
    }
    
    this.saveHistory();
    this.updateInspector();
    this.render();
  }

  cutSelection() {
    this.copySelection();
    this.deleteSelection();
  }

  pasteSelection() {
    if (!this.internalClipboard || this.internalClipboard.nodes.length === 0) return;
    
    this.selectedNodeIds.clear();
    const idMap = new Map();
    
    for (const n of this.internalClipboard.nodes) {
      const newId = "N" + Date.now() + Math.floor(Math.random() * 1000);
      idMap.set(n.id, newId);
      
      const newNode = { ...n, id: newId, x: n.x + 20, y: n.y + 20 };
      this.data.nodes.push(newNode);
      this.selectedNodeIds.add(newId);
    }
    
    this.data.arrows = this.data.arrows || [];
    for (const a of this.internalClipboard.arrows) {
      if (idMap.has(a.from) && idMap.has(a.to)) {
        const newArrow = { ...a, from: idMap.get(a.from), to: idMap.get(a.to) };
        if (newArrow.id) newArrow.id = "A" + Date.now() + Math.floor(Math.random() * 1000);
        this.data.arrows.push(newArrow);
      }
    }
    
    this.saveHistory();
    this.updateInspector();
    this.render();
  }

  saveHistory() {
    const dataCopy = JSON.parse(JSON.stringify(this.data));
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(dataCopy);
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedNodeIds.clear();
      this.updateInspector();
      this.render();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedNodeIds.clear();
      this.updateInspector();
      this.render();
    }
  }

  getNodeAt(clientX, clientY) {
    const canvas = this.container.querySelector(`#${this.canvasId}`);
    let found = null;
    const nodeEls = canvas.querySelectorAll('.cat-node');
    nodeEls.forEach(el => {
      const nRect = el.getBoundingClientRect();
      if (clientX >= nRect.left && clientX <= nRect.right &&
          clientY >= nRect.top && clientY <= nRect.bottom) {
        const id = el.id.replace('cat-node-', '');
        found = this.data.nodes.find(n => n.id === id);
      }
    });
    return found;
  }

  handleMouseDown(e) {
    const canvas = this.container.querySelector(`#${this.canvasId}`);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = this.getNodeAt(e.clientX, e.clientY);
    
    let clickedArrowIdx = null;
    const arrowTarget = e.target.closest('.cat-arrow-label') || e.target.closest('path[data-arrow-index]');
    if (arrowTarget) {
      clickedArrowIdx = parseInt(arrowTarget.dataset.arrowIndex);
    }

    if (this.currentTool === "select") {
      if (clickedNode) {
        this.selectedArrowIdx = null;
        if (e.ctrlKey || e.metaKey) {
          if (this.selectedNodeIds.has(clickedNode.id)) {
            this.selectedNodeIds.delete(clickedNode.id);
          } else {
            this.selectedNodeIds.add(clickedNode.id);
          }
        } else {
          if (!this.selectedNodeIds.has(clickedNode.id)) {
            this.selectedNodeIds.clear();
            this.selectedNodeIds.add(clickedNode.id);
          }
        }
        
        this.updateInspector();
        this.render();
        
        this.isDraggingNode = true;
        this.dragStartPositions.clear();
        for (const id of this.selectedNodeIds) {
          const n = this.data.nodes.find(node => node.id === id);
          if (n) this.dragStartPositions.set(id, { startX: n.x, startY: n.y });
        }
        this.dragStartMouse = { x, y };
      } else if (clickedArrowIdx !== null) {
        this.selectedNodeIds.clear();
        this.selectedArrowIdx = clickedArrowIdx;
        this.updateInspector();
        this.render();
      } else {
        this.selectedArrowIdx = null;
        if (!e.ctrlKey && !e.metaKey) {
          this.selectedNodeIds.clear();
          this.updateInspector();
          this.render();
        }
        this.isSelectingBox = true;
        this.selectionBoxStart = { x, y };
        
        const canvasEl = this.container.querySelector(`#${this.canvasId}`);
        const box = document.createElement('div');
        box.id = 'temp-selection-box';
        box.className = 'cat-selection-box';
        box.style.left = `${x}px`;
        box.style.top = `${y}px`;
        box.style.width = '0px';
        box.style.height = '0px';
        canvasEl.appendChild(box);
      }
    } else if (this.currentTool === "node") {
      if (!clickedNode) {
        const newId = "N" + Date.now();
        this.data.nodes.push({ id: newId, label: "X", x, y });
        this.saveHistory();
        this.render();
      }
    } else if (this.currentTool === "arrow") {
      let startId = null;
      if (clickedNode) {
        startId = clickedNode.id;
      } else if (clickedArrowIdx !== null) {
        startId = this.data.arrows[clickedArrowIdx].id;
      }

      if (startId) {
        this.isDrawingArrow = true;
        this.pendingArrowStart = startId;
        
        const svg = canvas.querySelector('.cat-arrows');
        if (svg && !svg.querySelector('#temp-arrow')) {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.id = "temp-arrow";
          path.setAttribute("stroke", "rgba(0, 123, 255, 0.8)");
          path.setAttribute("stroke-width", "2");
          path.setAttribute("fill", "none");
          path.setAttribute("stroke-dasharray", "4,4");
          svg.appendChild(path);
        }
      }
    }
  }

  handleMouseMove(e) {
    if (!this.isDraggingNode && !this.isDrawingArrow && !this.isSelectingBox) return;
    
    const canvas = this.container.querySelector(`#${this.canvasId}`);
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isDraggingNode) {
      let dx = x - this.dragStartMouse.x;
      let dy = y - this.dragStartMouse.y;
      
      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dy = 0;
        } else {
          dx = 0;
        }
      }
      
      for (const [id, pos] of this.dragStartPositions.entries()) {
        const node = this.data.nodes.find(n => n.id === id);
        if (node) {
          node.x = pos.startX + dx;
          node.y = pos.startY + dy;
          const el = canvas.querySelector(`#cat-node-${node.id}`);
          if (el) {
            el.style.left = `${node.x}px`;
            el.style.top = `${node.y}px`;
          }
        }
      }
    } else if (this.isSelectingBox && this.selectionBoxStart) {
      const box = canvas.querySelector('#temp-selection-box');
      if (box) {
        const left = Math.min(x, this.selectionBoxStart.x);
        const top = Math.min(y, this.selectionBoxStart.y);
        const width = Math.abs(x - this.selectionBoxStart.x);
        const height = Math.abs(y - this.selectionBoxStart.y);
        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
      }
    } else if (this.isDrawingArrow && this.pendingArrowStart) {
      let startX, startY;
      const n = this.data.nodes.find(node => node.id === this.pendingArrowStart);
      if (n) {
         startX = n.x; startY = n.y;
      } else {
         const arrowIdx = this.data.arrows.findIndex(a => a.id === this.pendingArrowStart);
         if (arrowIdx >= 0) {
           const labelEl = canvas.querySelector(`.cat-arrow-label[data-arrow-index="${arrowIdx}"]`);
           if (labelEl) {
             startX = parseFloat(labelEl.style.left);
             startY = parseFloat(labelEl.style.top);
           }
         }
      }
      
      if (startX !== undefined) {
        const svg = canvas.querySelector('.cat-arrows');
        const tempArrow = svg ? svg.querySelector('#temp-arrow') : null;
        if (tempArrow) {
          tempArrow.setAttribute("d", `M ${startX} ${startY} L ${x} ${y}`);
        }
      }
    }
  }

  handleMouseUp(e) {
    if (this.isDraggingNode) {
      this.isDraggingNode = false;
      this.saveHistory();
      this.render();
      this.updateInspector(); // Update coordinates in inspector
    }
    
    if (this.isSelectingBox) {
      this.isSelectingBox = false;
      const canvas = this.container.querySelector(`#${this.canvasId}`);
      if (canvas) {
        const box = canvas.querySelector('#temp-selection-box');
        if (box) box.remove();
      }
      
      if (this.selectionBoxStart) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const left = Math.min(x, this.selectionBoxStart.x);
        const right = Math.max(x, this.selectionBoxStart.x);
        const top = Math.min(y, this.selectionBoxStart.y);
        const bottom = Math.max(y, this.selectionBoxStart.y);

        for (const node of this.data.nodes) {
          if (node.x >= left && node.x <= right && node.y >= top && node.y <= bottom) {
            this.selectedNodeIds.add(node.id);
          }
        }
        this.updateInspector();
        this.render();
      }
    }

    if (this.isDrawingArrow) {
      this.isDrawingArrow = false;
      const canvas = this.container.querySelector(`#${this.canvasId}`);
      const svg = canvas ? canvas.querySelector('.cat-arrows') : null;
      if (svg) {
        const tempArrow = svg.querySelector('#temp-arrow');
        if (tempArrow) tempArrow.remove();
      }

      let targetId = null;
      const targetNode = this.getNodeAt(e.clientX, e.clientY);
      if (targetNode) {
        targetId = targetNode.id;
      } else {
        const arrowTarget = e.target.closest('.cat-arrow-label');
        if (arrowTarget && arrowTarget.dataset.arrowIndex !== undefined) {
          const idx = parseInt(arrowTarget.dataset.arrowIndex);
          if (this.data.arrows[idx]) {
            targetId = this.data.arrows[idx].id;
          }
        }
      }

      if (targetId) {
        this.data.arrows = this.data.arrows || [];
        this.data.arrows.push({ 
          id: "A" + Date.now() + Math.random().toString(36).substr(2, 5),
          from: this.pendingArrowStart, 
          to: targetId, 
          label: "f", 
          curve: 0,
          shift: 0,
          style: "solid"
        });
        this.saveHistory();
        this.render();
      }
      this.pendingArrowStart = null;
    }
  }

  updateInspector() {
    const title = this.container.querySelector('#inspector-title');
    const content = this.container.querySelector('#inspector-content');
    content.innerHTML = "";

    if (this.selectedArrowIdx !== null) {
      const arrow = this.data.arrows[this.selectedArrowIdx];
      if (!arrow) return;
      title.textContent = `矢印: ${arrow.from} -> ${arrow.to}`;
      
      content.innerHTML = `
        <label>
          ラベル (LaTeX)
          <input type="text" id="prop-arrow-label" value="${arrow.label || ''}">
        </label>
        <label>
          曲率 (curve)
          <input type="number" id="prop-arrow-curve" value="${arrow.curve || 0}">
        </label>
        <label>
          ずらし (shift)
          <input type="number" id="prop-arrow-shift" value="${arrow.shift || 0}">
        </label>
        <div style="display: flex; gap: 4px;">
          <label style="flex: 1;">
            ラベル X調整
            <input type="number" id="prop-arrow-label-x" value="${arrow.labelOffsetX || 0}">
          </label>
          <label style="flex: 1;">
            ラベル Y調整
            <input type="number" id="prop-arrow-label-y" value="${arrow.labelOffsetY || 0}">
          </label>
        </div>
        <label>
          スタイル
          <select id="prop-arrow-style">
            <option value="solid" ${(!arrow.style || arrow.style==='solid') ? 'selected' : ''}>実線 (solid)</option>
            <option value="dashed" ${arrow.style==='dashed' ? 'selected' : ''}>破線 (dashed)</option>
            <option value="double" ${arrow.style==='double' ? 'selected' : ''}>二重線 (double)</option>
          </select>
        </label>
      `;
      content.querySelector('#prop-arrow-label').addEventListener('change', (e) => { arrow.label = e.target.value; this.saveHistory(); this.render(); });
      content.querySelector('#prop-arrow-curve').addEventListener('change', (e) => { arrow.curve = parseInt(e.target.value); this.saveHistory(); this.render(); });
      content.querySelector('#prop-arrow-shift').addEventListener('change', (e) => { arrow.shift = parseInt(e.target.value); this.saveHistory(); this.render(); });
      content.querySelector('#prop-arrow-label-x').addEventListener('change', (e) => { arrow.labelOffsetX = parseInt(e.target.value); this.saveHistory(); this.render(); });
      content.querySelector('#prop-arrow-label-y').addEventListener('change', (e) => { arrow.labelOffsetY = parseInt(e.target.value); this.saveHistory(); this.render(); });
      content.querySelector('#prop-arrow-style').addEventListener('change', (e) => { arrow.style = e.target.value; this.saveHistory(); this.render(); });
    } else if (this.selectedNodeIds.size === 1) {
      const selectedId = Array.from(this.selectedNodeIds)[0];
      const node = this.data.nodes.find(n => n.id === selectedId);
      title.textContent = `ノード: ${node.id}`;
      
      content.innerHTML = `
        <label>
          ラベル (LaTeX)
          <input type="text" id="prop-label" value="${node.label}">
        </label>
        <label>
          X座標
          <input type="number" id="prop-x" value="${node.x}">
        </label>
        <label>
          Y座標
          <input type="number" id="prop-y" value="${node.y}">
        </label>
      `;

      content.querySelector('#prop-label').addEventListener('change', (e) => { node.label = e.target.value; this.saveHistory(); this.render(); });
      content.querySelector('#prop-x').addEventListener('change', (e) => { node.x = parseInt(e.target.value); this.saveHistory(); this.render(); });
      content.querySelector('#prop-y').addEventListener('change', (e) => { node.y = parseInt(e.target.value); this.saveHistory(); this.render(); });
    } else if (this.selectedNodeIds.size > 1) {
      title.textContent = `${this.selectedNodeIds.size}個のノードを選択中`;
      content.innerHTML = `<p style="font-size: 12px; color: #666;">複数選択時は座標の相対移動のみ可能です。</p>`;
    } else {
      title.textContent = "選択なし";
    }
  }

  async render() {
    const canvasContainer = this.container.querySelector(`#${this.canvasId}`);
    try {
      await CatDiagram.render(`#${this.canvasId}`, this.data, { 
        selectedArrowIdx: this.selectedArrowIdx,
        showGuides: true,
        builderMode: true
      });
      for (const id of this.selectedNodeIds) {
        const el = canvasContainer.querySelector(`#cat-node-${id}`);
        if (el) el.classList.add('selected');
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// Export to global scope
window.CatDiagram = CatDiagram;
window.CatTemplates = CatTemplates;
window.CatDiagramBuilder = CatDiagramBuilder;
