/**
 * catdiag-renderer.js
 * SVGとHTMLを組み合わせて図式を描画します。
 */

import { validateDiagram } from "./catdiag-core.js";
import { computeLayout } from "./catdiag-layout.js";
import { typesetDiagram, createMathLabel } from "./catdiag-mathjax.js";
import { renderAscii } from "./catdiag-ascii.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export async function renderDiagram(diagram, mountElement, options = {}) {
  // 1. 検証
  const validation = validateDiagram(diagram);
  if (!validation.ok) {
    console.error("Diagram validation failed:", validation.errors);
    mountElement.textContent = "Diagram validation failed. See console.";
    return;
  }

  // 2. レイアウト計算
  const layoutInfo = computeLayout(diagram);
  
  // 3. ルートコンテナの生成
  const container = document.createElement("div");
  container.className = "catdiag";
  container.style.width = `${layoutInfo.width}px`;
  container.style.height = `${layoutInfo.height}px`;

  // 4. SVGコンテナの生成（矢印用）
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "catdiag-arrows");
  // 矢印の先端の定義
  const defs = document.createElementNS(SVG_NS, "defs");
  const marker = document.createElementNS(SVG_NS, "marker");
  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("refX", "9"); // 矢印の先端位置の調整
  marker.setAttribute("refY", "3.5");
  marker.setAttribute("orient", "auto");
  const polygon = document.createElementNS(SVG_NS, "polygon");
  polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
  polygon.setAttribute("fill", "currentColor");
  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.appendChild(defs);
  
  container.appendChild(svg);

  // 5. ノードの配置
  const nodes = diagram.nodes || [];
  for (const node of nodes) {
    const pos = layoutInfo.nodePositions.get(node.id);
    const nodeDiv = document.createElement("div");
    nodeDiv.className = "catdiag-node";
    if (node.className) nodeDiv.classList.add(node.className);
    
    nodeDiv.style.left = `${pos.x}px`;
    nodeDiv.style.top = `${pos.y}px`;

    const labelTex = node.label || node.id;
    nodeDiv.appendChild(createMathLabel(labelTex));
    
    container.appendChild(nodeDiv);
  }

  // 6 & 7. エッジの描画とラベルの配置
  const edges = diagram.edges || [];
  for (const edge of edges) {
    const fromPos = layoutInfo.nodePositions.get(edge.from);
    const toPos = layoutInfo.nodePositions.get(edge.to);
    
    if (!fromPos || !toPos) continue;

    // パス描画
    const path = document.createElementNS(SVG_NS, "path");
    // ノードのサイズを考慮して少し隙間を空ける簡易処理（中心から中心への線）
    // 本格的にはノードのBBox取得と交差計算が必要ですが、Phase 1では先端を少し手前にする。
    
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const padding = 20; // ノードの半径概算
    
    if (dist > padding * 2) {
      const ux = dx / dist;
      const uy = dy / dist;
      
      const startX = fromPos.x + ux * padding;
      const startY = fromPos.y + uy * padding;
      const endX = toPos.x - ux * padding;
      const endY = toPos.y - uy * padding;
      
      // 直線
      path.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY}`);
      
      if (edge.style === "dashed") {
        path.setAttribute("stroke-dasharray", "5,5");
      }
      
      path.setAttribute("marker-end", "url(#arrowhead)");
      svg.appendChild(path);

      // ラベル配置
      if (edge.label) {
        const labelPosition = edge.labelPosition ?? 0.5;
        const lx = startX + (endX - startX) * labelPosition;
        const ly = startY + (endY - startY) * labelPosition;
        
        const labelDiv = document.createElement("div");
        labelDiv.className = "catdiag-edge-label";
        
        // 直線に直交する方向へのオフセット（簡易的）
        const nx = -uy * 15;
        const ny = ux * 15;
        
        labelDiv.style.left = `${lx + nx}px`;
        labelDiv.style.top = `${ly + ny}px`;
        
        labelDiv.appendChild(createMathLabel(edge.label));
        container.appendChild(labelDiv);
      }
    }
  }

  // 8. マウントしてMathJaxに組版させる
  mountElement.replaceChildren(container);
  
  if (options.math !== "plain") {
    await typesetDiagram(container);
  }

  // 9. コピーイベントの登録
  if (options.copyAsAscii !== false) {
    container.addEventListener("copy", (event) => {
      // 選択テキストがあるかチェック
      const selection = window.getSelection();
      // もし図式全体を選択するようなコピーならハイジャックする
      if (selection && selection.containsNode(container, true)) {
        const ascii = renderAscii(diagram);
        event.clipboardData.setData("text/plain", ascii);
        event.preventDefault();
      }
    });
  }
}
