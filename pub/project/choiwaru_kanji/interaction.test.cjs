const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 1100 } });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    const base = process.argv[2] || 'http://127.0.0.1:8765';
    await page.goto(base + '/editor.html');
    await page.waitForSelector('#dictionary-grid button');
    await page.evaluate(() => {
      const glyph = { copyText: '比較字', ruby: 'ひかく', layers: [
        { type: 'text', char: '木', x: 103, y: 150, width: 350, height: 650, rotation: 15 },
        { type: 'text', char: '月', x: 517, y: 170, width: 330, height: 600, flipX: true }
      ] };
      const dictionary = { schemaVersion: '1.0', unitsPerEm: 1000, glyphs: {} };
      for (let i = 0; i < 130; i++) dictionary.glyphs['word-' + i] = { ...glyph, ruby: 'よみ' + i };
      localStorage.setItem('choiwaru-kanji-v1', JSON.stringify({ glyph, dictionary, id: 'word-0', selected: 1 }));
    });
    await page.reload();
    assert.equal(await page.locator('#dictionary-grid button').count(), 64);
    await page.locator('#dictionary-next').click();
    await page.locator('#dictionary-next').click();
    assert.equal(await page.locator('#dictionary-grid button').count(), 2);
    await page.locator('#dictionary-search').fill('よみ129');
    assert.equal(await page.locator('#dictionary-grid button').count(), 1);
    await page.locator('#dictionary-grid button').click();
    assert.equal(await page.locator('#meta-id').inputValue(), 'word-129');
    const layers = () => page.evaluate(() => JSON.parse(localStorage.getItem('choiwaru-kanji-v1')).glyph.layers);
    const original = await layers();
    await page.locator('#layers button').first().click();
    await page.locator('#layers button').nth(1).click({ modifiers: ['Shift'] });
    assert.equal(await page.locator('#layers button.active').count(), 2);
    await page.keyboard.press('Shift+ArrowRight');
    const moved = await layers();
    moved.forEach((l, i) => { assert.equal(l.x, original[i].x + 10); assert.equal(l.width, original[i].width); });
    await page.keyboard.press('Control+c');
    assert.ok((await page.evaluate(() => navigator.clipboard.readText())).startsWith('ChoiwaruKanjiParts/1\n'));
    await page.keyboard.press('Control+v');
    await page.waitForFunction(() => document.querySelectorAll('#layers li').length === 4);
    assert.deepEqual((await layers()).slice(2), moved, 'paste preserves all transforms and positions');
    await page.keyboard.press('Control+z'); assert.equal(await page.locator('#layers li').count(), 2);
    await page.keyboard.press('Control+Shift+z'); assert.equal(await page.locator('#layers li').count(), 4);
    await page.keyboard.press('Delete'); assert.equal(await page.locator('#layers li').count(), 2);
    await page.locator('#select-all').click();
    await page.locator('#canvas').scrollIntoViewIfNeeded();
    const box = await page.locator('#canvas').boundingBox();
    await page.mouse.move(box.x + box.width * .65, box.y + box.height * .5); await page.mouse.down();
    await page.mouse.move(box.x + box.width * .7, box.y + box.height * .55, { steps: 4 }); await page.mouse.up();
    const dragged = await layers();
    assert.equal(dragged[1].x - dragged[0].x, moved[1].x - moved[0].x, 'group snap preserves offsets');
    assert.notEqual(dragged[0].x, moved[0].x);
    await page.locator('#preview-text').fill('朝{字}夜{字}。');
    const sentence = page.locator('.preview-sentence').last();
    await sentence.scrollIntoViewIfNeeded();
    const rect = await sentence.boundingBox();
    await page.mouse.move(rect.x + 1, rect.y + rect.height / 2);
    await page.mouse.down(); await page.mouse.move(rect.x + rect.width - 1, rect.y + rect.height / 2, { steps: 20 }); await page.mouse.up();
    await page.keyboard.press('Control+c');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(copied, '朝比較字夜比較字。');
    assert.equal(await page.locator('#previews .inline-glyph svg').count(), 6, 'copy does not change display');
    const contextCopy = await page.evaluate(() => {
      const e = new ClipboardEvent('copy', { clipboardData: new DataTransfer(), bubbles: true, cancelable: true });
      document.dispatchEvent(e); return e.clipboardData.getData('text/plain');
    });
    assert.equal(contextCopy, copied, 'context-menu copy uses the same selection event');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.goto(base + '/demo.html'); await page.waitForSelector('.choiwaru-copy-text');
    const host = page.locator('[data-kanji]').first();
    await host.evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el.querySelector('.choiwaru-copy-text'));
      getSelection().removeAllRanges(); getSelection().addRange(range);
      el.click();
    });
    assert.equal(await page.locator('dialog[open]').count(), 0, 'selection does not trigger annotation');
    await page.keyboard.press('Control+c');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '⿴門猫');
    assert.deepEqual(errors, []);
    console.log('PASS: 130 glyph gallery, search, paging, multi-select, group drag, clipboard paste, undo, preview mouse selection, copy event, renderer copy, mobile');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
