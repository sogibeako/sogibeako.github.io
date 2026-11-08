const assert=require('node:assert/strict'),K=require('./klein-space.js');
const make=()=>K.create(K.rasterize(K.generate('groups','open')));
const walk=(s,d,n)=>{for(let i=0;i<n;i++)assert(K.move(s,d));};
{
 const s=make();assert.deepEqual(K.returnGroups(s),[]);
 walk(s,'E',48);walk(s,'S',1);walk(s,'N',1);
 assert.deepEqual(K.returnGroups(s),[{dx:48,dy:0,kind:'same',count:2,firstStep:48,lastStep:50}]);
 walk(s,'E',48);assert.deepEqual(K.returnGroups(s).map(g=>[g.dx,g.count]),[[96,1],[48,2]]);
 const before=JSON.stringify(s.returns);const groups=K.returnGroups(s);groups[0].count=999;
 assert.equal(K.returnGroups(s)[0].count,1);assert.equal(JSON.stringify(s.returns),before);
 K.setReference(s);assert.deepEqual(K.returnGroups(s),[]);
}
{
 const s=make();walk(s,'E',24);walk(s,'N',2);
 assert.equal(K.returnGroups(s)[0].kind,'reversed');
}
{
 const s=make();walk(s,'S',20);walk(s,'N',40);
 assert.deepEqual(K.returnGroups(s).map(g=>g.dy),[-20,20]);
}
{
 const s=make();walk(s,'S',20);
 for(let i=0;i<22;i++){walk(s,'E',1);walk(s,'W',1);}
 const [g]=K.returnGroups(s);assert.equal(s.returnCounts.same,23);assert.equal(g.count,20);assert.equal(g.firstStep,26);assert.equal(g.lastStep,64);
 assert.equal(K.returnGroups(s).reduce((n,g)=>n+g.count,0),s.returns.length);
}
console.log('Return grouping: lifted destinations, revisits, reversed frames, retained window, reset and read-only results passed');
