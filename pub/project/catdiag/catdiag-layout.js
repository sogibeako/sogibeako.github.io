/**
 * catdiag-layout.js
 * ノード座標の計算やアンカー自動決定など、配置層の処理を行います。
 */

export function computeLayout(diagram) {
  const layout = diagram.layout || { mode: "manual", unit: 120, padding: 32 };
  const padding = layout.padding ?? 32;
  const unit = layout.unit ?? 120;

  const nodePositions = new Map();

  // 今はmanualモードのみサポート
  if (layout.mode === "manual") {
    for (const node of diagram.nodes || []) {
      nodePositions.set(node.id, {
        x: padding + node.x * unit,
        y: padding + node.y * unit
      });
    }
  } else {
    // 将来の自動レイアウト用フォールバック
    for (const node of diagram.nodes || []) {
      nodePositions.set(node.id, {
        x: padding + (node.x || 0) * unit,
        y: padding + (node.y || 0) * unit
      });
    }
  }

  return {
    nodePositions,
    width: Math.max(0, ...Array.from(nodePositions.values()).map(p => p.x)) + padding,
    height: Math.max(0, ...Array.from(nodePositions.values()).map(p => p.y)) + padding
  };
}

export function chooseAnchors(fromPos, toPos) {
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? ["right", "left"]
      : ["left", "right"];
  }

  return dy > 0
    ? ["bottom", "top"]
    : ["top", "bottom"];
}
