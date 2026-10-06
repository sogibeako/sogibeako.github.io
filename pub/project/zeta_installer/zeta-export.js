(() => {
  'use strict';
  if (window.__zetaTextExport) { window.__zetaTextExport.focus(); return; }
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:16px;top:16px;z-index:2147483647';
  const ui = host.attachShadow({mode:'open'});
  ui.innerHTML = '<style>:host{all:initial}section{font:14px/1.6 system-ui;background:#fff;color:#172033;border:2px solid #6555c5;border-radius:12px;padding:16px;width:300px;box-shadow:0 8px 40px #0004}button{font:inherit;margin:10px 6px 0 0;padding:6px 12px;cursor:pointer}p{margin:6px 0;white-space:pre-wrap}</style><section><b>zeta TXT保存・試用版</b><p id="status">会話の本文を1か所クリックしてください。そこから過去へ収集します。最新まで保存する場合は、先にこのパネルを閉じ、最新の発言へ移動してください。</p><button id="save">ここまでを保存</button><button id="close">閉じる</button></section>';
  document.documentElement.append(host);
  const status = ui.querySelector('#status');
  let stopped = false, selected = false, chunks = [], scroller;
  const origin = location.href;
  const title = document.title;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const focus = () => { host.style.display = ''; };
  window.__zetaTextExport = {focus};
  function cleanup() {
    stopped = true;
    document.removeEventListener('click', choose, true);
    host.remove(); delete window.__zetaTextExport;
  }
  function read() {
    const copy = scroller.cloneNode(true);
    copy.querySelectorAll('script,style,button,input,textarea,select,nav,header,footer,[hidden],[aria-hidden="true"]').forEach(el => el.remove());
    // innerText on a detached element loses rendered line breaks; keep block boundaries explicitly.
    copy.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
    copy.querySelectorAll('p,div,li,article,section,h1,h2,h3,blockquote').forEach(el => el.append('\n'));
    return (copy.textContent || '').replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
  }
  function merge(older) {
    if (!older.length) return;
    if (!chunks.length) { chunks = [older]; return; }
    const head = chunks[0];
    for (let n = Math.min(older.length,head.length); n > 0; n--) {
      let match = true;
      for (let j=0;j<n;j++) if (older[older.length-n+j] !== head[j]) { match=false; break; }
      if (match) { chunks[0] = older.slice(0,older.length-n).concat(head); return; }
    }
    // Preserve uncertain text instead of silently deleting repeated dialogue.
    chunks.unshift(older);
  }
  function save() {
    stopped = true;
    if (!chunks.length) { status.textContent = '保存対象がまだありません。閉じて、もう一度実行してください。'; return; }
    const body = chunks.map(c=>c.join('\n')).join('\n\n--- 接続未確認：前後に重複・欠落の可能性があります ---\n\n');
    const note = 'zeta テキスト収集（試用版・全件取得は未保証）\n'+title+'\n'+origin+'\n保存日時: '+new Date().toLocaleString()+'\n\n';
    const blob = new Blob(['\ufeff',note,body],{type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href=url; a.download='zeta_'+new Date().toISOString().replace(/[:.]/g,'-')+'.txt';
    host.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000);
    status.textContent='TXTのダウンロードを開始しました。開始位置より後の会話は対象外です。内容を確認してください。';
  }
  ui.querySelector('#save').onclick=save;
  ui.querySelector('#close').onclick=cleanup;
  async function choose(event) {
    if (event.composedPath().includes(host) || selected) return;
    event.preventDefault(); event.stopImmediatePropagation();
    let el=event.target;
    while(el && el!==document.documentElement) {
      if (el.scrollHeight>el.clientHeight+20 && /auto|scroll/.test(getComputedStyle(el).overflowY)) break;
      el=el.parentElement;
    }
    scroller=el && el!==document.documentElement ? el : document.scrollingElement;
    if (!scroller || scroller===document.scrollingElement) {
      status.textContent='会話専用のスクロール領域を検出できません。会話本文の別の位置をクリックしてください。ページ全体の誤保存を避けるため、収集は開始していません。'; return;
    }
    selected=true;
    document.removeEventListener('click',choose,true);
    let idle=0;
    try {
      for(let step=0;step<500 && !stopped;step++) {
        if(location.href!==origin || !scroller.isConnected) throw new Error('ページまたは会話の表示が切り替わりました');
        const before=read(); merge(before);
        status.textContent='過去へ収集中… '+chunks.reduce((n,c)=>n+c.join('\n').length,0).toLocaleString()+'文字\nこのタブを表示したままお待ちください。途中保存もできます。';
        const previous=scroller.scrollTop;
        scroller.scrollBy({top:-Math.max(100,scroller.clientHeight*0.6),behavior:'instant'});
        await sleep(1800);
        if(stopped) break;
        const after=read(); merge(after);
        const unchanged=before.join('\n')===after.join('\n');
        idle=unchanged && Math.abs(scroller.scrollTop-previous)<2 ? idle+1 : 0;
        if(idle>=9) { save(); status.textContent+='\n約16秒間変化がなかったため停止しました。通信が遅い場合は過去分が残っている可能性があります。'; return; }
      }
      if(!stopped) { save(); status.textContent+='\n収集回数の上限で停止しました。'; }
    } catch(error) { stopped=true; status.textContent='収集を停止しました：'+error.message+'\n「ここまでを保存」で取得済みの内容を保存できます。'; }
  }
  document.addEventListener('click',choose,true);
  const room=document.querySelector('[data-sentry-component="WebviewChatRoom"]');
  if(room) {
    const candidates=[room,...room.querySelectorAll('*')].filter(el => el.clientHeight>120 && el.scrollHeight>el.clientHeight+20 && /auto|scroll/.test(getComputedStyle(el).overflowY));
    candidates.sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight);
    if(candidates.length) choose({target:candidates[0],composedPath:()=>[],preventDefault(){},stopImmediatePropagation(){}});
  }
})();
