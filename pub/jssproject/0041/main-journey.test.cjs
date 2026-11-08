const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function finish(g){const q=[[g.player.world_position,[]]],seen=new Set();for(const [id,path] of q){if(id===g.world.exit){for(const d of path)assert(M.move(g,d));assert(g.won);return;}if(seen.has(id))continue;seen.add(id);for(const d of Object.keys(M.DIRS)){const e=M.transition(g.world,{world_position:id},d);if(e)q.push([g.world.warps?.get(e.to)??e.to,[...path,d]]);}}throw Error('no route');}
const configs=[...['dfs','prim','rooms','division'].map(algorithm=>({algorithm})),{algorithm:'dfs',topology:'torus',width:20,height:16,shiftX:2,shiftY:6},...['pair','oneway','cycle3','cycle4'].map(warpStyle=>({algorithm:'rooms',warpMode:true,warpCount:2,warpStyle}))];
for(const [i,config] of configs.entries()){
 let g=J.start({width:21,height:17,seed:'journey-'+i,...config},'mixed');
 const initial=snap(g);assert(!J.canAdvance(g));assert.throws(()=>J.next(g,'premature'));assert.equal(snap(g),initial);
 for(let stage=0;stage<3;stage++){
  finish(g);assert(J.canAdvance(g));const clearSteps=g.steps;
  if(stage===1){assert(M.continueExploring(g));assert(M.waitTurn(g));assert(J.canAdvance(g));}
  const before=snap(g);assert.throws(()=>J.next(g,g.generationOptions.seed));assert.equal(snap(g),before);
  const invalid={...g,generationOptions:{...g.generationOptions,width:0}};const invalidBefore=snap(invalid);assert.throws(()=>J.next(invalid,'generation-failure'));assert.equal(snap(invalid),invalidBefore);
  const next=J.next(g,'journey-'+i+'-next-'+stage);assert.equal(snap(g),before);
  assert.deepEqual(next.generationOptions,{...g.generationOptions,seed:'journey-'+i+'-next-'+stage});
  assert.equal(next.journey.completed,stage+1);assert.equal(next.journey.steps,g.journey.steps+clearSteps);
  assert.equal(next.steps,0);assert.equal(next.markers.size,0);assert.equal(next.cognition.archives.length,0);assert(!next.won);assert(!next.exploringAfterExit);
  assert.equal(next.world.rotatingWarp,g.world.rotatingWarp);
  const reset=J.restart(next);assert.deepEqual(reset.journey,next.journey);assert.deepEqual(reset.generationOptions,next.generationOptions);assert.equal(reset.world,next.world);
  g=next;
 }
}
const demo=M.createGame(M.createWarpDemo());assert(!J.canAdvance(demo));assert(!J.restart(demo).journey);
console.log('PASS: 9 configurations / 27 departures; exit gating, same options, fresh state, retained rotation, restart and non-mutating failures.');
