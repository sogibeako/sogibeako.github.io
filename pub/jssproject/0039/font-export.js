(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let api, raw=Object.create(null), issues=new Map(), page=0, result=null, controller=null, face=null;
  let revision=0;
  function download(data,name,type) {
    const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a'); a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  function invalidate() {
    revision++; result=null; $('font-result').hidden=true;
    if(face){document.fonts.delete(face);face=null;}
    controller?.abort();
  }
  function validate() {
    const checked=KanjiFont.validateAssignments(api.getDictionary(),raw);
    issues=checked.issues;
    return checked;
  }
  function highlight() {
    document.querySelectorAll('#font-assignments .font-entry').forEach(row=>{
      const message=issues.get(row.dataset.id)||'';
      row.classList.toggle('invalid',!!message); row.querySelector('input').setAttribute('aria-invalid',String(!!message)); row.querySelector('.font-error').textContent=message;
    });
    document.querySelectorAll('#dictionary-grid button').forEach(button=>button.classList.toggle('font-invalid',issues.has(button.dataset.glyphId)));
  }
  function render() {
    const dictionary=api.getDictionary(),query=$('font-search').value.trim().toLocaleLowerCase();
    const entries=Object.entries(dictionary.glyphs).filter(([id,g])=>(!$('font-errors-only').checked||issues.has(id))&&[id,g.ruby,raw[id]].join(' ').toLocaleLowerCase().includes(query));
    const pages=Math.max(1,Math.ceil(entries.length/48));page=Math.max(0,Math.min(page,pages-1));
    $('font-assignments').replaceChildren();
    for(const [id,g] of entries.slice(page*48,(page+1)*48)) {
      const row=document.createElement('div');row.className='font-entry';row.dataset.id=id;
      row.append(KanjiCore.renderGlyph(g,{size:48}));
      const title=document.createElement('strong');title.textContent=id;
      const ruby=document.createElement('span');ruby.textContent=g.ruby||'読み未登録';
      const label=document.createElement('label');label.append('割り当て先');
      const input=document.createElement('input');input.type='text';input.maxLength=12;input.placeholder='例：U+E000';input.value=raw[id]||'';input.setAttribute('aria-label',`${id} の割り当て先`);
      input.oninput=()=>{
        raw[id]=input.value; const parsed=KanjiFont.parseCodePoint(input.value);
        api.assign(id,parsed.error?null:parsed.codePoint);invalidate();validate();highlight();
        $('font-status').textContent=issues.size?`${issues.size}字の割り当てを確認してください。`:'全字の割り当てが有効です。生成できます。';
      };
      label.append(input);const error=document.createElement('p');error.className='font-error';row.append(title,ruby,label,error);$('font-assignments').append(row);
    }
    $('font-page').textContent=`${entries.length}字 · ${page+1} / ${pages}ページ`;
    $('font-prev').disabled=page===0;$('font-next').disabled=page===pages-1;
    highlight();
  }
  function focusIssues() {
    $('font-errors-only').checked=true;$('font-search').value='';page=0;render();
    $('font-assignments').scrollIntoView({block:'nearest'});
    $('font-assignments').querySelector('input')?.focus({preventScroll:true});
  }
  function refresh() {
    if(!api)return;
    invalidate();raw=Object.create(null);
    for(const [id,g] of Object.entries(api.getDictionary().glyphs))raw[id]=g.fontCodePoint===undefined?'':KanjiFont.format(g.fontCodePoint);
    validate();render();
    $('font-status').textContent=issues.size?`${issues.size}字が未割り当て、または割り当てに問題があります。`:'割り当てを確認し、TTFを生成できます。';
  }
  function mount(options) {
    api=options;
    $('font-search').oninput=()=>{page=0;render();};$('font-errors-only').onchange=()=>{page=0;render();};
    $('font-prev').onclick=()=>{page--;render();};$('font-next').onclick=()=>{page++;render();};
    $('font-family').oninput=invalidate;$('font-resolution').onchange=invalidate;
    $('font-check').onclick=()=>{validate();render();$('font-status').textContent=issues.size?`${issues.size}字に問題があります。赤い字の割り当て先を修正してください。`:'全字の割り当てが有効です。';if(issues.size)focusIssues();};
    $('font-fill-pua').onclick=()=>{
      const parsed=KanjiFont.parseCodePoint($('font-pua-start').value),ranges=[[0xe000,0xf8ff],[0xf0000,0xffffd],[0x100000,0x10fffd]];
      const range=ranges.find(([a,b])=>parsed.codePoint>=a&&parsed.codePoint<=b);
      if(!range){$('font-status').textContent='開始位置には私用領域 U+E000〜F8FF / F0000〜FFFFD / 100000〜10FFFD を指定してください。';return;}
      const used=new Set([...validate().assignments.values()]); let cp=parsed.codePoint;const updates=[];
      for(const id of Object.keys(api.getDictionary().glyphs))if(!raw[id]?.trim()){
        while(used.has(cp)&&cp<=range[1])cp++;
        if(cp>range[1]){$('font-status').textContent='指定した私用領域に空きが足りません。開始位置を変更してください。';return;}
        updates.push([id,cp]);used.add(cp++);
      }
      updates.forEach(([id,cp])=>{raw[id]=KanjiFont.format(cp);api.assign(id,cp,true);});api.flush();invalidate();validate();render();$('font-status').textContent=`${updates.length}字を割り当てました。${issues.size?`${issues.size}字に問題が残っています。`:''}`;
    };
    $('font-use-unicode').onclick=()=>{
      let count=0;
      for(const [id,g] of Object.entries(api.getDictionary().glyphs))if(!raw[id]?.trim()&&g.unicode){const p=KanjiFont.parseCodePoint(KanjiFont.format(g.unicode.codePointAt(0)));if(!p.error){raw[id]=KanjiFont.format(p.codePoint);api.assign(id,p.codePoint,true);count++;}}
      api.flush();invalidate();validate();render();$('font-status').textContent=`${count}字を設定しました。${issues.size}字に未指定・重複などがあります。`;
    };
    $('font-json').onclick=()=>download(JSON.stringify(api.getDictionary(),null,2),'dictionary.json','application/json');
    $('font-cancel').onclick=()=>controller?.abort();
    $('font-build').onclick=async()=>{
      const checked=validate();
      if(checked.issues.size){$('font-status').textContent=`生成できません：${checked.issues.size}字の割り当てを修正してください。`;focusIssues();return;}
      if(!checked.assignments.size){$('font-status').textContent='辞書に字を登録してください。';return;}
      const family=$('font-family').value.trim();
      if(!/^[A-Za-z][A-Za-z0-9-]{0,47}$/.test(family)||/source/i.test(family)){$('font-status').textContent='フォント名は英字で始まる英数字・ハイフン48文字以内です。予約名Sourceは使えません。';return;}
      invalidate();const started=revision;controller=new AbortController();const signal=controller.signal;
      $('font-settings').disabled=true;$('font-cancel').hidden=false;
      try{
        const dictionary=KanjiCore.validateDictionary(api.getDictionary());
        const generated=await KanjiFont.generate(dictionary,checked.assignments,{family,resolution:+$('font-resolution').value,signal,progress:(i,total,id)=>{$('font-status').textContent=`字形を変換中 ${i+1}/${total}：${id}`;}});
        if(signal.aborted||started!==revision)throw new Error('辞書が変更されたか、生成が中止されました。');
        if(generated.issues.size){issues=generated.issues;$('font-status').textContent=`生成できません：${issues.size}字の描画を確認してください。`;focusIssues();return;}
        const next=new FontFace(`CKGenerated${Date.now()}`,generated.data.buffer);await next.load();
        if(signal.aborted||started!==revision)throw new Error('生成を中止しました。');
        face=next;document.fonts.add(face);result={...generated,family};
        $('font-preview').style.fontFamily=`"${face.family}"`;
        $('font-preview').textContent=generated.glyphs.map(g=>String.fromCodePoint(g.codePoint)).join(' ');
        $('font-result').hidden=false;$('font-status').textContent=`${generated.glyphs.length}字のTTFを生成しました。プレビューを確認してダウンロードしてください。`;
      }catch(e){$('font-status').textContent=`生成できませんでした：${e.message}`;}
      finally{controller=null;$('font-settings').disabled=false;$('font-cancel').hidden=true;}
    };
    $('font-download').onclick=()=>{if(result)download(result.data,`${result.family}.ttf`,'font/ttf');};
    $('font-license').onclick=()=>{if(result)download(result.license,`${result.family}-LICENSE.txt`,'text/plain;charset=utf-8');};
    refresh();
  }
  window.KanjiFontUI={mount,refresh,highlight};
})();
