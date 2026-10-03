/**
 * catdiag-ascii.js
 * JSON形式の図式データからASCIIアート表現を生成します。
 */

export function renderAscii(diagram, options = {}) {
  const cellWidth = options.cellWidth || 10;
  const cellHeight = options.cellHeight || 4;

  const nodes = diagram.nodes || [];
  const edges = diagram.edges || [];

  const nodeMap = new Map();
  let maxX = 0;
  let maxY = 0;

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    if (node.x > maxX) maxX = node.x;
    if (node.y > maxY) maxY = node.y;
  }

  // 二次元文字配列（キャンバス）を作成
  const canvasWidth = (maxX + 1) * cellWidth;
  const canvasHeight = (maxY + 1) * cellHeight;
  const canvas = Array(canvasHeight).fill(null).map(() => Array(canvasWidth).fill(' '));

  function writeText(x, y, text) {
    if (y < 0 || y >= canvasHeight) return;
    for (let i = 0; i < text.length; i++) {
      if (x + i >= 0 && x + i < canvasWidth) {
        canvas[y][x + i] = text[i];
      }
    }
  }

  // エッジの描画（簡易版：水平・垂直のみ対応）
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;

    const fx = fromNode.x * cellWidth;
    const fy = fromNode.y * cellHeight;
    const tx = toNode.x * cellWidth;
    const ty = toNode.y * cellHeight;

    const labelText = edge.ascii || edge.label || "";
    const cleanLabelText = labelText.replace(/\\operatorname{([^}]+)}/g, '$1')
                                    .replace(/[\\]/g, '');

    if (fromNode.y === toNode.y) {
      // 水平矢印
      const minX = Math.min(fx, tx);
      const maxX = Math.max(fx, tx);
      const midX = Math.floor((minX + maxX) / 2);
      
      const isForward = tx > fx;
      const arrowLength = maxX - minX - 4; // Node label width approx
      
      if (arrowLength > 0) {
        const startX = minX + 4;
        let line = "-".repeat(arrowLength);
        if (isForward) {
          line = "-" + line.slice(1, -1) + ">";
        } else {
          line = "<" + line.slice(1, -1) + "-";
        }
        writeText(startX, fy, line);
        // ラベルは矢印の上に書く
        if (cleanLabelText) {
          writeText(midX - Math.floor(cleanLabelText.length / 2), fy - 1, cleanLabelText);
        }
      }
    } else if (fromNode.x === toNode.x) {
      // 垂直矢印
      const minY = Math.min(fy, ty);
      const maxY = Math.max(fy, ty);
      const midY = Math.floor((minY + maxY) / 2);

      const isForward = ty > fy;
      
      for (let y = minY + 1; y < maxY; y++) {
        writeText(fx, y, "|");
      }
      if (isForward) {
        writeText(fx, maxY - 1, "v");
      } else {
        writeText(fx, minY + 1, "^");
      }
      // ラベルは矢印の横に書く
      if (cleanLabelText) {
        writeText(fx + 2, midY, cleanLabelText);
      }
    } else {
      // 斜め等（簡易注記）
      // ... 複雑になるため現段階ではパス。必要に応じて "A --f(diagonal)--> B" のような表現を追加
    }
  }

  // ノードの描画
  for (const node of nodes) {
    const nx = node.x * cellWidth;
    const ny = node.y * cellHeight;
    const label = node.ascii || node.label || node.id;
    const cleanLabel = label.replace(/\\operatorname{([^}]+)}/g, '$1')
                            .replace(/[\\]/g, ''); // 簡易TeX除去
    writeText(nx, ny, cleanLabel);
  }

  // 空白行をトリムして文字列化
  return canvas.map(row => row.join('').trimEnd()).filter(row => row.length > 0).join('\n');
}
