const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),M=require('./quarter-turn-memory.js'),A=require('./quarter-turn-auto.js');
for(const strategy of ['explore','exit']){
 let tick=null,created=0,finished=0,lastState,previousSteps=0,els={},events={};
 const ctx=new Proxy({},{get:()=>()=>{}}),defaults={mode:'quarterCCW',terrain:'maze',size:'12',seed:'continuous',render:'hybrid',autoMode:strategy,autoSpeed:'10'};
 const el=id=>els[id]??={value:defaults[id]??'',checked:id==='continuous'||id==='boundaryLinks'||strategy==='exit'&&['randomSpace','randomAlgorithm','randomSize'].includes(id),style:{},clientWidth:800,getContext:()=>ctx,focus(){},setAttribute(){}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/quarter-turn-lab.js','utf8'),{QuarterTurnMemory:M,ConnectionSpace:S,QuarterTurnMaze:{...Q,create(...args){created++;a.equal(args[3].boundaryLinks,true);lastState=Q.create(...args);return lastState;}},QuarterTurnAuto:{next(p,visited,mode){const plan=A.next(p,visited,mode);if(plan.done){a(!plan.blocked);a.equal(p.id,p.world.exit);if(mode==='explore')a.equal(visited.size,p.world.cells.reduce((x,y)=>x+y,0));finished++;previousSteps+=p.steps;}return plan;}},document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(n,f)=>events[n]=f},window:{addEventListener(){}},location:{search:''},URLSearchParams,devicePixelRatio:1,setInterval(fn,ms){a.equal(ms,10);tick=fn;return 1;},clearInterval(){tick=null;}});
 el('autoStart').onclick();for(let i=0;created<4&&tick&&i<30000;i++)tick();a.equal(created,4);a.equal(finished,3);a(tick);a.equal(el('journeyStatus').textContent,`3枚踏破 ／ 通算 ${previousSteps}歩`);a.equal(el('autoMode').value,strategy);
 el('continuous').checked=false;for(let i=0;tick&&i<10000;i++)tick();a.equal(tick,null);a.equal(created,4);a.equal(finished,4);
 el('exitNext').onclick();a.equal(tick,null);a.equal(created,5);a.match(el('journeyStatus').textContent,/4枚踏破/);
 el('autoStart').onclick();a(tick);el('autoStop').onclick();a.equal(tick,null);el('reset').onclick();a.equal(el('journeyStatus').textContent,'0枚踏破 ／ 通算 0歩');
}
console.log('Both strategies: 4 maps each, complete-floor gate, applied openings and speed retained, counters, OFF-at-next-exit, manual next, stop and reset passed.');
