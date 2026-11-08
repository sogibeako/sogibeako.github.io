(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const key = "choiwaru-kanji-v1";
  const sample = {
    unicode: null, copyText: "⿴門猫", ids: "⿴門猫", ruby: "こもりねこ",
    original: "籠城", meaning: "猫が閉じこもること。",
    layers: [
      { type: "text", char: "門", x: 100, y: 70, width: 800, height: 860 },
      { type: "text", char: "猫", x: 325, y: 415, width: 350, height: 430 }
    ]
  };
  let dictionary = KanjiCore.validateDictionary({ schemaVersion: "1.0", unitsPerEm: 1000, glyphs: { "gate-cat": sample } });
  let glyph = clone(dictionary.glyphs["gate-cat"]);
  let id = "gate-cat", selected = 1, history = [], future = [], drag = null;
  let selection = new Set([1]), partsClipboard = [], dictionaryPage = 0;
  const picked = () => [...selection].filter(i => glyph.layers[i]).sort((a, b) => a - b);
  function selectOnly(i) { selected = i; selection = new Set(i >= 0 ? [i] : []); }
  function choose(i, additive) {
    if (additive) {
      if (selection.has(i)) selection.delete(i); else selection.add(i);
      selected = selection.has(i) ? i : [...selection].at(-1) ?? -1;
    } else selectOnly(i);
  }
  let dirty = false, storageWarning = "";
  let matchPreviewColor = false;
  let deletedGlyphIds = new Set();
  const metadata = ["ruby", "unicode", "original", "ids", "copyText", "meaning"];
  const properties = ["char", "x", "y", "width", "height", "rotation", "font", "fontWeight", "strokeWidth", "fill", "flipX", "flipY"];
  function status(message) { $("status").textContent = message + (storageWarning ? ` ${storageWarning}` : ""); }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify({ dictionary, glyph, id, selected, dirty, deletedGlyphIds: [...deletedGlyphIds], previewText: $("preview-text").value, matchPreviewColor, reference: { enabled: $("reference-enabled").checked, char: $("reference-char").value, opacity: $("reference-opacity").valueAsNumber } })); storageWarning = ""; }
    catch { storageWarning = "ブラウザ内に保存できません。JSONを書き出して保管してください。"; }
  }
  function snapshot() { return JSON.stringify({ glyph, id, selected, dirty, selection: picked() }); }
  function restore(s) {
    const state = JSON.parse(s);
    ({ glyph, id, selected, dirty } = state);
    selection = new Set(state.selection ?? (selected >= 0 ? [selected] : []));
    refresh(); persist();
  }
  function change(fn) {
    const before = snapshot();
    try {
      fn();
      glyph = KanjiCore.validateGlyph(glyph);
      history.push(before); if (history.length > 100) history.shift();
      future = []; dirty = true; persist(); refresh();
    } catch (error) { restore(before); status(error.message); }
  }
  function updateProperties() {
    $("group-scale").disabled = !picked().length;
    const bounds = selectionBounds();
    $("group-size").textContent = bounds ? `選択枠：横 ${Math.round(bounds.width)} × 縦 ${Math.round(bounds.height)}` : "部品を選択してください";
    const l = glyph.layers[selected];
    $("properties").disabled = !l;
    $("selection-label").textContent = picked().length > 1 ? `${picked().length}部品を選択中 · 座標は基準部品 ${selected + 1}` : l ? `部品 ${selected + 1} · ${l.char || ({ erase: "消去領域", line: "直線", rect: "矩形", circle: "円" }[l.type])}` : "部品を選択してください";
    for (const k of properties) {
      const input = $(`prop-${k}`);
      if (input.type === "checkbox") input.checked = l?.[k] ?? false;
      else input.value = l?.[k] ?? (input.type === "color" ? "#111827" : "");
      input.disabled = !l || (picked().length > 1 && !["x", "y"].includes(k)) || (["char", "font", "fontWeight"].includes(k) && l.type !== "text") || (["fill", "strokeWidth"].includes(k) && l.type === "erase");
    }
    $("weight-value").textContent = l?.fontWeight || "400";
    $("forward").disabled = picked().length > 1 || !l || selected === glyph.layers.length - 1;
    $("backward").disabled = picked().length > 1 || !l || selected === 0;
  }
  function drawCanvas() {
    const canvas = $("canvas");
    const svg = KanjiCore.renderGlyph(glyph);
    const overlay = KanjiCore.svgNode("svg", { viewBox: "0 0 1000 1000", class: "overlay", "aria-hidden": "true" });
    glyph.layers.forEach((l, i) => {
      const rect = KanjiCore.svgNode("rect", {
        width: l.width, height: l.height, transform: KanjiCore.transform(l),
        fill: l.type === "erase" ? "#df865e16" : "transparent",
        stroke: selection.has(i) ? "#4c845f" : l.type === "erase" ? "#c47750" : "none",
        "stroke-width": 2, "vector-effect": "non-scaling-stroke",
        "stroke-dasharray": l.type === "erase" ? "7 5" : "none",
        "data-layer": i, cursor: "move", "pointer-events": "all"
      });
      overlay.append(rect);
    });
    canvas.replaceChildren(svg, overlay);
    $("reference-opacity-value").textContent = `${$("reference-opacity").value}%`;
    if ($("reference-enabled").checked) {
      const value = $("reference-char").value.trim();
      const char = typeof Intl.Segmenter === "function"
        ? [...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(value)][0]?.segment
        : [...value][0];
      if (char) {
        const reference = KanjiCore.svgNode("svg", { viewBox: "0 0 1000 1000", class: "reference-overlay", "aria-hidden": "true" });
        // Use a normal em-sized character, not renderGlyph's ink-bound stretching.
        const text = KanjiCore.svgNode("text", {
          x: 500, y: 500, "text-anchor": "middle", "dominant-baseline": "central",
          "font-family": KanjiCore.fonts.sans, "font-size": 1000, "font-weight": 400,
          fill: "#bf4b72", opacity: $("reference-opacity").valueAsNumber / 100
        });
        text.textContent = char; reference.append(text); canvas.append(reference);
      }
    }
  }
  function drawLayers() {
    $("layer-count").textContent = glyph.layers.length;
    $("layers").replaceChildren();
    glyph.layers.forEach((l, i) => {
      const li = document.createElement("li"), b = document.createElement("button");
      b.classList.toggle("active", selection.has(i));
      b.setAttribute("aria-pressed", String(selection.has(i)));
      const icon = document.createElement("span"); icon.className = "layer-icon"; icon.textContent = l.char || ({ erase: "▧", line: "─", rect: "▭", circle: "○" }[l.type]);
      const name = document.createElement("span"); name.className = "layer-name"; name.textContent = l.char ? "文字" : l.type === "erase" ? "消去領域" : "図形";
      const n = document.createElement("small"); n.textContent = String(i + 1).padStart(2, "0");
      b.append(icon, name, n); li.append(b); $("layers").prepend(li);
      b.onclick = e => { choose(i, e.shiftKey || e.ctrlKey || e.metaKey || $("multi-select").checked); refresh(); $("canvas").focus({ preventScroll: true }); };
    });
  }
  function drawPreviews() {
    $("match-preview-color").setAttribute("aria-pressed", String(matchPreviewColor));
    $("match-preview-color").textContent = `本文と同じ色：${matchPreviewColor ? "オン" : "オフ"}`;
    const previewGlyph = matchPreviewColor ? clone(glyph) : glyph;
    if (matchPreviewColor) previewGlyph.layers.forEach(layer => {
      if (layer.type !== "erase" && layer.fill !== "none") layer.fill = "currentColor";
    });
    const container = $("previews");
    container.className = $("preview-bg").value;
    container.style.fontFamily = KanjiCore.fonts[$("preview-font").value || "sans"];
    container.replaceChildren();
    for (const size of [16, 24, 48]) {
      const row = document.createElement("div"); row.className = "preview-line"; row.style.fontSize = `${size}px`;
      const label = document.createElement("span"); label.className = "size-label"; label.textContent = `${size}px`;
      const sentence = document.createElement("span"); sentence.className = "preview-sentence";
      const chunks = $("preview-text").value.split("{字}");
      chunks.forEach((chunk, index) => {
        if (index) {
          const inline = document.createElement("span"); inline.className = "inline-glyph";
          inline.append(KanjiCore.renderGlyph(previewGlyph, { font: $("preview-font").value || undefined }));
          ChoiwaruKanji.bindCopy(inline, glyph);
          sentence.append(inline);
        }
        sentence.append(chunk);
      });
      row.append(label, sentence); container.append(row);
    }
    drawDiaryPreview(previewGlyph);
    const safe = v => v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    $("embed-code").textContent = `<span data-kanji="${safe(id)}">${safe(glyph.copyText || glyph.unicode || glyph.ids || "創作漢字")}</span>`;
  }
  function refresh() {
    updateDeleteButton();
    drawCanvas(); drawLayers(); drawPreviews(); updateProperties();
    $("meta-id").value = id;
    for (const k of metadata) $(`meta-${k}`).value = glyph[k] ?? "";
    $("undo").disabled = !history.length; $("redo").disabled = !future.length;
  }
  function listDictionary() {
    const select = $("dictionary-select"), previous = select.value;
    select.replaceChildren(new Option("登録済みの字を選ぶ", ""));
    for (const [key, g] of Object.entries(dictionary.glyphs)) select.add(new Option(`${key} · ${g.ruby || g.copyText || "読み未登録"}`, key));
    select.value = Object.hasOwn(dictionary.glyphs, previous) ? previous : "";
    updateDeleteButton();
    drawDictionary();
    window.KanjiFontUI?.refresh();
  }
  function drawDiaryPreview(previewGlyph) {
    const frame = $("diary-preview"), doc = document.implementation.createHTMLDocument("日記プレビュー");
    doc.documentElement.lang = "ja";
    // Keep diary styles isolated from the editor. The fallback also supports extracted ZIPs.
    const fallback = doc.createElement("style");
    fallback.textContent = 'body{margin:0;background:#111822;font-size:1rem;line-height:1.6}.wrapper{max-width:700px;width:80%;margin:50px auto;padding:20px;background:#afd3e6;font-family:"Segoe UI","Arial Unicode MS","MS PGothic",sans-serif}';
    const css = doc.createElement("link");css.rel="stylesheet";css.href=new URL("../../style/diary_style.css",location.href).href;
    const layout = doc.createElement("style");
    layout.textContent = '.sample{white-space:pre-wrap;overflow-wrap:anywhere}.inline-glyph{display:inline-block;width:1em;height:1em;vertical-align:-.1em}.inline-glyph svg{display:block;width:100%;height:100%}';
    doc.head.append(fallback,css,layout);
    const wrapper=doc.createElement("main");wrapper.className="wrapper";
    const sentence=doc.createElement("p");sentence.className="sample "+$("diary-preview-font").value;
    const size=$("diary-preview-size").value;if(size)sentence.style.fontSize=size+"px";
    $("preview-text").value.split("{字}").forEach((chunk,index)=>{
      if(index){const inline=doc.createElement("span");inline.className="inline-glyph";inline.append(KanjiCore.renderGlyph(previewGlyph,{font:$("preview-font").value||undefined}));sentence.append(inline);}
      sentence.append(chunk);
    });
    wrapper.append(sentence);doc.body.append(wrapper);
    frame.style.width=$("diary-preview-width").value?$("diary-preview-width").value+"px":"100%";
    frame.onload=()=>{
      const text=frame.contentDocument.querySelector(".sample");if(!text)return;
      const style=frame.contentWindow.getComputedStyle(text);
      const loaded=!!frame.contentDocument.querySelector('link').sheet;
      $("diary-preview-info").textContent=`本文：${style.fontSize} ／ 行間：${style.lineHeight} ／ 表示幅：${Math.round(frame.getBoundingClientRect().width)}px${loaded?"":"（日記CSSが見つからないため簡易スタイル）"}`;
    };
    frame.srcdoc="<!doctype html>"+doc.documentElement.outerHTML;
  }
  function updateDeleteButton() {
    $("delete-glyph").disabled = !Object.hasOwn(dictionary.glyphs, $("dictionary-select").value);
    $("insert-glyph").disabled = !Object.hasOwn(dictionary.glyphs, $("dictionary-select").value);
  }
  $("insert-glyph").onclick = () => {
    const source = dictionary.glyphs[$("dictionary-select").value];
    if (source) pasteParts(source.layers);
  };
  function selectionBounds() {
    const points = picked().flatMap(i => {
      const l = glyph.layers[i];
      const probe = KanjiCore.svgNode("g", { transform: KanjiCore.transform(l) });
      const m = probe.transform.baseVal.consolidate().matrix;
      return [[0, 0], [l.width, 0], [0, l.height], [l.width, l.height]].map(([x, y]) => ({ x: m.a*x + m.c*y + m.e, y: m.b*x + m.d*y + m.f }));
    });
    if (!points.length) return null;
    const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y));
    return { x, y, width: Math.max(...points.map(p => p.x)) - x, height: Math.max(...points.map(p => p.y)) - y };
  }
  $("apply-group-scale").onclick = () => {
    const bounds = selectionBounds(); if (!bounds) return;
    const sx = $("group-scale-x").valueAsNumber / 100, sy = $("group-scale-y").valueAsNumber / 100;
    if (![sx, sy].every(v => Number.isFinite(v) && v >= .01 && v <= 10)) { status("倍率は1〜1000%で指定してください。"); return; }
    if (sx === 1 && sy === 1) return;
    change(() => picked().forEach(i => {
      const l = glyph.layers[i], [a, b, c, d] = l.matrix || [1, 0, 0, 1];
      l.x = bounds.x + (l.x + l.width / 2 - bounds.x) * sx - l.width / 2;
      l.y = bounds.y + (l.y + l.height / 2 - bounds.y) * sy - l.height / 2;
      l.matrix = [sx*a, sy*b, sx*c, sy*d];
    }));
    $("group-scale-x").value = "100"; $("group-scale-y").value = "100";
  };
  $("dictionary-select").addEventListener("change", updateDeleteButton);
  let pendingDeleteId = null;
  $("delete-glyph").onclick = () => {
    const target = $("dictionary-select").value;
    if (!Object.hasOwn(dictionary.glyphs, target)) return;
    pendingDeleteId = target;
    const g = dictionary.glyphs[target];
    $("delete-glyph-preview").replaceChildren(KanjiCore.renderGlyph(g, { size: 80 }));
    $("delete-glyph-target").textContent = `ID：${target}\n読み：${g.ruby || "未登録"}\nコピー用文字列：${g.copyText || g.unicode || g.ids || "未登録"}`;
    $("delete-glyph-dialog").returnValue = "cancel";
    $("delete-glyph-dialog").showModal();
  };
  $("delete-glyph-dialog").addEventListener("close", () => {
    const target = pendingDeleteId; pendingDeleteId = null;
    if ($("delete-glyph-dialog").returnValue !== "delete" || !target || !Object.hasOwn(dictionary.glyphs, target)) return;
    delete dictionary.glyphs[target]; deletedGlyphIds.add(target);
    persist(); listDictionary();
    status(`「${target}」を辞書から削除しました。下書きは残っています。「辞書JSON」では削除した字を再登録しません。「辞書に保存」を押すと再登録できます。`);
  });
  function drawDictionary() {
    const query = $("dictionary-search").value.trim().toLocaleLowerCase();
    const entries = Object.entries(dictionary.glyphs).filter(([key, g]) =>
      [key, g.ruby, g.meaning, g.copyText, g.unicode, g.ids, g.original].join(" ").toLocaleLowerCase().includes(query));
    const pages = Math.max(1, Math.ceil(entries.length / 64));
    dictionaryPage = Math.min(dictionaryPage, pages - 1);
    $("dictionary-grid").replaceChildren();
    for (const [key, g] of entries.slice(dictionaryPage * 64, (dictionaryPage + 1) * 64)) {
      const button = document.createElement("button"); button.type = "button";
      button.dataset.glyphId = key;
      button.title = `${key} · ${g.ruby || "読み未登録"}\n${g.meaning || ""}`;
      button.setAttribute("aria-label", `${g.ruby || key}を編集`);
      button.setAttribute("aria-current", String(key === id));
      button.append(KanjiCore.renderGlyph(g, { size: 42 }));
      const caption = document.createElement("small"); caption.textContent = g.ruby || key;
      button.append(caption); button.onclick = () => { $("dictionary-select").value = key; updateDeleteButton(); $( $("dictionary-action").value === "insert" ? "insert-glyph" : "load-glyph").click(); drawDictionary(); };
      $("dictionary-grid").append(button);
    }
    $("dictionary-count").textContent = `${entries.length}字 · ${dictionaryPage + 1} / ${pages}ページ`;
    $("dictionary-prev").disabled = dictionaryPage === 0; $("dictionary-next").disabled = dictionaryPage >= pages - 1;
    window.KanjiFontUI?.highlight();
  }
  $("dictionary-search").oninput = () => { dictionaryPage = 0; drawDictionary(); };
  $("dictionary-prev").onclick = () => { dictionaryPage--; drawDictionary(); };
  $("dictionary-next").onclick = () => { dictionaryPage++; drawDictionary(); };
  function add(type, chars = []) {
    change(() => {
      const values = type === "text" ? chars : [null], count = values.length;
      if (!count) throw new Error("追加する文字を入力してください");
      if (glyph.layers.length + count > 256) throw new Error("部品は合計256個まで追加できます");
      const layout = $("layout").value;
      values.forEach((char, i) => {
        let x = 250, y = 250, width = 500, height = 500;
        if (type === "text" && layout !== "overlay") {
          const cols = layout === "horizontal" ? count : layout === "vertical" ? 1 : Math.ceil(Math.sqrt(count));
          const rows = Math.ceil(count / cols);
          width = 800 / cols; height = 800 / rows;
          x = 100 + i % cols * width; y = 100 + Math.floor(i / cols) * height;
        }
        if (type === "line") height = 40;
        if (type === "erase" || type === "rect") height = 150;
        glyph.layers.push({ type, ...(char ? { char } : {}), x, y, width, height, strokeWidth: type === "line" ? 35 : 0 });
      });
      selectOnly(glyph.layers.length - 1);
    });
  }
  $("add-text").onclick = () => {
    const chars = typeof Intl.Segmenter === "function"
      ? [...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment($("characters").value)].map(s => s.segment)
      : [...$("characters").value];
    add("text", chars.filter(c => c.trim()));
  };
  for (const char of ["木", "口", "日", "月", "心", "氵", "扌", "亻", "艹", "辶", "門", "囗", "猫", "丶", "一"]) {
    const button = document.createElement("button"); button.textContent = char; button.title = `${char}を追加`;
    button.onclick = () => add("text", [char]); $("radicals").append(button);
  }
  document.querySelectorAll("[data-add]").forEach(b => b.onclick = () => add(b.dataset.add));
  for (const k of properties) $(`prop-${k}`).addEventListener("change", e => {
    if (!glyph.layers[selected]) return;
    change(() => {
      const input = e.target;
      if (["x", "y"].includes(k) && picked().length > 1) {
        const delta = input.valueAsNumber - glyph.layers[selected][k];
        picked().forEach(i => { glyph.layers[i][k] += delta; });
      } else glyph.layers[selected][k] = input.type === "checkbox" ? input.checked : ["number", "range"].includes(input.type) ? input.valueAsNumber : input.value;
    });
  });
  $("prop-fontWeight").addEventListener("input", e => { $("weight-value").textContent = e.target.value; });
  for (const k of metadata) $(`meta-${k}`).addEventListener("change", e => {
    const value = e.target.value || (["unicode", "original", "ids"].includes(k) ? null : "");
    if (glyph[k] !== value) change(() => { glyph[k] = value; });
  });
  $("meta-id").onchange = e => change(() => { id = e.target.value.trim(); });
  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    input.setRangeText(text, start, end, "end");
    input.focus();
    return start + text.length;
  }
  // Preserve the selection when clicking/tapping a toolbar button.
  for (const [symbol, name] of [
    ["⿰", "左右"], ["⿱", "上下"], ["⿲", "左中右"], ["⿳", "上中下"],
    ["⿴", "全囲み"], ["⿵", "上から囲む"], ["⿶", "下から囲む"], ["⿷", "左から囲む"],
    ["⿸", "左上から囲む"], ["⿹", "右上から囲む"], ["⿺", "左下から囲む"], ["⿻", "重ねる"]
  ]) {
    const button = document.createElement("button");
    button.type = "button"; button.textContent = `${symbol} ${name}`;
    button.title = `${symbol}（${name}）をIDS欄に挿入`;
    button.dataset.ids = symbol;
    button.addEventListener("pointerdown", e => e.preventDefault());
    button.onclick = () => {
      const input = $("meta-ids");
      const position = insertAtCursor(input, symbol);
      const value = input.value;
      change(() => { glyph.ids = value; });
      input.focus(); input.setSelectionRange(position, position);
    };
    $("ids-buttons").append(button);
  }
  $("preview-text").addEventListener("input", () => { drawPreviews(); persist(); });
  for (const name of ["reference-enabled", "reference-char", "reference-opacity"]) {
    $(name).addEventListener("input", e => {
      if (e.isComposing) return;
      drawCanvas(); persist();
    });
  }
  $("reference-char").addEventListener("compositionend", () => { drawCanvas(); persist(); });
  $("match-preview-color").onclick = () => {
    matchPreviewColor = !matchPreviewColor; drawPreviews(); persist();
  };
  $("insert-preview-glyph").addEventListener("pointerdown", e => e.preventDefault());
  $("insert-preview-glyph").onclick = () => {
    insertAtCursor($("preview-text"), "{字}"); drawPreviews(); persist();
  };
  $("reset-preview-text").onclick = () => {
    $("preview-text").value = "今日も{字}していた。"; drawPreviews(); persist();
  };
  $("undo").onclick = () => { if (history.length) { future.push(snapshot()); restore(history.pop()); } };
  $("redo").onclick = () => { if (future.length) { history.push(snapshot()); restore(future.pop()); } };
  function pasteParts(parts) {
    if (!parts.length) return;
    change(() => {
      const layers = KanjiCore.validateGlyph({ layers: parts }).layers;
      if (glyph.layers.length + layers.length > 256) throw new Error("部品は合計256個までです");
      const start = glyph.layers.length; glyph.layers.push(...layers);
      selection = new Set(layers.map((_, i) => start + i)); selected = glyph.layers.length - 1;
    });
    $("canvas").focus({ preventScroll: true });
  }
  const partsHeader = "ChoiwaruKanjiParts/1\n";
  function copyParts() { partsClipboard = picked().map(i => clone(glyph.layers[i])); return partsHeader + JSON.stringify(partsClipboard); }
  const editingParts = () => document.activeElement === $("canvas") || $("layers").contains(document.activeElement);
  document.addEventListener("copy", e => {
    if (!editingParts() || !picked().length || !e.clipboardData) return;
    e.clipboardData.setData("text/plain", copyParts()); e.preventDefault();
    status(`${partsClipboard.length}部品をコピーしました。貼り付けは同じ位置・サイズになります。`);
  });
  document.addEventListener("paste", e => {
    if (!editingParts()) return;
    const value = e.clipboardData?.getData("text/plain") || "";
    if (!value.startsWith(partsHeader)) return;
    e.preventDefault();
    try {
      if (value.length > 1024 * 1024) throw new Error("部品データが大きすぎます");
      pasteParts(KanjiCore.validateGlyph({ layers: JSON.parse(value.slice(partsHeader.length)) }).layers);
    } catch (error) { status(`貼り付けできません：${error.message}`); }
  });
  $("copy-parts").onclick = () => { copyParts(); status(`${partsClipboard.length}部品を一時コピーしました。「部品を貼り付け」で複製できます。`); };
  $("paste-parts").onclick = () => pasteParts(partsClipboard);
  $("select-all").onclick = () => { selection = new Set(glyph.layers.map((_, i) => i)); selected = glyph.layers.length - 1; refresh(); $("canvas").focus({ preventScroll: true }); };
  $("clear-selection").onclick = () => { selectOnly(-1); refresh(); };
  function moveParts(dx, dy) { if (picked().length) change(() => picked().forEach(i => { glyph.layers[i].x += dx; glyph.layers[i].y += dy; })); }
  document.querySelectorAll("[data-nudge]").forEach(button => button.onclick = () => {
    const step = $("move-step").valueAsNumber;
    if (!Number.isFinite(step) || step < 1 || step > 1000) return;
    const [x, y] = button.dataset.nudge.split(",").map(Number); moveParts(x * step, y * step);
  });
  $("duplicate").onclick = () => pasteParts(picked().map(i => clone(glyph.layers[i])));
  $("delete").onclick = () => { if (picked().length) change(() => {
    glyph.layers = glyph.layers.filter((_, i) => !selection.has(i)); selectOnly(Math.min(selected, glyph.layers.length - 1));
  }); };
  for (const [name, delta] of [["forward", 1], ["backward", -1]]) $(name).onclick = () => {
    if (selected < 0 || selected + delta < 0 || selected + delta >= glyph.layers.length) return;
    change(() => { const [l] = glyph.layers.splice(selected, 1); selected += delta; glyph.layers.splice(selected, 0, l); selectOnly(selected); });
  };
  $("new-glyph").onclick = () => change(() => {
    glyph = { layers: [], ruby: "", meaning: "", copyText: "", unicode: null, original: null, ids: null };
    id = `kanji-${Date.now().toString(36)}`; selectOnly(-1);
  });
  function point(e) {
    const box = $("canvas").getBoundingClientRect();
    return { x: (e.clientX - box.left) * 1000 / box.width, y: (e.clientY - box.top) * 1000 / box.height };
  }
  $("canvas").addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    const target = e.target.closest("[data-layer]");
    if (!target) { selectOnly(-1); refresh(); return; }
    const index = Number(target.dataset.layer);
    if (e.shiftKey || e.ctrlKey || e.metaKey || $("multi-select").checked) {
      choose(index, true); refresh(); $("canvas").focus(); e.preventDefault(); return;
    }
    if (!selection.has(index)) selectOnly(index); else selected = index;
    const l = glyph.layers[selected];
    drag = { point: point(e), x: l.x, y: l.y, before: snapshot(), origins: picked().map(i => ({ i, x: glyph.layers[i].x, y: glyph.layers[i].y })), moved: false, pointer: e.pointerId };
    $("canvas").setPointerCapture(e.pointerId); $("canvas").focus();
    refresh(); e.preventDefault();
  });
  $("canvas").addEventListener("pointermove", e => {
    if (!drag || drag.pointer !== e.pointerId) return;
    const p = point(e), l = glyph.layers[selected], step = $("snap").checked ? 25 : 1;
    if (!l || (Math.abs(p.x - drag.point.x) + Math.abs(p.y - drag.point.y) < 2 && !drag.moved)) return;
    drag.moved = true;
    let dx = Math.round((drag.x + p.x - drag.point.x) / step) * step - drag.x;
    let dy = Math.round((drag.y + p.y - drag.point.y) / step) * step - drag.y;
    dx = Math.max(...drag.origins.map(o => -5000 - o.x), Math.min(dx, ...drag.origins.map(o => 5000 - o.x)));
    dy = Math.max(...drag.origins.map(o => -5000 - o.y), Math.min(dy, ...drag.origins.map(o => 5000 - o.y)));
    drag.origins.forEach(o => { glyph.layers[o.i].x = o.x + dx; glyph.layers[o.i].y = o.y + dy; });
    drawCanvas(); updateProperties(); drawPreviews();
  });
  function endDrag(e) {
    if (!drag || drag.pointer !== e.pointerId) return;
    const previous = drag; drag = null;
    if (previous.moved) {
      history.push(previous.before); if (history.length > 100) history.shift();
      future = []; dirty = true; persist(); refresh();
    }
  }
  $("canvas").addEventListener("pointerup", endDrag);
  $("canvas").addEventListener("lostpointercapture", endDrag);
  $("canvas").addEventListener("pointercancel", e => { if (drag) { const before = drag.before; drag = null; restore(before); } });
  document.addEventListener("keydown", e => {
    if (e.target.closest("input,textarea,select,[contenteditable]") || drag) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault(); $(e.shiftKey ? "redo" : "undo").click(); return;
    }
    if (e.target !== $("canvas") || !glyph.layers[selected]) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") { e.preventDefault(); $("select-all").click(); return; }
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key]) {
      e.preventDefault(); moveParts(dirs[e.key][0] * (e.shiftKey ? 10 : 1), dirs[e.key][1] * (e.shiftKey ? 10 : 1));
    }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); $("delete").click(); }
  });
  for (const k of ["grid", "guides"]) $(k).onchange = () => $("canvas").classList.toggle(k, $(k).checked);
  $("preview-font").onchange = drawPreviews; $("preview-bg").onchange = drawPreviews;
  for(const name of ["diary-preview-font","diary-preview-size","diary-preview-width"])$(name).onchange=drawPreviews;
  function save() {
    const g = KanjiCore.validateGlyph(glyph);
    // Assignment belongs to the registered entry, not to an older editing-history snapshot.
    if (Object.hasOwn(dictionary.glyphs, id)) {
      if (dictionary.glyphs[id].fontCodePoint === undefined) delete g.fontCodePoint;
      else g.fontCodePoint = dictionary.glyphs[id].fontCodePoint;
    }
    if (!g.layers.length) throw new Error("部品を追加してから保存してください");
    g.copyText = g.copyText || g.unicode || g.ids || g.layers.filter(l => l.type === "text").map(l => l.char).join("") || id;
    const next = clone(dictionary); Object.defineProperty(next.glyphs, id, { value: g, enumerable: true, configurable: true, writable: true });
    dictionary = KanjiCore.validateDictionary(next);
    deletedGlyphIds.delete(id);
    glyph = clone(g); dirty = false; persist(); listDictionary(); refresh();
    status(`「${id}」を辞書に保存しました（${Object.keys(dictionary.glyphs).length}字）。`);
  }
  $("save").onclick = () => { try { save(); } catch (e) { status(e.message); } };
  function download(data, name, type) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  $("export").onclick = () => {
    try {
      const includeDraft = glyph.layers.length > 0 && !deletedGlyphIds.has(id);
      if (includeDraft) save();
      download(JSON.stringify(dictionary, null, 2), "dictionary.json", "application/json");
      status(includeDraft ? "編集中の字を含めて辞書を書き出しました。" : "登録済みの辞書を書き出しました。削除した字や空の下書きは追加していません。");
    }
    catch (e) { status(e.message); }
  };
  $("svg-export").onclick = () => {
    const svg = KanjiCore.renderGlyph(glyph);
    download(new XMLSerializer().serializeToString(svg), `${id.replace(/[^a-zA-Z0-9_-]/g, "_") || "kanji"}.svg`, "image/svg+xml");
    status("透明背景のSVGを書き出しました。文字はアウトラインではなく、使用環境のフォントで描画されます。");
  };
  $("load-glyph").onclick = () => {
    const key = $("dictionary-select").value;
    if (!Object.hasOwn(dictionary.glyphs, key)) return;
    change(() => { glyph = clone(dictionary.glyphs[key]); id = key; selectOnly(glyph.layers.length - 1); });
    status(`「${key}」を読み込みました。元の下書きには「戻す」で戻れます。`);
  };
  $("import").onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("JSONファイルは10MB以内にしてください");
      const next = KanjiCore.validateDictionary(JSON.parse(await file.text()));
      // Preserve the previous dictionary as a download before replacing it.
      download(JSON.stringify(dictionary, null, 2), "dictionary-backup.json", "application/json");
      dictionary = next; persist(); listDictionary();
      status(`${Object.keys(dictionary.glyphs).length}字を読み込みました。旧辞書はバックアップとして書き出しました。選択して「編集」で開けます。`);
    } catch (error) { status(`読み込みできませんでした：${error.message}`); }
    e.target.value = "";
  };
  async function start() {
    let restored = false;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved) {
        const d = KanjiCore.validateDictionary(saved.dictionary), g = KanjiCore.validateGlyph(saved.glyph);
        if (typeof saved.id !== "string") throw new Error("下書きIDが不正です");
        dictionary = d; glyph = g; id = saved.id; selected = Math.min(glyph.layers.length - 1, Math.max(-1, Number(saved.selected) || 0));
        selectOnly(selected); dirty = Boolean(saved.dirty); restored = true;
        if (Array.isArray(saved.deletedGlyphIds)) deletedGlyphIds = new Set(saved.deletedGlyphIds.filter(v => typeof v === "string"));
        if (typeof saved.previewText === "string") $("preview-text").value = saved.previewText.slice(0, 2000);
        matchPreviewColor = saved.matchPreviewColor === true;
        if (saved.reference && typeof saved.reference === "object") {
          $("reference-enabled").checked = saved.reference.enabled === true;
          if (typeof saved.reference.char === "string") $("reference-char").value = saved.reference.char.slice(0, 64);
          if (Number.isFinite(saved.reference.opacity)) $("reference-opacity").value = Math.max(5, Math.min(60, saved.reference.opacity));
        }
      }
    } catch { storageWarning = "以前の下書きを読み込めませんでした。"; }
    if (!restored) {
      try {
        const r = await fetch("dictionary.json");
        if (!r.ok) throw new Error();
        dictionary = KanjiCore.validateDictionary(await r.json());
      } catch { /* file:// and offline still have a usable starter dictionary. */ }
    }
    listDictionary(); refresh();
    status(restored ? "前回の下書きを復元しました。" : "「門」と「猫」から始めてみましょう。部品を選んで自由に編集できます。");
    await Promise.allSettled([
      document.fonts.load('400 1000px "Noto Sans JP"'),
      document.fonts.load('400 1000px "Noto Serif JP"')
    ]);
    refresh();
    document.fonts.addEventListener("loadingdone", () => { drawCanvas(); drawPreviews(); drawDictionary(); });
  }
  KanjiFontUI.mount({
    getDictionary: () => dictionary,
    assign: (key, codePoint, deferSave = false) => {
      if (!Object.hasOwn(dictionary.glyphs, key)) return;
      if (codePoint === null) {
        delete dictionary.glyphs[key].fontCodePoint;
        if (id === key) delete glyph.fontCodePoint;
      } else {
        dictionary.glyphs[key].fontCodePoint = codePoint;
        if (id === key) glyph.fontCodePoint = codePoint;
      }
      if (!deferSave) persist();
    },
    flush: persist
  });
  start();
})();
