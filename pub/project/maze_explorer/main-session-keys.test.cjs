const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
let checkpoints=0;
function roundtrip(g){const text=S.encode(g,'keys'),r=S.decode(text);assert.equal(r.course,'keys');assert.deepEqual(r.game.player,g.player);assert.deepEqual(r.game.openedDoors,g.openedDoors);assert.deepEqual(r.game.cognition,g.cognition);assert.equal(r.game.steps,g.steps);assert.equal(r.game.turns,g.turns);assert.deepEqual(r.game.journey,g.journey);assert.equal(S.encode(r.game,'keys'),text);checkpoints++;return r.game;}
for(const algorithm of ['dfs','prim','division','rooms','eller','wilson','kruskal','hunt','growing'])for(const keyCount of [1,2,3]){
 let g=S.attach(J.start({width:31,height:23,algorithm,keyDoor:true,keyCount,seed:'save-keys-'+algorithm+keyCount}));g.journey={completed:4,steps:501};assert(S.supported(g));
 const path=M.solvePuzzle(g.world).path;g=roundtrip(g);
 for(const direction of path){
  const keys=g.player.keys.length,doors=g.openedDoors.size;
  assert(S.act(g,'move',direction));
  if(keys!==g.player.keys.length||doors!==g.openedDoors.size){g=roundtrip(g);if(!g.won){S.act(g,'wait');g=roundtrip(g);}}
 }
 assert(g.won);assert.equal(g.player.keys.length,g.world.puzzle.locks.length);assert.equal(g.openedDoors.size,g.world.puzzle.locks.length);
 g=roundtrip(g);S.act(g,'continue');g=roundtrip(g);assert(g.exploringAfterExit);
 const n=J.next(g,'after-save-'+algorithm+keyCount,'keys');assert.equal(n.journey.completed,5);assert(!n.world.puzzle);assert.equal(n.player.keys.length,0);
 const reset=S.attach(J.restart(g));assert.equal(reset.player.keys.length,0);assert.equal(reset.openedDoors.size,0);roundtrip(reset);
}
console.log(`PASS: 27 key/door mazes, ${checkpoints} exact round trips at key pickup, unlock, wait, exit and continued exploration; replay continues to exit and next maze.`);
