const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const [width,height] of [[15,15],[24,18],[31,25],[40,40]])for(let seed=0;seed<12;seed++){
 const opts={wallStyle:'grid',width,height,seed},w=S.generate('crossingMaze',opts);assert.deepEqual(w.cells,S.generate('crossingMaze',opts).cells);
 const q=[w.start],seen=new Set(q);for(const n of q){const p=S.position(w,n);assert(p.x%2||p.y%2,'even/even grid pillars must stay walls');for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(!e)continue;assert.equal(w.edges.get(`${e.to}:${(d+2)%4}`).to,n);if(S.position(w,e.to).sheet!==p.sheet)assert.equal(e.kind,'stairs');if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));
 const st=S.create('crossingMaze',opts);for(const n of seen){st.id=n;const view=S.nearestView(st);for(let d=0;d<4;d++){const [x,y]=S.directions[d],t=view.find(t=>t.x===x&&t.y===y),e=w.edges.get(`${n}:${d}`);assert.equal(t.wall,!e);if(e)assert.equal(t.id,e.to);}}
 for(const n of w.crossings){const p=S.position(w,n);for(const d of p.sheet===0?[0,2]:[1,3])assert(!w.edges.has(`${n}:${d}`));}
}
assert.throws(()=>S.generate('crossingMaze',{wallStyle:'grid',width:8,height:15}));assert.throws(()=>S.generate('crossingMaze',{wallStyle:'unknown'}));
console.log('Grid crossing: 48 worlds; lattice pillars, deterministic generation, full connectivity, stairs, exit and all-cell preview consistency passed');
