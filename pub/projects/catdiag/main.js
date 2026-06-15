/**
 * main.js
 * レンダリングのテスト用エントリーポイント
 */

import { Diagram } from "./catdiag-builder.js";
import { renderDiagram } from "./catdiag-renderer.js";

async function main() {
  // 1. 基本の四角形
  const square = Diagram.square({
    A: "A",
    B: "B",
    C: "C",
    D: "D",
    top: "f",
    left: "g",
    right: "h",
    bottom: "k"
  });

  // ASCII出力のテスト用に追加設定
  square.edges[0].ascii = "f";
  square.edges[1].ascii = "g";
  square.edges[2].ascii = "h";
  square.edges[3].ascii = "k";

  await renderDiagram(square, document.querySelector("#diagram-square"), {
    math: "mathjax",
    copyAsAscii: true
  });

  // 2. プルバック
  const pullback = Diagram.pullback({
    P: "P",
    A: "A",
    B: "B",
    C: "C",
    p1: "p_1",
    p2: "p_2",
    f: "f",
    g: "g"
  });

  await renderDiagram(pullback, document.querySelector("#diagram-pullback"), {
    math: "mathjax",
    copyAsAscii: true
  });

  // 3. 自然変換
  const naturality = Diagram.naturalitySquare({
    X: "X",
    Y: "Y",
    F: "F",
    G: "G",
    arrow: "f",
    transformation: "\\eta"
  });

  await renderDiagram(naturality, document.querySelector("#diagram-naturality"), {
    math: "mathjax",
    copyAsAscii: true
  });

  console.log("Rendering complete. Try copying the diagrams to see ASCII output.");
}

// ドキュメント読み込み完了を待たずに実行可能（モジュールスクリプトのためdeferがかかっている）
main().catch(console.error);
