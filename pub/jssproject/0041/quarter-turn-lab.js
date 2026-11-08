(()=>{'use strict';
const S=ConnectionSpace,M=QuarterTurnMemory,$=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');
const descriptions={doubleTwist:'左右を越えると上下反転、上下を越えると左右反転します。',quarterCW:'接続先の辺は時計回り。辺上の順序を保ち、視点は反時計回り90度に変化します。',quarterCCW:'接続先の辺は反時計回り。辺上の順序を保ち、視点は時計回り90度に変化します。',cwTwist:'接続先の辺は時計回り。辺上の順序を逆転し、視点は反時計回り90度に変化します。',ccwTwist:'接続先の辺は反時計回り。辺上の順序を逆転し、視点は時計回り90度に変化します。'};
const embedded=new URLSearchParams(location.search).has('embedded');let embeddedFamily=new URLSearchParams(location.search).get('family')||'doubleTwist';
let timer=null,completed=0,totalSteps=0,moves=[];
let applied=null,state,truth=false,steps=0,crossings=0,last='',memory=M.create();

const G=GraphWands,wandUI=GraphWandControls.attach(()=>state,()=>draw(),()=>truth,canvas,{onBegin:()=>stopAuto(),visible:()=>new Set(S.nearestView(state,6,null,true).filter(p=>!p.wall).map(p=>p.id)),recordCast:(spell,d)=>moves.push({spell,d}),afterCast:()=>{steps=state.steps;observe();}});
function enableWands(){if(!state.wands){G.init(state);if(state.wands)moves.push('wands');}}
function stopAuto(message){if(timer!==null)clearInterval(timer);timer=null;$('autoStart').disabled=false;$('autoStop').disabled=true;if(message)$('autoStatus').textContent=message;}
function tickAuto(){if(state.wands?.oob){stopAuto();return;}if(wandUI.busy())return;if(state.wands?.frozen){move(4);return;}
 const stroll=$('autoMode').value==='stroll',covered=state.world.cells.every((v,id)=>!v||memory.visited.has(id));
 const walk=stroll&&covered?MazeStroll.route(state,MazeWildlife.graph(state),null,state.world.exit):null;
 const roaming=!!walk?.length,plan=roaming?{direction:walk[0],phase:'散歩 '+MazeStroll.record(state).steps+' / 2000歩'}:QuarterTurnAuto.next(state,memory.visited,stroll?'explore':$('autoMode').value||'explore');
 if(plan.done){if(!plan.blocked&&(stroll||$('continuous').checked)&&state.world.exit!==undefined&&state.id===state.world.exit){advanceExit(true);return;}stopAuto(plan.reason);return;}
 move(truth?plan.direction:state.frame.indexOf(plan.direction));if(roaming)MazeStroll.advance(state,state.id);
 $('autoStatus').textContent=`${plan.phase} ／ 訪問 ${memory.visited.size} / ${state.world.cells.reduce((a,b)=>a+b,0)}床`;
}
function startAuto(mode){stopAuto();if(state.wallPass){stopAuto('壁抜け中は自動歩行を停止します。床へ戻りShift+Wで解除してください。');return;}if(mode)$('autoMode').value=mode;
 if($('autoMode').value==='exit'&&state.world.exit===undefined){stopAuto('固定地形には出口がありません。全床探索をお試しください。');return;}
 $('autoStart').disabled=true;$('autoStop').disabled=false;$('autoStatus').textContent='自動歩行中';
 timer=setInterval(tickAuto,Number($('autoSpeed').value)||250);canvas.focus();
}
function changeSpeed(faster){const values=['700','250','80','40','20','10'],i=values.indexOf($('autoSpeed').value);$('autoSpeed').value=values[Math.max(0,Math.min(values.length-1,(i<0?1:i)+(faster?1:-1)))];if(timer!==null)startAuto();}
$('autoStart').onclick=()=>startAuto();$('autoStop').onclick=()=>{stopAuto('自動歩行を停止しました。');canvas.focus();};
$('autoMode').onchange=()=>{if(timer!==null)startAuto();};$('autoSpeed').onchange=()=>{if(timer!==null)startAuto();};

function observe(){if(state.wands?.oob)return;M.observe(memory,state,S.nearestView(state,6,null,true));}
function toggleWallPass(){stopAuto();if(state.wands?.oob)return;if(!QuarterTurnMaze.toggleWallPass(state)){stopAuto('壁の中では解除できません。床へ戻ってからShift+Wを押してください。');return;}moves.push('ghost');stopAuto(state.wallPass?'壁抜けON：自動歩行は停止中です。':'壁抜けOFF');draw();canvas.focus();}
$('wallPass').onclick=toggleWallPass;
function consoleStatus(){
 const total=state.world.cells.reduce((n,v)=>n+(v?1:0),0),seen=memory.seen.size;
 return {world:state.world,steps:moves.filter(d=>Number.isInteger(d)&&d>=0&&d<4).length+' / '+state.steps,label:'通路の発見率',discovery:(total?Math.floor(seen/total*100):0)+'%（'+seen+' / '+total+'床）'+(memory.complete?'・地図完成':''),turn:state.steps};
}
function draw(){enableWands();wandUI.state();steps=state.steps;if(state.wands?.oob){const width=canvas.clientWidth||800,height=canvas.clientHeight||480,dpr=devicePixelRatio||1;canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);GraphOob.draw(ctx,state,width,height);window.dispatchEvent(new Event('exploration-change'));return;}
 $('wallPass').textContent='壁抜け '+(state.wallPass?'ON':'OFF')+' · Shift+W';$('wallPass').setAttribute('aria-pressed',String(!!state.wallPass));
 // Draw at the displayed canvas size: CSS containment must not shrink a 504px bitmap.
 const compact=!!canvas.closest('.console-play-stage'),span=truth?state.world.size+2:21;
 const width=Math.max(1,Math.floor(canvas.clientWidth)),height=compact?Math.max(1,Math.floor(canvas.clientHeight)):span*24,dpr=devicePixelRatio||1;
 const cell=truth?Math.max(1,Math.min((width-28)/state.world.size,(height-28)/state.world.size)):Math.max(1,Math.min(24,(width-20)/19));
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(!compact)canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0b161c';ctx.fillRect(0,0,width,height);
 const ox=Math.floor(width/2),oy=Math.floor(height/2),render=$('render').value;
 const tiles=truth?Array.from(state.world.cells.slice(0,state.world.size**2),(v,id)=>{const base=state.id%(state.world.size**2),x=id%state.world.size,y=Math.floor(id/state.world.size),t=QuarterTurnMaze.projectTile(state,{id,x:x-base%state.world.size,y:y-Math.floor(base/state.world.size),frame:[0,1,2,3],wall:!v});return {...t,x:x-state.world.size/2,y:y-state.world.size/2};}):M.compose(memory,state,S.nearestView(state,6,null,true),Math.ceil(Math.max(width,height)/cell/2)+1);
 for(const t of tiles){const x=ox+t.x*cell,y=oy+t.y*cell,isPlayer=truth?t.id===state.id:t.x===0&&t.y===0,projectile=!t.wall&&WandFlight.matches(wandUI.projectile(),t.id),isSelf=(!t.remembered||t.revealed)&&!t.wall&&t.id===state.id,beyond=!truth&&t.seams>0;
 ctx.globalAlpha=t.remembered&&!t.revealed?.45:1;
 if(render!=='ascii'||isPlayer||isSelf||projectile){ctx.fillStyle=projectile?WandFlight.color(wandUI.projectile()):isPlayer?'#ffe581':isSelf?'#e9aac5':t.wall?(beyond?'#8c7a9b':'#728888'):(beyond?'#433451':'#244341');ctx.fillRect(x,y,cell-1,cell-1);}
 if(t.wall)globalThis.ReflectingWalls?.paint(ctx,state,t.id,x+cell/2,y+cell/2,cell);
 const animal=globalThis.MazeWildlife?.projectedGlyph(state,t,memory.complete,truth);
 const feature=!t.wall?SheetFeatures.glyph(state,t.id,truth||!t.remembered||memory.complete):null;
 const symbol=!t.wall?S.underpassSymbol(state.world,t.id,t.frame):'';
 if(render!=='tiles'||symbol||feature||projectile||animal||isPlayer||isSelf||t.id===state.world.exit||t.id===state.world.start){ctx.font=(cell*.75)+'px ui-monospace, Consolas, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=projectile?'#fff':isPlayer||isSelf?'#111':beyond?'#d9b9ef':t.wall?'#e4c47e':'#abd2bc';const glyph=projectile?'*':isPlayer||isSelf?'@':t.wall?'#':animal||feature||symbol|| (t.id===state.world.exit?'>':t.id===state.world.start?'<':t.id%(state.world.size+1)===0?String(1+t.id/(state.world.size+1)):'.');// Match the crossing/triple maze's underpass typography in every render mode.
 if(symbol&&glyph===symbol){ctx.font=render==='ascii'?`${cell*.88}px Consolas, "Liberation Mono", monospace`:`bold ${Math.max(7,cell*.8)}px monospace`;ctx.fillStyle='#f1c583';}
 globalThis.MazeWildlife?.paint(ctx,state,t.id,glyph,x+cell/2,y+cell/2,cell,beyond);if(symbol&&glyph===symbol)ctx.fillText(glyph,x+cell/2,y+cell/2);else ctx.fillText(glyph,x+cell/2,y+cell/2,cell-3);}
 }
 ctx.globalAlpha=1;
 window.dispatchEvent(new Event('exploration-change'));
 $('journeyStatus').textContent=`${completed}枚踏破 ／ 通算 ${totalSteps+steps}歩`;
 $('exitNext').disabled=state.world.exit===undefined||state.id!==state.world.exit;
 for(const button of document.querySelectorAll('[data-render]'))button.setAttribute('aria-pressed',String(button.dataset.render===render));
 $('subjective').setAttribute('aria-pressed',String(!truth));$('truth').setAttribute('aria-pressed',String(truth));
 $('status').textContent=`${steps}歩 ／ 境界通過 ${crossings}回 ／ 実座標 (${state.id%state.world.size}, ${Math.floor(state.id/state.world.size)}) ／ 見かけの上＝${['北','東','南','西'][truth?0:state.frame[0]]} ／ ${state.world.seamDetour?.requested?(state.world.seamDetour.required?(state.world.seamDetour.blocked===null?'境界経由が必要（元の配置）':'1マス封鎖・境界経由が必要'):'安全に塞げる場所なし'):'通路封鎖OFF'} ／ 境界から通路へ ${state.world.seamRoutes?.length||0}本 ／ 境界付近の開通 ${state.world.boundaryLinksOpened||0}か所 ／ アンダーパス ${state.world.passages?.length??0} / 目標 ${state.world.floorUnderpasses??0}か所 ／ 記憶 ${memory.tiles.size}マス・訪問 ${memory.visited.size}床 ／ 視認 ${memory.seen.size}/${state.world.cells.reduce((a,b)=>a+b,0)}床${memory.complete?'・地図完成（壁も表示）':''} ／ ${last} ／ ${globalThis.MazeWildlife?.status(state)||''}${state.id===state.world.exit?' ／ 出口に到着！':''}`;
}
function reset(){stopAuto('自動歩行は停止中です。');state=applied?.terrain==='maze'?QuarterTurnMaze.create(applied.mode,applied.size,applied.seed,{ruleMode:applied.ruleMode??'plain',boundaryLinks:applied.boundaryLinks,algorithm:applied.algorithm,seamRoutes:applied.seamRoutes,seamDetour:applied.seamDetour,floorUnderpasses:applied.floorUnderpasses??0,underpassShape:applied.underpassShape??'mixed'}):QuarterTurnMaze.installRules(S.create($('mode').value),applied.ruleMode??'plain');steps=0;crossings=0;last='';moves=[];memory=M.create();observe();$('description').textContent=descriptions[$('mode').value];draw();canvas.focus();}
function move(d){if(wandUI.busy())return;if(state.wands?.oob){if(GraphOob.move(state,d))moves.push(d);draw();return;}const current=state,action=state.wands?.frozen?4:d,from=state.id,wd=action===4?4:truth?action:state.frame[action],edge=action===4?null:state.wallPass?QuarterTurnMaze.wallEdge(state.world,from,wd):state.world.edges.get(from+':'+wd),local=action===4?4:truth?state.frame.indexOf(action):action;
 if(QuarterTurnMaze.move(state,action,truth)){moves.push(local);if(edge?.kind==='twisted-boundary')crossings++;G.after(current,()=>{if(current!==state)return;steps=state.steps;observe();last=action===4?'その場で1ターン待ちました':'';draw();});}else last='壁で進めません';draw();}

function generate(){if(embedded){const left=Math.random()<.5;$('mode').value=embeddedFamily==='doubleTwist'?'doubleTwist':embeddedFamily==='quarter'?(left?'quarterCCW':'quarterCW'):(left?'ccwTwist':'cwTwist');}completed=0;totalSteps=0;applied={ruleMode:$('ruleMode').value||'plain',mode:$('mode').value,terrain:$('terrain').value,size:Number($('size').value),seed:$('seed').value,algorithm:$('algorithm').value||'legacy',floorUnderpasses:Number($('underpassCount').value),underpassShape:$('underpassShape').value,seamRoutes:Number($('seamRoutes').value||2),seamDetour:!!$('seamDetour').checked,boundaryLinks:!!$('boundaryLinks').checked};reset();}
function lottery(){return {space:!embedded&&!!$('randomSpace').checked,algorithm:!!$('randomAlgorithm').checked,size:!!$('randomSize').checked};}
function nextOptions(){if(embedded){const left=Math.random()<.5;applied.mode=embeddedFamily==='doubleTwist'?'doubleTwist':embeddedFamily==='quarter'?(left?'quarterCCW':'quarterCW'):(left?'ccwTwist':'cwTwist');}applied=QuarterTurnMaze.nextOptions(applied,lottery());for(const id of ['mode','size','seed'])$(id).value=String(applied[id]);$('algorithm').value=applied.algorithm||'legacy';syncFamily();}
function advanceExit(resume=false){if(state.wands?.oob){if(G.returnOob(state)){moves.push('oob-return');observe();}draw();return;}if(embedded&&parent.ExplorationHost?.advance(embeddedFamily))return;if(state.world.exit===undefined||state.id!==state.world.exit){last='出口 > の上で次の迷路へ進めます。';draw();return;}completed++;totalSteps+=steps;nextOptions();reset();if(resume)startAuto();}
$('exitNext').onclick=()=>advanceExit();
function syncFamily(){const mode=$('mode').value;$('family').value=mode==='doubleTwist'?'doubleTwist':['quarterCW','quarterCCW'].includes(mode)?'quarter':'quarterTwist';$('turn').value=['quarterCCW','ccwTwist'].includes(mode)?'left':'right';$('turnControl').hidden=embedded||mode==='doubleTwist';}
function chooseFamily(){const family=$('family').value,left=$('turn').value==='left';$('mode').value=family==='doubleTwist'?'doubleTwist':family==='quarter'?(left?'quarterCCW':'quarterCW'):(left?'ccwTwist':'cwTwist');$('turnControl').hidden=family==='doubleTwist';generate();}
$('family').onchange=chooseFamily;$('turn').onchange=chooseFamily;
for(const button of document.querySelectorAll('[data-render]'))button.onclick=()=>{$('render').value=button.dataset.render;draw();canvas.focus();};
$('mode').onchange=()=>{syncFamily();generate();};$('terrain').onchange=generate;$('generate').onclick=generate;$('next').onclick=()=>{completed=0;totalSteps=0;nextOptions();reset();};$('reset').onclick=()=>{completed=0;totalSteps=0;reset();};$('render').onchange=draw;
$('truth').onclick=()=>{truth=true;draw();canvas.focus();};$('subjective').onclick=()=>{truth=false;draw();canvas.focus();};
for(const b of document.querySelectorAll('[data-dir]'))b.onclick=()=>{stopAuto('手動操作で停止しました。');move(Number(b.dataset.dir));canvas.focus();};
document.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.target.closest('input,select,textarea,button')||e.ctrlKey||e.altKey||e.metaKey)return;if(e.shiftKey&&e.key.toLowerCase()==='w'){e.preventDefault();if(!e.repeat)toggleWallPass();return;}if(e.key==='>'){e.preventDefault();if(!e.repeat)advanceExit();return;}if(e.shiftKey&&e.key.toLowerCase()==='n'){e.preventDefault();$('next').onclick();return;}if(e.shiftKey&&['a','g','r'].includes(e.key.toLowerCase())){e.preventDefault();if(!e.repeat){const mode=e.key.toLowerCase()==='r'?'stroll':e.key.toLowerCase()==='a'?'explore':'exit';if(mode==='stroll'&&timer!==null&&$('autoMode').value===mode)stopAuto('散歩を停止しました。');else startAuto(mode);}return;}if(['+','=','-'].includes(e.key)){e.preventDefault();changeSpeed(e.key!=='-');return;}const d={'.':4,ArrowUp:0,k:0,ArrowRight:1,l:1,ArrowDown:2,j:2,ArrowLeft:3,h:3}[e.key];if(d!==undefined){e.preventDefault();stopAuto('手動操作で停止しました。');move(d);}else if(e.key==='0'||e.key==='1'){truth=e.key==='1';draw();}});
function displaySettings(){return {render:$('render').value,truth,continuous:!!$('continuous').checked,autoMode:$('autoMode').value,autoSpeed:$('autoSpeed').value,completed,totalSteps,lottery:lottery()};}
function checkpoint(){G.flush(state);observe();return {options:applied,moves,state,memory,crossings,settings:displaySettings()};}
function saveText(){G.flush(state);observe();return QuarterTurnSave.encode(applied,moves,state,displaySettings());}
function loadText(text){
 applyLoaded(QuarterTurnSave.decode(text)); // Validate before replacing the current game.
}
function applyLoaded(loaded){
 stopAuto('保存した探索を再開しました。自動歩行は停止中です。');
 applied=loaded.options;if(embedded)embeddedFamily=applied.mode==='doubleTwist'?'doubleTwist':['quarterCW','quarterCCW'].includes(applied.mode)?'quarter':'quarterTwist';state=loaded.state;memory=loaded.memory;moves=loaded.moves;steps=state.steps;crossings=loaded.crossings;last='';
 const prefs=loaded.settings;completed=prefs.completed;totalSteps=prefs.totalSteps;truth=prefs.truth;for(const [key,id]of [['space','randomSpace'],['algorithm','randomAlgorithm'],['size','randomSize']])$(id).checked=!!prefs.lottery?.[key];
 $('ruleMode').value=applied.ruleMode??'plain';for(const key of ['mode','terrain','size','seed'])$(key).value=String(applied[key]);$('underpassCount').value=String(applied.floorUnderpasses??0);$('underpassShape').value=applied.underpassShape??'mixed';$('boundaryLinks').checked=applied.boundaryLinks;$('algorithm').value=applied.algorithm||'legacy';$('seamRoutes').value=String(applied.seamRoutes??0);$('seamDetour').checked=!!applied.seamDetour;
 $('render').value=prefs.render;$('continuous').checked=prefs.continuous;$('autoMode').value=prefs.autoMode;if(![...$('autoSpeed').options].some(o=>o.value===prefs.autoSpeed)){const o=document.createElement('option');o.value=prefs.autoSpeed;o.textContent=prefs.autoSpeed+' ms（指定値）';$('autoSpeed').append(o);}$('autoSpeed').value=prefs.autoSpeed;
 syncFamily();$('description').textContent=descriptions[applied.mode];draw();canvas.focus();
}
$('saveGame').onclick=()=>{try{const text=saveText();$('saveText').value=text;localStorage.setItem('quarter-turn-save-v1',text);$('saveStatus').textContent='このブラウザーに保存しました。JSONもコピーできます。';}catch(error){$('saveStatus').textContent=error.message;}};
$('resumeGame').onclick=()=>{try{const text=localStorage.getItem('quarter-turn-save-v1');if(!text)throw Error('保存がありません。');loadText(text);$('saveStatus').textContent='ブラウザーの保存から再開しました。';}catch(error){$('saveStatus').textContent=error.message;}};
$('loadGame').onclick=()=>{try{loadText($('saveText').value);$('saveStatus').textContent='JSONから再開しました。';}catch(error){$('saveStatus').textContent=error.message;}};


