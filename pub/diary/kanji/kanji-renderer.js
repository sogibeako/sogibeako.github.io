(() => {
  "use strict";
  let dictionary = { glyphs: {} };
  let settings = { ruby: true, baseline: "-0.1em" };
  const rendered = new WeakMap();
  const scriptURL = document.currentScript?.src;
  function installStyles() {
    if (document.getElementById("choiwaru-styles")) return;
    const link = document.createElement("link");
    link.id = "choiwaru-styles"; link.rel = "stylesheet";
    link.href = new URL("kanji-renderer.css", scriptURL || location.href).href;
    document.head.append(link);
  }
  function copyText(g) { return g.copyText || g.unicode || g.ids || g.layers.filter(l => l.type === "text").map(l => l.char).join(""); }
  function bindCopy(element, glyph, visual = element) {
    rendered.set(element, glyph);
    element.classList.add("choiwaru-copy-host");
    visual.classList.add("choiwaru-copy-visual");
    const proxy = document.createElement("span");
    proxy.className = "choiwaru-copy-text"; proxy.textContent = copyText(glyph) || "\uFFFC";
    proxy.setAttribute("aria-hidden", "true");
    visual.append(proxy);
  }
  let dialog;
  function annotate(element, glyph) {
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "choiwaru-dialog";
      document.body.append(dialog);
      dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
    }
    dialog.replaceChildren();
    const title = document.createElement("h2"); title.textContent = copyText(glyph);
    const description = document.createElement("p");
    description.textContent = `読み：${glyph.ruby || "未登録"}\n本来の表記：${glyph.original || "未登録"}\n意味：${glyph.meaning || "未登録"}`;
    const copy = document.createElement("button"); copy.textContent = "この漢字をコピー";
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(copyText(glyph)); copy.textContent = "コピーしました"; }
      catch { copy.textContent = "コピーできません。上の文字列を選択してください"; }
    };
    const close = document.createElement("button"); close.textContent = "閉じる"; close.onclick = () => dialog.close();
    dialog.append(title, description, copy, close);
    dialog.showModal();
  }
  function render(element) {
    if (!(element instanceof Element)) return false;
    const raw = dictionary.glyphs[element.dataset.kanji];
    if (!raw) return false;
    const glyph = KanjiCore.validateGlyph(raw);
    // Recolor only drawing layers; erase masks must retain their luminance values.
    // Keep currentColor live so class/theme changes do not require a rerender.
    const requestedColor = element.dataset.color ?? settings.color;
    const color = typeof requestedColor === "string" && CSS.supports("color", requestedColor)
      ? requestedColor : null;
    if (color) {
      glyph.layers.forEach(layer => {
        if (layer.type !== "erase" && layer.fill !== "none") layer.fill = "currentColor";
      });
    }
    const svg = KanjiCore.renderGlyph(glyph, { size: 1000 });
    const visual = document.createElement("span");
    visual.className = "choiwaru-kanji";
    visual.style.verticalAlign = settings.baseline;
    visual.append(svg);
    let content = visual;
    const showRuby = settings.ruby && element.dataset.ruby !== "hide" && glyph.ruby;
    if (showRuby) {
      content = document.createElement("ruby");
      const rt = document.createElement("rt"); rt.textContent = glyph.ruby; rt.setAttribute("aria-hidden", "true");
      content.append(visual, rt);
    }
    if (color) content.style.color = color;
    element.replaceChildren(content);
    element.classList.add("choiwaru-host");
    element.classList.toggle("choiwaru-with-ruby", Boolean(showRuby));
    element.setAttribute("aria-label", [glyph.ruby || copyText(glyph), glyph.meaning].filter(Boolean).join("："));
    element.tabIndex = 0; element.setAttribute("role", "button");
    element.setAttribute("aria-haspopup", "dialog");
    element.title = "字の読み・意味を表示";
    bindCopy(element, glyph, visual);
    // Property handlers are replaced on rerender, avoiding duplicate listeners.
    element.onclick = () => { if (window.getSelection()?.isCollapsed !== false) annotate(element, rendered.get(element)); };
    element.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); annotate(element, rendered.get(element)); } };
    return true;
  }
  function renderAll(root = document) { root.querySelectorAll("[data-kanji]").forEach(render); }
  // Walk the original DOM so even a selection starting inside an SVG or rt is normalized once.
  function selectionText(selection) {
    const parts = [];
    let containsGlyph = false;
    for (let index = 0; index < selection.rangeCount; index++) {
      const range = selection.getRangeAt(index);
      if (range.collapsed) continue;
      let root = range.commonAncestorContainer;
      if (root.nodeType === Node.TEXT_NODE) root = root.parentNode;
      root = root.closest?.(".choiwaru-copy-host") || root;
      function visit(node) {
        if (!range.intersectsNode(node)) return "";
        if (node.nodeType === Node.ELEMENT_NODE && rendered.has(node)) {
          containsGlyph = true; return copyText(rendered.get(node));
        }
        if (node.nodeType === Node.TEXT_NODE) {
          const start = range.startContainer === node ? range.startOffset : 0;
          const end = range.endContainer === node ? range.endOffset : node.length;
          return node.data.slice(start, end);
        }
        if (node.nodeName === "BR") return "\n";
        const value = [...node.childNodes].map(visit).join("");
        return /^(P|DIV|LI|SECTION|ARTICLE|H[1-6])$/.test(node.nodeName) && value ? value + "\n" : value;
      }
      parts.push(visit(root).replace(/\n$/, ""));
    }
    return containsGlyph ? parts.join("\n") : null;
  }
  document.addEventListener("copy", e => {
    if (e.defaultPrevented || document.activeElement?.matches("input,textarea,[contenteditable=true]")) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !e.clipboardData) return;
    const value = selectionText(selection);
    if (value !== null) { e.clipboardData.setData("text/plain", value); e.preventDefault(); }
  });
  document.addEventListener("dragstart", e => {
    const selection = window.getSelection();
    const value = selection && selectionText(selection);
    if (value !== null && value !== false && e.dataTransfer) {
      e.dataTransfer.clearData(); e.dataTransfer.setData("text/plain", value);
    }
  });
  async function init(options = {}) {
    const next = typeof options.dictionary === "string"
      ? await fetch(options.dictionary).then(r => { if (!r.ok) throw new Error(`辞書の読み込みに失敗: ${r.status}`); return r.json(); })
      : options.dictionary;
    const validated = KanjiCore.validateDictionary(next);
    dictionary = validated;
    settings = { ...settings, ...options };
    installStyles();
    renderAll();
    await document.fonts.ready;
    renderAll();
  }
  window.ChoiwaruKanji = { init, render, renderAll, selectionText, bindCopy };
  // CSS can arrive after init() when the host omitted the explicit stylesheet link.
  document.fonts.addEventListener("loadingdone", () => renderAll());
})();
