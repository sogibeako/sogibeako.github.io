const assert=require('node:assert/strict'),K=require('./klein-space.js');
let seamEdges=0;
for(const [width,height] of [[4,4],[5,7],[12,10]])for(const seed of ['klein-first','raster-2','raster-3']){
 const graph=K.generate(seed,'dfs',width,height),before=[...graph.passages],w=K.rasterize(graph);
 assert.deepEqual([...graph.passages],before);assert.equal(w.width,width*2);assert.equal(w.height,height*2);
 const center=id=>(2*Math.floor(id/width)+1)*w.width+2*(id%width)+1;
 for(let id=0;id<width*height;id++)for(const d of Object.keys(K.dirs)){
  const a=center(id),middle=K.adjacent(w,a,d),end=K.adjacent(w,middle.to,d),logical=K.adjacent(graph,id,d),open=graph.passages.has(`${id}:${d}`);
  assert.equal(end.to,center(logical.to));assert.equal(middle.flip!==end.flip,logical.flip);
  assert.equal(!!w.cells[middle.to],open,'corridor parity and reflection preserve graph edges');
  assert.equal(w.passages.has(`${a}:${d}`),open);
  if(logical.seam&&open)seamEdges++;
 }
 for(let id=0;id<w.cells.length;id++)for(const d of Object.keys(K.dirs)){
  const e=K.adjacent(w,id,d),back=K.adjacent(w,e.to,K.opposite[d]);assert.equal(back.to,id);assert.equal(back.flip,e.flip);
  assert.equal(w.passages.has(`${id}:${d}`),!!(w.cells[id]&&w.cells[e.to]));
 }
 const q=[w.start],prev=new Map([[w.start,null]]);
 for(const at of q)for(const d of Object.keys(K.dirs))if(w.passages.has(`${at}:${d}`)){const next=K.adjacent(w,at,d).to;if(!prev.has(next)){prev.set(next,[at,d]);q.push(next);}}
 assert.equal(prev.size,w.cells.reduce((a,b)=>a+b,0));assert(prev.has(w.exit));
 const route=[];for(let at=w.exit;prev.get(at);){const [p,d]=prev.get(at);route.unshift(d);at=p;}
 for(const truth of [false,true]){
  const game=K.create(w);for(const wd of route)assert(K.move(game,truth?wd:K.worldDirection(wd,game.flipped),truth));assert.equal(game.id,w.exit);assert.equal(game.steps,route.length);
 }
 const g=K.create(w);assert([...g.memory.values()].some(n=>!n.terrain),'adjacent walls are observed');
 const d=Object.keys(K.dirs).find(d=>!w.passages.has(`${g.id}:${d}`));if(d){const steps=g.steps;assert.equal(K.move(g,d),false);assert.equal(g.steps,steps);}
}
assert(seamEdges>0);
const g=K.create(K.rasterize(K.generate()));for(let i=0;i<24;i++)assert(K.move(g,'E'));assert(g.flipped);assert.equal(g.id,19*24+1);
for(let i=0;i<24;i++)assert(K.move(g,'E'));assert(!g.flipped);assert.equal(g.id,g.world.start);assert.equal(g.steps,48);
console.log('PASS: nine raster mazes, exact graph edge correspondence, reflection parity, reversible boundaries, all-floor reachability, both view controls to exit, observed walls and 24/48-step open-space loops.');