function autoPath(goal){const q=[state.id],parents=new Map([[state.id,null]]);for(const id of q){if(goal(id)){const path=[];for(let at=id;parents.get(at);){const p=parents.get(at);path.push(p.d);at=p.id;}return path.reverse();}for(let d=0;d<4;d++){const e=state.world.edges.get(id+':'+d);if(e&&!parents.has(e.to)){parents.set(e.to,{id,d});q.push(e.to);}}}return null;}
function courseFresh(family,seed,course){
 const left=Math.random()<.5,base={...applied,terrain:'maze',seed,mode:family==='doubleTwist'?family:family==='quarter'?(left?'quarterCCW':'quarterCW'):(left?'ccwTwist':'cwTwist')};
 const options=ExplorationGeneration.chooseQuarter(base,seed,course);
 const fresh=QuarterTurnMaze.create(options.mode,options.size,seed,options),settings={...displaySettings(),completed:0,totalSteps:0};return QuarterTurnSave.encode(options,[],fresh,settings);
}
window.QuarterExplorationAdapter={autoOobPlan:()=>wandUI.autoOobPlan(false),autoOobCast:d=>wandUI.autoOobCast(d),returnOob:()=>advanceExit(),autoOob:()=>!!state.wands?.oob,wands:()=>wandUI,autoBusy:()=>wandUI.busy(),autoFrozen:()=>state.wands?.frozen||0,autoWait:()=>move(4),autoDynamic:()=>state.features?.bird!=null,autoStallLimit:()=>10000,autoRelocated:()=>!!state.features?.last,consoleStatus,checkpoint,restoreCheckpoint:applyLoaded,snapshot:saveText,prepare(text){QuarterTurnSave.decode(text);return text;},apply:loadText,courseFresh,courseEnter:loadText,family(name){if(embeddedFamily===name)return;embeddedFamily=name;generate();},pause:()=>stopAuto(),progress:()=>({token:state,steps:state.steps,exit:state.id===state.world.exit}),autoPlan:()=>autoPath(id=>id===state.world.exit),autoPosition:()=>state.id,autoTargets:()=>new Set(Array.from(state.world.cells,(v,id)=>v?id:-1).filter(id=>id>=0)),autoExplore(seen){for(const id of memory.visited)seen.add(id);return autoPath(id=>!seen.has(id));},autoMove:d=>move(truth?d:state.frame.indexOf(d)),autoNext:()=>advanceExit(),autoStroll:()=>MazeStroll.route(state,MazeWildlife.graph(state),null,state.world.exit),toggleWallPass};
if(embedded){document.querySelector('h1').hidden=true;document.querySelector('main>a')?.setAttribute('hidden','');$('autoStart').closest('.controls').hidden=true;$('family').closest('label').hidden=true;}

const mode=new URLSearchParams(location.search).get('space');if(Object.hasOwn(descriptions,mode))$('mode').value=mode;
window.addEventListener('resize',draw);syncFamily();generate();
// The common console can resize or adopt the canvas after initialization.
new ResizeObserver(()=>{if(canvas.clientWidth&&canvas.clientHeight)draw();}).observe(canvas);})();
