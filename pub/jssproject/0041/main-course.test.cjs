const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function finish(g){const q=[[g.player.world_position,[]]],seen=new Set();for(const [id,path] of q){if(id===g.world.exit){for(const d of path)assert(M.move(g,d));assert(g.won);return;}if(seen.has(id))continue;seen.add(id);for(const d of Object.keys(M.DIRS)){const e=M.transition(g.world,{world_position:id},d);if(e)q.push([g.world.warps?.get(e.to)??e.to,[...path,d]]);}}throw Error('no route');}

const encountered=new Set();
for(const course of ['plain','variety'])for(let trial=0;trial<6;trial++){
 let g=J.start({width:9,height:9,algorithm:'dfs',seed:'course-start-'+trial});
 for(let stage=0;stage<6;stage++){
  finish(g);const before=snap(g),seed='course-'+trial+'-'+stage;
  const next=J.next(g,seed,course),repeat=J.next(g,seed,course);
  assert.equal(snap(next),snap(repeat));assert.equal(snap(g),before);
  assert.equal(next.generationOptions.topology,'plane');assert.notEqual(next.world.algorithm,g.world.algorithm);
  assert(!next.world.birdMode);assert(!next.world.puzzle);assert(!next.world.warpInvisible);
  assert.equal(!!next.world.warpMode,course==='variety'&&!g.world.warpMode);
  if(next.world.warpMode){assert(next.world.warps.size>0);encountered.add(next.world.warpStyle);}
  assert.equal(next.journey.completed,stage+1);assert.equal(next.journey.steps,g.journey.steps+g.steps);
  assert.equal(next.steps,0);g=next;
 }
 finish(g);
 const plain=J.next(g,'switch-plain-'+trial,'plain');assert(!plain.world.warpMode);
 const before=snap(g);assert.throws(()=>J.next(g,'bad-course','unknown'));assert.equal(snap(g),before);
}
assert.equal(encountered.size,4);
console.log('PASS: 72 course transitions plus final exits; deterministic generation, changing algorithms, alternating visible warps (all 4 styles), retained progress and invalid-course rejection.');
