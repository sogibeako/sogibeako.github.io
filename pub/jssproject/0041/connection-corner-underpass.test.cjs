const assert=require('node:assert/strict'),S=require('./connection-space.js');let corners=0;
for(const mode of ['cornerUnderpass','underpassMaze','crossingMaze','kleinMaze','torusMaze'])for(let seed=0;seed<3;seed++){
 const st=S.create(mode,{seed,width:30,height:26,underpassShape:'corners',floorUnderpasses:3}),w=st.world;
 assert.deepEqual([...w.edges],[...S.generate(mode,{seed,width:30,height:26,underpassShape:'corners',floorUnderpasses:3}).edges]);
 const q=[w.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert.equal(w.edges.get(`${e.to}:${(e.transform[d]+2)%4}`)?.to,id);if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));
 for(const p of w.passages)if(p.arms){corners++;for(const id of [p.horizontal,p.vertical])for(const frame of [[0,1,2,3],[2,1,0,3],[1,2,3,0]]){
  st.id=id;st.frame=frame;const mark=S.underpassSymbol(w,id,frame);const dirs={'┌':[1,2],'┘':[0,3],'┐':[2,3],'└':[0,1]}[mark];assert(dirs);assert.deepEqual([0,1,2,3].filter(d=>w.edges.has(`${id}:${frame[d]}`)),dirs);
 }}
 for(const id of seen)for(const frame of [[0,1,2,3],[2,1,0,3]]){st.id=id;st.frame=frame;const view=S.nearestView(st);for(let d=0;d<4;d++){const [x,y]=S.directions[d],tile=view.find(p=>p.x===x&&p.y===y),e=w.edges.get(`${id}:${frame[d]}`);assert.equal(tile.wall,!e,`${mode}/${seed}/${id}/${d}`);if(e)assert.equal(tile.id,e.to);}}
}
assert(corners>0);
// The requested 3x3 appears on both sides of the fixed corner pair.
const st=S.create('cornerUnderpass'),p=st.world.passages[0],width=st.world.layouts[0].width;
for(const [offset,glyph] of [[2*width,'┌'],[2,'┌'],[-2*width,'┘'],[-2,'┘']]){st.id=p.horizontal+offset;const view=S.nearestView(st),center=view.find(t=>!t.wall&&[p.horizontal,p.vertical].includes(t.id));assert(center);assert.equal(S.underpassSymbol(st.world,center.id,center.frame),glyph);}
console.log(`15 worlds / ${corners} bent crossings: requested views, symbols, reciprocal edges, connectivity, both-frame adjacent views passed.`);
