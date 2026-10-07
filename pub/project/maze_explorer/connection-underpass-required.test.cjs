const assert=require('node:assert/strict'),S=require('./connection-space.js');
function search(w,blocked=-1){const q=[w.start],paths=new Map([[w.start,[w.start]]]);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&e.to!==blocked&&!paths.has(e.to)){paths.set(e.to,[...paths.get(id),e.to]);q.push(e.to);}}return paths;}
let count=0;
for(const [width,height] of [[15,15],[21,27],[40,40]])for(let seed=0;seed<50;seed++){
 const w=S.generate('underpassMaze',{width,height,seed,count:1,route:'required'}),paths=search(w),path=paths.get(w.exit);
 assert.equal(paths.size,w.cells.reduce((a,b)=>a+b,0));assert(path);assert.equal(w.edges.size/2,paths.size-1);
 const v=path.indexOf(w.vertical),h=path.indexOf(w.horizontal);assert(v>0&&h>v&&h<path.length-1);assert(h-v>=8);
 assert(!search(w,w.vertical).has(w.exit));assert(!search(w,w.horizontal).has(w.exit));
 assert.deepEqual(S.generate('underpassMaze',{width,height,seed,count:1}).cells,w.cells);
 const old=S.generate('underpassMaze',{width,height,seed,route:'loop'});assert(search(old).has(old.exit));assert.equal(old.route,'loop');count++;
}
assert.throws(()=>S.generate('underpassMaze',{route:'unknown'}));
console.log(`${count} required routes: connected tree, vertical before horizontal, detour >=8 steps, either blocked crossing prevents exit; legacy loops passed`);
