const assert=require('node:assert/strict'),S=require('./connection-space.js');
const walk=(s,legs)=>{for(const [d,n] of legs)for(let i=0;i<n;i++)assert(S.move(s,d));};
for(const loop of [[[1,2],[2,2],[3,2],[0,2]],[[2,2],[1,2],[0,2],[3,2]]]){
 const s=S.create('branch'),origin=s.id;walk(s,loop);assert.equal(s.id,origin+64);assert.deepEqual([s.x,s.y],[0,0]);assert.deepEqual(s.frame,[0,1,2,3]);
 walk(s,loop);assert.equal(s.id,origin);assert.deepEqual(s.frame,[0,1,2,3]);
}
{
 const s=S.create('branch');s.id=21;s.history=[];walk(s,[[2,2],[1,1],[0,2],[3,1]]);assert.equal(s.id,21); // Two crossings, no winding around the pillar.
}
{
 const s=S.create('branch');walk(s,[[1,2],[2,2]]);assert.equal(s.id,100);assert.equal(s.last.kind,'branch');assert(S.move(s,0));assert.equal(s.id,28);assert.deepEqual(s.frame,[0,1,2,3]);
}
{
 const w=S.generate('branch');assert.equal(w.cells[27],0);assert.equal(w.cells[91],0);assert.notEqual(w.cells[49],w.cells[113]);assert.notEqual(w.cells[14],w.cells[78]);
 for(let id=0;id<128;id++)for(let d=0;d<4;d++){
  const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert(w.cells[id]&&w.cells[e.to]);
  if(Math.floor(id/64)!==Math.floor(e.to/64)){assert.equal(e.kind,'branch');assert([3,4].includes(Math.floor(id%64/8)));assert(id%8>=4);}
 }
 for(const id of [0,7,56,63,64,71,120,127]){assert.equal(w.edges.has(`${id}:${Math.floor(id%64/8)===0?0:2}`),false);}
 const s=S.create('branch');walk(s,[[1,1]]);const before=JSON.stringify(s);assert.equal(S.move(s,2),false);assert.equal(JSON.stringify(s),before);
}
console.log('Branch stage: clockwise/counterclockwise single and double winding, nonwinding circuit, inverse crossing, pillar and distinct scenery passed');
