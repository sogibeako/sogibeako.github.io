const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function finish(g){const q=[[g.player.world_position,[]]],seen=new Set();for(const [id,path] of q){if(id===g.world.exit){for(const d of path)assert(M.move(g,d));assert(g.won);return;}if(seen.has(id))continue;seen.add(id);for(const d of Object.keys(M.DIRS)){const e=M.transition(g.world,{world_position:id},d);if(e)q.push([g.world.warps?.get(e.to)??e.to,[...path,d]]);}}throw Error('no route');}

for(const course of ['same','plain','variety'])for(let trial=0;trial<8;trial++){
 const old=J.start({width:21,height:17,algorithm:'rooms',seed:'previous-'+trial,warpMode:true,warpStyle:'cycle3',warpCount:2},'mixed');
 finish(old);M.continueExploring(old);const before=snap(old);
 const fresh=J.begin(old,'begin-'+trial,course);assert.equal(snap(old),before);
 assert.deepEqual(fresh.journey,{completed:0,steps:0});assert.equal(fresh.steps,0);assert(!fresh.won);assert(!fresh.exploringAfterExit);assert.equal(fresh.cognition.archives.length,0);
 if(course==='same'){assert.deepEqual(fresh.generationOptions,{...old.generationOptions,seed:'begin-'+trial});assert.equal(fresh.world.rotatingWarp,'mixed');}
 else {
  assert.equal(fresh.world.width,21);assert.equal(fresh.world.height,17);assert(!fresh.world.warpMode);
  const other=J.start({width:9,height:9,seed:'unrelated'});assert.equal(snap(J.begin(other,'begin-'+trial,course)),snap(fresh));
 }
 finish(fresh);const next=J.next(fresh,'after-begin-'+trial,course);assert.equal(next.journey.completed,1);assert.equal(next.journey.steps,fresh.steps);
 if(course==='variety')assert(next.world.warpMode);
 assert.throws(()=>J.begin(old,'bad','unknown'));assert.throws(()=>J.begin(old,'',course));assert.equal(snap(old),before);
}
console.log('PASS: 24 journey starts and exits; clean progress, same-condition rotation, deterministic gentle starts, continuation and immutable failure.');
