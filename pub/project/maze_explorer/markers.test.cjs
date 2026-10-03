const assert=require('node:assert/strict'),M=require('./core.js');
for(const topology of ['plane','torus']){
 const w=M.generate({width:topology==='plane'?25:24,height:topology==='plane'?25:24,topology,shiftX:topology==='torus'?2:0,shiftY:topology==='torus'?-2:0,birdMode:true,separateMaps:true,keyDoor:topology==='plane'}),g=M.createGame(w);
 assert.equal(M.placeMarker(g).status,'blocked');
 const features=new Set([w.start,w.exit,...(w.puzzle?.locks||[]).flatMap(l=>[l.key,l.door])]);
 const floors=[...w.cells.keys()].filter(id=>w.cells[id]&&!features.has(id));
 const old=new Map(g.cognition.memory_nodes);g.cognition.archives.push({nodes:old});const saved=JSON.stringify([...old]);
 for(let i=0;i<9;i++){
  const id=floors[i];Object.assign(g.player,{world_position:id,perceived_x:id%w.width,perceived_y:Math.floor(id/w.width)});M.observe(g);
  const before={turns:g.turns,steps:g.steps,birds:JSON.stringify(g.birds),progress:JSON.stringify(g.cognition.loopProgress)};
  assert.deepEqual(M.placeMarker(g),{status:'placed',label:String(i+1)});assert.equal(M.featureAt(g,id),String(i+1));assert.equal(M.placeMarker(g).status,'existing');
  for(const k of g.cognition.visible_cells){const n=g.cognition.memory_nodes.get(k);if(n.world_id===id)assert.equal(n.feature,String(i+1));}
  assert.deepEqual({turns:g.turns,steps:g.steps,birds:JSON.stringify(g.birds),progress:JSON.stringify(g.cognition.loopProgress)},before);
 }
 g.player.world_position=floors[9];assert.equal(M.placeMarker(g).status,'full');
 for(const id of features){g.player.world_position=id;assert.equal(M.placeMarker(g).status,'blocked');}
 assert.equal(JSON.stringify([...old]),saved);
 g.player.world_position=floors[0];g.bird.position=floors[0];M.waitTurn(g);assert.equal(g.lastEvent,'teleport');assert.equal(g.markers.size,9);
 assert.equal(M.featureAt(g,floors[0]),'1');assert.equal(M.createGame(w).markers.size,0);
 g.won=true;assert.equal(M.placeMarker(g).status,'won');
}
console.log('PASS: numbered markers, plane and dual-shift torus, visible copies, immutable archives, no time/AI/learning change, feature exclusions, cap, teleport retention, reset, won guard.');
