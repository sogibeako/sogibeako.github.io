/* Run against a local HTTP server: node browser.test.cjs [base URL].
   Requires Playwright with a locally installed Microsoft Edge. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.argv[2] || "http://127.0.0.1:8765";
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(`${base}/editor.html`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("#layers").children.length === 2);
    await page.locator("#preview-text").fill("朝は{字}。\n夜も{字}！");
    assert.equal(await page.locator("#previews .inline-glyph").count(), 6);
    assert.ok((await page.locator("#previews").textContent()).includes("夜も"));
    await page.locator("#preview-text").evaluate(el => { el.focus(); el.setSelectionRange(0, 2); });
    await page.locator("#insert-preview-glyph").click();
    assert.ok((await page.locator("#preview-text").inputValue()).startsWith("{字}{字}"));
    await page.locator("#meta-ids").fill("木月");
    await page.locator("#meta-ids").evaluate(el => el.setSelectionRange(0, 0));
    await page.locator('[data-ids="⿰"]').click();
    assert.equal(await page.locator("#meta-ids").inputValue(), "⿰木月");
    await page.locator("#meta-ids").evaluate(el => el.setSelectionRange(0, 1));
    await page.locator('[data-ids="⿱"]').click();
    assert.equal(await page.locator("#meta-ids").inputValue(), "⿱木月");
    await page.locator("#undo").click();
    assert.equal(await page.locator("#meta-ids").inputValue(), "⿰木月");
    await page.locator("#characters").fill("木日月心");
    await page.locator("#layout").selectOption("grid");
    await page.locator("#add-text").click();
    assert.equal(await page.locator("#layers li").count(), 6, "more than two text parts");
    await page.locator("#prop-fontWeight").fill("800");
    await page.locator("#prop-fontWeight").dispatchEvent("change");
    await page.locator("#prop-strokeWidth").fill("20");
    await page.locator("#prop-strokeWidth").press("Tab");
    await page.locator("#prop-flipX").check();
    await page.locator("#prop-rotation").fill("30");
    await page.locator("#prop-rotation").press("Tab");
    await page.locator("#duplicate").click();
    assert.equal(await page.locator("#layers li").count(), 7);
    await page.locator("#undo").click();
    assert.equal(await page.locator("#layers li").count(), 6);
    await page.locator("#redo").click();
    assert.equal(await page.locator("#layers li").count(), 7);
    await page.locator("#delete").click();
    await page.locator("#meta-id").fill("test-four-parts");
    await page.locator("#meta-id").press("Tab");
    await page.locator("#save").click();
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#export").click();
    const download = await downloadPromise;
    const fs = require("node:fs");
    const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    assert.equal(exported.glyphs["test-four-parts"].layers.length, 6);
    assert.equal(exported.glyphs["test-four-parts"].layers[5].fontWeight, 800);
    assert.equal(exported.glyphs["test-four-parts"].layers[5].flipX, true);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("#layers li").count(), 6, "draft restored");
    assert.ok((await page.locator("#preview-text").inputValue()).startsWith("{字}{字}"), "custom sentence restored");
    await page.locator("#reset-preview-text").click();
    await page.locator("#import").setInputFiles({
      name: "roundtrip.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(exported))
    });
    await page.waitForFunction(() => document.querySelector("#status").textContent.includes("字を読み込みました"));
    await page.locator("#dictionary-select").selectOption("test-four-parts");
    await page.locator("#load-glyph").click();
    assert.equal(await page.locator("#prop-rotation").inputValue(), "30");
    await page.locator("#canvas").scrollIntoViewIfNeeded();
    const bounds = await page.locator("#canvas").boundingBox();
    const xBefore = Number(await page.locator("#prop-x").inputValue());
    await page.mouse.move(bounds.x + bounds.width * .7, bounds.y + bounds.height * .7);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * .75, bounds.y + bounds.height * .75, { steps: 4 });
    await page.mouse.up();
    assert.notEqual(Number(await page.locator("#prop-x").inputValue()), xBefore, "drag updates coordinates");
    await page.locator("#undo").click();
    // Verify pixel alpha and the order of two erase operations.
    const pixels = await page.evaluate(async () => {
      const layers = [
        { type: "rect", x: 0, y: 0, width: 1000, height: 1000, fill: "#ff0000" },
        { type: "erase", x: 200, y: 200, width: 600, height: 600 },
        { type: "rect", x: 400, y: 400, width: 200, height: 200, fill: "#0000ff" },
        { type: "erase", x: 480, y: 480, width: 40, height: 40 }
      ];
      const svg = KanjiCore.renderGlyph({ layers });
      const image = new Image();
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
      image.src = url; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1000;
      const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0); URL.revokeObjectURL(url);
      return [[100, 100], [300, 300], [450, 450], [500, 500]].map(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data]);
    });
    assert.deepEqual(pixels, [[255, 0, 0, 255], [0, 0, 0, 0], [0, 0, 255, 255], [0, 0, 0, 0]], "sequential masks preserve later strokes");
    const invalid = await page.evaluate(() => {
      const bad = [
        { layers: [{ type: "rect", width: -1 }] },
        { layers: [{ type: "text", char: "猫", fill: "url(https://example.com)" }] },
        { layers: [{ type: "erase", shape: "path" }] },
        { layers: [{ type: "script" }] }
      ];
      return bad.map(g => { try { KanjiCore.renderGlyph(g); return false; } catch { return true; } });
    });
    assert.ok(invalid.every(Boolean));
    // Return to the starter glyph for the representative screenshot.
    await page.locator("#dictionary-select").selectOption("gate-cat");
    await page.locator("#load-glyph").click();
    if (process.env.CK_SCREENSHOT) await page.screenshot({ path: process.env.CK_SCREENSHOT, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "mobile does not overflow");
    await page.goto(`${base}/demo.html`, { waitUntil: "networkidle" });
    await page.waitForSelector(".choiwaru-host svg");
    assert.equal(await page.locator(".choiwaru-host").count(), 3);
    const colors = await page.evaluate(() => {
      const el = document.querySelector("[data-kanji]");
      const fill = () => getComputedStyle(el.querySelector("svg text")).fill;
      const original = fill();
      el.dataset.color = "rgb(210, 65, 90)"; ChoiwaruKanji.render(el);
      const rgb = fill(), ruby = getComputedStyle(el.querySelector("rt")).color;
      const style = document.createElement("style"); style.textContent = ".test-accent { color: rgb(35, 120, 95) }";
      document.head.append(style); el.classList.add("test-accent");
      el.dataset.color = "currentColor"; ChoiwaruKanji.render(el);
      const inherited = fill();
      el.style.color = "rgb(10, 20, 30)"; const live = fill();
      el.dataset.color = "url(https://example.com)"; ChoiwaruKanji.render(el);
      const invalid = fill();
      delete el.dataset.color; ChoiwaruKanji.render(el);
      return { original, rgb, ruby, inherited, live, invalid, restored: fill() };
    });
    assert.equal(colors.rgb, "rgb(210, 65, 90)");
    assert.equal(colors.ruby, colors.rgb);
    assert.equal(colors.inherited, "rgb(35, 120, 95)");
    assert.equal(colors.live, "rgb(10, 20, 30)");
    assert.equal(colors.invalid, colors.original);
    assert.equal(colors.restored, colors.original);
    const copies = await page.evaluate(() => {
      const p = document.getElementById("diary");
      const host = p.querySelector("[data-kanji]");
      const selection = getSelection(), range = document.createRange();
      function read() { selection.removeAllRanges(); selection.addRange(range); return ChoiwaruKanji.selectionText(selection); }
      range.selectNodeContents(p); const full = read();
      const ink = host.querySelector("text").firstChild;
      range.setStart(p.firstChild, 2); range.setEnd(ink, 1); const partialEnd = read();
      range.setStart(ink, 0); range.setEnd(host.nextSibling, 3); const partialStart = read();
      range.selectNodeContents(host.querySelector("rt")); const ruby = read();
      range.setStart(p.firstChild, 0); range.setEndBefore(host); const before = read();
      selection.removeAllRanges();
      return { full, partialEnd, partialStart, ruby, before };
    });
    assert.equal(copies.full, "こにゃんは今日も⿴門猫していました。\n窓の外は、⿱月⿰月月の夜。");
    assert.equal(copies.partialEnd, "ゃんは今日も⿴門猫");
    assert.equal(copies.partialStart, "⿴門猫してい");
    assert.equal(copies.ruby, "⿴門猫");
    assert.equal(copies.before, null, "no substitution for adjacent unselected glyph");
    const clipboard = await page.evaluate(() => {
      const range = document.createRange(); range.selectNodeContents(document.getElementById("diary"));
      getSelection().removeAllRanges(); getSelection().addRange(range);
      const data = new DataTransfer();
      const event = new ClipboardEvent("copy", { clipboardData: data, cancelable: true, bubbles: true });
      document.dispatchEvent(event); getSelection().removeAllRanges();
      return { text: data.getData("text/plain"), prevented: event.defaultPrevented };
    });
    assert.equal(clipboard.text, copies.full); assert.equal(clipboard.prevented, true);
    await page.locator("[data-kanji]").first().focus();
    await page.keyboard.press("Enter");
    assert.ok(await page.locator("dialog").isVisible());
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("dialog").isVisible(), false);
    await page.evaluate(() => ChoiwaruKanji.renderAll());
    assert.equal(await page.locator(".choiwaru-host").count(), 3, "rerender stays idempotent");
    const bulk = await page.evaluate(async () => {
      const dictionary = await fetch("dictionary.json").then(r => r.json());
      for (let i = 0; i < 24; i++) {
        dictionary.glyphs[`test-${i}`] = dictionary.glyphs["gate-cat"];
        const el = document.createElement("span"); el.dataset.kanji = `test-${i}`; el.textContent = "代替";
        document.body.append(el);
      }
      const unknown = document.createElement("span"); unknown.dataset.kanji = "unknown"; unknown.textContent = "未登録の代替";
      document.body.append(unknown);
      await ChoiwaruKanji.init({ dictionary });
      let rejected = false;
      try { await ChoiwaruKanji.init({ dictionary: "missing-dictionary.json" }); } catch { rejected = true; }
      return { count: document.querySelectorAll(".choiwaru-host").length, fallback: unknown.textContent, rejected };
    });
    assert.deepEqual(bulk, { count: 27, fallback: "未登録の代替", rejected: true });
    assert.deepEqual(errors, []);
    console.log("PASS: editor, 6 parts, styling, undo/redo, JSON roundtrip, draft, mask alpha/order, validation, mobile, copy boundaries, keyboard annotation, rerender");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
