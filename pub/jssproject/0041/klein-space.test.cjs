const assert=require('node:assert/strict'),K=require('./klein-space.js');
for(const mode of ['open','dfs'])for(const seed of ['klein-first','klein-2','klein-3']){
 const w=K.generate(seed,mode);assert.deepEqual(K.generate(seed,mode),w);
 for(let id=0;id<w.width*w.height;id++)for(const d of Object.keys(K.dirs)){
  const e=K.adjacent(w,id,d),back=K.adjacent(w,e.to,K.opposite[d]);assert.equal(back.to,id);assert.equal(back.flip,e.flip);
  assert.equal(w.passages.has(`${id}:${d}`),w.passages.has(`${e.to}:${K.opposite[d]}`));
 }
 const q=[w.start],seen=new Set(q);for(const id of q)for(const d of Object.keys(K.dirs))if(w.passages.has(`${id}:${d}`)){const to=K.adjacent(w,id,d).to;if(!seen.has(to)){seen.add(to);q.push(to);}}
 assert.equal(seen.size,w.width*w.height);assert(seen.has(w.exit));
}
const world=K.generate(),g=K.create(world);for(let i=0;i<12;i++)assert(K.move(g,'E'));assert.equal(g.flipped,true);assert.equal(g.id,108);assert.equal(g.x,12);
assert(K.move(g,'N'));assert.equal(g.id,0);assert.equal(g.y,-1);assert.equal(g.flipped,true);
assert(K.move(g,'S'));assert.equal(g.id,108);
assert(K.move(g,'N',true));assert.equal(g.id,96);assert.equal(g.y,1);assert(K.move(g,'S',true));
for(let i=0;i<12;i++)assert(K.move(g,'E'));assert.equal(g.id,world.start);assert.equal(g.flipped,false);assert.equal(g.x,24);
assert([...g.memory.values()].filter(n=>n.id===world.start).length>1,'subjective map retains repeated images');
const h=K.create(world);for(let i=0;i<10;i++)K.move(h,'N');assert.equal(h.id,0);assert.equal(h.flipped,false);
const maze=K.create(K.generate('blocked','dfs'));let checked=0;
for(let id=0;id<120;id++)for(const d of Object.keys(K.dirs))if(!maze.world.passages.has(`${id}:${d}`)){
 maze.id=id;const before=JSON.stringify(maze,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);assert.equal(K.move(maze,d,true),false);assert.equal(JSON.stringify(maze,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v),before);checked++;
}assert(checked);
console.log('PASS: Klein graph reciprocity, seeded DFS reachability, seam reflections, two horizontal laps, vertical loop, subjective/truth controls, repeated memories and blocked moves.');
