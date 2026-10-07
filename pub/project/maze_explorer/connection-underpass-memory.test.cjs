const assert=require('node:assert/strict'),S=require('./connection-space.js');
const state=S.create('underpass'),book={charts:[],active:-1};S.observeWalkingMap(state,book);
const first=book.charts[0],original=new Map([...first.cells].map(([k,p])=>[k,p.signature]));
const route=[0,3,3,3,2,2,2,1];
for(const d of route){assert(S.move(state,d));S.observeWalkingMap(state,book);}
assert.equal(book.charts.length,1);assert.equal(book.charts[book.active],first);
for(const [key,signature] of original)if(!first.cells.get(key).underpassProjection)assert.equal(first.cells.get(key).signature,signature);
for(const d of [...route].reverse()){assert(S.move(state,(d+2)%4));S.observeWalkingMap(state,book);}
assert.equal(book.charts[book.active],first);
const count=book.charts.length;for(let lap=0;lap<3;lap++){for(const d of route){S.move(state,d);S.observeWalkingMap(state,book);}for(const d of [...route].reverse()){S.move(state,(d+2)%4);S.observeWalkingMap(state,book);}}
assert.equal(book.charts.length,count);
// Entering the vertical centre must still remember the common ground around it.
S.move(state,2);S.observeWalkingMap(state,book);S.move(state,2);const obs=S.observeWalkingMap(state,book);assert.equal(state.id,state.world.vertical);
for(const p of S.nearestView(state)){const record=obs.chart.cells.get(`${state.x+p.x},${state.y+p.y}`);assert(record);assert.equal(record.signature,p.wall?'wall':'floor:0');}
const before=JSON.stringify(state),snapshot=JSON.stringify(book,(_,v)=>v instanceof Map?[...v]:v);S.observeWalkingMap(state,book);assert.equal(JSON.stringify(state),before);assert.equal(JSON.stringify(book,(_,v)=>v instanceof Map?[...v]:v),snapshot);
assert.equal(S.observeWalkingMap(S.create('underpass')).book.charts.length,1);
// Walk a generated route across both centre cells, retaining every live observation.
for(let seed=0;seed<8;seed++){
 const s=S.create('underpassMaze',{seed}),b={charts:[],active:-1};
 for(const target of [s.world.vertical,s.world.horizontal]){
  const paths=new Map([[s.id,[]]]),q=[s.id];for(const id of q)for(let d=0;d<4;d++){const e=s.world.edges.get(`${id}:${d}`);if(e&&!paths.has(e.to)){paths.set(e.to,[...paths.get(id),d]);q.push(e.to);}}
  for(const d of paths.get(target)){S.move(s,d);const o=S.observeWalkingMap(s,b);for(const p of S.nearestView(s))assert(o.chart.cells.has(`${s.x+p.x},${s.y+p.y}`));}
 }
}
console.log('Underpass memory: automatic underpass merge, preserved common records, repeat reuse, centre/common-ground memory, purity and 8 generated routes passed');
