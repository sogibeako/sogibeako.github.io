const assert=require('node:assert/strict'),K=require('./klein-space.js');
const make=()=>K.create(K.rasterize(K.generate('frames','open')));
const walk=(s,d,n,truth=false)=>{for(let i=0;i<n;i++)assert(K.move(s,d,truth));};
{
 const s=make();walk(s,'E',24);walk(s,'N',2);walk(s,'S',2);walk(s,'W',24);
 const [a,b]=s.returnIntervals.map(K.intervalTransform);
 assert.deepEqual(a,{dx:24,dy:-2,flipped:true});assert.deepEqual(b,K.inverseTransform(a));
 assert.deepEqual(K.intervalGroups(s),[{dx:24,dy:-2,flipped:true,forward:1,reverse:1,lastStep:52}]);
 assert.deepEqual(K.inverseTransform(K.inverseTransform(a)),a);
}
{
 const s=make();walk(s,'S',20,true);walk(s,'E',24,true);walk(s,'S',2,true);walk(s,'S',20,true);
 const [first,,last]=s.returnIntervals;
 assert.equal(first.dy,20);assert.equal(last.dy,-20);assert.equal(last.fromFlipped,true);
 assert.deepEqual(K.intervalTransform(first),K.intervalTransform(last));
 assert.equal(K.intervalGroups(s).find(g=>g.dx===0).forward,2);
}
{
 const s=make();walk(s,'S',20);walk(s,'N',20);walk(s,'E',1);walk(s,'W',1);
 const before=JSON.stringify(s.returnIntervals),groups=K.intervalGroups(s);
 assert.equal(groups.length,1);assert.equal(groups[0].forward,1);assert.equal(groups[0].reverse,1);
 groups[0].forward=100;assert.equal(K.intervalGroups(s)[0].forward,1);assert.equal(JSON.stringify(s.returnIntervals),before);
 K.setReference(s);assert.deepEqual(K.intervalGroups(s),[]);
}
console.log('Interval frames: reflected departure, actual reverse traversal, direction pairing, revisit exclusion and read-only grouping passed');
