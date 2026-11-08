const assert=require('node:assert/strict'),S=require('./connection-space.js'),w=S.generate('double');
let throat=0;
for(let id=0;id<128;id++)for(let d=0;d<4;d++){
 const e=w.edges.get(`${id}:${d}`);
 if(!w.cells[id]){assert.equal(e,undefined);continue;}
 assert(e);assert(w.cells[e.to]);
 if(e.kind==='throat'){throat++;assert.equal(e.to%64,id%64);assert.notEqual(Math.floor(e.to/64),Math.floor(id/64));}
 else assert.equal(Math.floor(e.to/64),Math.floor(id/64));
}
assert.equal(throat,16);
for(const d of [1,2]){const s=S.create('double');for(let i=0;i<8;i++)assert(S.move(s,d));assert.equal(s.id,9);assert.deepEqual(s.frame,[0,1,2,3]);}
const s=S.create('double');for(const d of [1,1,2])assert(S.move(s,d));assert.equal(s.id,19);
assert(S.move(s,2));assert.equal(s.id,83);assert.equal(s.last.kind,'throat');assert.deepEqual(s.frame,[2,1,0,3]);
assert(S.move(s,0));assert.equal(s.id,19);assert.deepEqual(s.frame,[0,1,2,3]);
// Compute the square complex's Euler characteristic from the actual edge gluing.
const parent=Array.from({length:512},(_,i)=>i),find=a=>parent[a]===a?a:(parent[a]=find(parent[a])),join=(a,b)=>{parent[find(a)]=find(b);};
const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
for(let id=0;id<128;id++)if(w.cells[id])for(let d=0;d<4;d++){
 const e=w.edges.get(`${id}:${d}`),[nx,ny]=S.directions[d];
 for(let i=0;i<4;i++){const [x,y]=corners[i];if(x*nx+y*ny!==1)continue;
  const ux=x-2*nx,uy=y-2*ny,ex=S.directions[e.transform[1]],ey=S.directions[e.transform[2]],tx=ux*ex[0]+uy*ey[0],ty=ux*ex[1]+uy*ey[1];
  const j=corners.findIndex(([a,b])=>a===tx&&b===ty);assert(j>=0);join(id*4+i,e.to*4+j);
 }
}
const vertices=new Set();for(let id=0;id<128;id++)if(w.cells[id])for(let i=0;i<4;i++)vertices.add(find(id*4+i));
assert.equal(vertices.size-w.edges.size/2+120,-2);
console.log('Central-hole gluing: all 8 rim pairs, same-sheet outer boundaries, round trip and Euler characteristic -2 passed');
