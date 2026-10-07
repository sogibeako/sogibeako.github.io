const assert=require('node:assert/strict'),S=require('./connection-space.js');
let count=0,upper=0,lower=0,dead=0;
for(const growth of ['dfs','prim','growing','hunt','kruskal','frontier'])for(const wallStyle of ['dense','grid'])for(let seed=0;seed<4;seed++){
 const opts={growth,wallStyle,seed,width:31,height:31,floorUnderpasses:3},w=S.generate('crossingMaze',opts),base=S.generate('crossingMaze',{...opts,floorUnderpasses:0});
 assert.deepEqual(w.cells,S.generate('crossingMaze',opts).cells);assert.deepEqual([...w.stairs],[...base.stairs]);
 const queue=[w.start],seen=new Set(queue);for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert.equal(w.edges.get(`${e.to}:${(d+2)%4}`).to,id);if(S.groundSheet(w,id)!==S.groundSheet(w,e.to))assert.equal(e.kind,'stairs');if(!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));
 for(const [k,e] of base.edges)if(e.kind==='stairs')assert.deepEqual(w.edges.get(k),e);
 for(const p of w.passages){if(p.baseSheet===0)upper++;else lower++;if(p.role==='deadend')dead++;assert.equal(S.groundSheet(w,p.vertical),p.baseSheet);assert.equal(S.groundSheet(w,p.horizontal),p.baseSheet);}
 const state=S.create('crossingMaze',opts);
 for(const id of seen){state.id=id;const view=S.nearestView(state);for(let d=0;d<4;d++){const [x,y]=S.directions[d],t=view.find(t=>t.x===x&&t.y===y),e=w.edges.get(`${id}:${d}`);assert.equal(t.wall,!e,`${growth} ${wallStyle} ${seed} ${id} ${d}`);if(e)assert.equal(t.id,e.to);}}
 // Observation from local virtual cells keeps the correct physical floor label.
 for(const p of w.passages){state.id=p.vertical;const o=S.observeWalkingMap(state);for(const r of o.chart.cells.values())if(!r.wall)assert.equal(r.signature,`floor:${p.baseSheet}`);}
 count++;
}
assert(upper>0&&lower>0);assert(dead>0);
for(const floorUnderpasses of [-1,7,NaN])assert.throws(()=>S.generate('crossingMaze',{floorUnderpasses}));
console.log(`${count} worlds: ${upper} upper / ${lower} lower local crossings (${dead} dead ends); deterministic, connected, stairs unchanged, no cross-floor edges, all-cell previews and memory passed`);
