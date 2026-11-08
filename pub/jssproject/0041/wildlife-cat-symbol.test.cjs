const a=require('node:assert/strict'),W=require('./maze-wildlife.js');
const host=JSON.parse('{"wildlife":{"pets":[{"kind":"c","id":7,"mode":"sleep"}],"food":[]}}');
a.equal(W.glyph(host,{},7),'f');a.equal(W.glyph(host,{},7,false),null);a(W.status(host).includes('猫 f'));
const ctx={fillRect(){}};a(W.paint(ctx,host,7,'f',0,0,24));a.equal(ctx.fillStyle,W.palette.c.ink);
a(W.paint(ctx,host,7,'f',0,0,24,true));a.equal(ctx.fillStyle,'#111');
a.equal(host.wildlife.pets[0].kind,'c');
console.log('Saved cat identity retained; visible glyph/status f and normal/beyond-seam palette passed.');
