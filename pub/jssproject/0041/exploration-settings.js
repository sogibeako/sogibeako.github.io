/* Keep settings separate from play without replacing the exploration documents. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),host=window.ExplorationHost,dialog=$('explorationSettingsDialog'),space=$('explorationSpace'),aside=document.querySelector('.layout aside'),slot=$('embeddedGeneration');
 $('generationSettingsSlot').append(aside);
 $('commonSettings').append($('sharedCoursePanel'),$('bundlePanel'));
 $('topology').closest('label').hidden=true;$('skewPilotOpen').hidden=true;
 aside.querySelector('.eyebrow').hidden=true;
 document.querySelector('.layout').classList.add('play-first');
 const close=()=>dialog.close();
 $('closeExplorationSettings').addEventListener('click',close);
 dialog.addEventListener('close',()=>host.focus());
 dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}});
 let syncLearning=()=>{};
 function embeddedSettings(){
  syncLearning=()=>{};
  slot.replaceChildren();const mode=host.mode();if(mode==='main')return;
  const frame=$(['doubleTwist','quarter','quarterTwist'].includes(mode)?'quarterFrame':mode==='branch'?'branchFrame':mode==='triple'?'tripleFrame':mode==='crossing'?'crossingFrame':mode==='biaxial'?'biaxialFrame':mode==='klein'?'kleinFrame':mode==='skew'?'skewPilotFrame':'enclosureFrame'),doc=frame.contentDocument,source=doc?.getElementById('settings');
  if(!source){slot.textContent='生成設定を読み込んでいます…';return;}
  const result=document.createElement('p');result.setAttribute('role','status');result.className='hint';
  const form=source.cloneNode(true);form.id='embeddedSettingsForm';form.hidden=false;
  const originals=[...source.querySelectorAll('input,select,button,textarea')],copies=[...form.querySelectorAll('input,select,button,textarea')];
  form.querySelectorAll('[id]').forEach(el=>el.id='embedded-'+el.id);
  form.querySelectorAll('[for]').forEach(el=>el.htmlFor='embedded-'+el.htmlFor);
  if(['doubleTwist','quarter','quarterTwist'].includes(mode))form.querySelector('#embedded-family').closest('label').hidden=true;
  if(mode==='triple'){
   form.classList.add('triple-settings');
   const root=form.querySelector('#embedded-tripleMazeGeneration');
   root.querySelector('legend').textContent='中央穴3トーラスの生成設定';
   const sections=[];
   function section(title,ids){
    const group=document.createElement('section'),heading=document.createElement('h3');heading.textContent=title;group.append(heading);
    for(const id of ids){const input=form.querySelector('#embedded-'+id);if(!input)continue;const node=input.closest('label')||input;group.append(node);}
    sections.push(group);return group;
   }
   section('1 · 迷路の基本',['tripleMazeGrowth','tripleWallStyle','tripleRuleMode','tripleMazeSeed']);
   section('2 · シートの大きさ',['tripleMazeSize','tripleCustomSize']);
   section('3 · 穴とシートを巡る経路',['tripleRoute','tripleReturnShape','tripleHoleSize','tripleHolePlacement','tripleRimWalls','tripleHoleApproach','tryTripleReturn']);
   section('4 · 周回路と境界のずれ',['tripleLoopStyle','tripleShiftX','tripleShiftY','tripleFoldControl']);
   section('5 · アンダーパス',['tripleUnderpasses','underpassShape']);
   const next=root.querySelector('details');
   const notes=document.createElement('details'),summary=document.createElement('summary');summary.textContent='生成条件・操作の補足';notes.append(summary);
   root.querySelectorAll(':scope > p.hint').forEach(p=>notes.append(p));
   const actions=document.createElement('div');actions.className='triple-settings-actions';
   actions.append(form.querySelector('#embedded-generateTripleMaze'),form.querySelector('#embedded-nextTripleMaze'));
   form.querySelector(':scope > button[type="submit"]').hidden=true;
   root.append(...sections,next,notes,actions);
  }
  function sync(){if(mode==='triple')source.querySelectorAll('[id]').forEach(original=>{const copy=form.querySelector('#embedded-'+original.id);if(copy)copy.hidden=original.hidden;});originals.forEach((original,i)=>{const copy=copies[i];copy.value=original.value;copy.checked=original.checked;copy.disabled=original.disabled;});}
  originals.forEach((original,i)=>{
   const copy=copies[i];
   if(original.tagName==='BUTTON'){if(original.type==='button')copy.addEventListener('click',()=>{original.click();sync();});return;}
   for(const type of ['input','change'])copy.addEventListener(type,()=>{original.value=copy.value;original.checked=copy.checked;original.dispatchEvent(new frame.contentWindow.Event(type,{bubbles:true}));sync();});
  });
  form.addEventListener('submit',event=>{event.preventDefault();source.requestSubmit();sync();result.textContent=doc.getElementById('error')?.textContent?.trim()||doc.getElementById('sizeError')?.textContent?.trim()||doc.getElementById('status')?.textContent||'生成条件を反映しました。';});
  sync();slot.append(form,result);
  const learning=doc.getElementById('loopThreshold')?.closest('details');
  if(learning){
   const panel=learning.cloneNode(true);panel.hidden=false;panel.open=true;
   panel.querySelectorAll('[id]').forEach(el=>el.id='embedded-'+el.id);
   panel.querySelectorAll('[for]').forEach(el=>el.htmlFor='embedded-'+el.htmlFor);
   const threshold=panel.querySelector('#embedded-loopThreshold'),fold=panel.querySelector('#embedded-foldLoops'),status=panel.querySelector('#embedded-loopStatus');
   syncLearning=()=>{
    threshold.value=doc.getElementById('loopThreshold').value;
    fold.checked=doc.getElementById('foldLoops').checked;
    if(status)status.textContent=doc.getElementById('loopStatus').textContent;
   };
   for(const [copy,id]of [[threshold,'loopThreshold'],[fold,'foldLoops']])copy.addEventListener('change',()=>{
    const original=doc.getElementById(id);original.value=copy.value;original.checked=copy.checked;
    original.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));syncLearning();
   });
   const hint=document.createElement('p');hint.className='hint';hint.textContent='周回数は通常トーラス・中央穴・作例3・クラインで共通です。2トーラスとクラインでは今の探索へ、通常トーラスでは次の生成へ反映します。折りたたみON/OFFも全空間で共通で、表示へすぐ反映します。学習記録は各探索で保持します。';
   panel.append(hint);syncLearning();slot.append(panel);
  }
 }
 function update(){space.value=host.mode()==='main'?$('topology').value:host.mode();$('commonSettings').hidden=['klein','biaxial'].includes(host.mode());embeddedSettings();}
 $('openExplorationSettings').addEventListener('click',()=>{if(host.mode()==='branch')$('branchFrame').contentWindow?.BranchExplorationAdapter?.pause();update();dialog.showModal();space.focus();});
 space.addEventListener('change',()=>{
  const value=space.value;
  if(value==='plane'||value==='torus'){if($('topology').value!==value){$('topology').value=value;$('topology').dispatchEvent(new Event('change',{bubbles:true}));}host.select('main');}
  else host.select(value);
  update();space.focus();
 });
 window.addEventListener('exploration-selected',update);
 for(const id of ['quarterFrame','branchFrame','skewPilotFrame','enclosureFrame','kleinFrame','biaxialFrame','crossingFrame','tripleFrame'])$(id).addEventListener('load',()=>{
  const doc=$(id).contentDocument,form=doc?.getElementById('settings'),map=doc?.getElementById('map');
  if(form)(form.closest('details')||form).hidden=true;
  const learning=doc?.getElementById('loopThreshold')?.closest('details');if(learning)learning.hidden=true;
  $(id).contentWindow.addEventListener('exploration-change',()=>queueMicrotask(()=>{if(dialog.open&&host.mode()!=='main'&&$(['doubleTwist','quarter','quarterTwist'].includes(host.mode())?'quarterFrame':host.mode()==='branch'?'branchFrame':host.mode()==='triple'?'tripleFrame':host.mode()==='crossing'?'crossingFrame':host.mode()==='biaxial'?'biaxialFrame':host.mode()==='klein'?'kleinFrame':host.mode()==='skew'?'skewPilotFrame':'enclosureFrame')===$(id))syncLearning();}));
  if(id==='biaxialFrame'&&doc.querySelector('main')&&doc.querySelector('.views')){const auto=doc.getElementById('auto');if(auto)auto.hidden=true;const main=doc.querySelector('main'),views=doc.querySelector('.views');main.insertBefore(views,main.firstChild);const status=doc.getElementById('status');if(status)main.insertBefore(status,views.nextSibling);const title=main.querySelector('h1');if(title)title.hidden=true;const back=main.querySelector('a');if(back)back.hidden=true;}
  if(map&&id!=='branchFrame'){const main=doc.querySelector('main');main.insertBefore(map,main.firstChild);const controls=doc.getElementById('mapDisplayControls');if(controls)main.insertBefore(controls,map);}
  if(dialog.open)update();
 });
 // Main hotkeys must not move or regenerate a maze while a modal is open.
 window.addEventListener('keydown',event=>{if(dialog.open&&!dialog.contains(event.target)&&event.key!=='Escape')event.stopImmediatePropagation();},true);
})();
