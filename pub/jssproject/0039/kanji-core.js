/* Choiwaru Kanji — shared, DOM-safe SVG composition. No network or editor state. */
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const fonts = { sans: '"Noto Sans JP", sans-serif', serif: '"Noto Serif JP", serif' };
  let serial = 0;
  const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
  function number(v, fallback, min, max, key) {
    if (v === undefined) return fallback;
    if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
      throw new Error(`${key}: ${min}〜${max}の数値を指定してください`);
    return v;
  }
  function text(v, fallback = "", max = 2000) {
    if (v === undefined || v === null) return fallback;
    if (typeof v !== "string" || v.length > max) throw new Error("文字列の型または長さが不正です");
    return v;
  }
  function validateGlyph(raw) {
    if (!object(raw) || !Array.isArray(raw.layers) || raw.layers.length > 256)
      throw new Error("layersは256部品以内の配列にしてください");
    const result = {};
    if (raw.fontCodePoint !== undefined && raw.fontCodePoint !== null) {
      const cp = number(raw.fontCodePoint, 0, 0, 0x10ffff, "fontCodePoint");
      if (!Number.isInteger(cp) || (cp >= 0xd800 && cp <= 0xdfff)) throw new Error("fontCodePointはUnicodeスカラー値です");
      result.fontCodePoint = cp;
    }
    for (const k of ["unicode", "copyText", "ids", "ruby", "original", "meaning"])
      result[k] = text(raw[k], ["unicode", "ids", "original"].includes(k) ? null : "");
    if (result.unicode && [...result.unicode].length !== 1)
      throw new Error("Unicode対応には確認済みの1文字を指定してください");
    result.layers = raw.layers.map(l => {
      if (!object(l) || !["text", "rect", "circle", "line", "erase"].includes(l.type))
        throw new Error("未対応のレイヤーです");
      if (l.type === "erase" && l.shape !== undefined && l.shape !== "rect")
        throw new Error("消去領域はrectのみ対応しています");
      const r = { type: l.type };
      if (l.matrix !== undefined) {
        if (!Array.isArray(l.matrix) || l.matrix.length !== 4) throw new Error("matrixは4個の数値です");
        r.matrix = l.matrix.map(v => number(v, 0, -10000, 10000, "matrix"));
        if (Math.abs(r.matrix[0] * r.matrix[3] - r.matrix[1] * r.matrix[2]) < 1e-8) throw new Error("変形が小さすぎます");
      }
      for (const [k, fallback, min, max] of [
        ["x", 0, -5000, 5000], ["y", 0, -5000, 5000],
        ["width", 1000, 1, 5000], ["height", 1000, 1, 5000],
        ["rotation", 0, -3600, 3600], ["fontWeight", 400, 100, 900],
        ["strokeWidth", l.type === "line" ? 35 : 0, 0, 300]
      ]) r[k] = number(l[k], fallback, min, max, k);
      for (const k of ["flipX", "flipY"]) {
        if (l[k] !== undefined && typeof l[k] !== "boolean") throw new Error(`${k}は真偽値です`);
        r[k] = l[k] ?? false;
      }
      r.font = l.font ?? "sans";
      if (!Object.hasOwn(fonts, r.font)) throw new Error("未対応のフォントです");
      r.fill = l.fill ?? "#111827";
      if (typeof r.fill !== "string" || !/^(#[\da-f]{3}|#[\da-f]{6}|currentColor|none)$/i.test(r.fill))
        throw new Error("色には16進数の色コード・currentColor・noneを指定してください");
      if (l.type === "text") {
        r.char = text(l.char, "", 64);
        if (!r.char.trim()) throw new Error("文字部品が空です");
      }
      if (l.type === "erase") r.shape = "rect";
      return r;
    });
    return result;
  }
  function validateDictionary(raw) {
    if (!object(raw) || raw.schemaVersion !== "1.0" || raw.unitsPerEm !== 1000 || !object(raw.glyphs))
      throw new Error("schemaVersion: 1.0 / unitsPerEm: 1000 の辞書が必要です");
    if (Object.keys(raw.glyphs).length > 5000) throw new Error("辞書は5000字以内にしてください");
    const glyphs = Object.create(null);
    for (const [id, glyph] of Object.entries(raw.glyphs)) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id) || ["__proto__", "constructor", "prototype"].includes(id))
        throw new Error(`漢字IDが不正です: ${id}`);
      glyphs[id] = validateGlyph(glyph);
    }
    return { schemaVersion: "1.0", unitsPerEm: 1000, glyphs };
  }
  function svgNode(name, attrs = {}) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
  }
  function transform(l) {
    const matrix = l.matrix ? `matrix(${l.matrix.join(" ")} 0 0)` : "";
    return `translate(${l.x + l.width / 2} ${l.y + l.height / 2}) ${matrix} rotate(${l.rotation}) scale(${l.flipX ? -1 : 1} ${l.flipY ? -1 : 1}) translate(${-l.width / 2} ${-l.height / 2})`;
  }
  function renderGlyph(raw, options = {}) {
    const glyph = validateGlyph(raw);
    const size = number(options.size, 1000, 1, 5000, "size");
    const svg = svgNode("svg", { viewBox: "0 0 1000 1000", width: size, height: size, "aria-hidden": "true" });
    const defs = svgNode("defs");
    svg.append(defs);
    let drawing = svgNode("g");
    const prefix = `ck-${++serial}`;
    glyph.layers.forEach((l, i) => {
      const group = svgNode("g", { transform: transform(l) });
      const fill = l.fill;
      if (l.type === "erase") {
        const id = `${prefix}-${i}`;
        const mask = svgNode("mask", { id, maskUnits: "userSpaceOnUse", x: -10000, y: -10000, width: 20000, height: 20000, "mask-type": "luminance" });
        mask.append(svgNode("rect", { x: -10000, y: -10000, width: 20000, height: 20000, fill: "white" }));
        group.append(svgNode("rect", { width: l.width, height: l.height, fill: "black" }));
        mask.append(group);
        defs.append(mask);
        const wrapped = svgNode("g", { mask: `url(#${id})` });
        wrapped.append(drawing);
        drawing = svgNode("g");
        drawing.append(wrapped);
        return;
      }
      if (l.type === "text") {
        const family = fonts[options.font ?? l.font] ?? fonts.sans;
        // Measure the ink bounds, not the em box: independent scaling also works for 丶 and 一.
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.font = `${l.fontWeight} 1000px ${family}`;
        const m = ctx.measureText(l.char);
        const left = m.actualBoundingBoxLeft || 0;
        const ascent = m.actualBoundingBoxAscent || 880;
        const w = Math.max(1, left + (m.actualBoundingBoxRight || m.width));
        const h = Math.max(1, ascent + (m.actualBoundingBoxDescent || 0));
        const ink = svgNode("g", { transform: `scale(${l.width / w} ${l.height / h})` });
        const t = svgNode("text", { x: left, y: ascent, "font-family": family, "font-size": 1000, "font-weight": l.fontWeight, fill, stroke: fill, "stroke-width": l.strokeWidth, "paint-order": "stroke fill" });
        t.textContent = l.char;
        ink.append(t);
        group.append(ink);
      } else if (l.type === "line") {
        group.append(svgNode("line", { x1: 0, y1: l.height / 2, x2: l.width, y2: l.height / 2, stroke: fill, "stroke-width": l.strokeWidth, "stroke-linecap": "round" }));
      } else {
        group.append(svgNode(l.type === "circle" ? "ellipse" : "rect", {
          ...(l.type === "circle" ? { cx: l.width / 2, cy: l.height / 2, rx: l.width / 2, ry: l.height / 2 } : { width: l.width, height: l.height }),
          fill, stroke: fill, "stroke-width": l.strokeWidth
        }));
      }
      drawing.append(group);
    });
    svg.append(drawing);
    return svg;
  }
  window.KanjiCore = Object.freeze({ renderGlyph, validateGlyph, validateDictionary, svgNode, transform, fonts });
})();
