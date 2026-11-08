const assert=require('node:assert/strict'),S=require('./connection-space.js');
let cases=0;
for(const [mode,dimensions] of [['double',[[8,8],[12,10]]],['double',[[24,24],[24,24]]],['triple',[[8,8],[14,8],[10,12]]],['triple',[[24,24],[24,23],[22,20]]]]){
 const max=S.holeLimit(mode,dimensions);
 for(let holeSize=1;holeSize<=max;holeSize++)for(const walls of [true,false]){
  const w=S.generate(mode,{dimensions,holeSize,walls});assert.equal(w.holes.size,(mode==='triple'?4:2)*holeSize**2);assert(w.cells[w.start]);
  const seen=new Set([w.start]),queue=[w.start];let throats=0;
  for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;const back=w.edges.get(`${e.to}:${(e.transform[d]+2)%4}`);assert.equal(back.to,id);assert.deepEqual(e.transform.map(n=>back.transform[n]),[0,1,2,3]);if(e.kind==='throat')throats++;if(!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
  assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert.equal(throats,(mode==='triple'?16:8)*holeSize);
  // Every rim is still usable in the observer's chart, even at maximum size.
  const st=S.create(mode,{dimensions,holeSize,walls});for(const [key,e] of w.edges)if(e.kind==='throat'){const [id,d]=key.split(':').map(Number);st.id=id;const [x,y]=S.directions[d],t=S.nearestView(st).find(t=>t.x===x&&t.y===y);assert(t&&!t.wall);assert.equal(t.id,e.to);}
  cases++;
 }
 assert.throws(()=>S.generate(mode,{dimensions,holeSize:max+1}));
 const auto=S.generate(mode,{dimensions,holeSize:'auto'});assert(auto.holeSize>=1&&auto.holeSize<=max);
}
for(const holeSize of [0,-1,1.5,NaN])assert.throws(()=>S.generate('double',{holeSize}));
console.log(`Variable hole sizes: ${cases} worlds; floor connectivity, all rim inverses, hole areas, adjacent previews, automatic sizes and invalid values passed`);
