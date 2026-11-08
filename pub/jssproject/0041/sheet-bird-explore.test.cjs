const assert=require('node:assert/strict'),L=require('./lattice-holes.js'),H=require('./return-enclosure.js'),S=require('./connection-space.js'),F=require('./sheet-features.js'),A=require('./sheet-annotations.js'),P=require('./exploration-solver.js');
const results=[];
for(const kind of ['central','enclosure'])for(const growth of ['dfs','prim','rooms'])for(const warp of [false,true]){
 const features={birds:true,birdAcross:true,birdLeap:true,keys:true,warp},seed='bird-matrix-'+growth+'-'+warp;
 const state=kind==='central'?L.create({maze:true,periodSize:16,growth,seed,features}):H.create(seed,{growth,features});
 const targets=P.connectedTargets(state),seen=new Set([state.id]);let contacts=0,detours=0,done=false;
 for(let step=0;step<4000;step++){
  const complete=[...targets].every(id=>seen.has(id))&&P.connectedWarpPending(state).size===0;
  if(complete&&state.id===state.world.exit){done=true;break;}
  F.autoMark(state);
  const path=(complete?null:P.connectedExplore(state,seen))??P.connected(state),detour=P.connectedBirdDetour(state);
  const chosen=detour?.length?detour:path;if(detour?.length)detours++;
  assert(chosen.length,'planner returned empty route before completion');assert(S.move(state,chosen[0],true));
  A.recordWarp(state);seen.add(state.id);if(state.features.last){seen.add(state.features.last.from);if(state.features.last.kind==='teleport')contacts++;}
 }
 results.push({kind,growth,warp,done,steps:state.steps,missing:[...targets].filter(id=>!seen.has(id)).length,contacts,detours});
}
console.log(JSON.stringify(results));
assert(results.every(r=>r.done),'matrix should finish all floors/warps and return to exit');
