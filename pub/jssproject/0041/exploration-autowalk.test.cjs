const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{
const els={},events={},winEvents={};let callback=null,moves=0,token={},steps=0,advanceCount=0,fail=false,release=null,delayed=false;
for(const id of ['autoWalkProgress','autoWalkMode','autoWalkStart','autoWalkStop','autoWalkSpeed','autoWalkStatus','skewPilotFrame','enclosureFrame'])els[id]={value:'250',addEventListener(){}};
const adapter={autoPlan:()=>[0,1,2],autoMove(){moves++;steps++;},progress:()=>({token,steps,exit:steps===3})};
const host={mode:()=> 'main',async autoAdvance(allowed){if(delayed)await new Promise(r=>release=r);if(!allowed()||fail)return false;advanceCount++;token={};steps=0;winEvents['exploration-selected']();return true;}};
const document={getElementById:id=>els[id],addEventListener:(n,f)=>events[n]=f};
vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-autowalk.js','utf8'),{document,window:{ExplorationHost:host,MainExplorationAdapter:adapter,addEventListener:(n,f)=>winEvents[n]=f},setTimeout:f=>(callback=f,1),clearTimeout:()=>callback=null});
const key=(extra={})=>({type:'keydown',key:'G',shiftKey:true,target:{closest:()=>false},preventDefault(){},...extra});
events.keydown(key());assert.equal(moves,1);events.keydown(key({repeat:true}));assert.equal(moves,1);callback();callback();assert.equal(steps,3);await callback();assert.equal(advanceCount,1);callback();assert.equal(steps,1);events.keydown(key());assert.equal(callback,null);
events.keydown(key({target:{closest:()=>true}}));assert.equal(callback,null);
steps=0;els.autoWalkStart.onclick();events.keydown(key({key:'Escape',shiftKey:false}));assert.equal(callback,null);
steps=0;els.autoWalkStart.onclick();token={};callback();assert.equal(callback,null);assert.match(els.autoWalkStatus.textContent,/変更/);
steps=3;els.autoWalkStart.onclick();fail=true;await callback();assert.equal(callback,null);assert.match(els.autoWalkStatus.textContent,/進めなかった/);fail=false;
steps=3;delayed=true;els.autoWalkStart.onclick();const pending=callback();els.autoWalkStop.onclick();release();await pending;assert.equal(advanceCount,1);assert.equal(callback,null);delayed=false;
steps=0;els.autoWalkStart.onclick();winEvents['exploration-selected']();assert.equal(callback,null);
steps=0;els.autoWalkStart.onclick();document.hidden=true;events.visibilitychange();assert.equal(callback,null);
document.hidden=false;token={};steps=0;let id=0,continued=0;els.autoWalkMode.value='explore';
adapter.autoPosition=()=>id;
adapter.progress=()=>({token,steps,exit:id===1});
adapter.autoMove=d=>{id=d;steps++;};
adapter.autoContinue=()=>continued++;
adapter.autoExplore=seen=>{for(const dest of [0,1,2,3])if(!seen.has(dest))return [dest];return null;};
adapter.autoPlan=()=>id===1?[]:[1];
els.autoWalkStart.onclick();assert.equal(id,1);const advancesBefore=advanceCount;callback();assert.equal(id,2);assert.equal(continued,1);assert.equal(advanceCount,advancesBefore);
els.autoWalkStop.onclick();els.autoWalkStart.onclick();assert.equal(id,3);callback();assert.equal(id,1);assert.equal(advanceCount,advancesBefore);assert.match(els.autoWalkStatus.textContent,/完了条件/);
els.autoWalkMode.onchange();assert.equal(callback,null);
// Retain initial target set: a one-way transition can strand an unvisited floor.
token={};steps=0;id=0;adapter.autoTargets=()=>new Set([0,1,9]);
adapter.autoExplore=seen=>seen.has(1)?null:[1];
els.autoWalkStart.onclick();callback();assert.equal(callback,null);assert.match(els.autoWalkStatus.textContent,/未訪問の床が 1/);assert.equal(advanceCount,advancesBefore);
token={};steps=0;id=0;els.autoWalkMode.value='exit';let plans=0,notes=0;
adapter.autoDynamic=()=>true;adapter.autoStallLimit=()=>300;adapter.autoPrepare=()=>notes++;
adapter.autoPlan=()=>{plans++;return [id+10];};adapter.progress=()=>({token,steps,exit:false});
els.autoWalkStart.onclick();assert.equal(id,10);callback();assert.equal(id,20);assert(plans>=3);assert.equal(notes,2);adapter.autoDetour=()=>[99];callback();assert.equal(id,99);assert.match(els.autoWalkStatus.textContent,/迂回中/);els.autoWalkStop.onclick();
// Select full exploration with A, switch to exit with G without toggling off.
 delete adapter.autoDetour;token={};steps=0;id=0;adapter.autoTargets=()=>new Set([0,1]);adapter.autoExplore=()=>[1];
 events.keydown(key({key:'A'}));assert.equal(els.autoWalkMode.value,'explore');assert.equal(els.autoWalkStart.disabled,true);
 events.keydown(key({key:'G'}));assert.equal(els.autoWalkMode.value,'exit');assert.equal(els.autoWalkStart.disabled,true);
 els.autoWalkSpeed.value='250';events.keydown(key({key:'+',shiftKey:false}));assert.equal(els.autoWalkSpeed.value,'80');assert.equal(els.autoWalkStart.disabled,true);
 for(let n=0;n<10;n++)events.keydown(key({key:'+'}));assert.equal(els.autoWalkSpeed.value,'10');
 for(let n=0;n<10;n++)events.keydown(key({key:'-',shiftKey:false}));assert.equal(els.autoWalkSpeed.value,'700');
 events.keydown(key({key:'+',ctrlKey:true}));assert.equal(els.autoWalkSpeed.value,'700');
 events.keydown(key({key:'A',isComposing:true}));assert.equal(els.autoWalkMode.value,'exit');
 // Never descend with unfinished evidence, even if the planner returns no route.
 adapter.autoDynamic=()=>false;adapter.autoExplore=()=>null;adapter.autoLoop=()=>null;adapter.autoMap=()=>null;adapter.autoTargets=()=>new Set([0]);adapter.progress=()=>({token,steps,exit:true});adapter.autoPosition=()=>0;adapter.autoPlan=()=>[];
 for(const [field,label]of [['autoLoopPending','未理解'],['autoWarpPending','未確認'],['autoMapPending','未照合']]){
  token={};steps=0;els.autoWalkMode.value='explore';for(const k of ['autoLoopPending','autoWarpPending','autoMapPending'])adapter[k]=()=>k===field?1:0;
  const before=advanceCount;els.autoWalkStart.onclick();if(field==='autoWarpPending'){assert.equal(callback,null);assert.match(els.autoWalkStatus.textContent,new RegExp(label));}else{assert.equal(typeof callback,'function');assert.match(els.autoWalkStatus.textContent,/全床・全ワープ/);}assert.equal(advanceCount,before);assert.match(els.autoWalkProgress.textContent,/残り 1/);
 }
 token={};for(const k of ['autoLoopPending','autoWarpPending','autoMapPending'])adapter[k]=()=>0;els.autoWalkStart.onclick();assert.equal(typeof callback,'function');assert.match(els.autoWalkProgress.textContent,/ループ理解：完了/);els.autoWalkStop.onclick();assert.match(els.autoWalkProgress.textContent,/ループ理解：完了/);
 // Completed floors and warps must use the exit planner even when learning cannot find a route.
 token={};steps=0;id=0;let exitPlans=0;
 adapter.autoPosition=()=>id;adapter.autoTargets=()=>new Set([0,1]);adapter.progress=()=>({token,steps,exit:id===2});
 adapter.autoExplore=()=>[1];adapter.autoLoop=()=>{throw Error('No loop route');};adapter.autoMap=()=>{throw Error('No map route');};
 adapter.autoLoopPending=()=>2;adapter.autoMapPending=()=>1;adapter.autoWarpPending=()=>0;
 adapter.autoPlan=()=>{exitPlans++;return [2];};
 els.autoWalkStart.onclick();assert.equal(id,1);callback();assert.equal(id,2);assert.equal(exitPlans,1);assert.match(els.autoWalkStatus.textContent,/全床・全ワープ/);els.autoWalkStop.onclick();
 console.log('Complete floor/warp coverage switches to the exit planner while retaining unfinished learning counters.');
 // Klein explicitly requires learning before the completed-floor exit shortcut.
 token={};steps=0;id=0;adapter.autoRequireLoops=()=>true;adapter.autoTargets=()=>new Set([0]);adapter.autoExplore=()=>null;
 adapter.autoLoopPending=()=>steps<3?1:0;adapter.autoLoop=()=>steps<3?[0]:null;adapter.autoMapPending=()=>0;adapter.autoMap=()=>null;
 els.autoWalkStart.onclick();assert.equal(steps,1);assert.equal(id,0);callback();callback();assert.equal(steps,3);assert.equal(id,0);callback();assert.equal(id,2);assert.equal(typeof callback,'function');els.autoWalkStop.onclick();
 console.log('Klein required learning completes physical laps before the exit shortcut.');
 console.log('Mode shortcuts, speed steps and limits, modifiers, typing, repeats and automatic map transitions passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
