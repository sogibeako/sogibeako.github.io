const assert=require('node:assert/strict'),O=require('./orientation.js'),M=require('./core.js');
const norm=f=>f.map(x=>x||0);
function route(w,start,pad){
 const q=[[start,[]]],seen=new Set([start]);
 for(const [id,path] of q)for(const d of Object.keys(M.DIRS)){
  const e=M.transition(w,{world_position:id},d);if(!e)continue;
  const next=[...path,d];if(e.to===pad)return next;
  const to=w.warps.get(e.to)??e.to;if(!seen.has(to)){seen.add(to);q.push([to,next]);}
 }
 throw Error('unreachable');
}
let crossings=0;
for(const layout of ['dfs','prim'])for(const mode of [...Object.keys(O.transforms),'mixed'])for(const warpStyle of ['oneway','cycle3','cycle4']){
 const s=O.create(mode,{layout,warpStyle,warpCount:3,seed:'directed-70'}),w=s.game.world;
 assert.equal(w.validation.warp.canExit,w.validation.floors);assert.equal(w.validation.warp.reachable,w.validation.floors);
 assert.deepEqual([...s.warpFrames.keys()].sort(),[...w.warps.keys()].sort());
 w.exit=-1;
 const walk=d=>{
  const edge=M.transition(w,s.game.player,d),before=[...s.frame],steps=s.game.steps,count=s.crossings;
  const group=w.warpGroups.find(g=>g.includes(edge.to)),i=w.warpGroups.indexOf(group);
  const t=O.transforms[mode==='mixed'?['right','mirror','left','half'][i]:mode];
  const warped=w.warps.has(edge.to),expected=warped?O.compose(t,before):before;
  const local=O.direction(O.apply(O.inverse(s.frame),...M.DIRS[d]));assert.ok(O.move(s,local));
  assert.deepEqual(norm(s.frame),norm(expected));assert.equal(s.game.steps,steps+1);assert.equal(s.crossings,count+Number(warped));assert.equal(s.archives.length,s.crossings);
  assert.equal(s.game.player.world_position,w.warps.get(edge.to)??edge.to);
  for(const n of s.chart.nodes.values()){
   const [dx,dy]=O.apply(s.chart.frame,n.x,n.y),origin=s.chart.origin;
   assert.equal(n.world_id,(Math.floor(origin/w.width)+dy)*w.width+origin%w.width+dx);
  }
  if(warped)crossings++;
 };
 for(const pads of w.warpGroups){
  route(w,s.game.player.world_position,pads[0]).forEach(walk);
  const arrival=s.game.player.world_position,frame=[...s.frame],count=s.crossings;
  const hops=warpStyle==='oneway'?1:pads.length;
  for(let hop=0;hop<hops;hop++){
   const id=s.game.player.world_position;
   const d=Object.keys(M.DIRS).find(d=>{const e=M.transition(w,s.game.player,d);return e&&!w.warps.has(e.to);});assert.ok(d);
   walk(d);walk(O.direction(M.DIRS[d].map(x=>-x)));
   if(warpStyle==='oneway'){assert.equal(s.game.player.world_position,id);assert.equal(s.crossings,count);assert.deepEqual(s.frame,frame);}
  }
  if(warpStyle!=='oneway'){
   assert.equal(s.game.player.world_position,arrival);assert.equal(s.crossings,count+pads.length);
   const i=w.warpGroups.indexOf(pads),t=O.transforms[mode==='mixed'?['right','mirror','left','half'][i]:mode];let expected=frame;
   for(let j=0;j<pads.length;j++)expected=O.compose(t,expected);
   assert.deepEqual(norm(s.frame),norm(expected));
   if(mode==='right'&&warpStyle==='cycle3')assert.notDeepEqual(norm(s.frame),norm(frame));
   if(warpStyle==='cycle4')assert.deepEqual(norm(s.frame),norm(frame));
  }
 }
}
console.log(`PASS: 30 directed worlds, ${crossings} transfers, one-way landing/reentry without return, full 3/4-pad circuits and composed frames, subjective input, local memory, one-step transfer and reachability.`);
