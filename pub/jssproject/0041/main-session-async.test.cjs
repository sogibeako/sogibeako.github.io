const assert=require('node:assert/strict'),{performance}=require('node:perf_hooks'),M=require('./core.js'),S=require('./main-session.js'),J=require('./main-journey.js');
(async()=>{
 const g=S.attach(J.start({width:25,height:19,algorithm:'rooms',seed:'long-bird-replay',birdMode:true,birdCount:2,separateMaps:true}));
 const rng=M.random('long-walk');
 for(let i=0;i<2000;i++){
  if(g.won)S.act(g,'continue');
  const dirs=Object.keys(M.DIRS).filter(d=>M.ruleTransition(g.world,g.player,d));
  S.act(g,i%3===0?'wait':'move',...(i%3===0?[]:[dirs[Math.floor(rng()*dirs.length)]]));
  if(i%100===0){S.act(g,'mark');S.act(g,'landmark');S.act(g,'recorded');if(g.cognition.archives.length)S.act(g,'note',g.cognition.archives.length-1,'長い探索の記録');}
 }
 assert(g.cognition.archives.length>0);const text=S.encode(g,'birds'),start=performance.now();
 const sync=S.decode(text),syncMs=performance.now()-start;let yields=0,last=-1;const before=performance.now();
 const restored=await S.decodeAsync(text,{onProgress:p=>{assert(p.done>=last);last=p.done;},yieldTask:async()=>{yields++;}});
 assert(yields>20);assert.equal(S.encode(restored.game,'birds'),S.encode(sync.game,'birds'));
 for(let i=0;i<30;i++){S.act(g,'wait');S.act(restored.game,'wait');assert.equal(S.encode(restored.game,'birds'),S.encode(g,'birds'));}
 let cancelled=false;await assert.rejects(S.decodeAsync(text,{cancelled:()=>cancelled,onProgress:()=>{cancelled=true;}}),/中止/);
 await assert.rejects(S.decodeAsync('invalid'));
 const damaged=JSON.parse(text);damaged.check='bad';await assert.rejects(S.decodeAsync(JSON.stringify(damaged)),/再現/);
 console.log(`PASS: bird archive replay (${g.cognition.archives.length} charts), sync ${syncMs.toFixed(0)}ms; chunked equivalent with ${yields} yields; continued RNG, cancellation, invalid input and checksum rejection.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
