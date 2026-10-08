const assert=require('node:assert/strict'),S=require('./connection-space.js');let crossings=0,rememberedAcrossSheets=0;
for(const growth of ['dfs','prim','growing'])for(let seed=0;seed<4;seed++){
 const st=S.create('doubleMaze',{seed,growth,wallStyle:'grid',dimensions:[[24,24],[24,24]],holeSize:3,holeRimWalls:true,floorUnderpasses:3,underpassShape:'mixed'}),memory={cells:new Map()},knownKeys=new Set();
 const observe=()=>{const view=S.nearestView(st),before=new Map(memory.cells),result=S.observeJourneyMap(st,memory,view);for(const p of view)if(p.id>=0)knownKeys.add(`${st.x+p.x},${st.y+p.y}`);knownKeys.add(`${st.x},${st.y}`);
 for(const [key,p] of before)if(!result.visible.has(key))assert.deepEqual(memory.cells.get(key),p,'out-of-view terrain retained');
 for(const key of memory.cells.keys())assert(knownKeys.has(key),'no unseen terrain');
 assert.equal(memory.cells.get(`${st.x},${st.y}`).id,st.id);assert.deepEqual(memory.cells.get(`${st.x},${st.y}`).frame,st.frame);
 if(st.last?.kind==='throat'){crossings++;const sheet=S.groundSheet(st.world,st.id);if([...memory.cells].some(([key,p])=>!p.wall&&!result.visible.has(key)&&S.groundSheet(st.world,p.id)!==sheet))rememberedAcrossSheets++;}
 };
 observe();const seen=new Set([st.id]);
 // Walk a graph traversal through all reachable pockets, reversing real transitions.
 const visit=(id)=>{for(let d=0;d<4;d++){const e=st.world.edges.get(`${id}:${d}`);if(!e||seen.has(e.to))continue;seen.add(e.to);assert(S.move(st,st.frame.indexOf(d)));observe();visit(e.to);assert(S.move(st,st.frame.indexOf(e.transform[(d+2)%4])));observe();assert.equal(st.id,id);}};visit(st.id);
 const count=memory.cells.size;observe();assert.equal(memory.cells.size,count);
}
assert(crossings>0);assert(rememberedAcrossSheets>0);console.log(`12 traversals: ${crossings} sheet crossings, ${rememberedAcrossSheets} retaining earlier-sheet floors out of view; positions, frames, unseen-terrain exclusion and redraw stability passed.`);
