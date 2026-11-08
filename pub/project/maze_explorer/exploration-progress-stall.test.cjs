const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{
for(const kind of ['loop','warp','map','stuck']){
 const els={},token={},notices=[];let callback,steps=0,id=0;
 const el=n=>els[n]??={value:n==='autoWalkMode'?'explore':'10',addEventListener(){}};
 const left=()=>kind==='stuck'?3:Math.max(0,3-Math.floor(steps/2));
 const adapter={progress:()=>({token,steps,exit:id===1}),autoPosition:()=>id,autoTargets:()=>new Set(kind==='map'?[0,2]:[0]),autoDynamic:()=>true,autoStallLimit:()=>3,autoRequireLoops:()=>kind==='loop',autoLoopPending:()=>kind==='loop'?left():0,autoWarpPending:()=>['warp','stuck'].includes(kind)?left():0,autoMapPending:()=>kind==='map'?left():0,
 autoExplore:()=>kind==='loop'?null:left()>0?[0]:kind==='map'&&id!==2?[2]:null,autoLoop:()=>left()>0?Array(left()*2).fill(0):null,autoPlan:()=>[1],autoMove:d=>{id=d;steps++;}};
 const window={ExplorationHost:{mode:()=> 'main',autoAdvance:async()=>false},MainExplorationAdapter:adapter,addEventListener(){},dispatchEvent:e=>notices.push(e.detail)};
 vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-autowalk.js','utf8'),{CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},window,document:{getElementById:el,addEventListener(){}},setTimeout:f=>(callback=f,1),clearTimeout:()=>callback=null});
 el('autoWalkStart').onclick();for(let i=0;i<20&&callback&&id!==1;i++){const f=callback;callback=null;await f();}
 assert.match(notices[0].text,/自動歩行を開始/);assert.equal(notices[0].turn,0);
 if(kind==='stuck'){assert.equal(notices.length,2);assert.equal(notices[1].turn,3);assert.match(notices[1].text,/探索が進まない/);assert.equal(steps,3);assert.match(el('autoWalkStatus').textContent,/探索が進まない/);}
 else {assert.equal(notices.length,1,'walking ticks do not flood logs');assert.equal(id,1,kind+' must finish despite revisiting floors');assert.equal(steps,kind==='map'?8:7);}
}
console.log('Dynamic exploration: loop learning and confirmed warp/map progress avoid false stalls; no-progress stop remains.');
})().catch(e=>{console.error(e);process.exitCode=1;});
