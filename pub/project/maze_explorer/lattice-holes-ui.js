'use strict';
(()=>{
 if(new URLSearchParams(location.search).get('embedded')==='1'){
  const main=document.querySelector('main');main.style.padding='0';main.style.maxWidth='none';main.querySelector('h1').hidden=true;main.querySelector('a').hidden=true;
  const setup=document.createElement('details'),title=document.createElement('summary');title.textContent='この空間の生成設定';setup.append(title);
  const form=document.getElementById('settings');form.before(setup);setup.append(form,document.getElementById('nextSeed'));
 }
 const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d'),S=ConnectionSpace;
 let state=LatticeHoles.create({maze:true,periodSize:20,underpasses:2,underpassShape:'mixed'}),truth=false,renderMode='hybrid',book={charts:[],active:-1},journey={number:1,steps:0};
 function draw(observation=SkewSession.observe(state,book)){
  $('subjective').setAttribute('aria-pressed',String(!truth));$('truth').setAttribute('aria-pressed',String(truth));
  window.dispatchEvent?.(new Event('exploration-change'));
  const {view,knowledge}=observation,w=state.world;
  const width=canvas.clientWidth,height=canvas.clientHeight,dpr=window.devicePixelRatio||1;canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0b161c';ctx.fillRect(0,0,width,height);
  const display=SkewDisplay.compose(state,book,view,truth);
  const size=truth?Math.min((width-28)/display.columns,(height-28)/display.rows):Math.min(24,(width-20)/19);
  const ox=truth?(width-size*display.columns)/2:width/2-size/2,oy=truth?(height-size*display.rows)/2:height/2-size/2;
  for(const p of display.tiles){const x=ox+p.x*size,y=oy+p.y*size;ctx.fillStyle=p.wall?(p.bright?'#738c8b':'#34474b'):(p.sheet===0?(p.bright?'#39625a':'#1a3334'):(p.bright?'#634979':'#312a42'));if(renderMode!=='ascii')ctx.fillRect(x,y,size-(size>8?1:0),size-(size>8?1:0));ctx.fillStyle=renderMode==='ascii'&&['#','.'].includes(p.glyph)?((p.id<0?S.groundSheet(w,state.id):p.sheet)===0?(p.bright?'#a6d9b4':'#607e69'):(p.bright?'#d4b4ee':'#81708f')):(p.bright?'#e3dab0':'#7e8c82');ctx.font=renderMode==='ascii'?`${size*.88}px Consolas, "Liberation Mono", monospace`:['#','.'].includes(p.glyph)?`${Math.max(7,size*.65)}px Consolas, monospace`:`bold ${Math.max(7,size*.8)}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';if(renderMode==='ascii'&&!truth&&!p.wall&&p.glyph==='.'&&p.sheet!==S.groundSheet(w,state.id)){ctx.font=`bold ${size*.88}px Consolas, "Liberation Mono", monospace`;ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.min(1,size*.045);ctx.strokeText(p.glyph,x+size/2,y+size/2);}if(renderMode!=='tiles'||!['#','.'].includes(p.glyph))ctx.fillText(p.glyph,x+size/2,y+size/2);}
  for(const h of display.portals){ctx.strokeStyle='#82cbd9';ctx.lineWidth=2;ctx.strokeRect(ox+h.x*size,oy+h.y*size,size*h.width,size*h.height);}
  const threshold=state.loopThreshold??3;
  $('loopStatus').textContent=knowledge.length?knowledge.map(p=>`シート ${p.sheet===0?'A':'B'}・周期 (${p.a}, ${p.b})：${p.count}周 — ${threshold===0?'記録のみ':p.learned?'理解済み':`あと${p.remaining}周`}`).join(' ／ '):'記録した周期周回はまだありません。';
  const sheet=S.groundSheet(w,state.id),learned=knowledge.filter(p=>p.sheet===sheet&&p.learned).length;
  $('senseStatus').textContent=threshold===0?'方向感覚：OFF（周回記録は継続）':`方向感覚：${threshold}周で理解 ／ 現在のシートで理解した周期 ${learned}種類`;
  $('exitNext').hidden=!w.maze;$('exitNext').disabled=!w.maze||state.id!==w.exit;
  const l=w.lattice;$('status').textContent=`${state.steps}歩 ／ シート ${S.groundSheet(w,state.id)===0?'A':'B'} ／ 周期 a=(${l.a})、b=(${l.b}) ／ 穴を除く各シート ${l.determinant-4}セル（壁を含む） ／ 主観地図 ${book.active+1}/${book.charts.length}枚${w.maze?` ／ ${{walls:'連結を保つ壁配置',dfs:'DFS',prim:'Prim',growing:'Growing Tree'}[w.growth]} ／ ${w.wallStyle==='grid'?'格子状の壁':'密な枝道'} ／ シード ${w.seed} ／ 4本の周期周回路${w.returnPocket?' ／ A→B→A必須の出口ポケット（検証済み）':''} ／ 穴の縁の壁 ${w.holeRimWallCount??0}セル${w.holeRimWalls?'（許可）':'（なし）'} ／ アンダーパス A ${(w.passages||[]).filter(p=>p.baseSheet===0).length}・B ${(w.passages||[]).filter(p=>p.baseSheet===1).length}（曲がる交差 ${(w.passages||[]).filter(p=>p.arms).length}）${state.id===w.exit?' ／ 出口に到達しました！ > で次へ。移動すれば探索を続けられます。':''} ／ ${journey.number}枚目・${journey.number-1}枚踏破 ／ 通算 ${journey.steps+state.steps}歩`:''}`+(window.SheetFeatures?.status(state)||'');
 }
 function move(d){
  const observation=SkewSession.step(state,book,d,truth),result=observation.learned;
  if(result)$('loopNotice').textContent=`方向感覚を得ました：シート ${result.sheet===0?'A':'B'}・周期 (${result.a}, ${result.b})。`;
  draw(observation);canvas.focus();
 }
 document.querySelectorAll('[data-render]').forEach(button=>button.addEventListener('click',()=>{renderMode=button.dataset.render;document.querySelectorAll('[data-render]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));draw();canvas.focus();}));
 $('foldLoops').addEventListener('change',()=>{state.foldLoops=$('foldLoops').checked;draw();});
 $('loopThreshold').addEventListener('change',()=>{try{SkewLoops.setThreshold(state,Number($('loopThreshold').value));$('loopNotice').textContent='';draw();}catch(error){$('error').textContent=error.message;}});
 function begin(next,continuing=false){
  for(const [id,key]of [['sheetKeys','keys'],['sheetWarp','warp'],['sheetBirds','birds']])$(id).checked=!!next.features?.options[key];
  $('periodWidth').value=String(next.world.lattice.width);$('periodHeight').value=String(next.world.lattice.height);
  ({state,book,truth,journey}=SkewSession.begin(next,{state,book,truth,journey},continuing));
  $('loopNotice').textContent='';$('error').textContent='';draw();canvas.focus();
 }
 function regenerate(){try{const sx=Number($('sx').value),sy=Number($('sy').value);if(Math.abs(sx)>4||Math.abs(sy)>4)throw Error('ずれは−4〜4の偶数で指定してください。');const next=LatticeHoles.create({features:{keys:$('sheetKeys').checked,warp:$('sheetWarp').checked,birds:$('sheetBirds').checked},shiftX:sx,shiftY:sy,walls:$('walls').checked,maze:$('terrain').value==='maze',seed:$('seed').value,growth:$('growth').value,wallStyle:$('wallStyle').value,periodWidth:Number($('periodWidth').value),periodHeight:Number($('periodHeight').value),underpasses:Number($('underpasses').value),underpassShape:$('underpassShape').value,holeRimWalls:$('holeRimWalls').checked,returnPocket:$('returnPocket').checked});begin(next);}catch(error){$('error').textContent=error.message;}}
 $('settings').addEventListener('submit',e=>{e.preventDefault();regenerate();});
 function nextSeed(){$('seed').value='skew-'+Math.random().toString(36).slice(2,10);regenerate();}
 $('nextSeed').onclick=nextSeed;
 const randomDefaults={randomNext:false,randomGrowth:true,randomWall:true,randomSize:true,randomShift:true,randomPassages:true};
 function randomOptions(base,rng=Math.random){
  return SkewOptions.randomize(base,{enabled:$('randomNext').checked,growth:$('randomGrowth').checked,wall:$('randomWall').checked,size:$('randomSize').checked,shift:$('randomShift').checked,passages:$('randomPassages').checked,min:Number($('randomMin').value),max:Number($('randomMax').value)},rng);
 }
 function advance(){
  if(window.parent!==window&&window.parent?.ExplorationHost?.advance('skew'))return;
  const w=state.world;if(!w.maze)return;
  if(state.id!==w.exit){$('error').textContent='出口 > の上で > を押すと次の迷路へ進めます。';return;}
  try{
   const options=randomOptions({...SkewOptions.applied(w,'skew-'+Math.random().toString(36).slice(2,10)),features:state.features?.options});
   const next=LatticeHoles.create(options);
   for(const [id,value] of Object.entries({terrain:'maze',seed:options.seed,sx:options.shiftX,sy:options.shiftY,periodSize:options.periodSize,growth:options.growth,wallStyle:options.wallStyle,underpasses:options.underpasses,underpassShape:options.underpassShape}))$(id).value=String(value);
   $('holeRimWalls').checked=options.holeRimWalls;$('returnPocket').checked=!!options.returnPocket;
   begin(next,true);
  }catch(error){$('error').textContent=error.message;}
 }
 $('returnPocketDemo').addEventListener('click',()=>{
  try{const options={maze:true,periodSize:20,growth:'growing',wallStyle:'grid',shiftX:2,shiftY:-2,seed:'return-test-2',holeRimWalls:true,returnPocket:true,underpasses:0,underpassShape:'mixed'};const next=LatticeHoles.create(options);
   for(const [id,value]of Object.entries({terrain:'maze',periodSize:20,growth:'growing',wallStyle:'grid',sx:2,sy:-2,seed:options.seed,underpasses:0,underpassShape:'mixed'}))$(id).value=String(value);
   $('holeRimWalls').checked=true;$('returnPocket').checked=true;begin(next);
  }catch(error){$('error').textContent=error.message;}
 });
 $('exitNext').onclick=advance;
 const saveKey='maze-explorer.skew-holes-save.v1',controlIds=['sheetKeys','sheetWarp','sheetBirds','terrain','growth','wallStyle','periodSize','periodWidth','periodHeight','underpasses','underpassShape','seed','sx','sy','walls','holeRimWalls','returnPocket',...Object.keys(randomDefaults),'randomMin','randomMax'];
 const controls=()=>Object.fromEntries(controlIds.map(id=>[id,{value:String($(id).value),checked:Boolean($(id).checked)}]));
 function save(){try{const text=SkewSave.encode({state,book,journey,controls:controls()});SkewSave.decode(text);window.localStorage.setItem(saveKey,text);$('saveStatus').textContent=`保存しました：${state.world.seed} ／ ${state.steps}歩 ／ ${journey.number}枚目。`;}catch(error){$('saveStatus').textContent='保存できませんでした。'+error.message;}}
 function restore(text,prepared=null){
  const previous={state,book,journey,truth,controls:controls()};let replaced=false;
  try{
   const {snapshot:s,repairedSeams}=prepared||SkewSave.decode(text);state=s.state;book=s.book;journey=s.journey;truth=false;replaced=true;
   for(const [id,checked] of Object.entries(randomDefaults))$(id).checked=checked;
   $('holeRimWalls').checked=false;$('returnPocket').checked=false;
   $('randomMin').value='16';$('randomMax').value='24';
   for(const id of controlIds)if(s.controls[id]){$(id).value=s.controls[id].value;$(id).checked=s.controls[id].checked;}
   if(!s.controls.periodWidth)$('periodWidth').value=String(state.world.lattice.width);if(!s.controls.periodHeight)$('periodHeight').value=String(state.world.lattice.height);
   $('loopThreshold').value=String(state.loopThreshold??3);$('foldLoops').checked=state.foldLoops!==false;$('loopNotice').textContent='';
   draw();$('error').textContent='';$('saveStatus').textContent=`再開しました：${state.world.seed} ／ ${state.steps}歩 ／ ${journey.number}枚目。${repairedSeams?` 境界の接続${repairedSeams}箇所と地図の矛盾を修復しました。`:""}`;canvas.focus();return true;
  }catch(error){if(replaced){({state,book,journey,truth}=previous);$('loopThreshold').value=String(state.loopThreshold??3);$('foldLoops').checked=state.foldLoops!==false;for(const id of controlIds){$(id).value=previous.controls[id].value;$(id).checked=previous.controls[id].checked;}try{draw();}catch{}}$('saveStatus').textContent='再開できませんでした。'+error.message;return false;}
 }
 function load(){try{const text=window.localStorage.getItem(saveKey);if(!text){$('saveStatus').textContent='保存した探索はまだありません。';return;}restore(text);}catch(error){$('saveStatus').textContent='再開できませんでした。'+error.message;}}
 function exportFile(){
  let url,link;
  try{const text=SkewSave.encode({state,book,journey,controls:controls()});SkewSave.decode(text);
   url=URL.createObjectURL(new Blob([text],{type:'application/json'}));link=document.createElement('a');link.href=url;link.download=`skew-exploration-${Date.now()}.json`;document.body.appendChild(link);link.click();
   $('saveStatus').textContent='探索ファイルのダウンロードを開始しました。';
  }catch(error){$('saveStatus').textContent='書き出しできませんでした。'+error.message;}
  finally{link?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
 }
 let importSerial=0;
 async function importFile(file){
  const serial=++importSerial,original=state,steps=state.steps;if(!file)return;
  try{if(file.size>20000000)throw Error('ファイルが大きすぎます（上限20MB）。');
   const text=await file.text();if(serial!==importSerial)return;
   if(state!==original||state.steps!==steps)throw Error('読み込み中に探索が進んだため中止しました。もう一度選んでください。');
   restore(text);
  }catch(error){if(serial===importSerial)$('saveStatus').textContent='読み込みできませんでした。'+error.message;}
 }
 window.SkewExplorationAdapter={
  autoNext:()=>advance(),
  autoDynamic:()=>state.features?.bird!=null,autoStallLimit:()=>2000,autoRelocated:()=>!!state.features?.last,autoTraversed:()=>state.features?.last?[state.features.last.from,state.id]:[state.id],autoLoop:()=>ExplorationSolver.connectedLoop(state,S,SkewLoops),autoTargets:()=>ExplorationSolver.connectedTargets(state),autoPosition:()=>state.id,autoExplore:seen=>ExplorationSolver.connected(state,seen),autoPlan:()=>ExplorationSolver.connected(state),autoMove:d=>move(truth?d:state.frame.indexOf(d)),
  progress:()=>({token:state,steps:state.steps,exit:state.world.maze&&state.id===state.world.exit}),
  fresh(seed,randomGeneration=false,generators,sizes,topologies,shifts){return LatticeHoles.create(ExplorationGeneration.choose('skew',{...SkewOptions.applied(state.world,seed),maze:true,features:state.features?.options},randomGeneration,seed,generators,sizes,topologies,'none',shifts));},
  enter(next){begin(next);$('seed').value=next.world.seed;$('terrain').value='maze';$('growth').value=next.world.growth;$('periodSize').value=String(next.world.lattice.width);$('sx').value=String(next.world.lattice.shiftX);$('sy').value=String(next.world.lattice.shiftY);$('returnPocket').checked=!!next.world.returnPocket;},
  snapshot:()=>SkewSave.encode({state,book,journey,controls:controls()}),
  prepare:text=>SkewSave.decode(text),
  apply(prepared){if(!restore(null,prepared))throw Error('中央穴の探索を復元できませんでした。');}
 };
 $('exportFile').onclick=exportFile;
 $('importFile').addEventListener('change',e=>{const file=e.target.files?.[0];e.target.value='';void importFile(file);});
 $('save').onclick=save;$('load').onclick=load;

 $('sheetMark').onclick=()=>{SheetFeatures.mark(state);draw();canvas.focus();};
 $('subjective').onclick=()=>{truth=false;draw();canvas.focus();};$('truth').onclick=()=>{truth=true;draw();canvas.focus();};document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>move(Number(b.dataset.dir)));
 document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.target.closest('input,select,textarea'))return;if(e.key.toLowerCase()==='m'){e.preventDefault();if(!e.repeat)$('sheetMark').click();return;}if(e.key==='>'){e.preventDefault();if(!e.repeat)advance();return;}if(e.shiftKey&&e.key.toLowerCase()==='n'){e.preventDefault();if(!e.repeat)nextSeed();return;}const d={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3,k:0,l:1,j:2,h:3}[e.key];if(d!==undefined){e.preventDefault();move(d);}else if(e.key==='0'||e.key==='1'){truth=e.key==='1';draw();}});window.addEventListener('resize',()=>draw());draw();
})();
