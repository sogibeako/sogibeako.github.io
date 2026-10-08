const assert=require('node:assert/strict'),S=require('./connection-space.js');let cases=0,blocked=0;
for(const wallStyle of ['dense','grid'])for(const growth of ['walls','dfs','prim','growing'])for(const loopStyle of ['straight','meander'])for(let seed=0;seed<5;seed++){
 const options={wallStyle,growth,loopStyle,seed,dimensions:[[20,20],[24,18]],holeSize:3,holeRimWalls:true,floorUnderpasses:3,underpassShape:'mixed'},w=S.generate('doubleMaze',options);
 assert.deepEqual(w.cells,S.generate('doubleMaze',options).cells);
 const q=[w.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert(w.cells[e.to]);assert.equal(w.edges.get(`${e.to}:${e.transform[(d+2)%4]}`)?.to,id);if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));
 for(const loop of w.guaranteedLoops)for(const path of [loop.horizontal,loop.vertical]){let id=path.start;for(const d of path.directions){assert(w.edges.has(`${id}:${d}`));id=w.edges.get(`${id}:${d}`).to;}assert.equal(id,path.start);}
 for(const [key,e] of w.candidates){const [id,d]=key.split(':').map(Number);if(e.kind!=='throat'||!w.cells[id]||w.cells[e.to])continue;blocked++;assert(!w.edges.has(key));
  for(const frame of [[0,1,2,3],[2,1,0,3],[0,3,2,1],[2,3,0,1]]){const st={world:w,id,frame,x:0,y:0,steps:0,history:[]};const local=frame.indexOf(d),[x,y]=S.directions[local];assert.equal(S.move(st,local),false);const tile=S.nearestView(st).find(p=>p.x===x&&p.y===y);assert(tile?.wall,'blocked portal must look blocked');}
 }
 cases++;
}
assert(blocked>0);console.log(`${cases} rim-wall mazes: connected, winding loops preserved, reciprocal, deterministic; ${blocked} blocked portal approaches checked in four frames.`);
