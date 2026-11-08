/* Event console and commands, shared by standalone and embedded exploration. */
(()=>{'use strict';
if(window.parent!==window)return;
const game=document.querySelector('.explorer')||document.getElementById('map');if(!game)return;
// Keep the common log directly after the active canvas, including embedded games.
const panel=document.createElement('section');panel.className='wildlife-console';panel.setAttribute('aria-label','迷宮ログ');
const title=document.createElement('h2');title.textContent='迷宮ログ';const state=document.createElement('p');state.textContent='1歩進むか . キーで待つと、動物の状態を表示します。';
const history=document.createElement('ol');history.setAttribute('aria-label','最近の出来事');
const note=document.createElement('p');note.textContent='観察用：視界外の動物も含めて表示します。最新100件。';note.className='console-note';
const toggle=document.createElement('button');toggle.type='button';toggle.textContent='履歴を隠す';toggle.onclick=()=>{history.hidden=!history.hidden;toggle.textContent=history.hidden?'履歴を表示':'履歴を隠す';};
panel.append(title,state,toggle,history,note);
function positionLog(){
 const frame=[...document.querySelectorAll('.explorer iframe')].find(f=>!f.closest('[hidden]')&&f.getAttribute('src'));
 const doc=frame?.contentDocument||document;
 const map=[...doc.querySelectorAll('canvas')].find(c=>!c.closest('[hidden]')&&c.getClientRects().length);
 if(!map)return;
 if(doc!==document&&!doc.querySelector('[data-wildlife-console-style]')){const css=doc.createElement('link');css.rel='stylesheet';css.href=new URL('wildlife-console.css?v=515',location.href).href;css.dataset.wildlifeConsoleStyle='';doc.head.append(css);}
 if(map.nextElementSibling!==panel)map.after(panel);
}
positionLog();
window.addEventListener('exploration-selected',()=>queueMicrotask(positionLog));
for(const frame of document.querySelectorAll('.explorer iframe'))frame.addEventListener('load',()=>queueMicrotask(positionLog));

const form=document.createElement('form');form.className='maze-command';
const input=document.createElement('input');input.type='text';input.placeholder='help / auto explore / stop';input.setAttribute('aria-label','迷宮コマンド');input.autocomplete='off';
const submit=document.createElement('button');submit.textContent='実行';submit.type='submit';
const reply=document.createElement('p');reply.setAttribute('role','status');reply.className='console-note';
form.append(input,submit);title.after(form,reply);
const ids=()=>document.getElementById('autoWalkStart')?['autoWalkMode','autoWalkStart','autoWalkStop','autoWalkSpeed']:['autoMode','autoStart','autoStop','autoSpeed'];
function selectInterval(select,value){
 if(!select)throw Error('この画面では歩行速度を変更できません。');
 if(![...select.options].some(o=>o.value===value)){let option=select.querySelector('[data-custom-speed]');if(!option){option=document.createElement('option');option.dataset.customSpeed='';select.append(option);}option.value=value;option.textContent=value+' ms（指定値）';}
 select.value=value;
}
const wandAPI=()=>window.ExplorationHost&&window.ExplorationHost.mode()!=='main'?window.ExplorationHost.wands?.():window.MainWandsUI||window.GraphWandsUI;
document.addEventListener('keydown',e=>{if(e.shiftKey&&e.key.toLowerCase()==='z'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.isComposing&&!e.target.closest('input,select,textarea,[contenteditable]')&&window.ExplorationHost?.mode()!=='main'&&wandAPI()?.state().available){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)wandAPI().begin();}},true);
function command(text){
 const [verb,arg,...extra]=text.trim().toLowerCase().split(/\s+/),[mode,start,stop,speed]=ids(),get=id=>document.getElementById(id);
 if(extra.length)throw Error('引数が多すぎます。help で一覧を表示します。');
 if(verb==='auto'&&arg==='oob'){if(!window.HiddenOobWalk)throw Error('本編画面から実行してください。');window.HiddenOobWalk.start();input.blur();return '自動歩行を開始しました。';}
 if(verb==='help'){return 'auto explore：全床 ／ auto exit：出口 ／ auto stroll：散歩 ／ stop：停止 ／ speed 250：間隔ms（1〜60000の整数・小さいほど速い） ／ wall：壁抜け切替 ／ panel：操作パネル ／ zap：杖を構える';}
 if(verb==='auto'&&['explore','exit','stroll'].includes(arg)){if(!get(start)||!get(mode))throw Error('この画面では自動歩行を利用できません。');get(stop)?.click();get(mode).value=arg;get(start).click();return '自動歩行：'+get(mode).selectedOptions[0].textContent;}
 if(verb==='zap'&&!arg){if(!wandAPI()?.state().available)throw Error('この空間ではまだ杖を使えません。');if(!wandAPI().begin())return '床の / を拾ってから zap を入力してください。';input.blur();if(window.ExplorationHost?.focus)window.ExplorationHost.focus();else document.getElementById('map')?.focus();return '杖：1〜4で選択 → 矢印で方向 → Enterで発射（Escで取消）';}
 if(verb==='stop'&&!arg){get(stop)?.click();return '自動歩行を停止しました。';}
 if(verb==='speed'){if(!/^\d+$/.test(arg||'')||!Number.isSafeInteger(Number(arg))||Number(arg)<1||Number(arg)>60000)throw Error('speed 125 のように、1〜60000 ms の整数を指定してください。');const value=String(Number(arg));selectInterval(get(speed),value);selectInterval(speedSelect,value);get(speed).dispatchEvent(new Event('change',{bubbles:true}));return '歩行間隔：'+value+' ms / 歩';}
 if(verb==='wall'&&!arg){get(stop)?.click();if(window.ExplorationHost){if(!window.ExplorationHost.wallPass())throw Error('この空間は壁抜け操作に対応していません。');}else if(get('wallPass'))get('wallPass').click();else throw Error('この画面は壁抜け操作に対応していません。');return '壁抜け切替を実行しました。現在の状態は迷路の案内を確認してください。';}
 if(verb==='panel'&&!arg){selectInterval(speedSelect,get(speed)?.value||'250');floating.hidden=false;return '操作パネルを表示しました。';}
 throw Error('不明なコマンドです。help で一覧を表示します。');
}
function run(text){try{const message=command(text);if(text.trim().toLowerCase()==='panel'){uiEntries.push({turn:Number(turns.textContent.match(/\d+/)?.[0]||0),text:message});if(uiEntries.length>100)uiEntries.shift();reply.textContent='';renderHistory();}else reply.textContent=message;}catch(e){reply.textContent=e.message;}}
form.onsubmit=e=>{e.preventDefault();run(input.value);};
// Keep game shortcuts from consuming typed command text, including spaces and dots.
form.addEventListener('keydown',e=>e.stopPropagation());
const floating=document.createElement('section');floating.className='maze-floating-controls';floating.hidden=true;floating.setAttribute('aria-label','移動できる操作パネル');
const handle=document.createElement('div');handle.className='maze-drag-handle';handle.textContent='操作パネル · ドラッグで移動';handle.tabIndex=0;handle.setAttribute('aria-label','操作パネルの位置。矢印キーでも移動');
const close=document.createElement('button');close.textContent='閉じる';close.onclick=()=>{floating.hidden=true;opener.focus();};
floating.append(handle,close);
for(const [label,cmd] of [['全床','auto explore'],['出口','auto exit'],['散歩','auto stroll'],['停止','stop'],['壁抜け切替','wall']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>run(cmd);floating.append(b);}
const speedSelect=document.createElement('select');speedSelect.setAttribute('aria-label','歩行速度');for(const n of ['700','250','80','40','20','10']){const o=document.createElement('option');o.value=n;o.textContent=n+' ms';speedSelect.append(o);}speedSelect.value='250';speedSelect.onchange=()=>run('speed '+speedSelect.value);floating.append(speedSelect);document.body.append(floating);
const opener=document.createElement('button');opener.type='button';opener.textContent='操作パネルを開く';opener.onclick=()=>run('panel');form.append(opener);
const logColumn=document.createElement('div');logColumn.className='console-log-column';
const infoColumn=document.createElement('aside');infoColumn.className='console-info-column';infoColumn.setAttribute('aria-label','探索の現在情報');
logColumn.append(title,form,reply,toggle,history,note);
const infoTitle=document.createElement('h2');infoTitle.textContent='現在の状態';
const turns=document.createElement('p');turns.textContent='経過ターン：—';
state.className='console-pet-status';state.textContent='犬・猫：次のターンで状態を表示';
const metrics=document.createElement('div');metrics.className='console-metrics';
infoColumn.append(infoTitle,turns,state,metrics);panel.append(logColumn,infoColumn);
// Move the live progress nodes rather than duplicating their changing text.
const progressTitle=document.createElement('h3');progressTitle.textContent='探索の進捗';floating.append(progressTitle);
for(const id of ['autoWalkProgress','autoWalkStatus']){const node=document.getElementById(id);if(node)floating.append(node);}
if(!document.getElementById('autoWalkProgress')){const node=document.getElementById('autoStatus');if(node)floating.append(node);}

const topControls=document.getElementById('autoWalkControls');if(topControls){const help=topControls.querySelector('details');if(help)floating.append(help);topControls.hidden=true;}
let uiEntries=[];
let metricData=window.MazeConsoleStatus,animalEntries=[],validationToken=null,validationEntry=null;
const originalStats=document.querySelector('#steps')?.closest('.stats');if(originalStats)originalStats.hidden=true;
function renderHistory(){const wandEntries=wandAPI()?.state().events||[];const entries=[...animalEntries,...uiEntries,...wandEntries].sort((a,b)=>(Number(a.turn)||0)-(Number(b.turn)||0));if(validationEntry)entries.unshift(validationEntry);const follow=history.scrollHeight-history.scrollTop-history.clientHeight<32;history.replaceChildren(...entries.slice(-100).map(entry=>{const li=document.createElement('li');li.textContent=`${entry.turn}：${entry.text.replace(/猫 c/g,"猫 f")}`;return li;}));if(follow)history.scrollTop=history.scrollHeight;}
function showMetrics(){const main=!window.ExplorationHost||window.ExplorationHost.mode()==='main',raw=window.ExplorationHost?.consoleStatus?.()||window.QuarterExplorationAdapter?.consoleStatus?.()||window.BiaxialExplorationAdapter?.consoleStatus?.()||window.KleinExplorationAdapter?.consoleStatus?.()||window.BranchExplorationAdapter?.consoleStatus?.()||window.TripleExplorationAdapter?.consoleStatus?.()||window.CrossingExplorationAdapter?.consoleStatus?.()||window.SkewExplorationAdapter?.consoleStatus?.()||window.EnclosureExplorationAdapter?.consoleStatus?.()||(main?metricData:null),data=raw?.actions!==undefined?MazeConsoleMetrics.summarize(raw):raw;const token=raw?.world||raw?.token;if(token&&token!==validationToken){validationToken=token;uiEntries=[];animalEntries=[];const report=raw.world?MazeConsoleMetrics.connectionReport(raw.world):raw.validation;validationEntry=report?{turn:'生成時',text:'接続検証：'+report}:null;state.textContent='犬・猫：次のターンで状態を表示';}else if(!token){validationToken=null;validationEntry=null;}if(data)turns.textContent='経過ターン：'+(data.turn??String(data.steps).split('/')[1]?.trim()??'—');metrics.replaceChildren();for(const text of data?[`${data.stepLabel||"歩数／行動"}：${data.steps}`,`${data.label}：${data.discovery}`]:['歩数／行動：—','通路発見率：—']){const line=document.createElement('p');line.textContent=text;metrics.append(line);}renderHistory();}
function updateMetrics(d){if(!d)return;metricData=d;showMetrics();}
window.addEventListener('maze-status-update',e=>updateMetrics(e.detail));
window.addEventListener('exploration-selected',()=>{animalEntries=[];uiEntries=[];turns.textContent='経過ターン：—';state.textContent='犬・猫：次のターンで状態を表示';showMetrics();});
updateMetrics(metricData);
window.addEventListener('exploration-change',showMetrics);
window.addEventListener('maze-auto-notice',e=>{const d=e.detail;if(!d||typeof d.text!=='string')return;showMetrics();uiEntries.push({turn:Number.isFinite(d.turn)?d.turn:0,text:d.text});if(uiEntries.length>100)uiEntries.shift();renderHistory();});
for(const frame of document.querySelectorAll('.explorer iframe'))frame.addEventListener('load',()=>{frame.contentWindow?.addEventListener('exploration-change',()=>queueMicrotask(()=>{if(!frame.closest('[hidden]'))showMetrics();}));showMetrics();});
const journeyReadout=document.createElement('p');journeyReadout.className='console-journey';infoColumn.append(journeyReadout);
const journeyNode=document.getElementById('journeyInfo');if(journeyNode)journeyNode.classList.add('console-original-journey');
function syncJourney(){
 const shared=document.getElementById('sharedCourseEnabled')?.checked;
 const frame=[...document.querySelectorAll('.explorer iframe')].find(f=>!f.closest('[hidden]')&&f.getAttribute('src'));
 const doc=frame?.contentDocument||document;
 const node=shared?document.getElementById('sharedCourseStatus'):frame?(doc.getElementById('journeyStatus')||doc.getElementById('journeyInfo')):journeyNode||document.getElementById('journeyStatus');
 const text=node?.textContent||'';journeyReadout.textContent=text?text.split(' ／ 次は')[0]:'踏破済み迷路数：—';
}
const journeyObserver=new MutationObserver(syncJourney);
for(const id of ['journeyInfo','sharedCourseStatus','journeyStatus']){const node=document.getElementById(id);if(node)journeyObserver.observe(node,{childList:true,subtree:true,characterData:true});}
window.addEventListener('exploration-selected',syncJourney);window.addEventListener('maze-wildlife-update',syncJourney);
for(const frame of document.querySelectorAll('.explorer iframe'))frame.addEventListener('load',()=>{for(const id of ['journeyStatus','journeyInfo']){const node=frame.contentDocument?.getElementById(id);if(node){journeyObserver.observe(node,{childList:true,subtree:true,characterData:true});}}syncJourney();});
syncJourney();
// Main-map tools retain their original document and IDs so editing/export handlers keep working.
const mapPanel=document.createElement('section');mapPanel.className='maze-floating-controls maze-map-panel';mapPanel.hidden=true;mapPanel.setAttribute('aria-label','地図パネル');
const mapHandle=document.createElement('div');mapHandle.className='maze-drag-handle';mapHandle.textContent='地図パネル · ドラッグで移動';mapHandle.tabIndex=0;
const mapClose=document.createElement('button');mapClose.textContent='閉じる';mapClose.onclick=()=>{mapPanel.hidden=true;mapOpen.focus();};mapPanel.append(mapHandle,mapClose);
const mapTools=document.createElement('div');mapPanel.append(mapTools);
const exportTools=document.getElementById('exportMapPng')?.closest('details');if(exportTools)mapTools.append(exportTools);
for(const id of ['trueMapExport','mapArchive','warpNotes']){const node=document.getElementById(id);if(node&&!mapTools.contains(node))mapTools.append(node);}
const mapHint=document.createElement('p');mapPanel.append(mapHint);
document.body.append(mapPanel);
const mapOpen=document.createElement('button');mapOpen.type='button';mapOpen.textContent='地図パネルを開く';form.append(mapOpen);
function mapAvailability(){const main=!window.ExplorationHost||window.ExplorationHost.mode()==='main';mapTools.hidden=!main;mapHint.textContent=main?'地図帳・転移履歴は、対応する迷路で利用できます。':'この空間の地図操作は、各迷路の操作欄を利用してください。';}
mapOpen.onclick=()=>{mapAvailability();mapPanel.hidden=false;window.dispatchEvent(new Event('maze-map-panel-open'));};window.addEventListener('exploration-selected',mapAvailability);
function mapPlace(x,y){mapPanel.style.left=Math.max(0,Math.min(innerWidth-mapPanel.offsetWidth,x))+'px';mapPanel.style.top=Math.max(0,Math.min(innerHeight-mapPanel.offsetHeight,y))+'px';mapPanel.style.right='auto';mapPanel.style.bottom='auto';}
let mapDrag=null;mapHandle.onpointerdown=e=>{const r=mapPanel.getBoundingClientRect();mapDrag={x:e.clientX-r.x,y:e.clientY-r.y};mapHandle.setPointerCapture(e.pointerId);};mapHandle.onpointermove=e=>{if(mapDrag)mapPlace(e.clientX-mapDrag.x,e.clientY-mapDrag.y);};mapHandle.onpointerup=mapHandle.onpointercancel=()=>{mapDrag=null;};
mapHandle.onkeydown=e=>{const d={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[e.key];if(d){e.preventDefault();e.stopPropagation();const r=mapPanel.getBoundingClientRect();mapPlace(r.x+d[0],r.y+d[1]);}};
window.addEventListener('resize',()=>{if(!mapPanel.hidden){const r=mapPanel.getBoundingClientRect();mapPlace(r.x,r.y);}});


function place(x,y){floating.style.left=Math.max(0,Math.min(innerWidth-floating.offsetWidth,x))+'px';floating.style.top=Math.max(0,Math.min(innerHeight-floating.offsetHeight,y))+'px';floating.style.right='auto';floating.style.bottom='auto';}
let drag=null;handle.onpointerdown=e=>{const r=floating.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};handle.setPointerCapture(e.pointerId);};handle.onpointermove=e=>{if(drag)place(e.clientX-drag.x,e.clientY-drag.y);};handle.onpointerup=handle.onpointercancel=()=>{drag=null;};
handle.onkeydown=e=>{const d={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[e.key];if(d){e.preventDefault();e.stopPropagation();const r=floating.getBoundingClientRect();place(r.left+d[0],r.top+d[1]);}};
window.addEventListener('resize',()=>{if(!floating.hidden){const r=floating.getBoundingClientRect();place(r.left,r.top);}});

// Main bird-course wands use the existing console and draggable controls.
const wandButton=document.createElement('button');wandButton.type='button';wandButton.textContent='杖 ⇧Z';wandButton.onclick=()=>wandAPI()?.toggle();form.append(wandButton);
const wandState=document.createElement('p');wandState.style.fontSize='12px';infoColumn.append(wandState);
const wandControls=document.createElement('details'),wandTitle=document.createElement('summary');wandTitle.textContent='杖の操作';wandControls.append(wandTitle);
const wandHelp=document.createElement('p');wandHelp.textContent='Shift+Z または zap で構える・1〜4で杖選択・矢印で方向・Enterで発射・Escで取消。構え中だけキーが切り替わります。';wandControls.append(wandHelp);
for(const [label,run]of [['金縛り',()=>wandAPI()?.select(0)],['吹き飛ばし',()=>wandAPI()?.select(1)],['場所替え',()=>wandAPI()?.select(2)],['引き寄せ',()=>wandAPI()?.select(3)],...['↑','→','↓','←'].map((v,d)=>[v,()=>wandAPI()?.aim(d)]),['発射',()=>wandAPI()?.fire()],['取消',()=>wandAPI()?.cancel()]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=run;wandControls.append(button);}
floating.append(wandControls);
function syncWandControls(){const state=wandAPI()?.state(),active=state?.available;wandButton.hidden=wandState.hidden=wandControls.hidden=!active;wandState.textContent=active?state.text:'';wandButton.setAttribute('aria-pressed',String(!!state?.armed));}
window.addEventListener('maze-wildlife-update',syncWandControls);window.addEventListener('maze-wand-update',()=>{syncWandControls();renderHistory();});window.addEventListener('exploration-change',syncWandControls);window.addEventListener('exploration-selected',syncWandControls);syncWandControls();
let source=null,seed=null,lastTurn=-1;
window.addEventListener('maze-wildlife-update',e=>{
 const d=e.detail;if(!d)return;
 if(d.source!==window){const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===d.source);if(!frame||frame.closest('[hidden]'))return;}
 if(source===d.source&&seed===d.seed&&lastTurn===d.turn)return;
 source=d.source;seed=d.seed;lastTurn=d.turn;
 turns.textContent=`経過ターン：${d.turn}`;state.textContent=d.status;state.title=state.textContent;
 animalEntries=d.entries.slice();renderHistory();
});

// Compact play surface: map controls, map, then log; auxiliary content opens on demand.
const logActions=document.createElement('div');logActions.className='console-log-actions';logActions.append(opener,mapOpen,toggle);title.after(logActions);
infoColumn.append(form,reply);form.classList.add('console-bottom-command');
const auxOpen=document.createElement('button');auxOpen.type='button';auxOpen.textContent='その他の機能';logActions.append(auxOpen);
const logHeader=document.createElement('div');logHeader.className='console-log-header';
const menu=document.createElement('details');menu.className='console-tools-menu';
const menuLabel=document.createElement('summary');menuLabel.textContent='メニュー';menu.append(menuLabel,logActions);
title.before(logHeader);logHeader.append(title,menu);
logActions.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});
menu.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();menu.open=false;menuLabel.focus();}});
const stages=new WeakMap();let activeAux=null;
auxOpen.onclick=()=>{activeAux?.showModal();};
function compactPlay(){
 const doc=panel.ownerDocument,map=panel.previousElementSibling;
 if(!map||map.tagName!=='CANVAS')return;
 let record=stages.get(map);
 if(!record){
  const parent=map.parentElement,bar=doc.getElementById('mapDisplayControls')||parent.querySelector('.mapbar');
  const rest=[];for(let el=panel.nextElementSibling;el;el=el.nextElementSibling)if(!['SCRIPT','STYLE','DIALOG'].includes(el.tagName))rest.push(el);
  const aux=doc.createElement('dialog');aux.className='console-aux-dialog';aux.setAttribute('aria-label','その他の機能');
  const close=doc.createElement('button');close.textContent='閉じて探索へ';close.onclick=()=>{aux.close();map.focus();};aux.append(close,...rest);doc.body.append(aux);
  const stage=doc.createElement('section');stage.className='console-play-stage';map.before(stage);if(bar)stage.append(bar);stage.append(map,panel);
  record={stage,aux};stages.set(map,record);
 }
 // World toggles may reuse a stage whose toolbar was moved to another canvas.
 const bar=doc.getElementById('mapDisplayControls');
 if(bar&&bar.parentElement!==record.stage)record.stage.prepend(bar);
 activeAux=record.aux;
 doc.documentElement.classList.add('console-compact-document');
 for(let node=record.stage.parentElement;node&&node!==doc.body;node=node.parentElement)node.classList.add('console-stage-host');
 doc.documentElement.classList.toggle('console-embedded-document',doc!==document);
 if(doc!==document){const frame=[...document.querySelectorAll('.explorer iframe')].find(f=>f.contentDocument===doc);if(frame)frame.classList.add('console-play-frame');}
 record.stage.style.height=Math.max(440,(doc===document?innerHeight-90:innerHeight-100))+'px';
}
function compactAfterPosition(){positionLog();compactPlay();}
window.MazeConsoleLayout={refresh:compactAfterPosition};
compactPlay();window.addEventListener('exploration-selected',()=>queueMicrotask(compactAfterPosition));
for(const frame of document.querySelectorAll('.explorer iframe'))frame.addEventListener('load',()=>queueMicrotask(compactAfterPosition));
window.addEventListener('resize',compactAfterPosition);
})();
