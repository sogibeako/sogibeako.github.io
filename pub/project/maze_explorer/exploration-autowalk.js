/* Timed playback through each runtime's ordinary movement entry point. */
(()=>{'use strict';const $=id=>document.getElementById(id);let run=null,timer=null;
const adapter=()=>{const mode=window.ExplorationHost.mode();return mode==='main'?window.MainExplorationAdapter:$(mode==='skew'?'skewPilotFrame':'enclosureFrame').contentWindow?.[mode==='skew'?'SkewExplorationAdapter':'EnclosureExplorationAdapter'];};
function stop(message){clearTimeout(timer);timer=null;run=null;$('autoWalkStart').disabled=false;$('autoWalkStop').disabled=true;if(message)$('autoWalkStatus').textContent=message;}
function tick(){if(!run)return;try{const a=adapter(),p=a?.progress();if(a!==run.adapter||p.token!==run.token||p.steps!==run.steps){stop('探索が変更されたため停止しました。');return;}if(p.exit||run.index===run.path.length){stop(p.exit?'出口に到着しました！':'経路の終わりで停止しました。');return;}a.autoMove(run.path[run.index++]);const after=a.progress();if(after.token!==run.token||after.steps!==run.steps+1){stop('移動できなかったため停止しました。');return;}run.steps=after.steps;$('autoWalkStatus').textContent='出口へ自動歩行中：残り '+(run.path.length-run.index)+' 歩';if(after.exit){stop('出口に到着しました！');return;}timer=setTimeout(tick,Number($('autoWalkSpeed').value));}catch(e){stop(e.message);}}
$('autoWalkStart').onclick=()=>{stop();try{const a=adapter();if(!a?.autoPlan)throw Error('空間の読込後に開始してください。');const p=a.progress(),path=a.autoPlan();if(p.exit||!path.length){stop('出口に到着しています。');return;}run={adapter:a,token:p.token,steps:p.steps,path,index:0};$('autoWalkStart').disabled=true;$('autoWalkStop').disabled=false;tick();}catch(e){stop(e.message);}};
$('autoWalkStop').onclick=()=>stop('自動歩行を停止しました。');
function manual(e){if(!run)return;if(e.type==='keydown'&&['Shift','Control','Alt','Meta'].includes(e.key))return;if(e.target?.closest?.('#autoWalkControls')){if(e.key==='Escape')stop('自動歩行を停止しました。');return;}stop('手動操作に切り替えました。');}
function bind(doc){doc.addEventListener('keydown',manual,true);doc.addEventListener('pointerdown',manual,true);}
bind(document);for(const id of ['skewPilotFrame','enclosureFrame'])$(id).addEventListener('load',()=>{stop();bind($(id).contentDocument);});
window.addEventListener('exploration-selected',()=>stop());document.addEventListener('visibilitychange',()=>{if(document.hidden&&run)stop('画面を離れたため停止しました。');});
})();
