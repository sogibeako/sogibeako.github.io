const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const counts=new Set(),algorithms=new Set();
for(let trial=0;trial<12;trial++){
 let g=J.begin(J.start({width:9,height:9,seed:'old'}),'key-start-'+trial,'keys');
 assert(!g.world.puzzle);assert.equal(g.world.width,21);
 for(let stage=0;stage<7;stage++){
  assert.equal(!!g.world.puzzle,stage%2===1);assert.equal(g.generationOptions.topology,'plane');
  assert(!g.world.warpMode);assert(!g.world.birdMode);assert.equal(g.player.keys.length,0);assert.equal(g.openedDoors.size,0);
  const solution=M.solvePuzzle(g.world);assert(solution.solvable);assert(solution.ordered);
  if(g.world.puzzle){
   counts.add(g.generationOptions.keyCount);algorithms.add(g.world.algorithm);assert(g.world.puzzle.locks.length>0);
   for(const lock of g.world.puzzle.locks)assert(!M.solvePuzzle(g.world,true,lock.keyId).solvable);
  }
  for(const d of solution.path)assert(M.move(g,d));assert(g.won);
  if(g.world.puzzle){assert.equal(g.player.keys.length,g.world.puzzle.locks.length);assert.equal(g.openedDoors.size,g.world.puzzle.locks.length);}
  if(stage===6)break;
  const reset=J.restart(g);assert.equal(reset.player.keys.length,0);assert.equal(reset.openedDoors.size,0);
  const before=snap(g),seed='key-next-'+trial+'-'+stage,next=J.next(g,seed,'keys');
  assert.equal(snap(g),before);assert.equal(snap(next),snap(J.next(g,seed,'keys')));
  assert.equal(next.journey.completed,stage+1);assert.equal(next.journey.steps,g.journey.steps+g.steps);g=next;
 }
}
assert.deepEqual([...counts].sort(),[1,2,3]);
assert.deepEqual([...algorithms].sort(),['dfs','prim','division','rooms','wilson','kruskal','hunt','growing','eller'].sort());
console.log('PASS: 72 transitions and 84 exits; all 3 key targets and 9 algorithms, required ordered keys, deterministic generation, fresh inventory/doors and retained progress.');
