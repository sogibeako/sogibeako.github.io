const a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),T=require('./maze-stroll.js');
for(const mode of ['exit','explore','stroll'])for(const countWaits of [false,true]){
 let timer=null,steps=0,id=0,frozen=0,waits=0,plans=0;const token={},moves=[],els={};
 for(const n of ['autoWalkStart','autoWalkStop','autoWalkMode','autoWalkSpeed','autoWalkStatus','autoWalkProgress'])els[n]={value:n==='autoWalkMode'?mode:'10',addEventListener(){}};
 const adapter={progress:()=>({token,steps,exit:id===2}),autoPosition:()=>id,autoTargets:()=>new Set([0,1,2]),autoWarpPending:()=>0,autoExplore:seen=>seen.has(2)?null:[id+1],autoPlan:()=>{plans++;return id<2?[id+1]:[];},autoFrozen:()=>frozen,autoWait(){a(frozen>0);frozen--;waits++;if(countWaits)steps++;},autoMove(d){a.equal(frozen,0);moves.push(d);id=d;steps++;if(d===1)frozen=5;}};
 const context={MazeStroll:T,document:{getElementById:n=>els[n],addEventListener(){}},window:{ExplorationHost:{mode:()=> 'main'},MainExplorationAdapter:adapter,addEventListener(){}},setTimeout:f=>(timer=f,1),clearTimeout:()=>timer=null};
 vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-autowalk.js','utf8'),context);els.autoWalkStart.onclick();
 for(let i=0;timer&&id!==2&&i<20;i++){const fn=timer;timer=null;fn();}
 a.equal(waits,5);a.equal(id,2);a.deepEqual(moves,[1,2]);a.equal(T.record(token).steps,0);a.equal(els.autoWalkStop.disabled,false);a(!/停止しました/.test(els.autoWalkStatus.textContent));
}
console.log('PASS: exit/explore/stroll automatically wait 5 frozen turns then resume; movement-count and action-count adapters both supported, no stroll budget consumed.');
