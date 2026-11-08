const a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
for(const resolveBeforeTick of [true,false]){
 let timer,steps=0,id=0,busy=false,relocated=false,loops=1;const token={},els={};
 for(const n of ['autoWalkStart','autoWalkStop','autoWalkMode','autoWalkSpeed','autoWalkStatus','autoWalkProgress'])els[n]={value:n==='autoWalkMode'?'explore':'250',addEventListener(){}};
 const adapter={progress:()=>({token,steps,exit:false}),autoPosition:()=>id,autoTargets:()=>new Set([0]),autoWarpPending:()=>0,autoExplore:()=>null,autoRequireLoops:()=>true,autoLoopPending:()=>loops,autoLoop:()=>id===7?[8]:[1,2],autoPlan:()=>[8],autoDynamic:()=>true,autoBusy:()=>busy,autoRelocated:()=>relocated,autoTraversed:()=>[id],autoStallLimit:()=>100,autoMove(d){if(steps===0){a.equal(d,1);id=1;busy=true;}else{a.equal(d,8,'replan after the delayed swap, not stale second loop step');id=8;}steps++;}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-autowalk.js','utf8'),{document:{getElementById:n=>els[n],addEventListener(){}},window:{ExplorationHost:{mode:()=> 'main'},MainExplorationAdapter:adapter,addEventListener(){}},setTimeout:f=>(timer=f,1),clearTimeout:()=>timer=null});
 els.autoWalkStart.onclick();if(!resolveBeforeTick){timer();a.equal(steps,1);}
 busy=false;relocated=true;id=7;timer();a.equal(id,8);a.equal(steps,2);a(!/停止/.test(els.autoWalkStatus.textContent));
}
console.log('Delayed spell relocation replans learning routes even when flight finishes before the next timer tick.');
