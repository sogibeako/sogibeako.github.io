const assert=require('node:assert/strict'),S=require('./connection-space.js');let cases=0;
for(const growth of ['dfs','prim','growing'])for(const loopStyle of ['straight','meander'])for(const dimensions of [[[8,8],[10,12]],[[20,20],[24,18]]])for(const holeSize of [1,2,4])for(let seed=0;seed<4;seed++){
 const w=S.generate('doubleMaze',{wallStyle:'grid',growth,loopStyle,dimensions,holeSize,seed:'grid-'+seed});
 const rim=id=>{const p=S.position(w,id);return w.portals.some(h=>h.sheet===p.sheet&&p.x>=h.x-1&&p.x<=h.x+h.size&&p.y>=h.y-1&&p.y<=h.y+h.size);};
 for(let id=0;id<w.cells.length;id++){
  const p=S.position(w,id),l=w.layouts[p.sheet];if(w.holes.has(id))continue;
  if(p.x%2&&p.y%2)assert(w.cells[id],`${growth}: missing grid site ${id}`);
  if(!rim(id)&&p.x%2===0&&p.y%2===0)assert.equal(w.cells[id],0,'lattice pillar');
  if(!rim(id)&&w.cells[id]&&(p.x%2)!==(p.y%2)){
   const dirs=p.x%2?[0,2]:[1,3];for(const d of dirs){const e=w.edges.get(`${id}:${d}`);assert(e,`${growth}: dangling connector ${id}`);}
  }
 }
 const q=[w.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));cases++;
}
console.log(`${cases} grid mazes: every odd/odd site carved, pillars retained, no dangling connectors, all floors connected.`);
