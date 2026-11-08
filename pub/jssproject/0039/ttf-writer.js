/* Minimal unhinted TrueType writer. Outlines are explicit on-curve polygons.
   Reference: https://learn.microsoft.com/typography/opentype/spec/ */
(() => {
  'use strict';
  class Bytes {
    constructor() { this.a = []; }
    u8(n) { this.a.push(n & 255); return this; }
    u16(n) { return this.u8(n >> 8).u8(n); }
    u32(n) { return this.u16(n >>> 16).u16(n); }
    str(s) { for (const c of s) this.u8(c.charCodeAt(0)); return this; }
    zeros(n) { while (n--) this.u8(0); return this; }
    add(a) { for (const v of a) this.u8(v); return this; }
    data() { return Uint8Array.from(this.a); }
  }
  function sum(data) {
    let result = 0;
    for (let i = 0; i < data.length; i += 4) result = (result + (((data[i] || 0) * 0x1000000) + ((data[i+1] || 0) << 16) + ((data[i+2] || 0) << 8) + (data[i+3] || 0))) >>> 0;
    return result;
  }
  function glyphData(contours) {
    const points = contours.flat();
    if (points.length > 65535 || contours.length > 32767) throw new Error('字形の輪郭が複雑すぎます。解像度を下げてください。');
    const bbox = points.length ? [Math.min(...points.map(p=>p[0])), Math.min(...points.map(p=>p[1])), Math.max(...points.map(p=>p[0])), Math.max(...points.map(p=>p[1]))] : [0,0,0,0];
    const b = new Bytes().u16(contours.length); bbox.forEach(v => b.u16(v));
    let end = -1;
    for (const contour of contours) { end += contour.length; b.u16(end); }
    b.u16(0); // No instructions.
    for (const p of points) b.u8(1); // On-curve, signed 16-bit deltas.
    for (let axis = 0; axis < 2; axis++) {
      let last = 0;
      for (const p of points) { b.u16(p[axis] - last); last = p[axis]; }
    }
    if (b.a.length % 2) b.u8(0);
    return { data: b.data(), bbox, points: points.length, contours: contours.length };
  }
  function names(family, license) {
    const values = { 0: license.includes('SIL OPEN FONT LICENSE') ? 'Copyright 2014-2024 Adobe. Modified outlines: Choiwaru Kanji user.' : 'Created with Choiwaru Kanji.', 1: family, 2: 'Regular', 3: `${family};1.0;Choiwaru`, 4: `${family} Regular`, 5: 'Version 1.000', 6: `${family}-Regular`, 13: license, 14: license.includes('SIL OPEN FONT LICENSE') ? 'https://openfontlicense.org/' : '' };
    const records = new Bytes(), strings = new Bytes();
    for (const [id, text] of Object.entries(values)) {
      const value = new Bytes(); for (let i = 0; i < text.length; i++) value.u16(text.charCodeAt(i));
      records.u16(3).u16(1).u16(0x409).u16(+id).u16(value.a.length).u16(strings.a.length);
      strings.add(value.a);
    }
    return new Bytes().u16(0).u16(Object.keys(values).length).u16(6 + records.a.length).add(records.a).add(strings.a).data();
  }
  function cmap(entries) {
    const bmp = entries.filter(e => e.codePoint < 0xffff), n = bmp.length + 1;
    const pow = 2 ** Math.floor(Math.log2(n));
    const f4 = new Bytes().u16(4).u16(16 + 8*n).u16(0).u16(n*2).u16(pow*2).u16(Math.log2(pow)).u16(n*2 - pow*2);
    bmp.forEach(e => f4.u16(e.codePoint)); f4.u16(0xffff).u16(0);
    bmp.forEach(e => f4.u16(e.codePoint)); f4.u16(0xffff);
    bmp.forEach(e => f4.u16(e.gid - e.codePoint)); f4.u16(1);
    f4.zeros(n*2);
    const f12 = new Bytes().u16(12).u16(0).u32(16 + entries.length*12).u32(0).u32(entries.length);
    entries.forEach(e => f12.u32(e.codePoint).u32(e.codePoint).u32(e.gid));
    return new Bytes().u16(0).u16(2).u16(3).u16(1).u32(20).u16(3).u16(10).u32(20+f4.a.length).add(f4.a).add(f12.a).data();
  }
  function build(glyphs, options) {
    const em = 2048, ascent = 1802, descent = -246;
    const family = options.family;
    if (!/^[A-Za-z][A-Za-z0-9-]{0,47}$/.test(family) || /source/i.test(family)) throw new Error('フォント名は英字で始まる英数字・ハイフン48文字以内です。Sourceは予約名のため使用できません。');
    if (!glyphs.length || glyphs.length > 5000) throw new Error('フォントは1〜5000字で作成してください。');
    const sorted = [...glyphs].sort((a,b) => a.codePoint-b.codePoint);
    if (sorted.some(g => !Number.isInteger(g.codePoint) || g.codePoint < 0 || g.codePoint > 0x10ffff || (g.codePoint >= 0xd800 && g.codePoint <= 0xdfff))) throw new Error('割り当て先が未指定または不正です。');
    if (new Set(sorted.map(g=>g.codePoint)).size !== sorted.length) throw new Error('割り当て先が重複しています。');
    const missing = [[[100,0],[100,1400],[1400,1400],[1400,0]],[[240,140],[1260,140],[1260,1260],[240,1260]]];
    const outlines = [glyphData(missing), ...sorted.map(g=>glyphData(g.contours))];
    const glyf = new Bytes(), loca = new Bytes(), hmtx = new Bytes();
    outlines.forEach(g => { loca.u32(glyf.a.length); glyf.add(g.data); hmtx.u16(em).u16(g.bbox[0]); });
    loca.u32(glyf.a.length);
    const bbox = [Math.min(...outlines.map(g=>g.bbox[0])), Math.min(...outlines.map(g=>g.bbox[1])), Math.max(...outlines.map(g=>g.bbox[2])), Math.max(...outlines.map(g=>g.bbox[3]))];
    const head = new Bytes().u32(0x10000).u32(0x10000).u32(0).u32(0x5f0f3cf5).u16(3).u16(em);
    const epoch = Math.floor(Date.now()/1000) + 2082844800;
    head.u32(0).u32(epoch).u32(0).u32(epoch); bbox.forEach(v=>head.u16(v));
    head.u16(0).u16(8).u16(2).u16(1).u16(0);
    const hhea = new Bytes().u32(0x10000).u16(ascent).u16(descent).u16(0).u16(em).u16(bbox[0]).u16(em-bbox[2]).u16(bbox[2]).u16(1).u16(0).u16(0).zeros(8).u16(0).u16(outlines.length);
    const maxp = new Bytes().u32(0x10000).u16(outlines.length).u16(Math.max(...outlines.map(g=>g.points))).u16(Math.max(...outlines.map(g=>g.contours))).u16(0).u16(0).u16(2).zeros(16);
    const os2 = new Bytes().u16(4).u16(em).u16(400).u16(5).u16(0);
    [1300,1300,0,280,1300,1300,0,950,100,500,0].forEach(v=>os2.u16(v));
    os2.zeros(10).u32(0).u32(0).u32(0).u32(0).str('CKNJ').u16(0x40).u16(Math.min(sorted[0].codePoint,0xffff)).u16(Math.min(sorted.at(-1).codePoint,0xffff));
    os2.u16(ascent).u16(descent).u16(0).u16(ascent).u16(-descent).u32(0).u32(0).u16(1000).u16(1400).u16(0).u16(32).u16(1);
    const post = new Bytes().u32(0x30000).u32(0).u16(-100).u16(50).u32(1).zeros(16);
    const tables = { 'OS/2':os2.data(), cmap:cmap(sorted.map((g,i)=>({codePoint:g.codePoint,gid:i+1}))), glyf:glyf.data(), head:head.data(), hhea:hhea.data(), hmtx:hmtx.data(), loca:loca.data(), maxp:maxp.data(), name:names(family,options.license), post:post.data() };
    const tags = Object.keys(tables).sort(), count = tags.length, power = 2 ** Math.floor(Math.log2(count));
    const header = new Bytes().u32(0x10000).u16(count).u16(power*16).u16(Math.log2(power)).u16(count*16-power*16), body = new Bytes();
    let offset = 12 + count*16, headOffset;
    tags.forEach(tag => {
      const data = tables[tag]; header.str(tag).u32(sum(data)).u32(offset).u32(data.length);
      if (tag === 'head') headOffset = offset;
      body.add(data); const padding = (4-data.length%4)%4; body.zeros(padding); offset += data.length+padding;
    });
    const output = new Bytes().add(header.a).add(body.a).data();
    new DataView(output.buffer).setUint32(headOffset+8, (0xb1b0afba-sum(output))>>>0);
    return output;
  }
  window.ChoiwaruTTF = { build };
})();
