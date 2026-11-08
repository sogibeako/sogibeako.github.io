'use strict';
const O=MazeOrientation,M=MazeCore,$=id=>document.getElementById(id),c=$('labMap'),ctx=c.getContext('2d');
let state=O.create(),truth=false;
let autoStore=null,autoTimer=null,autoDirty=false;
function initAutoSave(){
 try{
  autoStore=MazeOrientationAutosave.create(window.localStorage,MazeOrientationSave);
  $('labAutoResume').disabled=!autoStore.read();
  $('labAutoStatus').textContent=autoStore.read()?'前回の自動保存があります。「自動保存から再開」で続きを読み込めます。':'自動保存はオフです。必要なときに有効にできます。';
 }catch(error){$('labAutoStatus').textContent='ブラウザー内の保存を利用できません。ファイル保存を使ってください。';$('labAutoEnabled').disabled=true;}
}
function flushAutoSave(){
 clearTimeout(autoTimer);autoTimer=null;
 if(!autoDirty||!$('labAutoEnabled').checked||!autoStore)return;
 try{
  autoStore.save(state);autoDirty=false;$('labAutoResume').disabled=false;
  $('labAutoStatus').textContent=`自動保存済み：第${state.config.stage}迷路・${state.game.steps}歩（累計${state.config.completedSteps+state.game.steps}歩）。`;
 }catch(error){$('labAutoEnabled').checked=false;autoDirty=false;$('labAutoStatus').textContent=`自動保存を停止しました：${error.message} 手動のファイル保存も利用できます。`;}
}
function queueAutoSave(){
 if(!$('labAutoEnabled').checked)return;
 autoDirty=true;$('labAutoStatus').textContent='探索の変更を自動保存します…';clearTimeout(autoTimer);autoTimer=setTimeout(flushAutoSave,500);
}
$('labAutoEnabled').addEventListener('change',()=>{
 if($('labAutoEnabled').checked){
  try{autoStore=MazeOrientationAutosave.create(window.localStorage,MazeOrientationSave);autoDirty=true;flushAutoSave();}
  catch(error){$('labAutoEnabled').checked=false;$('labAutoStatus').textContent=`自動保存を開始できません：${error.message}`;}
 }else{clearTimeout(autoTimer);autoDirty=false;$('labAutoStatus').textContent='自動保存はオフです。最後に保存した探索は残っています。';}
});
$('labAutoResume').addEventListener('click',()=>{
 try{
  const next=autoStore.restore();clearTimeout(autoTimer);autoDirty=false;state=next;truth=false;
  syncSettings();updateWorldInfo();draw();$('labAutoEnabled').checked=true;
  $('labAutoStatus').textContent=`第${state.config.stage}迷路・${state.game.steps}歩から再開しました。自動保存は有効です。`;
  $('labAction').textContent='ブラウザー内に保存した探索を復元しました。';
 }catch(error){$('labAutoStatus').textContent=`再開できません：${error.message} 現在の探索と保存データは保持しています。`;}
});
window.addEventListener('pagehide',flushAutoSave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushAutoSave();});
function paintCell(g,x,y,tile,terrain,feature){
 const textMode=$('labAppearance').value==='text';
 if(!textMode){g.fillStyle=terrain?'#29443f':'#77918e';g.fillRect(x,y,Math.max(.5,tile-1),Math.max(.5,tile-1));}
 const symbol=feature||(textMode?(terrain?'.':'#'):'');
 if(symbol){
  g.fillStyle=symbol==='@'?'#e6ffd6':feature?'#f1c583':terrain?'#9bb8af':'#77918e';
  g.font=`${feature?'bold ':''}${tile*.8}px monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText(symbol,x+tile/2,y+tile/2);
 }
}
$('labAppearance').addEventListener('change',draw);
const arrows={up:'↑',down:'↓',left:'←',right:'→'};
function draw(){
 const g=state.game,w=g.world,px=g.player.world_position%w.width,py=Math.floor(g.player.world_position/w.width);
 const width=c.clientWidth,height=c.clientHeight,dpr=window.devicePixelRatio||1;
 c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle='#0b161c';ctx.fillRect(0,0,width,height);
 const cols=truth?w.width:11,rows=truth?w.height:11,tile=Math.min((width-24)/cols,(height-24)/rows,42),ox=(width-cols*tile)/2,oy=(height-rows*tile)/2;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const offset=O.apply(state.frame,x-5,y-5),wx=truth?x:px+offset[0],wy=truth?y:py+offset[1];
  if(wx<0||wy<0||wx>=w.width||wy>=w.height)continue;
  const id=wy*w.width+wx;
  const key=`${state.chart.position[0]+x-5},${state.chart.position[1]+y-5}`,node=state.chart.nodes.get(key),visible=truth||state.chart.visible.has(key);
  if(!truth&&!node)continue;
  ctx.globalAlpha=visible?1:.38;
  const symbol=id===g.player.world_position?'@':truth?M.featureAt(g,id):node.feature;
  paintCell(ctx,ox+x*tile,oy+y*tile,tile,truth?w.cells[id]:node.terrain,symbol);
 }
 ctx.globalAlpha=1;
 const hx=truth?px:5,hy=truth?py:5,heading=truth?g.player.direction:O.direction(O.apply(O.inverse(state.frame),...M.DIRS[g.player.direction]));
 ctx.fillStyle='#e6ffd6';ctx.font=`${Math.max(10,tile*.35)}px monospace`;ctx.fillText(arrows[heading],ox+(hx+.84)*tile,oy+(hy+.18)*tile);
 const up=O.direction(O.apply(state.frame,0,-1)),right=O.direction(O.apply(state.frame,1,0)),mirrored=state.frame[0]*state.frame[3]-state.frame[1]*state.frame[2]<0;
 $('frameInfo').textContent=`主観の上 = 真世界の ${arrows[up]} ／ 主観の右 = 真世界の ${arrows[right]} ／ ${mirrored?'反転あり':'反転なし'}`;
 $('labStatus').textContent=`${g.steps}歩 · ワープ ${state.crossings}回。${g.won?'出口に到着しました！':`${state.exploringAfterExit?'出口到達済み · 探索を継続中。':''}${truth?'真世界の画面方向':'主観世界の画面方向'}で操作します。`}`;
 $('labContinue').hidden=!g.won;
 $('labNext').hidden=g.world.exit<0; $('labNext').disabled=g.player.world_position!==g.world.exit;
 $('labJourney').textContent=`第${state.config.stage}迷路 · クリア ${state.config.stage-1}回 · 累計 ${state.config.completedSteps+g.steps}歩`;
 c.setAttribute('aria-label',`向きの実験、${truth?'真世界':'主観世界'}、${g.steps}歩、ワープ${state.crossings}回`);
 drawCurrentChart();drawArchive();
 $('local').setAttribute('aria-pressed',String(!truth));$('world').setAttribute('aria-pressed',String(truth));
}
function drawChart(canvas,chart,current){
 const kind=current?'Current':'Archive',viewport=$(`lab${kind}Viewport`),zoom=Number($(`lab${kind}Zoom`).value);
 if(!viewport.clientWidth||!viewport.clientHeight)return;
 const width=viewport.clientWidth*zoom,height=viewport.clientHeight*zoom;
 canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
 const nodes=[...chart.nodes.values()],g=canvas.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#0b161c';g.fillRect(0,0,width,height);
 if(!nodes.length)return;
 const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),minX=Math.min(...xs),minY=Math.min(...ys),cols=Math.max(...xs)-minX+1,rows=Math.max(...ys)-minY+1;
 const tile=Math.min(28*zoom,(width-20*zoom)/cols,(height-20*zoom)/rows),ox=(width-cols*tile)/2,oy=(height-rows*tile)/2;
 for(const n of nodes){
  const x=ox+(n.x-minX)*tile,y=oy+(n.y-minY)*tile;
  g.globalAlpha=current&&!chart.visible.has(`${n.x},${n.y}`)?.45:1;
  paintCell(g,x,y,tile,n.terrain,n.feature);
 }
 g.globalAlpha=1;
 if(current){
  const [px,py]=chart.position,x=ox+(px-minX)*tile,y=oy+(py-minY)*tile;
  g.fillStyle=$('labAppearance').value==='text'?'#0b161c':'#29443f';g.fillRect(x,y,tile,tile);
  g.fillStyle='#e6ffd6';g.font=`bold ${tile*.8}px monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText('@',x+tile/2,y+tile/2);
  const heading=O.direction(O.apply(O.inverse(chart.frame),...M.DIRS[state.game.player.direction]));
  g.font=`${Math.max(9,tile*.35)}px monospace`;g.fillText(arrows[heading],x+tile*.85,y+tile*.15);
 }
}
function drawCurrentChart(){
 const chart=state.chart,canvas=$('labCurrentMap'),ids=[...chart.matches].sort((a,b)=>a-b).map(i=>i+1);
 const count=[...chart.nodes.values()].filter(n=>n.terrain).length;
 $('labCurrentInfo').textContent=`記憶した床 ${count}セル ／ 取り込んだ記録：${ids.length?ids.join('・'):'まだありません'}。`;
 canvas.setAttribute('aria-label',`現在の統合地図、主観の向き、記憶した床${count}セル、照合済み${ids.length}冊`);
 if($('labCurrentChart').open)drawChart(canvas,chart,true);
}
$('labCurrentChart').addEventListener('toggle',drawCurrentChart);
new ResizeObserver(drawCurrentChart).observe($('labCurrentViewport'));
new ResizeObserver(()=>{if(state.archives.length)drawArchive();}).observe($('labArchiveViewport'));
for(const kind of ['Current','Archive'])$(`lab${kind}Zoom`).addEventListener('change',()=>{
 const viewport=$(`lab${kind}Viewport`),oldWidth=viewport.scrollWidth,oldHeight=viewport.scrollHeight;
 const cx=(viewport.scrollLeft+viewport.clientWidth/2)/oldWidth,cy=(viewport.scrollTop+viewport.clientHeight/2)/oldHeight;
 if(kind==='Current')drawCurrentChart();else drawArchive();
 viewport.scrollLeft=cx*viewport.scrollWidth-viewport.clientWidth/2;viewport.scrollTop=cy*viewport.scrollHeight-viewport.clientHeight/2;
});
function drawArchive(){
 const select=$('labArchiveChoice'),section=$('labArchives');section.hidden=!state.archives.length;
 if(!state.archives.length){select.replaceChildren();return;}
 if(select.options.length!==state.archives.length){
  const previous=select.value;select.replaceChildren(...state.archives.map((a,i)=>new Option(`記録 ${i+1}（${a.endedAt}歩目まで）`,String(i))));
  select.value=previous&&Number(previous)<state.archives.length?previous:String(state.archives.length-1);
 }
 const a=state.archives[Number(select.value)],nodes=[...a.nodes.values()],canvas=$('labArchiveMap');
 drawChart(canvas,a,false);
 const up=O.direction(O.apply(a.frame,0,-1)),right=O.direction(O.apply(a.frame,1,0));
 $('labArchiveInfo').textContent=`記録 ${Number(select.value)+1}：当時の上 = 真世界の ${arrows[up]} ／ 当時の右 = 真世界の ${arrows[right]}。観測した ${nodes.filter(n=>n.terrain).length}床セル。`;
 canvas.setAttribute('aria-label',$('labArchiveInfo').textContent);
 const result=O.inspectMatch(state,Number(select.value));
 $('labMatch').disabled=result.status!=='ready';
 const messages={ready:`共通の印 ${result.shared}個と観測した地形から、向きと位置が一意に決まりました。`,matched:'この記録は現在の地図へ照合済みです。',ambiguous:`向きを一意に決められません（候補 ${result.candidates.length}通り）。共通の印の周囲を探索するか、別の目印を両方の地図へ記録してください。`,conflict:'記録した印や地形の位置関係が一致しません。', 'no-landmarks':'両方の地図に記録した共通の入口・番号目印が必要です。'};
 $('labMatchInfo').textContent=messages[result.status]||'照合する記録がありません。';
 const chain=O.inspectAll(state);const reasons={'no-landmarks':'共通の印なし',ambiguous:'向き未確定',conflict:'記録に矛盾'};const pendingText=Object.entries(reasons).map(([status,label])=>{const n=chain.pending.filter(r=>r.status===status).length;return n?`${label} ${n}冊`:'';}).filter(Boolean).join(' ／ ');$('labMatchAll').disabled=!chain.matched.length;
 $('labChainInfo').textContent=chain.matched.length?`連鎖して照合できる記録：${chain.matched.map(i=>i+1).join(' → ')}。未確定 ${chain.pending.length}冊${pendingText?`（${pendingText}）`:""}。`:`新しく照合できる記録はありません。未確定 ${chain.pending.length}冊${pendingText?`（${pendingText}）`:""}。`;
}
$('labArchiveChoice').addEventListener('change',drawArchive);
function mark(){
 const result=O.placeMarker(state);
 $('labAction').textContent=result.label?`目印 ${result.label} を記録しました。`:'ここには目印を置けません（普通の床・最大9個）。';draw();queueAutoSave();
}
function match(){
 if(!state.archives.length){$('labAction').textContent='照合する保存地図がまだありません。';return;}
 const index=Number($('labArchiveChoice').value),result=O.matchArchive(state,index);
 $('labAction').textContent=result.status==='matched'?`記録 ${index+1} を現在の向きに合わせて取り込みました。`:'まだ向きと位置を一意に決められないため、照合を保留しました。';draw();queueAutoSave();
}
function matchAll(){
 const result=O.matchAll(state);
 $('labAction').textContent=result.matched.length?`記録 ${result.matched.map(i=>i+1).join(' → ')} を順に照合し、現在の向きに合わせて取り込みました。未確定 ${result.pending.length}冊。`:'新しく照合できる記録はありません。共通の目印を増やしてからお試しください。';draw();queueAutoSave();
}
$('labMatchAll').addEventListener('click',matchAll);
$('labContinue').addEventListener('click',()=>{if(O.continueExploring(state)){$('labAction').textContent='出口への到達を記録したまま、探索を続けます。';draw();queueAutoSave();}});
$('labMark').addEventListener('click',mark);$('labMatch').addEventListener('click',match);
function syncSettings(){
 $('labCourse').value=state.config.course;
 $('labLayout').value=state.config.layout;$('labSize').value=state.config.size;$('transform').value=state.config.mode;
 $('labSeed').value=state.config.seed;$('labWarpCount').value=String(state.config.warpCount);$('labWarpStyle').value=state.config.warpStyle;$('labWarpInvisible').checked=state.config.warpInvisible;
 for(const id of ['labSeed','labNewSeed','labWarpCount','labWarpStyle','labSize'])$(id).disabled=state.config.layout==='demo';
 $('labArchiveChoice').replaceChildren();
}
function advance(){
 try{
  const next=O.nextMaze(state);
  if(!next){$('labAction').textContent='次の迷路へ進むには、出口 > の上で > キーを押してください。';return;}
  state=next;syncSettings();updateWorldInfo();draw();queueAutoSave();
  $('labAction').textContent=`第${state.config.stage}迷路へ進みました。条件が変わりました。画面上の案内で今回のルールを確認できます。`;
 }catch(error){$('labAction').textContent=`次の迷路を生成できませんでした：${error.message} 現在の探索は保持しています。`;}
}
$('labNext').addEventListener('click',advance);
$('labBeginJourney').addEventListener('click',()=>{
 try{
  const next=O.createJourney($('labCourse').value,'walk-'+Math.random().toString(36).slice(2,10));
  state=next;truth=false;syncSettings();updateWorldInfo();draw();queueAutoSave();
  $('labAction').textContent='選んだコースで新しい旅を始めました。出口 > の上で > キーを押すと次の迷路へ進めます。';
  c.focus();
 }catch(error){$('labAction').textContent=`旅を始められませんでした：${error.message} 現在の探索は保持しています。`;}
});
function step(dir){if(O.move(state,dir,truth))queueAutoSave();draw();}
function updateWorldInfo(){
 $('labCourseInfo').textContent={all:'次の迷路から：通常迷路・可視ワープ・不可視ワープを混ぜます。',visible:'次の迷路から：通常迷路と見えるワープを混ぜます。不可視ワープは出ません。',plain:'次の迷路から：通常迷路だけを生成します。方式と大きさは変わります。'}[state.config.course];
  const plain=state.config.warpStyle==='none';
  $('labWarpCount').disabled=plain||state.config.layout==='demo';$('transform').disabled=plain;$('labWarpInvisible').disabled=plain;$('labWarpInvisible').checked=state.config.warpInvisible;
  $('labIntro').textContent=plain?'この階はワープのない迷路です。道をたどって出口 > を目指し、出口上で > キーを押すと次の迷路へ進めます。':state.config.warpInvisible?'ワープ床は普通の床と同じ見た目です。踏むと別の場所へ転移し、向きが変わります。どちらの表示でも方向キーは画面の上下左右へ進みます。':'Oを踏むと別の場所へ転移し、向きが変わります。どちらの表示でも方向キーは画面の上下左右へ進みます。';
  const style=state.game.world.warpStyle||'pair',styleName={none:'ワープなし',pair:'相互',oneway:'一方通行',cycle3:'3地点の輪',cycle4:'4地点の輪'}[style];
  $('labWarpRule').textContent=plain?'転移や向きの変化はありません。探索した道は一枚の地図に記録されます。':style==='pair'?'相互ワープ：往路で選んだ変換、復路でその逆変換を適用します。':style==='oneway'?'一方通行：転移時に向きが変わります。到着点は普通の床で、踏み直しても戻りません。':'輪のワープ：各転移で向きが変わります。一周して同じ場所へ戻っても、向きは異なる場合があります。';
  $('labWorldInfo').textContent=state.config.layout==='demo'?'二部屋の教材：出口なし。何度でも往復できます。':`${{dfs:'DFS',prim:'Prim',division:'領域分割',rooms:'部屋＋通路'}[state.config.layout]} · ${state.game.world.width} × ${state.game.world.height} · シード ${state.game.world.seed} · ${plain?styleName:`${styleName} ${state.game.world.warpCount}組（希望 ${state.game.world.requestedWarpCount}組）`} · > が出口です。`;
}
function exportMapText(download=false){
 try{
  const text=O.exportMapReport(state);$('labMapText').value=text;
  if(download){
   const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');
   link.href=url;link.download=`maze-orientation-map-${state.config.stage}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('labTextStatus').textContent=`第${state.config.stage}迷路・${state.game.steps}歩時点の地図を書き出しました。${download?"ファイル保存を要求しました。保存が始まらない場合は、下の欄からコピーできます。":""}`;
 }catch(error){$('labTextStatus').textContent=`書き出せませんでした：${error.message}`;}
}
$('labTextExport').addEventListener('click',()=>exportMapText());
$('labTextDownload').addEventListener('click',()=>exportMapText(true));
function exportSave(download=false){
 try{
  const text=MazeOrientationSave.encode(state);$('labSaveText').value=text;
  if(download){
   const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');
   link.href=url;link.download='maze-orientation-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('labSaveStatus').textContent=`${state.game.steps}歩・転移${state.crossings}回の保存データを書き出しました。`;
 }catch(error){$('labSaveStatus').textContent=error.message;}
}
function importSave(text){
 try{
  const next=MazeOrientationSave.decode(text);
  state=next;truth=false;
  syncSettings();$('labAction').textContent='保存した探索を復元しました。';updateWorldInfo();draw();queueAutoSave();
  $('labSaveStatus').textContent=`${state.game.steps}歩・転移${state.crossings}回の探索を再開しました。`;
 }catch(error){$('labSaveStatus').textContent=`読み込めませんでした：${error.message} 現在の探索は保持しています。`;}
}
$('labExport').addEventListener('click',()=>exportSave());
$('labDownload').addEventListener('click',()=>exportSave(true));
$('labImport').addEventListener('click',()=>importSave($('labSaveText').value));
$('labSaveFile').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{if(file.size>2000000)throw Error('ファイルは2MB以下にしてください。');importSave(await file.text());}
 catch(error){$('labSaveStatus').textContent=`読み込めませんでした：${error.message} 現在の探索は保持しています。`;}
 e.target.value='';
});
function restart(newSeed=false){
 const layout=$('labLayout').value;
 if(newSeed&&layout==='demo')return;
 if(newSeed)$('labSeed').value='walk-'+Math.random().toString(36).slice(2,10);
 try{
  const next=O.create($('transform').value,{layout,course:$('labCourse').value,size:$('labSize').value,seed:$('labSeed').value.trim()||'orientation-walk',warpCount:Number($('labWarpCount').value),warpStyle:$('labWarpStyle').value,warpInvisible:$('labWarpInvisible').checked});
  state=next;$('labAction').textContent='';
  updateWorldInfo();
  draw();queueAutoSave();
 }catch(error){$('labAction').textContent=`生成できませんでした：${error.message} 現在の探索は保持しています。`;}
}
$('labCourse').addEventListener('change',()=>{O.setCourse(state,$('labCourse').value);updateWorldInfo();$('labAction').textContent='次の迷路からコースを適用します。現在の探索はそのまま続けられます。';queueAutoSave();});
$('labLayout').addEventListener('change',()=>{
 const demo=$('labLayout').value==='demo';$('labSeed').disabled=demo;$('labNewSeed').disabled=demo;$('labWarpCount').disabled=demo;$('labWarpStyle').disabled=demo;$('labSize').disabled=demo;restart();
});
$('labSize').addEventListener('change',()=>restart());
$('labWarpInvisible').addEventListener('change',()=>restart());
$('labWarpStyle').addEventListener('change',()=>restart());
$('labWarpCount').addEventListener('change',()=>restart());
$('labNewSeed').addEventListener('click',()=>restart(true));
$('transform').addEventListener('change',()=>restart());
$('reset').addEventListener('click',()=>restart());
$('local').addEventListener('click',()=>{truth=false;draw();});$('world').addEventListener('click',()=>{truth=true;draw();});
for(const b of document.querySelectorAll('[data-dir]'))b.addEventListener('click',()=>step(b.dataset.dir));
c.addEventListener('pointerdown',()=>c.focus());
document.addEventListener('keydown',e=>{
 if(e.target.closest('.lab-chart-viewport')||e.ctrlKey||e.metaKey||e.altKey||e.isComposing||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.target.isContentEditable)return;
 if(e.key==='>'){e.preventDefault();if(!e.repeat)advance();return;}
 if(e.shiftKey&&e.key.toLowerCase()==='n'){e.preventDefault();if(!e.repeat)restart(true);return;}
 if(e.key.toLowerCase()==='m'||e.key.toLowerCase()==='c'){e.preventDefault();if(!e.repeat)(e.key.toLowerCase()==='m'?mark:matchAll)();return;}
 const dirs={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',h:'left',j:'down',k:'up',l:'right','2':'down','4':'left','6':'right','8':'up'};
 if(dirs[e.key]){e.preventDefault();step(dirs[e.key]);}else if(e.key==='0'||e.key==='1'){e.preventDefault();truth=e.key==='1';draw();}
});
new ResizeObserver(draw).observe(c);restart();initAutoSave();
