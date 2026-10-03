const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0,wraps=0,contacts=0;
for(const algorithm of ['dfs','prim','rooms'])for(const size of [8,16,30])for(const [shiftX,shiftY] of [[0,0],[0,2],[-2,0],[2,-2]])for(const seed of ['birds','鳥']) {
 const options={width:size,height:size,algorithm,topology:'torus',shiftX,shiftY,seed,birdMode:true,birdCount:2,loopLearning:true,learningLaps:3};
 const w=M.generate(options),g=M.createGame(w),copy=M.createGame(M.generate(options));
 for(let i=0;i<g.birds.length;i++){
  const bird=g.birds[i],observer=M.createGame({...w,birdMode:false});
  Object.assign(observer.player,{world_position:bird.position,perceived_x:bird.position%w.width,perceived_y:Math.floor(bird.position/w.width)});M.observe(observer);
  const expected=new Set([...observer.cognition.visible_cells].map(id=>observer.cognition.memory_nodes.get(id).world_id));
  assert.deepEqual(new Set(M.inspectBird(g,i).visibleCells),expected,'bird and player see the same periodic terrain');
 }
 for(let turn=0;turn<40;turn++){
  const previous=g.birds.map(b=>b.position),dirs=Object.keys(M.DIRS).filter(d=>M.transition(w,g.player,d));
  if(turn%3===0){M.waitTurn(g);M.waitTurn(copy);}else{const d=dirs[turn%dirs.length];M.move(g,d);M.move(copy,d);}
  assert.deepEqual(g.birds,copy.birds);assert.deepEqual(g.player,copy.player);
  assert.equal(M.periodicId(w,g.player.perceived_x,g.player.perceived_y),g.player.world_position);
  assert.equal(new Set(g.birds.map(b=>b.position)).size,g.birds.length);
  for(let j=0;j<g.birds.length;j++)if(previous[j]!==g.birds[j].position){
   const edge=Object.keys(M.DIRS).map(d=>M.transition(w,{world_position:previous[j]},d)).find(e=>e?.to===g.birds[j].position);assert.ok(edge);if(edge.kind==='wrap')wraps++;
  }
  if(g.won)break;
 }
 const reset=M.createGame(w),beforeProgress={...reset.cognition.loopProgress};
 reset.bird.position=reset.player.world_position;
 // Seed previous-segment visits with a different lift; these must not survive.
 const [dx,dy]=M.deckVector(w,2,1);
 for(let id=0;id<w.cells.length;id++)if(w.cells[id])reset.cognition.loopVisits.set(id,{x:id%w.width+dx,y:Math.floor(id/w.width)+dy,step:0});
 const oldMemory=[...reset.cognition.memory_nodes.keys()];M.waitTurn(reset);
 assert.equal(reset.lastEvent,'teleport');assert.equal(reset.cognition.loopVisits.size,1);assert.ok(reset.cognition.loopVisits.has(reset.player.world_position));
 assert.deepEqual(reset.cognition.loopProgress,beforeProgress);assert.ok(oldMemory.every(k=>reset.cognition.memory_nodes.has(k)));assert.equal(reset.lastLoopEvent,null);
 assert.equal(M.periodicId(w,reset.player.perceived_x,reset.player.perceived_y),reset.player.world_position);
 assert.ok(reset.birds.every(b=>b.position!==reset.player.world_position));contacts++;cases++;
}
// A direct periodic neighbor is visible and can be reached in a single bird step.
for(const [shiftX,shiftY] of [[0,0],[0,2],[2,0],[2,-2]]){
 const w={...M.createTorusDemo({openRoom:true,shiftX,shiftY}),birdMode:true};
 const g=M.createGame(w);let edge;
 for(let id=0;id<w.cells.length&&!edge;id++)if(w.cells[id])edge=Object.keys(M.DIRS).map(d=>M.transition(w,{world_position:id},d)).find(e=>e?.kind==='wrap');
 assert.ok(edge);g.bird.position=edge.from;Object.assign(g.player,{world_position:edge.to,perceived_x:edge.to%w.width,perceived_y:Math.floor(edge.to/w.width)});
 assert.ok(M.inspectBird(g).canSeePlayer);M.waitTurn(g);M.waitTurn(g);assert.equal(g.teleports,1);
}
assert.ok(wraps>0);
assert.throws(()=>M.generate({width:8,height:8,topology:'torus',keyDoor:true,birdMode:true}));
console.log(`PASS: ${cases} periodic bird worlds, ${wraps} bird seam crossings, ${contacts} segmented teleports; shared FOV, shifted/dual seams, deterministic movement, lift consistency, memory retention, no teleport loop credit.`);
