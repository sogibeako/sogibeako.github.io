const a=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js'),P=require('./exploration-solver.js');
const results=[];
for(const algorithm of ['dfs','prim','rooms','wilson','kruskal','hunt','growing'])for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]]){
 let g=S.attach(J.start({topology:'torus',width:16,height:16,algorithm,shiftX,shiftY,keyDoor:true,keyCount:3,distantKey:true,seed:'full-keys-'+algorithm,loopLearning:true,learningLaps:3}));
 const targets=P.mainTargets(g,M),seen=new Set([g.player.world_position]);let phase='floors',route=[],saved=false;
 for(let step=0;step<15000;step++){
  if(g.won&&phase==='exit')break;if(g.won)S.act(g,'continue');
  if(!route.length){route=P.mainExplore(g,M,seen);if(route===null){a.equal([...targets].filter(id=>!seen.has(id)).length,0);phase='loops';route=P.mainLoop(g,M);if(route===null){phase='exit';route=P.main(g,M);}}}
  if(phase==='exit'&&g.player.world_position===g.world.exit)break;
  a(route.length,'unfinished route');a(S.act(g,'move',route.shift()));seen.add(g.player.world_position);
  if(!saved&&g.player.keys.length){const text=S.encode(g,'same');g=S.decode(text).game;a.equal(S.encode(g,'same'),text);saved=true;}
 }
 a.equal(g.player.world_position,g.world.exit);a.equal(P.mainLoopPending(g),0);a.equal(seen.size,targets.size);a(saved);results.push(g.steps);
 const next=J.next(g,'next-'+algorithm+'-'+shiftX+'-'+shiftY,'same');a(next.world.puzzle);a.equal(next.generationOptions.topology,'torus');a.equal(next.player.keys.length,0);
}
console.log('28 entrance-to-completion runs: all floors, ordered keys, save/resume, both 3-lap loops, exit and next map; steps '+Math.min(...results)+'–'+Math.max(...results));

const birdResults=[];
for(const algorithm of ['dfs','prim','rooms'])for(const [shiftX,shiftY] of [[0,0],[2,-2]]){
 const g=S.attach(J.start({topology:'torus',width:16,height:16,algorithm,shiftX,shiftY,loops:8,keyDoor:true,keyCount:2,distantKey:true,birdMode:true,birdLeap:true,birdCount:1,separateMaps:true,seed:'bird-key-'+algorithm,loopLearning:true,learningLaps:3}));
 const targets=P.mainTargets(g,M),seen=new Set([g.player.world_position]);let route=[],contacts=0,finished=false;
 for(let step=0;step<12000;step++){
  const complete=[...targets].every(id=>seen.has(id));if(complete&&!P.mainLoopPending(g)&&g.player.world_position===g.world.exit){finished=true;break;}
  if(g.won)S.act(g,'continue');P.birdNotes(g,M,S.act);
  let path;
  if(!complete){path=P.birdDetour(g,M)||P.mainExplore(g,M,seen)||P.main(g,M);}
  else {if(!route.length)route=P.mainLoop(g,M)||P.main(g,M);path=route;}
  a(path?.length);a(S.act(g,'move',path[0]));if(complete)route.shift();
  seen.add(g.player.world_position);if(g.lastTransition?.kind==='teleport'){seen.add(g.lastTransition.from);route=[];contacts++;}
 }
 birdResults.push({algorithm,shiftX,shiftY,finished,steps:g.steps,contacts,missing:[...targets].filter(id=>!seen.has(id)).length,pending:P.mainLoopPending(g)});
}
console.log(JSON.stringify(birdResults));a(birdResults.every(r=>r.finished),'bird and keys exploration should complete');
