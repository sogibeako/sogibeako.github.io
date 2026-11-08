const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const [width,height] of [[8,8],[8,40],[40,8],[17,23],[24,24],[40,40]])for(let seed=0;seed<8;seed++){
 const w=S.generate('crossingMaze',{width,height,seed}),again=S.generate('crossingMaze',{width,height,seed});assert.deepEqual(w.cells,again.cells);assert.equal(w.cells.length,2*width*height);
 const seen=new Set([w.start]),q=[w.start];for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert(w.cells[e.to]);assert.equal(w.edges.get(`${e.to}:${(d+2)%4}`).to,id);if(S.position(w,id).sheet!==S.position(w,e.to).sheet)assert.equal(e.kind,'stairs');if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));
 for(const id of w.crossings){const p=S.position(w,id);for(const d of p.sheet===0?[0,2]:[1,3])assert(!w.edges.has(`${id}:${d}`));}
 const st=S.create('crossingMaze',{width,height,seed});for(const id of [...w.stairs,...w.crossings]){st.id=id;for(let d=0;d<4;d++){const [x,y]=S.directions[d],tile=S.nearestView(st).find(t=>t.x===x&&t.y===y);assert.equal(tile.wall,!w.edges.has(`${id}:${d}`));}}
}
for(const [width,height] of [[7,8],[41,8],[8,0],[8,41],[8.5,10],[NaN,10]])assert.throws(()=>S.generate('crossingMaze',{width,height}));
console.log('48 variable-size worlds: 8–40, rectangular, deterministic, connected, exit reachable, reciprocal stairs, protected crossing and preview passed');
