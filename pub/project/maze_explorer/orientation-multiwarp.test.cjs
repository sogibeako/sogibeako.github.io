const assert=require('node:assert/strict'),O=require('./orientation.js'),M=require('./core.js');
function route(w,start,pad){
 const q=[[start,[]]],seen=new Set([start]);
 for(const [id,path] of q)for(const d of Object.keys(M.DIRS)){
  const e=M.transition(w,{world_position:id},d);if(!e)continue;
  const next=[...path,d];if(e.to===pad)return next;
  const to=w.warps.get(e.to)??e.to;if(!seen.has(to)){seen.add(to);q.push([to,next]);}
 }
 throw Error('unreachable pad');
}
let crossings=0;
for(const layout of ['dfs','prim'])for(const mode of [...Object.keys(O.transforms),'mixed'])for(const warpCount of [2,4]){
 const s=O.create(mode,{layout,warpCount,seed:'multi-69'}),w=s.game.world;
 assert.ok(w.warpCount>=1&&w.warpCount<=warpCount);assert.equal(w.warps.size,w.warpCount*2);
 assert.equal(w.validation.warp.canExit,w.validation.floors);
 // Keep exploring past the exit so every actual pad can be exercised.
 w.exit=-1;let frame=O.identity(),count=0;
 for(const pad of w.warps.keys())for(const d of route(w,s.game.player.world_position,pad)){
  const edge=M.transition(w,s.game.player,d),group=w.warpGroups.find(g=>g.includes(edge.to));
  if(group){
   const i=w.warpGroups.indexOf(group),t=O.transforms[mode==='mixed'?['right','mirror','left','half'][i]:mode];
   frame=O.compose(edge.to===group[0]?t:O.inverse(t),frame);count++;
  }
  const local=O.direction(O.apply(O.inverse(s.frame),...M.DIRS[d]));assert.ok(O.move(s,local));
  assert.deepEqual(s.frame,frame);assert.equal(s.crossings,count);assert.equal(s.archives.length,count);
  const a=s.chart;
  for(const n of a.nodes.values()){
   const [dx,dy]=O.apply(a.frame,n.x,n.y);
   assert.equal(n.world_id,(Math.floor(a.origin/w.width)+dy)*w.width+a.origin%w.width+dx);
  }
 }
 crossings+=count;
 for(const [a,b] of w.warpGroups)assert.deepEqual(O.compose(s.warpFrames.get(a),s.warpFrames.get(b)).map(x=>x||0),O.identity());
 const snapshot=JSON.stringify(s.archives,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
 O.inspectAll(s);assert.equal(JSON.stringify(s.archives,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v),snapshot);
}
assert.throws(()=>O.create('right',{layout:'dfs',warpCount:5}));
assert.deepEqual(O.create('mixed').warpFrames.get(54),O.transforms.right);
console.log(`PASS: 20 multi-warp worlds, ${crossings} composed crossings, every pad in both directions, subjective inputs/local memory, inverse pair frames, reachability and immutable archived previews.`);
