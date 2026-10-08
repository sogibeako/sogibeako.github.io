const assert=require('node:assert/strict'),S=require('./connection-space.js');let count=0,changed=0;const changedByStyle={dense:0,grid:0};
for(const growth of ['dfs','prim','growing','hunt','kruskal','frontier'])for(const wallStyle of ['dense','grid'])for(const size of [15,31])for(let seed=0;seed<3;seed++){
 const opts={growth,wallStyle,width:size,height:size,seed,stairPlacement:'random',floorUnderpasses:2},s=S.create('crossingMaze',opts),w=s.world;
 assert.deepEqual([...w.edges],[...S.generate('crossingMaze',opts).edges]);
 const old=S.generate('crossingMaze',{...opts,stairPlacement:'diagonal',floorUnderpasses:0});if(JSON.stringify([...w.stairs].sort())!==JSON.stringify([...old.stairs].sort())){changed++;changedByStyle[wallStyle]++;}
 assert.equal([...w.edges.values()].filter(e=>e.kind==='stairs').length,4);assert.equal(w.stairs.size,4);
 const q=[w.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert.equal(w.edges.get(`${e.to}:${(d+2)%4}`).to,id);if(S.groundSheet(w,id)!==S.groundSheet(w,e.to))assert.equal(e.kind,'stairs');if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));
 for(const id of seen){s.id=id;const view=S.nearestView(s);for(let d=0;d<4;d++){const [x,y]=S.directions[d],t=view.find(t=>t.x===x&&t.y===y),e=w.edges.get(`${id}:${d}`);assert.equal(t.wall,!e);if(e)assert.equal(t.id,e.to);}}
 count++;
}
assert(changed>30);assert(changedByStyle.grid>0,'grid stairs must actually move');assert.throws(()=>S.generate('crossingMaze',{stairPlacement:'bad'}));
console.log(`${count} stair worlds: ${changed} changed placements; deterministic, two reciprocal stairs, all floors/exit reachable, floor isolation and all-cell previews passed`);
