const assert=require('node:assert/strict'),O=require('./orientation.js'),M=require('./core.js');
function path(world,start,goal,warp=false){
 const q=[[start,[]]],seen=new Set([start]);
 for(const [id,steps] of q){
  if(!warp&&id===goal)return steps;
  for(const d of Object.keys(M.DIRS)){
   const edge=M.transition(world,{world_position:id},d);if(!edge)continue;
   const to=world.warps.get(edge.to)??edge.to,next=[...steps,d];
   if(warp&&world.warps.has(edge.to))return next;
   if(!seen.has(to)){seen.add(to);q.push([to,next]);}
  }
 }
 throw Error('No route');
}
function walk(s,route){for(const d of route){
 const local=O.direction(O.apply(O.inverse(s.frame),...M.DIRS[d]));assert.ok(O.move(s,local));
 const a=s.chart,w=s.game.world;
 for(const n of a.nodes.values()){
  const [dx,dy]=O.apply(a.frame,n.x,n.y);
  assert.equal(n.world_id,(Math.floor(a.origin/w.width)+dy)*w.width+a.origin%w.width+dx);
 }
}}
for(const layout of ['dfs','prim'])for(const mode of Object.keys(O.transforms))for(const seed of ['orientation-walk','regression-68']){
 const s=O.create(mode,{layout,seed}),w=s.game.world;
 assert.equal(w.width,31);assert.equal(w.height,23);assert.equal(w.warps.size,2);assert.ok(w.validation.warp.exitReachable);assert.equal(w.validation.warp.canExit,w.validation.floors);
 walk(s,path(w,w.start,null,true));assert.equal(s.crossings,1);assert.equal(s.archives.length,1);assert.notDeepEqual(s.frame,O.identity());
 walk(s,path(w,s.game.player.world_position,w.exit));assert.ok(s.game.won);
 const fresh=O.create(mode,{layout,seed});assert.deepEqual(fresh.game.world.cells,w.cells);assert.deepEqual(fresh.game.world.warps,w.warps);assert.equal(fresh.archives.length,0);assert.deepEqual(fresh.frame,O.identity());
}
assert.equal(O.create().game.world.exit,-1);assert.throws(()=>O.create('right',{layout:'torus'}));
console.log('PASS: 16 generated worlds, warp then exit via subjective controls, frame/local-memory correspondence, connectivity, deterministic seed/reset, unchanged demo, unsupported layout rejected.');
