const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function finish(g){const q=[[g.player.world_position,[]]],seen=new Set();for(const [id,path] of q){if(id===g.world.exit){for(const d of path)assert(M.move(g,d));assert(g.won);return;}if(seen.has(id))continue;seen.add(id);for(const d of Object.keys(M.DIRS)){const e=M.transition(g.world,{world_position:id},d);if(e)q.push([g.world.warps?.get(e.to)??e.to,[...path,d]]);}}throw Error('no route');}


const shifts=new Set();
for(let trial=0;trial<12;trial++){
 let g=J.begin(J.start({width:9,height:9,seed:'old'}),'torus-start-'+trial,'torus');
 assert.equal(g.generationOptions.topology,'plane');assert.equal(g.world.width,21);
 for(let stage=0;stage<6;stage++){
  finish(g);const before=snap(g),seed='torus-course-'+trial+'-'+stage;
  const next=J.next(g,seed,'torus');assert.equal(snap(g),before);assert.equal(snap(next),snap(J.next(g,seed,'torus')));
  const o=next.generationOptions;assert.equal(o.topology,stage%2===0?'torus':'plane');
  assert(!next.world.warpMode);assert(!next.world.birdMode);assert(!next.world.puzzle);assert(!next.world.rotatingWarp);
  assert.equal(next.journey.completed,stage+1);assert.equal(next.journey.steps,g.journey.steps+g.steps);
  if(o.topology==='torus'){
   assert.equal(o.width%2,0);assert.equal(o.height%2,0);assert(o.loopLearning);assert.equal(o.learningLaps,3);assert.notEqual(o.algorithm,'division');
   shifts.add(o.shiftX+','+o.shiftY);
  }
  const restarted=J.restart(next);assert.deepEqual(restarted.generationOptions,o);g=next;
 }
 finish(g);
}
assert.equal(shifts.size,6);
console.log('PASS: 12 gentle starts, 72 alternating transitions and final exits; all 6 shift patterns, deterministic results, 3-lap learning and preserved progress.');
