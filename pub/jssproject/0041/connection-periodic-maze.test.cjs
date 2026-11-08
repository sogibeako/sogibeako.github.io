const assert=require('node:assert/strict'),S=require('./connection-space.js');
let count=0,passages=0;
for(const mode of ['kleinMaze','torusMaze'])for(const growth of ['dfs','prim','growing','kruskal'])for(let seed=0;seed<4;seed++){
 const options={width:30,height:26,seed,growth,floorUnderpasses:3},st=S.create(mode,options),w=st.world;
 assert.deepEqual([...w.edges],[...S.generate(mode,options).edges]);
 const q=[w.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert.equal(w.edges.get(`${e.to}:${(e.transform[d]+2)%4}`)?.to,id);if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));passages+=w.passages.length;
 for(const id of seen)for(const frame of [[0,1,2,3],[2,1,0,3]]){st.id=id;st.frame=frame;const view=S.nearestView(st);for(let d=0;d<4;d++){const [x,y]=S.directions[d],p=view.find(p=>p.x===x&&p.y===y),e=w.edges.get(`${id}:${frame[d]}`);assert.equal(p.wall,!e,`${mode}/${growth}/${seed}/${id}/${frame}/${d}`);if(e)assert.equal(p.id,e.to);}}
 for(const p of w.passages){st.id=p.vertical;assert.equal(S.groundSheet(w,p.vertical),0);const o=S.observeWalkingMap(st);assert([...o.chart.cells.values()].filter(p=>!p.wall).every(p=>p.signature==='floor:0'));}
 count++;
}
assert(passages>0);console.log(`${count} periodic worlds, ${passages} underpasses: reproducible, connected, reciprocal, all-cell views in both orientations passed.`);
