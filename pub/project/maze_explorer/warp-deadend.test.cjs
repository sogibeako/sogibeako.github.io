const assert=require('node:assert/strict'),F=require('./sheet-features.js');
function graph(count,links,seed='trap'){const edges=new Map(),ports=Array(count).fill(0);for(const [a,b]of links){edges.set(a+':'+ports[a]++,{to:b});edges.set(b+':'+ports[b]++,{to:a});}return {cells:new Uint8Array(count).fill(1),edges,domain:new Set(Array.from({length:count},(_,i)=>i)),start:0,exit:count-1,seed};}
const dead=graph(3,[[0,1],[1,2]]);assert(F.warpReturnTrap(dead,1,2));assert(!F.warpReturnTrap(dead,2,1),'another way out is allowed');
const spaced=graph(4,[[0,1],[1,2],[2,3]]);assert(!F.warpReturnTrap(spaced,1,3),'ordinary floor between endpoints permits escape');
const adjacent=graph(4,[[0,1],[1,2],[2,3]]);const a={world:adjacent};F.install(a,{warp:true,avoidWarpTrap:true});assert.equal(a.features.warps.get(1),2,'safe adjacent pair is retained');assert.equal(a.features.warps.get(2),1);
let oldTraps=0;
for(let i=0;i<128;i++){
 const w=graph(6,[[0,1],[1,2],[2,3],[3,4],[1,5]],'trap-'+i),legacy={world:w},safe={world:w};F.install(legacy,{warp:true});F.install(safe,{warp:true,avoidWarpTrap:true});
 for(const [from,to]of legacy.features.warps)if(F.warpReturnTrap(w,from,to))oldTraps++;
 for(const [from,to]of safe.features.warps){assert(!F.warpReturnTrap(w,from,to));const exits=[...w.edges].filter(([k])=>k.startsWith(to+':')).map(([,e])=>e.to);assert(exits.some(id=>safe.features.warps.get(id)!==to),'landing has a move that does not warp back');}
 const replay={world:w};F.install(replay,legacy.features.options);assert.deepEqual(replay.features.warps,legacy.features.warps,'unversioned old saves reproduce their original placement');
 const replaySafe={world:w};F.install(replaySafe,safe.features.options);assert.deepEqual(replaySafe.features.warps,safe.features.warps);
}
assert(oldTraps>0,'fixture reproduces original bad placement');
// Relabelled seam endpoints still count as adjacent in the movement graph.
const seam=graph(10,[[1,9],[1,2]]);assert(F.warpReturnTrap(seam,1,9));
console.log('128 seeds: original trap reproduced, new pairs escape, safe adjacency and spaced dead ends retained, seam adjacency and both save versions replayed.');
