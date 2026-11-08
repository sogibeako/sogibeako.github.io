const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto((process.argv[2]||'http://127.0.0.1:8765')+'/editor.html');
  await page.waitForSelector('.font-entry');
  assert.equal(await page.locator('.font-entry.invalid').count(),2);
  await page.locator('#font-build').click();
  assert.ok((await page.locator('#font-status').textContent()).includes('生成できません'));
  assert.equal(await page.locator('#font-result').isVisible(),false);
  await page.locator('[data-id="gate-cat"] input').fill('U+E001');
  await page.locator('[data-id="three-moons"] input').fill('U+E001');
  assert.equal(await page.locator('.font-entry.invalid').count(),2,'duplicate highlights both');
  await page.locator('[data-id="three-moons"] input').fill('U+D800');
  assert.equal(await page.locator('[data-id="three-moons"] input').getAttribute('aria-invalid'),'true');
  await page.locator('[data-id="three-moons"] input').fill('U+F0000');
  await page.locator('#font-errors-only').uncheck();
  assert.equal(await page.locator('.font-entry.invalid').count(),0);
  await page.reload();await page.waitForSelector('.font-entry');
  assert.equal(await page.locator('[data-id="three-moons"] input').inputValue(),'U+F0000');
  await page.locator('#font-build').click();
  await page.waitForFunction(()=>document.querySelector('#font-settings').disabled===false,{},{timeout:120000});
  const status=await page.locator('#font-status').textContent();console.log(status);
  assert.ok(status.includes('TTFを生成しました'),status);
  assert.ok(await page.locator('#font-result').isVisible());
  const pending=page.waitForEvent('download');await page.locator('#font-download').click();
  const download=await pending, destination=path.join(process.env.TEMP||'.','choiwaru-font-test.ttf');
  await download.saveAs(destination);assert.equal(fs.readFileSync(destination).readUInt32BE(0),0x10000);
  // Verify raster masking and contour orientation, including a later stroke.
  const masks=await page.evaluate(async()=>{
   const glyph={layers:[{type:'rect',x:100,y:100,width:800,height:800},{type:'erase',x:250,y:250,width:500,height:500},{type:'rect',x:400,y:400,width:200,height:200}]};
   const canvas=KanjiFont.rasterize(glyph,1024),ctx=canvas.getContext('2d');
   const alpha=(x,y)=>ctx.getImageData(x,y,1,1).data[3];
   const contours=KanjiFont.trace(canvas);
   const area=points=>points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0);
   const dictionary={schemaVersion:'1.0',unitsPerEm:1000,glyphs:{mask:glyph}};
   const generated=await KanjiFont.generate(dictionary,new Map([['mask',0xe002]]),{family:'MaskTest'});
   const face=new FontFace('MaskTest',generated.data.buffer);await face.load();document.fonts.add(face);
   const out=document.createElement('canvas');out.width=out.height=2048;const c=out.getContext('2d');c.font='2048px MaskTest';c.fillText('\ue002',0,1802);
   return {alpha:[alpha(150,150),alpha(300,300),alpha(500,500)],areas:contours.map(area),ttfAlpha:[c.getImageData(300,300,1,1).data[3],c.getImageData(600,600,1,1).data[3],c.getImageData(1000,1000,1,1).data[3]]};
  });
  assert.deepEqual(masks.alpha,[255,0,255]);assert.deepEqual(masks.ttfAlpha,[255,0,255]);
  assert.ok(masks.areas.some(a=>a>0)&&masks.areas.some(a=>a<0),'hole contours have opposite winding');
  await page.locator('[data-id="gate-cat"] input').fill('');
  assert.equal(await page.locator('#font-result').isVisible(),false,'assignment changes invalidate built font');
  await page.locator('#font-pua-start').fill('U+F0000');await page.locator('#font-fill-pua').click();
  assert.equal(await page.locator('[data-id="gate-cat"] input').inputValue(),'U+F0001','skip assigned codepoints');
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('PASS: missing/duplicate/invalid assignment, persistence, supplementary PUA, TTF load/download, mask holes and later ink, invalidation, PUA allocation, mobile');
  console.log(destination);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
