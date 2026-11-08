const a=require('node:assert/strict'),B=require('./branch-maze.js'),M=require('./branch-memory.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');let remembered=0,changes=0;
for(const sheets of [2,3])for(const seed of ['memory-a','memory-b','memory-c']){
 const s=B.create({sheets,seed}),memory=new Map(),known=new Set([s.id]);
 const first=M.observe(s,memory),initial=[...memory.keys()];a.equal(M.compose(s,new Map(),first).length,first.length);
 for(let n=0;n<3000;n++){
  const visible=M.observe(s,memory),view=M.compose(s,memory,visible),visibleAt=new Map(visible.map(p=>[p.x+','+p.y,p]));
  for(const p of view){a(memory.has(p.id));if(p.remembered){remembered++;a.equal(p.id,M.projection(s,p.x,p.y));a(!visibleAt.has(p.x+','+p.y));}else a.equal(p.id,visibleAt.get(p.x+','+p.y).id);}
  for(const id of initial)a(memory.has(id));const path=P.explore(s,known);if(!path)break;const old=Math.floor(s.id/64);a(S.move(s,path[0]));known.add(s.id);if(Math.floor(s.id/64)!==old)changes++;
 }
 a.equal([...memory.values()].filter(p=>!p.wall).length,s.world.branchStats.floors);
 // Walking a complete sheet cycle restores position while retaining observations.
 for(const d of P.route(s,id=>id===s.world.start))a(S.move(s,d));const before=new Set(memory.keys());for(let i=0;i<sheets;i++)for(const d of s.world.branchLoops[Math.floor(s.id/(s.world.size*s.world.size))]){a(S.move(s,d));M.observe(s,memory);}a.equal(s.id,s.world.start);for(const id of before)a(memory.has(id));
}
a(remembered>0);a(changes>0);console.log('Six branch mazes: persistent floors/walls, current rays override memory, unseen terrain withheld, all floors recorded, cross-sheet returns retain memory.');
