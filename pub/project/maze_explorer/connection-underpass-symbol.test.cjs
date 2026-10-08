const assert=require('node:assert/strict'),S=require('./connection-space.js');
let signs=0,seamSigns=0;
for(const mode of ['kleinMaze','torusMaze'])for(let seed=0;seed<8;seed++){
 const st=S.create(mode,{width:16,height:16,seed,floorUnderpasses:6}),w=st.world;
 for(let id=0;id<w.cells.length;id++)if(w.cells[id])for(const frame of [[0,1,2,3],[2,1,0,3]]){
  st.id=id;st.frame=frame;
  for(const p of S.nearestView(st)){
   if(p.wall)continue;const mark=S.underpassSymbol(w,p.id,p.frame);if(!mark)continue;
   const passage=w.passages.find(c=>c.horizontal===p.id||c.vertical===p.id);
   if(id===passage.horizontal||id===passage.vertical)continue;
   assert.equal(mark,Math.abs(p.y)>Math.abs(p.x)?'｜':'ー',`${mode} seed ${seed}, observer ${id}, offset ${p.x},${p.y}`);
   const here=S.position(w,id),at=S.position(w,p.id);if(Math.abs(here.x-at.x)>8||Math.abs(here.y-at.y)>8)seamSigns++;
   signs++;
  }
 }
}
assert(signs>0);assert(seamSigns>0);
const st=S.create('underpass'),w=st.world,p=w.passages[0];
for(const frame of [[0,1,2,3],[2,1,0,3],[1,2,3,0],[3,0,1,2]])for(const id of [p.horizontal,p.vertical]){
 const symbol=S.underpassSymbol(w,id,frame),walkable=[0,1,2,3].filter(d=>w.edges.has(`${id}:${frame[d]}`));
 assert.deepEqual(walkable,symbol==='｜'?[0,2]:[1,3]);
}
st.frame=[1,2,3,0];const o=S.observeWalkingMap(st);for(const r of o.chart.cells.values())if(!r.wall&&S.underpassSymbol(w,r.id,r.frame))assert(Array.isArray(r.frame));
console.log(`${signs} visible signs (${seamSigns} across seams): near entrance axis, rotated/reflected bars, recorded frames passed.`);
