/**
 * catdiag-mathjax.js
 * MathJaxの非同期レンダリングを管理します。
 */

export async function typesetDiagram(rootElement) {
  if (window.MathJax && window.MathJax.typesetPromise) {
    try {
      await window.MathJax.typesetPromise([rootElement]);
    } catch (err) {
      console.error("MathJax typeset failed", err);
    }
  } else {
    console.warn("MathJax is not loaded or typesetPromise is not available.");
  }
}

export function createMathLabel(texString) {
  const span = document.createElement("span");
  span.className = "catdiag-math";
  span.textContent = `\\(${texString}\\)`;
  return span;
}
