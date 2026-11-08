/* Local font IME-style pad for diary-md-converter. No font upload or external service. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), family='ChoiwaruDiaryFont';
  let font=null, face=null, points=[], pointSet=new Set(), labels=new Map(), currentPage=0, selection={start:0,end:0}, request=0;
  const editor=$('mdInput'), pad=$('ck-pad'), liveStyle=document.createElement('style');document.head.append(liveStyle);
  let copies=new Map();
  // This self-contained handler is also included in exported diary HTML.
  function installCopyHandler(){
    if(window.__ckDiaryCopyInstalled)return;window.__ckDiaryCopyInstalled=true;
    document.addEventListener('copy',event=>{
      if(event.defaultPrevented||!event.clipboardData||/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName))return;
      const selection=window.getSelection();if(!selection||selection.isCollapsed)return;
      let changed=false;const parts=[];
      for(let i=0;i<selection.rangeCount;i++){
        const range=selection.getRangeAt(i),ancestor=range.commonAncestorContainer;
        const glyph=(ancestor.nodeType===1?ancestor:ancestor.parentElement)?.closest('[data-ck-copy]');
        if(glyph){parts.push(glyph.getAttribute('data-ck-copy'));changed=true;continue;}
        const fragment=range.cloneContents();
        fragment.querySelectorAll('[data-ck-copy]').forEach(el=>{el.replaceWith(document.createTextNode(el.getAttribute('data-ck-copy')));changed=true;});
        fragment.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));
        fragment.querySelectorAll('p,div,li,blockquote,h1,h2,h3,h4,h5,h6,tr').forEach(el=>el.append('\n'));
        parts.push(fragment.textContent.replace(/\n+$/,''));
      }
      if(changed){event.clipboardData.setData('text/plain',parts.join('\n'));event.preventDefault();}
    });
  }
  installCopyHandler();
  editor.addEventListener('copy',event=>{
    if(!event.clipboardData)return;
    const text=editor.value.slice(editor.selectionStart,editor.selectionEnd);
    let changed=false;const result=Array.from(text,char=>{const cp=char.codePointAt(0);if(pointSet.has(cp)&&copies.has(cp)){changed=true;return copies.get(cp);}return char;}).join('');
    if(changed){event.clipboardData.setData('text/plain',result);event.preventDefault();}
  });
  const say=message=>{$('ck-pad-status').textContent=message;};
  const format=cp=>'U+'+cp.toString(16).toUpperCase().padStart(4,'0');
  const usable=cp=>cp>=32&&cp<=0x10ffff&&!(cp>=0x7f&&cp<=0x9f)&&!(cp>=0xd800&&cp<=0xdfff)&&!(cp>=0xfdd0&&cp<=0xfdef)&&(cp&0xffff)<0xfffe;
  function readCodePoints(buffer) {
    const v=new DataView(buffer), check=(offset,size)=>{if(offset<0||size<0||offset+size>v.byteLength)throw new Error('フォントのテーブルが不正です');};
    check(0,12);const signature=v.getUint32(0);
    if(![0x10000,0x4f54544f,0x74727565].includes(signature))throw new Error('単体のTTFまたはOTFを選んでください（TTC・WOFFは未対応）');
    const tables=v.getUint16(4);check(12,tables*16);let cmap;
    for(let i=0;i<tables;i++){const p=12+i*16;if(v.getUint32(p)===0x636d6170)cmap={offset:v.getUint32(p+8),length:v.getUint32(p+12)};}
    if(!cmap)throw new Error('Unicodeの割り当て表がありません');check(cmap.offset,cmap.length);check(cmap.offset,4);
    const count=v.getUint16(cmap.offset+2);check(cmap.offset+4,count*8);const candidates=[];
    for(let i=0;i<count;i++){
      const p=cmap.offset+4+i*8,platform=v.getUint16(p),encoding=v.getUint16(p+2);
      if(platform!==0&&!(platform===3&&[1,10].includes(encoding)))continue;
      const s=cmap.offset+v.getUint32(p+4);check(s,2);const f=v.getUint16(s);if([4,12].includes(f))candidates.push({s,f});
    }
    candidates.sort((a,b)=>b.f-a.f);const chosen=candidates[0];if(!chosen)throw new Error('対応するUnicode割り当て表がありません');
    const output=new Set();
    function add(cp,gid){if(gid&&usable(cp)){output.add(cp);if(output.size>20000)throw new Error('一覧は20,000字までです。創作字だけのフォントを選んでください');}}
    const {s,f}=chosen;
    if(f===12){
      check(s,16);const length=v.getUint32(s+4),groups=v.getUint32(s+12);check(s,length);
      if(16+groups*12>length)throw new Error('cmapの長さが不正です');
      let visited=0;
      for(let i=0;i<groups;i++){const p=s+16+i*12,start=v.getUint32(p),end=v.getUint32(p+4),gid=v.getUint32(p+8);if(start>end||end>0x10ffff||(visited+=end-start+1)>0x110000)throw new Error('Unicode範囲が不正です');for(let cp=start;cp<=end;cp++)add(cp,gid+cp-start);}
    }else{
      check(s,14);const length=v.getUint16(s+2),n=v.getUint16(s+6)/2;check(s,length);
      if(!Number.isInteger(n)||16+8*n>length)throw new Error('cmapの長さが不正です');
      const ends=s+14,starts=ends+2*n+2,deltas=starts+2*n,ranges=deltas+2*n;
      let visited=0;
      for(let i=0;i<n;i++){
        const start=v.getUint16(starts+2*i),end=v.getUint16(ends+2*i),delta=v.getInt16(deltas+2*i),range=v.getUint16(ranges+2*i);
        if(start>end||(visited+=end-start+1)>0x10000)throw new Error('Unicode範囲が不正です');
        for(let cp=start;cp<=end;cp++){
          let gid=(cp+delta)&0xffff;
          if(range){const address=ranges+2*i+range+2*(cp-start);if(address+2>s+length)throw new Error('グリフ参照が不正です');gid=v.getUint16(address);if(gid)gid=(gid+delta)&0xffff;}
          add(cp,gid);
        }
      }
    }
    if(!output.size)throw new Error('挿入できるUnicode文字がありません');
    return [...output].sort((a,b)=>a-b);
  }
  function remember(){selection={start:editor.selectionStart,end:editor.selectionEnd};}
  ['select','keyup','click','input','blur'].forEach(type=>editor.addEventListener(type,remember));
  function insert(cp){
    const start=Math.min(selection.start,editor.value.length),end=Math.min(selection.end,editor.value.length),char=String.fromCodePoint(cp);
    editor.focus();editor.setSelectionRange(start,end);editor.setRangeText(char,start,end,'end');remember();
    editor.dispatchEvent(new Event('input',{bubbles:true}));window.updateConversion();
    $('ck-pad-selected').textContent=`${format(cp)} ${labels.get(cp)||''} を挿入しました。`;
  }
  function render(){
    const query=$('ck-pad-search').value.trim().toLocaleLowerCase();
    const filtered=points.filter(cp=>[format(cp),cp.toString(16),String.fromCodePoint(cp),labels.get(cp)||''].join(' ').toLocaleLowerCase().includes(query));
    const pages=Math.max(1,Math.ceil(filtered.length/60));currentPage=Math.max(0,Math.min(currentPage,pages-1));$('ck-pad-grid').replaceChildren();
    for(const cp of filtered.slice(currentPage*60,(currentPage+1)*60)){
      const button=document.createElement('button');button.type='button';button.dataset.cp=cp;button.title=`${format(cp)} ${labels.get(cp)||''}`;button.setAttribute('aria-label',`${button.title} を本文に挿入`);
      const glyph=document.createElement('span');glyph.className='ck-pad-character';glyph.style.fontFamily=family;glyph.textContent=String.fromCodePoint(cp);glyph.setAttribute('aria-hidden','true');
      const code=document.createElement('small');code.textContent=format(cp);button.append(glyph,code);
      if(labels.has(cp)){const label=document.createElement('small');label.textContent=labels.get(cp);button.append(label);}
      button.addEventListener('pointerdown',e=>e.preventDefault());button.onclick=()=>insert(cp);$('ck-pad-grid').append(button);
    }
    $('ck-pad-count').textContent=`${filtered.length}字 · ${currentPage+1}/${pages}`;$('ck-pad-prev').disabled=currentPage===0;$('ck-pad-next').disabled=currentPage>=pages-1;
    $('ck-pad-name').textContent=font?`${font.name}（${points.length}字）`:'フォント未読み込み';
  }
  function dataURL(buffer){let binary='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return 'data:font/ttf;base64,'+btoa(binary);}
  async function activate(record,save=true){
    const mine=++request, cp=readCodePoints(record.buffer),next=new FontFace(family,record.buffer);
    await next.load();if(mine!==request)return;
    if(face)document.fonts.delete(face);face=next;document.fonts.add(face);
    font={...record,url:dataURL(record.buffer)};points=cp;pointSet=new Set(points);currentPage=0;
    liveStyle.textContent=`#mdInput{font-family:"${family}","Source Code Pro","Courier New",monospace}.ck-diary-glyph{font-family:"${family}"!important;font-style:normal;font-weight:400}`;
    render();window.updateConversion();say('字を押すと本文のカーソル位置に挿入します。');
    if(save)try{await store(record);}catch{say('読み込みました。このブラウザには保存できないため、次回は再度読み込んでください。');}
  }
  function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('diary-choiwaru-font',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async function store(value){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put(value,'font');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
  async function restore(){const initial=request;try{const db=await database();const record=await new Promise((resolve,reject)=>{const r=db.transaction('assets').objectStore('assets').get('font');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});db.close();if(record&&request===initial)await activate(record,false);}catch{say('保存済みフォントを復元できませんでした。ファイルを選んで読み込めます。');}}
  async function load(file){if(!file)return;const mine=++request;try{if(file.size>30*1024*1024)throw new Error('フォントは30MB以内にしてください');say('フォントを読み込んでいます…');const buffer=await file.arrayBuffer();if(mine!==request)return;await activate({name:file.name,buffer});}catch(e){say(`読み込めませんでした：${e.message}`);}}
  $('ck-pad-file').onchange=async e=>{await load(e.target.files[0]);e.target.value='';};
  $('ck-pad-json').onchange=async e=>{
    try{
      const file=e.target.files[0];if(!file)return;if(file.size>10*1024*1024)throw new Error('辞書は10MB以内にしてください');
      const dictionary=JSON.parse(await file.text());if(dictionary.schemaVersion!=='1.0'||!dictionary.glyphs||typeof dictionary.glyphs!=='object'||Array.isArray(dictionary.glyphs))throw new Error('Choiwaru Kanjiの辞書JSONを選んでください');
      const next=new Map(),nextCopies=new Map();for(const [id,g] of Object.entries(dictionary.glyphs))if(g&&Number.isInteger(g.fontCodePoint)&&usable(g.fontCodePoint)){const text=typeof g.ruby==='string'?g.ruby:'';next.set(g.fontCodePoint,`${text} ${id}`.slice(0,200));const copy=[g.copyText,g.unicode,g.ids].find(value=>typeof value==='string'&&value.length);if(copy)nextCopies.set(g.fontCodePoint,copy);}
      labels=next;copies=nextCopies;currentPage=0;render();window.updateConversion();say('辞書の読み・ID・コピー情報を反映しました。本文・プレビュー・出力した日記のコピー時に使います。');
    }catch(e){say(e.message);}e.target.value='';
  };
  pad.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();pad.classList.add('ck-drop');}});
  pad.addEventListener('dragleave',e=>{if(!pad.contains(e.relatedTarget))pad.classList.remove('ck-drop');});
  pad.addEventListener('drop',e=>{if(e.dataTransfer.files.length){e.preventDefault();pad.classList.remove('ck-drop');load(e.dataTransfer.files[0]);}});
  $('ck-pad-search').oninput=()=>{currentPage=0;render();};$('ck-pad-prev').onclick=()=>{currentPage--;render();};$('ck-pad-next').onclick=()=>{currentPage++;render();};
  function clamp(left,top){const rect=pad.getBoundingClientRect();pad.style.right='auto';pad.style.left=Math.max(0,Math.min(left,innerWidth-rect.width))+'px';pad.style.top=Math.max(0,Math.min(top,innerHeight-rect.height))+'px';}
  let drag=null;const handle=$('ck-pad-handle');
  handle.onpointerdown=e=>{if(e.button!==0)return;const rect=pad.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX-rect.left,y:e.clientY-rect.top};handle.setPointerCapture(e.pointerId);e.preventDefault();};
  handle.onpointermove=e=>{if(drag?.id===e.pointerId)clamp(e.clientX-drag.x,e.clientY-drag.y);};
  handle.onpointerup=handle.onpointercancel=handle.onlostpointercapture=()=>{drag=null;};
  handle.onkeydown=e=>{const dirs={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};if(dirs[e.key]){e.preventDefault();const r=pad.getBoundingClientRect();clamp(r.left+dirs[e.key][0],r.top+dirs[e.key][1]);}};
  function fit(){if(!pad.hidden){const r=pad.getBoundingClientRect();clamp(r.left,r.top);}}
  addEventListener('resize',fit);
  for(const direction of ['n','s','e','w','ne','nw','se','sw']){
    const grip=document.createElement('div');grip.className='ck-resize ck-resize-'+direction;grip.title='ドラッグでサイズ変更';grip.setAttribute('aria-hidden','true');pad.append(grip);
    let resizing=null;
    grip.onpointerdown=e=>{if(e.button!==0||$('ck-pad-body').hidden)return;e.preventDefault();grip.setPointerCapture(e.pointerId);resizing={id:e.pointerId,x:e.clientX,y:e.clientY,rect:pad.getBoundingClientRect()};};
    grip.onpointermove=e=>{
      if(resizing?.id!==e.pointerId)return;
      const {rect:r,x,y}=resizing,dx=e.clientX-x,dy=e.clientY-y;
      let left=r.left,right=r.right,top=r.top,bottom=r.bottom;
      const minW=Math.min(280,innerWidth-24),minH=Math.min(220,innerHeight-24);
      if(direction.includes('e'))right=Math.max(left+minW,Math.min(innerWidth-12,r.right+dx));
      if(direction.includes('w'))left=Math.min(right-minW,Math.max(0,r.left+dx));
      if(direction.includes('s'))bottom=Math.max(top+minH,Math.min(innerHeight-12,r.bottom+dy));
      if(direction.includes('n'))top=Math.min(bottom-minH,Math.max(0,r.top+dy));
      pad.style.width=(right-left)+'px';pad.style.height=(bottom-top)+'px';clamp(left,top);
    };
    grip.onpointerup=grip.onpointercancel=grip.onlostpointercapture=()=>{resizing=null;};
  }
  $('ck-pad-open').onclick=()=>{pad.hidden=false;fit();$('ck-pad-open').setAttribute('aria-expanded','true');};
  $('ck-pad-close').onclick=()=>{pad.hidden=true;$('ck-pad-open').setAttribute('aria-expanded','false');$('ck-pad-open').focus();};
  let expandedHeight='';
  $('ck-pad-minimize').onclick=()=>{const body=$('ck-pad-body');body.hidden=!body.hidden;if(body.hidden){expandedHeight=pad.style.height;pad.style.height='auto';}else pad.style.height=expandedHeight;pad.classList.toggle('ck-minimized',body.hidden);$('ck-pad-minimize').textContent=body.hidden?'＋':'−';$('ck-pad-minimize').setAttribute('aria-expanded',String(!body.hidden));fit();};
  $('ck-pad-embed').onchange=()=>window.updateConversion();
  function decorate(html){
    if(!font)return html;
    const template=document.createElement('template');template.innerHTML=html;
    const walk=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT),nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);
    for(const node of nodes){
      if(node.parentElement?.closest('script,style,textarea,svg,math,.eqwrap,.ck-diary-glyph'))continue;
      // Keep TeX source intact; MathJax owns the rendering inside these delimiters.
      const chunks=node.data.split(/(\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g),fragment=document.createDocumentFragment();let changed=false;
      for(const chunk of chunks){
        if(/^(\\\(|\$\$|\\\[)/.test(chunk)){fragment.append(chunk);continue;}
        let plain='';for(const char of chunk){if(pointSet.has(char.codePointAt(0))){if(plain){fragment.append(plain);plain='';}const span=document.createElement('span');span.className='ck-diary-glyph';span.textContent=char;if(copies.has(char.codePointAt(0)))span.dataset.ckCopy=copies.get(char.codePointAt(0));fragment.append(span);changed=true;}else plain+=char;}if(plain)fragment.append(plain);
      }
      if(changed)node.replaceWith(fragment);
    }
    return template.innerHTML;
  }
  function outputStyle(html){
    const copyScript=html.includes('data-ck-copy=')?`<script>(${installCopyHandler.toString()})();</script>\n`:'';
    if(!font||!$('ck-pad-embed').checked||!html.includes('class="ck-diary-glyph"'))return copyScript;
    return `<style data-choiwaru-font>@font-face{font-family:"${family}";src:url("${font.url}");font-display:swap}.ck-diary-glyph{font-family:"${family}"!important;font-style:normal;font-weight:400}</style>\n`+copyScript;
  }
  window.DiaryKanjiPad={decorate,outputStyle,readCodePoints};render();restore();
})();
