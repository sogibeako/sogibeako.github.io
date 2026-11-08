const assert=require('node:assert/strict'),K=require('./klein-space.js');
const make=()=>K.create(K.rasterize(K.generate('returns','open')));
const walk=(s,d,n)=>{for(let i=0;i<n;i++)assert(K.move(s,d));};
{
 const s=make();walk(s,'E',24);assert.equal(s.returns.length,0);
 walk(s,'N',2);assert.equal(s.id,s.reference.id);assert.equal(s.lastReturn.kind,'reversed');assert.equal(s.returnCounts.reversed,1);
 assert.deepEqual([s.lastReturn.dx,s.lastReturn.dy],[24,-2]);
}
{
 const s=make();walk(s,'E',48);assert.equal(s.lastReturn.kind,'same');assert.equal(s.returnCounts.same,1);
 const before=s.steps;K.setReference(s);assert.equal(s.reference.steps,before);assert.equal(s.returns.length,0);
 walk(s,'N',20);assert.equal(s.lastReturn.kind,'same');assert.equal(s.returnCounts.same,1);
}
{
 const s=make();walk(s,'N',1);walk(s,'S',1);assert.equal(s.returns.length,0);
 for(let i=0;i<22;i++)walk(s,'N',20);
 assert.equal(s.returnCounts.same,22);assert.equal(s.returns.length,20);
 assert.equal(s.returns[0].step,62);
}
{
 const s=K.create(K.rasterize(K.generate('blocked','dfs')));
 const d=Object.keys(K.dirs).find(d=>!s.world.passages.has(`${s.id}:${d}`));
 if(d){const before=JSON.stringify([s.reference,s.returns,s.returnCounts]);assert.equal(K.move(s,d),false);assert.equal(JSON.stringify([s.reference,s.returns,s.returnCounts]),before);}
}
console.log('Return records: reflected/same frame, seam-only, backtracking, reset, bounded log and blocked move passed');
