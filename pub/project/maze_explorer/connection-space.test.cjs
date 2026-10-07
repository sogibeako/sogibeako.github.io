const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const mode of Object.keys(S.names)){
 const w=S.generate(mode),seen=new Set([w.start]),queue=[w.start];
 for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;
  if(!w.directed){const inverse=w.edges.get(`${e.to}:${(e.transform[d]+2)%4}`);assert.equal(inverse.to,id);
  for(let n=0;n<4;n++)assert.equal(inverse.transform[e.transform[n]],n);}
  if(!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}
 }
 assert.equal(seen.size,w.cells.reduce((n,v)=>n+v,0));
 // Every edge can be crossed and reversed from every reachable orientation.
 const states=[S.create(mode)],keys=new Set();
 for(const s of states){const key=`${s.id}:${s.frame}`;if(keys.has(key))continue;keys.add(key);
  for(let d=0;d<4;d++){
   const a={...s,history:[]},before=[s.id,s.frame,s.x,s.y,s.steps];
   if(!S.move(a,d)){assert.deepEqual([a.id,a.frame,a.x,a.y,a.steps],before);continue;}
   if(!w.directed){const b={...a,history:[]};assert(S.move(b,(d+2)%4));assert.equal(b.id,s.id);assert.deepEqual(b.frame,s.frame);assert.equal(b.x,s.x);assert.equal(b.y,s.y);}
   const truth={...s,history:[]};assert(S.move(truth,s.frame[d],true));assert.equal(truth.id,a.id);assert.deepEqual(truth.frame,a.frame);
   if(!keys.has(`${a.id}:${a.frame}`))states.push(a);
  }
 }
 console.log(mode,seen.size,'cells,',keys.size,'position/frame states verified');
}
for(const mode of ['mobius','klein','sheets']){const s=S.create(mode);for(let i=0;i<16;i++)assert(S.move(s,1));assert.equal(s.id,9);assert.deepEqual(s.frame,[0,1,2,3]);assert.equal(s.x,16);}
const r=S.create('rotate');for(let i=0;i<7;i++)S.move(r,1);assert.deepEqual(r.frame,[1,2,3,0]);
assert.throws(()=>S.create('unknown'));console.log('All connection modes passed');
