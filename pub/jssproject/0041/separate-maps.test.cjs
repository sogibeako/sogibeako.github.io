const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0;
for(const topology of ['plane','torus'])for(const algorithm of ['dfs','rooms'])for(const teleportPolicy of ['far','known','unseen']){
 const w=M.generate({width:topology==='plane'?31:30,height:topology==='plane'?25:24,topology,algorithm,shiftX:topology==='torus'?2:0,shiftY:topology==='torus'?-2:0,birdMode:true,birdCount:2,separateMaps:true,teleportPolicy,keyDoor:topology==='plane',keyCount:3,loopLearning:true,seed:'notebooks'});
 const g=M.createGame(w),old=g.cognition.memory_nodes,oldEntries=[...old];
 const keys=[...g.player.keys],doors=[...g.openedDoors];
 g.bird.position=g.player.world_position;M.waitTurn(g);
 assert.equal(g.lastEvent,'teleport');assert.equal(g.cognition.archives.length,1);assert.equal(g.cognition.archives[0].nodes,old);
 assert.notEqual(g.cognition.memory_nodes,old);assert.deepEqual([...old],oldEntries);
 assert.deepEqual(g.player.keys,keys);assert.deepEqual([...g.openedDoors],doors);
 assert.equal(g.cognition.loopVisits.size,1);assert.ok(g.cognition.memory_nodes.size>0);
 const visibleWorlds=new Set([...g.cognition.visible_cells].map(id=>g.cognition.memory_nodes.get(id).world_id));
 assert.ok([...g.cognition.memory_nodes.values()].every(n=>visibleWorlds.has(n.world_id)),'new page includes only new observations');
 const snapshot=JSON.stringify([...old]);
 g.bird.position=g.player.world_position;M.waitTurn(g);
 assert.equal(g.cognition.archives.length,2);assert.equal(JSON.stringify([...old]),snapshot);
 const reset=M.createGame(w);assert.equal(reset.cognition.archives.length,0);assert.equal(reset.teleports,0);
 cases++;
}
// Past notebooks still count for destination preferences, even when active memory is empty.
const w=M.generate({birdMode:true,separateMaps:true,teleportPolicy:'known'}),g=M.createGame(w);
const target=Object.keys(M.DIRS).map(d=>M.transition(w,g.player,d)).find(e=>e&&e.to!==w.exit).to;
g.cognition.archives.push({nodes:new Map([['old',{world_id:target,x:target%w.width,y:Math.floor(target/w.width)}]])});
g.cognition.memory_nodes.clear();g.bird.position=w.start;M.waitTurn(g);
assert.equal(g.player.world_position,target);assert.equal(g.lastTeleport.wasKnown,true);assert.equal(g.lastTeleport.fallback,false);
console.log(`PASS: ${cases} notebook worlds; preserved archives, isolated new observations, repeated transfers, reset, inventory, loop segmentation, archived destination memory.`);
