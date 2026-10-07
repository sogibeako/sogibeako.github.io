const assert=require('node:assert/strict'),K=require('./klein-space.js');
const make=()=>K.create(K.rasterize(K.generate('path','open')));
const walk=(s,d,n,truth=false)=>{for(let i=0;i<n;i++)assert(K.move(s,d,truth));};
{
 const s=make();walk(s,'E',24);walk(s,'N',2);
 assert.deepEqual(s.crossingPath.reduced,['a','b']);
 assert.equal(s.lastReturn.path.recent,'a → b');
 const recorded=JSON.stringify(s.lastReturn.path);
 walk(s,'S',2);walk(s,'W',24);
 assert.deepEqual(s.crossingPath.reduced,[]);assert.equal(K.pathSummary(s).recent,'a → b → b⁻¹ → a⁻¹');
 assert.equal(JSON.stringify(s.returns[0].path),recorded);
 K.setReference(s);assert.equal(K.pathSummary(s).total,0);assert.equal(K.pathSummary(s).recent,'なし');
}
{
 const a=make(),b=make();walk(a,'E',24,true);walk(a,'S',20,true);walk(b,'S',20,true);walk(b,'E',24,true);
 assert.deepEqual(a.crossingPath.reduced,['a','b']);assert.deepEqual(b.crossingPath.reduced,['b','a']);
 assert.notEqual(a.y,b.y); // Order is retained even though both end at the same real cell/frame.
 assert.equal(a.id,b.id);assert.equal(a.flipped,b.flipped);
}
{
 const s=make();walk(s,'S',20*45);const p=K.pathSummary(s);
 assert.equal(p.total,45);assert.equal(p.length,45);assert.equal(s.crossingPath.recent.length,40);
 assert(p.recent.startsWith('…'));assert(p.reduced.startsWith('…'));
 walk(s,'N',20*45);assert.equal(K.pathSummary(s).length,0);
}
{
 const s=K.create(K.rasterize(K.generate('wall','dfs')));
 const d=Object.keys(K.dirs).find(d=>!s.world.passages.has(`${s.id}:${d}`));
 assert(d);const before=JSON.stringify(s.crossingPath);assert.equal(K.move(s,d),false);assert.equal(JSON.stringify(s.crossingPath),before);
}
console.log('Crossing path: order, inverse cancellation, reflected controls, immutable return snapshot, long paths and reset passed');
