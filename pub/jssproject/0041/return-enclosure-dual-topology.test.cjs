const assert=require('node:assert/strict'),H=require('./return-enclosure.js'),S=require('./connection-space.js');
let cases=0;
for(const shiftX of [-6,-4,-2,2,4,6])for(const shiftY of [-6,-4,-2,2,4,6])for(const verticalLoops of [0,1]){
 const w=H.create('topology-'+cases,{width:26,height:30,shiftX,shiftY,verticalLoops,underpasses:0}).world;
 for(const n of w.domain)for(let d=0;d<4;d++){
  const e=w.candidates.get(`${n}:${d}`);if(e.kind!=='normal')continue;
  assert(w.domain.has(e.to));const back=w.candidates.get(`${e.to}:${(d+2)%4}`);if(back.kind==='normal')assert.equal(back.to,n);
  const p=S.position(w,n),q=S.position(w,e.to),dx=p.x+S.directions[d][0]-q.x,dy=p.y+S.directions[d][1]-q.y,l=w.lattice;
  assert(Number.isInteger((l.height*dx+l.shiftX*dy)/l.determinant));assert(Number.isInteger((l.shiftY*dx+l.width*dy)/l.determinant));
 }
 cases++;
}
console.log(cases+' dual-axis topologies: reciprocal seams, integer deck translations, zero/one loop generation passed.');
