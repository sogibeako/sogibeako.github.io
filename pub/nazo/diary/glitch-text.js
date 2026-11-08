/*! GlitchText 1.0.0 | dependency-free | See distribution page for usage. */
(function(global){
"use strict";
function makeRandom(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function graphemes(text){return typeof Intl.Segmenter==='function' ? Array.from(new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(text),s=>s.segment) : Array.from(text);}
// ピクセルを複製して移動・反転する。元画像を参照するので書き換え中の画素が混ざらない。
function transformPixels(ctx,pw,ph,type,random){
  const source=ctx.getImageData(0,0,pw,ph),result=ctx.createImageData(pw,ph);
  const halfW=Math.floor(pw/2),halfH=Math.floor(ph/2),right=pw-halfW,bottom=ph-halfH;
  const shift=type===5||type===6 ? Math.max(1,Math.floor((type===5?ph:pw)*(.18+random()*.54))) : 0;
  const flipLeft=type===7 ? random()<.5 : false;
  for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){
    let sx=x,sy=y;
    if(type===5)sy=(y+shift)%ph;
    else if(type===6)sx=(x+shift)%pw;
    else if(type===7){
      if(flipLeft && x<halfW)sx=halfW-1-x;
      else if(!flipLeft && x>=right)sx=right+(pw-1-x);
    }else if(type===8 && x>=right)sx=x-right;
    else if(type===9 && y>=bottom)sy=y-bottom;
    const from=(sy*pw+sx)*4,to=(y*pw+x)*4;
    for(let c=0;c<4;c++)result.data[to+c]=source.data[from+c];
  }
  // putImageDataは座標変換の影響を受けないため、DPRを含む実ピクセルのまま書き戻す。
  ctx.putImageData(result,0,0);
}
/** type: 1〜4=塗り/消去, 5〜6=循環移動, 7=半分反転, 8〜9=半分複製, 10=重ね文字 */
function drawGlitch(canvas, character, type, font, color, random){
  const box=canvas.getBoundingClientRect(),w=box.width,h=box.height;
  const dpr=window.devicePixelRatio||1;
  canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const size=parseFloat(font.size);
  ctx.fillStyle=color;ctx.font=`${font.weight} ${size}px ${font.family}`;
  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  const baseline=h/2+size*0.35;
  ctx.fillText(character,w/2,baseline);
  if(!type || /^\s+$/u.test(character))return;
  if(type>=5 && type<=9){transformPixels(ctx,canvas.width,canvas.height,type,random);return;}
  const rand=(a,b)=>a+(b-a)*random();
  const rect=()=>({x:rand(0,w*.38),y:rand(h*.12,h*.48),w:rand(w*.35,w*.62),h:rand(h*.22,h*.4)});
  const fill=r=>ctx.fillRect(r.x,r.y,r.w,r.h);
  // 一文字枠のほぼ全体を覆う矩形。枠の大きさ自体は変えない。
  const largeRect=()=>{const rw=rand(w*.78,w),rh=rand(h*.74,h*.98);return {x:rand(0,w-rw),y:rand(0,h-rh),w:rw,h:rh};};
  const inside=(r,min=.12,max=.75)=>{const rw=r.w*rand(min,max),rh=r.h*rand(min,max);return {x:r.x+rand(0,r.w-rw),y:r.y+rand(0,r.h-rh),w:rw,h:rh};};
  // 指定した面積比になる矩形。幅・高さ・位置はランダム、枠内に収める。
  const areaRect=area=>{const widthRatio=rand(area,1),rw=w*widthRatio,rh=h*area/widthRatio;return {x:rand(0,w-rw),y:rand(0,h-rh),w:rw,h:rh};};
  if(type===1){
    const coverage=rand(.6,.8);
    const fraction=rand(Math.max(.25,2*coverage-1+.05),.9);
    // 矩形と三角形は重ならない。面積 = 外接矩形 × (fraction + (1-fraction)/2)。
    const r=areaRect(coverage/(.5+.5*fraction));
    ctx.save();ctx.translate(r.x,r.y);
    if(random()<.5){ctx.translate(r.w,0);ctx.scale(-1,1);}
    if(random()<.5){ctx.translate(0,r.h);ctx.scale(1,-1);}
    ctx.beginPath();
    if(random()<.5){
      const split=r.w*fraction;ctx.fillRect(0,0,split,r.h);
      ctx.moveTo(split,0);ctx.lineTo(split,r.h);ctx.lineTo(r.w,r.h);
    }else{
      const split=r.h*fraction;ctx.fillRect(0,0,r.w,split);
      ctx.moveTo(0,split);ctx.lineTo(r.w,split);ctx.lineTo(r.w,r.h);
    }
    ctx.closePath();ctx.fill();ctx.restore();
  }else if(type===2){
    const r=areaRect(rand(.6,.8));
    // 消した領域に、小さな文字を並べる。矩形でクリップして外にはみ出さない。
    ctx.clearRect(r.x,r.y,r.w,r.h);ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
    const pool=graphemes('ﾉｼｲﾛ01:;+=');
    const a=pool[Math.floor(random()*pool.length)],b=random()<.5?a:pool[Math.floor(random()*pool.length)];
    const tiny=size*rand(.08,.13),step=tiny*.78;
    ctx.font=`700 ${tiny}px monospace`;ctx.textAlign='left';ctx.textBaseline='top';
    for(let y=r.y;y<r.y+r.h;y+=tiny*.8)for(let x=r.x;x<r.x+r.w;x+=step)ctx.fillText(random()<.5?a:b,x,y);
    ctx.restore();
  }else if(type===3){
    for(let i=0;i<2;i++){const r=rect();ctx.clearRect(r.x,r.y,r.w,r.h);}
  }else if(type===4){
    const r=largeRect();fill(r);
    // 穴を先にすべて開けて、その内部へランダムな矩形を描き戻す。
    const holes=[];
    const count=1+Math.floor(random()*4);
    for(let i=0;i<count;i++){
      const hole=inside(r,.2,.85);holes.push(hole);ctx.clearRect(hole.x,hole.y,hole.w,hole.h);
    }
    for(const hole of holes){
      const pieces=1+Math.floor(random()*3);
      for(let j=0;j<pieces;j++){
        const patch=inside(hole,.08,.55);
        if(random()<.5){patch.y=hole.y;patch.h=hole.h;}
        else {patch.x=hole.x;patch.w=hole.w;}
        fill(patch);
      }
    }
  }else if(type===10){
    const pool=graphemes('鬱麤龘爨漢字文字ﾊﾛﾉｼアイウエオ01!?※');
    for(let i=0;i<4;i++){
      const s=size*rand(.55,.98);ctx.font=`${font.weight} ${s}px ${font.family}`;
      ctx.fillText(pool[Math.floor(random()*pool.length)],w/2+rand(-w*.22,w*.22),baseline+rand(-h*.15,h*.08));
    }
  }
}

const selector='span[data-glitch-method]';
const states=new WeakMap(),active=new Set();
const css='.gt-char{position:relative;display:inline-block;vertical-align:baseline;white-space:pre;overflow:hidden}.gt-source{visibility:hidden}.gt-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}';
function ensureStyle(){if(document.getElementById('glitch-text-style'))return;const style=document.createElement('style');style.id='glitch-text-style';style.textContent=css;document.head.append(style);}
function options(el){
 const value=el.getAttribute('data-glitch-method')||'all';
 const methods=value==='all'?Array.from({length:10},(_,i)=>i+1):value.split(',').map(x=>Number(x.trim()));
 const rawRate=el.getAttribute('data-glitch-rate');const rate=rawRate===null?100:Number(rawRate);
 if(!methods.length||methods.some(x=>!Number.isInteger(x)||x<1||x>10)||!Number.isFinite(rate)||rate<0||rate>100)throw new RangeError('加工方法は1〜10のカンマ区切りまたはall、加工割合は0〜100で指定してください。');
 return {methods:[...new Set(methods)],rate:rate/100};
}
function seedFrom(value){let n=2166136261;for(const c of String(value))n=Math.imul(n^c.codePointAt(0),16777619);return n>>>0;}
function paint(el){
 const state=states.get(el);if(!state||!el.isConnected)return;
 let config;try{config=options(el);}catch(e){console.warn('[GlitchText]',e.message,el);return;}
 const style=getComputedStyle(el),font={size:style.fontSize,weight:style.fontWeight,family:style.fontFamily};
 const random=makeRandom(seedFrom(el.getAttribute('data-glitch-seed')??state.seed));
 el.replaceChildren();el.setAttribute('role','img');el.setAttribute('aria-label',state.text);
 const pending=[];
 for(const character of graphemes(state.text)){
  const cell=document.createElement('span'),original=document.createElement('span'),canvas=document.createElement('canvas');
  cell.className='gt-char';cell.setAttribute('aria-hidden','true');original.className='gt-source';original.textContent=character;canvas.className='gt-canvas';canvas.setAttribute('aria-hidden','true');cell.append(original,canvas);el.append(cell);
  const type=random()<config.rate?config.methods[Math.floor(random()*config.methods.length)]:0;
  pending.push({canvas,character,type});
 }
 for(const item of pending)drawGlitch(item.canvas,item.character,item.type,font,style.color,random);
}
function elements(root){const items=[];if(root instanceof Element&&root.matches(selector))items.push(root);if(root.querySelectorAll)items.push(...root.querySelectorAll(selector));return items;}
function init(root=document){ensureStyle();for(const el of elements(root)){
 if(!states.has(el)){
  try{options(el);}catch(e){console.warn('[GlitchText]',e.message,el);continue;}
  // プレーンな文字列を囲む用途。元の子ノードも保持してdestroy時に復元する。
  states.set(el,{text:el.textContent,nodes:Array.from(el.childNodes),seed:Math.floor(Math.random()*2147483647),role:el.getAttribute('role'),label:el.getAttribute('aria-label')});active.add(el);
 }
 paint(el);
}return root;}
function refresh(root=document){return init(root);}
function reroll(root=document){for(const el of elements(root)){const state=states.get(el);if(state)state.seed=Math.floor(Math.random()*2147483647);}return init(root);}
function setText(el,text){if(!states.has(el))init(el);const state=states.get(el);if(!state)throw new TypeError('data-glitch-methodを指定したspanを渡してください。');state.text=String(text);state.nodes=[document.createTextNode(state.text)];paint(el);}
function destroy(root=document){for(const el of [...active])if(el===root||root.contains?.(el)){
 const state=states.get(el);el.replaceChildren(...state.nodes);for(const [key,value]of [['role',state.role],['aria-label',state.label]]){if(value===null)el.removeAttribute(key);else el.setAttribute(key,value);}active.delete(el);states.delete(el);
}}
let frame=0;function repaint(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;for(const el of [...active]){if(el.isConnected)paint(el);else {active.delete(el);states.delete(el);}}});}
global.GlitchText=Object.freeze({version:'1.0.0',init,refresh,reroll,setText,destroy});
function boot(){init();if(document.fonts)document.fonts.ready.then(repaint);global.addEventListener('resize',repaint);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
