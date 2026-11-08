/* Canvas composition -> boundary tracing -> unhinted TrueType outlines. */
(() => {
  'use strict';
  const families = { sans: 'CKExportSans', serif: 'CKExportSerif' };
  const loaded = new Map();
  function parseCodePoint(value) {
    const s = String(value ?? '').trim();
    if (!s) return { error: '未割り当て' };
    let codePoint;
    if (/^(?:U\+|0x)?[0-9a-f]{1,6}$/i.test(s)) codePoint = parseInt(s.replace(/^(U\+|0x)/i,''),16);
    else if ([...s].length === 1) codePoint = s.codePointAt(0);
    else return { error: 'U+E000のような16進数か1文字を入力してください' };
    if (codePoint > 0x10ffff || codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f) || (codePoint >= 0xd800 && codePoint <= 0xdfff) || (codePoint >= 0xfdd0 && codePoint <= 0xfdef) || (codePoint & 0xffff) >= 0xfffe) return { error: '制御文字・サロゲート・非文字・範囲外には割り当てられません' };
    return { codePoint };
  }
  const format = cp => `U+${cp.toString(16).toUpperCase().padStart(4,'0')}`;
  function validateAssignments(dictionary, values) {
    const issues = new Map(), used = new Map(), assignments = new Map();
    for (const id of Object.keys(dictionary.glyphs)) {
      const parsed = parseCodePoint(values[id]);
      if (parsed.error) { issues.set(id,parsed.error); continue; }
      assignments.set(id,parsed.codePoint);
      const previous = used.get(parsed.codePoint);
      if (previous) { issues.set(previous,'割り当て先が重複しています'); issues.set(id,'割り当て先が重複しています'); }
      else used.set(parsed.codePoint,id);
    }
    return { issues, assignments };
  }
  function coverage(buffer) {
    const v = new DataView(buffer); let cmap = 0;
    for (let i=0;i<v.getUint16(4);i++) {
      const at = 12+i*16;
      if (v.getUint32(at) === 0x636d6170) cmap = v.getUint32(at+8);
    }
    if (!cmap) throw new Error('元フォントにcmapがありません');
    const subtables = [];
    for (let i=0;i<v.getUint16(cmap+2);i++) {
      const at = cmap+4+i*8, platform = v.getUint16(at), encoding = v.getUint16(at+2);
      if (platform !== 0 && !(platform === 3 && [1,10].includes(encoding))) continue;
      const sub = cmap+v.getUint32(at+4), f = v.getUint16(sub);
      if ([4,12].includes(f)) subtables.push([sub,f]);
    }
    return cp => subtables.some(([s,f]) => {
      if (f === 12) {
        let lo=0, hi=v.getUint32(s+12)-1;
        while (lo<=hi) {
          const mid=(lo+hi)>>1, p=s+16+mid*12, start=v.getUint32(p), end=v.getUint32(p+4);
          if (cp<start) hi=mid-1; else if (cp>end) lo=mid+1; else return v.getUint32(p+8)+cp-start !== 0;
        }
      } else if (cp <= 0xffff) {
        const n=v.getUint16(s+6)/2, ends=s+14, starts=ends+2*n+2, deltas=starts+2*n, ranges=deltas+2*n;
        for (let i=0;i<n;i++) {
          if (cp>v.getUint16(ends+2*i)) continue;
          const start=v.getUint16(starts+2*i); if (cp<start) return false;
          const delta=v.getInt16(deltas+2*i), range=v.getUint16(ranges+2*i);
          if (!range) return ((cp+delta)&0xffff)!==0;
          const gid=v.getUint16(ranges+2*i+range+2*(cp-start)); return gid!==0 && ((gid+delta)&0xffff)!==0;
        }
      }
      return false;
    });
  }
  async function loadFont(key) {
    if (loaded.has(key)) return loaded.get(key);
    const task = (async () => {
      if (!window.CKFontAssets?.[key]) await new Promise((resolve,reject) => {
        const script=document.createElement('script'); script.src=`font-assets/${key}.js`;
        script.onload=resolve; script.onerror=()=>{script.remove();reject(new Error('元フォントを読み込めません。font-assetsフォルダーも配置してください。'));}; document.head.append(script);
      });
      const asset=window.CKFontAssets[key], buffer=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)).buffer;
      const face=new FontFace(families[key],buffer,{weight:key==='serif'?'200 900':'100 900'});
      await face.load(); document.fonts.add(face);
      return { has:coverage(buffer), license:asset.license };
    })();
    loaded.set(key,task);
    try { return await task; } catch(e) { loaded.delete(key); throw e; }
  }
  async function prepare(glyph) {
    for (const l of glyph.layers) if (l.type==='text' && l.fill!=='none') {
      const font=await loadFont(l.font);
      for (const c of l.char) if (!font.has(c.codePointAt(0))) throw new Error(`元フォントに「${c}」(${format(c.codePointAt(0))})がありません`);
      await document.fonts.load(`${l.fontWeight} 1000px ${families[l.font]}`,l.char);
    }
  }
  function rasterize(raw, resolution=1024) {
    const glyph=KanjiCore.validateGlyph(raw), canvas=document.createElement('canvas');
    canvas.width=canvas.height=resolution;
    const ctx=canvas.getContext('2d',{willReadFrequently:true}); ctx.scale(resolution/1000,resolution/1000);
    for (const l of glyph.layers) {
      if (l.type!=='erase' && l.fill==='none') continue;
      ctx.save();
      const probe=KanjiCore.svgNode('g',{transform:KanjiCore.transform(l)}), m=probe.transform.baseVal.consolidate().matrix;
      ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f); ctx.fillStyle=ctx.strokeStyle='#000'; ctx.lineWidth=l.strokeWidth; ctx.miterLimit=4;
      if (l.type==='erase') { ctx.globalCompositeOperation='destination-out'; ctx.fillRect(0,0,l.width,l.height); }
      else if (l.type==='text') {
        ctx.font=`${l.fontWeight} 1000px ${families[l.font]}`;
        const metrics=ctx.measureText(l.char), left=metrics.actualBoundingBoxLeft||0, ascent=metrics.actualBoundingBoxAscent||880;
        const w=Math.max(1,left+(metrics.actualBoundingBoxRight||metrics.width)), h=Math.max(1,ascent+(metrics.actualBoundingBoxDescent||0));
        ctx.scale(l.width/w,l.height/h);
        if (l.strokeWidth) ctx.strokeText(l.char,left,ascent);
        ctx.fillText(l.char,left,ascent);
      } else {
        ctx.beginPath();
        if (l.type==='line') { ctx.lineCap='round'; ctx.moveTo(0,l.height/2);ctx.lineTo(l.width,l.height/2); }
        else if (l.type==='circle') ctx.ellipse(l.width/2,l.height/2,l.width/2,l.height/2,0,0,2*Math.PI);
        else ctx.rect(0,0,l.width,l.height);
        if (l.type!=='line') ctx.fill();
        if (l.strokeWidth) ctx.stroke();
      }
      ctx.restore();
    }
    return canvas;
  }
  function trace(canvas) {
    const n=canvas.width, pixels=canvas.getContext('2d').getImageData(0,0,n,n).data;
    const on=(x,y)=>x>=0&&y>=0&&x<n&&y<n&&pixels[(y*n+x)*4+3]>=128;
    const edges=new Map(), stride=n+1;
    function edge(x,y,dir) { const key=y*stride+x; if(!edges.has(key))edges.set(key,[]); edges.get(key).push(dir); }
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(on(x,y)) {
      if(!on(x,y-1))edge(x,y,0);
      if(!on(x+1,y))edge(x+1,y,1);
      if(!on(x,y+1))edge(x+1,y+1,2);
      if(!on(x-1,y))edge(x,y+1,3);
    }
    const dirs=[[1,0],[0,1],[-1,0],[0,-1]], contours=[];
    let total=0;
    while(edges.size) {
      const start=edges.keys().next().value; let key=start, previous=edges.get(start)[0], points=[];
      do {
        const choices=edges.get(key); if(!choices?.length)throw new Error('輪郭の追跡に失敗しました');
        let dir=[(previous+1)%4,previous,(previous+3)%4,(previous+2)%4].find(d=>choices.includes(d));
        choices.splice(choices.indexOf(dir),1); if(!choices.length)edges.delete(key);
        const x=key%stride, y=Math.floor(key/stride); points.push([x,y]);
        key=(y+dirs[dir][1])*stride+x+dirs[dir][0]; previous=dir;
      }while(key!==start);
      // Remove collinear points only: retain holes and fine strokes without smoothing them away.
      points=points.filter((p,i,all)=>{const a=all[(i+all.length-1)%all.length],b=all[(i+1)%all.length];return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);});
      if(points.length>=3) { total+=points.length; contours.push(points.map(([x,y])=>[Math.round(x*2048/n),1802-Math.round(y*2048/n)])); }
      if(total>65535)throw new Error('輪郭が複雑すぎます。1024pxを選ぶか部品を減らしてください');
    }
    if(!contours.length)throw new Error('描画結果が空です。枠外の部品や消去領域を確認してください');
    return contours;
  }
  async function generate(dictionary, assignments, options={}) {
    const glyphs=[], issues=new Map(), licenses=new Set();
    for(const [id,raw] of Object.entries(dictionary.glyphs)) {
      if(options.signal?.aborted)throw new Error('作成を中止しました');
      options.progress?.(glyphs.length+issues.size,Object.keys(dictionary.glyphs).length,id);
      try {
        const g=KanjiCore.validateGlyph(raw); await prepare(g);
        for(const l of g.layers)if(l.type==='text'&&l.fill!=='none')licenses.add((await loadFont(l.font)).license);
        const canvas=rasterize(g,options.resolution||1024);
        glyphs.push({ id,codePoint:assignments.get(id),contours:trace(canvas) });
      } catch(e) { issues.set(id,e.message); }
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(issues.size)return {issues};
    const license=[...licenses].join('\n\n') || 'Generated from user-created geometric shapes.';
    return { data:ChoiwaruTTF.build(glyphs,{family:options.family,license}),license,issues,glyphs };
  }
  window.KanjiFont={parseCodePoint,format,validateAssignments,prepare,rasterize,trace,generate};
})();
