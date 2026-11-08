const assert=require('node:assert/strict'),O=require('./orientation.js'),S=require('./orientation-save.js'),M=require('./core.js');
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function route(w){const q=[[w.start,[]]],seen=new Set([w.start]);for(const [id,path] of q){if(id===w.exit)return path;for(const d of Object.keys(M.DIRS)){
 const e=M.transition(w,{world_position:id},d);if(e&&!seen.has(e.to)){seen.add(e.to);q.push([e.to,[...path,d]]);}
}}throw Error('unreachable');}
for(const layout of ['dfs','prim','division','rooms'])for(const size of ['small','standard','large']){
 const s=O.create('mixed',{layout,size,warpStyle:'none',warpCount:4,warpInvisible:true,seed:'plain-77'}),w=s.game.world;
 assert.equal(w.warps.size,0);assert.equal(s.warpFrames.size,0);assert.equal(w.warpCount,0);assert.equal(s.config.warpInvisible,false);
 assert.equal(M.reachable(w,w.start).count,w.validation.floors);
 const reference=M.generate({width:w.width,height:w.height,algorithm:layout,seed:'plain-77',loops:10,topology:'plane'});assert.deepEqual(w.cells,reference.cells);
 for(const d of route(w))assert.ok(O.move(s,d));assert.ok(s.game.won);assert.equal(s.crossings,0);assert.equal(s.archives.length,0);assert.deepEqual(s.frame,O.identity());
 assert.ok([...s.chart.nodes.values()].every(n=>n.feature!=='O'));
 assert.equal(snap(S.decode(S.encode(s))),snap(s));
 O.continueExploring(s);const next=O.nextMaze(s);assert.ok(next.game.world.warps.size>0);assert.equal(next.config.stage,2);assert.equal(next.config.completedSteps,s.game.steps);
}
// Find a generated next floor with no warp, starting from an ordinary paired floor.
let found=false;
for(let i=0;i<30&&!found;i++){
 const s=O.create('right',{layout:'dfs',size:'small',seed:'plain-next-'+i});
 s.game.player.world_position=s.game.world.exit;
 const n=O.nextMaze(s);if(n.config.warpStyle==='none'){found=true;assert.equal(n.game.world.warps.size,0);assert.equal(snap(S.decode(S.encode(n))),snap(n));}
}
assert.ok(found);console.log('PASS: 12 plain generator/size combinations, unchanged non-warp geometry, connected exit routes, no rotation/transfers/archive split, save restore, continued descent to warp floors and generated transition back to plain.');
