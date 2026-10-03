const assert=require('node:assert/strict'),M=require('./core.js');
for(const options of [{width:17,height:17,keyDoor:true,keyCount:3},{width:16,height:16,topology:'torus',shiftX:2,shiftY:-2}]){
 const g=M.createGame(M.generate(options));
 const before=JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
 const text=M.exportTrueMap(g),rows=text.split('\n');
 assert.equal(rows.length,g.world.height);assert.ok(rows.every(row=>row.length===g.world.width));
 assert.equal(text.split('@').length-1,1);
 for(let id=0;id<g.world.cells.length;id++){
  const ch=rows[Math.floor(id/g.world.width)][id%g.world.width];
  if(g.world.domain&&!g.world.domain[id])assert.equal(ch,' ');
  else if(id===g.player.world_position)assert.equal(ch,'@');
  else assert.equal(ch,M.featureAt(g,id)||(g.world.cells[id]?'.':'#'));
 }
 assert.equal(JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v),before);
 if(g.world.puzzle){const lock=g.world.puzzle.locks[0];g.openedDoors.add(lock.keyId);g.player.keys.push(lock.keyId);const updated=M.exportTrueMap(g).split('\n');assert.equal(updated[Math.floor(lock.door/g.world.width)][lock.door%g.world.width],lock.door===g.world.exit?'>':'/');assert.equal(updated[Math.floor(lock.key/g.world.width)][lock.key%g.world.width],'.');}
 const id=[...g.world.cells].findIndex((v,i)=>v&&i!==g.world.start&&i!==g.world.exit&&!M.featureAt(g,i));
 g.markers.set(id,'1');const char=()=>M.exportTrueMap(g).split('\n')[Math.floor(id/g.world.width)][id%g.world.width];
 assert.equal(char(),'1');g.birds=[{position:id,symbol:'V'}];assert.equal(char(),'V');g.player.world_position=id;assert.equal(char(),'@');
}
console.log('PASS: rectangular ASCII grid, dual-shift padding, current keys/doors, marker/bird/player priority, immutable game.');
