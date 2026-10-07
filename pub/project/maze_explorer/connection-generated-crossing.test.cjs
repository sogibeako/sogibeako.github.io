const assert=require('node:assert/strict'),S=require('./connection-space.js'),shapes=new Set();
for(let n=0;n<200;n++){
 const seed='bridge-test-'+n,w=S.generate('crossingMaze',{seed}),again=S.generate('crossingMaze',{seed});assert.deepEqual(w.cells,again.cells);assert.deepEqual(w.edges,again.edges);assert.equal(w.exit,again.exit);shapes.add(Buffer.from(w.cells).toString('hex'));
 const seen=new Set([w.start]),queue=[w.start];for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert(w.cells[e.to]);assert.equal(w.edges.get(`${e.to}:${(d+2)%4}`).to,id);if(Math.floor(id/64)!==Math.floor(e.to/64))assert.equal(e.kind,'stairs');if(!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));assert.notEqual(w.exit,w.start);assert.equal(w.edges.has('27:0'),false);assert.equal(w.edges.has('27:2'),false);assert.equal(w.edges.has('91:1'),false);assert.equal(w.edges.has('91:3'),false);
 const st=S.create('crossingMaze',{seed});for(const id of [27,91]){st.id=id;for(let d=0;d<4;d++){const [x,y]=S.directions[d],t=S.nearestView(st).find(t=>t.x===x&&t.y===y);assert.equal(t.wall,!w.edges.has(`${id}:${d}`));}}
}
assert(shapes.size>100);console.log(`200 seeds: reproducibility, ${shapes.size} distinct mazes, all-floor/exit reachability, reversible stairs and protected crossings passed`);
