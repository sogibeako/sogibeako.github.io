const assert=require('node:assert/strict'),S=require('./connection-space.js');
let worlds=0;
for(const mode of ['underpassMaze','crossingMaze','kleinMaze','torusMaze']){
 let straight=0,bent=0;
 for(let seed=0;seed<12;seed++){
  const o={seed,width:30,height:26,growth:'dfs',floorUnderpasses:3,count:5,underpassShape:'mixed'},w=S.generate(mode,o);
  assert.deepEqual([...w.edges],[...S.generate(mode,o).edges]);
  for(const p of w.passages){if(p.arms)bent++;else straight++;}
  const queue=[w.start],seen=new Set(queue);for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert.equal(w.edges.get(`${e.to}:${(e.transform[d]+2)%4}`)?.to,id);if(!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
  assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));worlds++;
 }
 assert(straight>0&&bent>0,mode);console.log(`${mode}: ${straight} straight, ${bent} bent`);
}
console.log(`${worlds} seeded mixed mazes: both shapes, deterministic, connected, reciprocal passed.`);
