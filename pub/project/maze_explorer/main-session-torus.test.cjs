const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
function loop(w,a,b){const [tx,ty]=M.deckVector(w,a,b),q=[[w.start,0,0,[]]],seen=new Set();for(const [id,x,y,p]of q){if(id===w.start&&x===tx&&y===ty)return p;const k=x+','+y;if(seen.has(k))continue;seen.add(k);for(const [d,[dx,dy]]of Object.entries(M.DIRS)){const e=M.transition(w,{world_position:id},d);if(e&&Math.abs(x+dx)<=40&&Math.abs(y+dy)<=40)q.push([e.to,x+dx,y+dy,[...p,d]]);}}throw Error('loop not found');}
let cases=0,roundtrips=0,recognized=0;
function restore(g){const encoded=S.encode(g,'torus'),r=S.decode(encoded).game;assert.deepEqual(r.player,g.player);assert.deepEqual(r.cognition,g.cognition);assert.equal(S.encode(r,'torus'),encoded);roundtrips++;return r;}
for(const [shiftX,shiftY]of [[0,0],[2,0],[0,-2],[2,2],[2,-2]])for(const learningLaps of [3,5])for(const loopLearning of [true,false]){
 let g=S.attach(J.start({width:8,height:8,topology:'torus',algorithm:'dfs',seed:'torus-save',shiftX,shiftY,loopLearning,learningLaps}));
 g.journey={completed:2,steps:120};const path=loop(g.world,1,0);
 for(let lap=0;lap<learningLaps;lap++){
  for(const d of path){if(g.won)S.act(g,'continue');assert(S.act(g,'move',d));}
  g=restore(g);
 }
 if(loopLearning){assert(g.cognition.known_loops.has('x'));recognized++;}else assert.equal(g.cognition.known_loops.size,0);
 const vertical=loop(g.world,0,1);
 for(const d of vertical){if(g.won)S.act(g,'continue');assert(S.act(g,'move',d));}restore(g);cases++;
}
for(const [shiftX,shiftY]of [[0,0],[2,0],[2,-2]]){
 let g=S.attach(J.start({width:8,height:8,topology:'torus',algorithm:'rooms',seed:'optical-save',roomCount:2,loops:30,shiftX,shiftY,loopLearning:true,learningLaps:3,selfVision:true}));
 g=restore(g);for(let i=0;i<30;i++){if(g.won)S.act(g,'continue');const dirs=Object.keys(M.DIRS).filter(d=>M.transition(g.world,g.player,d));S.act(g,'move',dirs[i%dirs.length]);}restore(g);cases++;
}
console.log(`PASS: ${cases} torus conditions, ${roundtrips} exact replays, ${recognized} learned horizontal periods; 3/5/off, single/dual shifts, later vertical learning and optical observations.`);
