const assert=require('node:assert/strict'),S=require('./connection-space.js');let cases=0,passes=0,bends=0;
for(const wallStyle of ['dense','grid'])for(const growth of ['walls','dfs','prim','growing'])for(const underpassShape of ['straight','mixed','corners'])for(let seed=0;seed<5;seed++){
 const options={wallStyle,growth,underpassShape,seed:'new-'+seed,dimensions:[[20,20],[24,18]],floorUnderpasses:3},w=S.generate('doubleMaze',options);
 assert.deepEqual(w.cells,S.generate('doubleMaze',options).cells);
 const q=[w.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert(w.cells[e.to]);const back=w.edges.get(`${e.to}:${e.transform[(d+2)%4]}`);assert.equal(back?.to,id);if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));
 for(const loop of w.guaranteedLoops)for(const path of [loop.horizontal,loop.vertical]){let id=path.start;for(const d of path.directions){const e=w.edges.get(`${id}:${d}`);assert(e);id=e.to;assert.equal(S.groundSheet(w,id),loop.sheet);}assert.equal(id,path.start);}
 for(const p of w.passages){passes++;if(p.arms)bends++;assert.equal(S.groundSheet(w,p.vertical),p.baseSheet);for(const id of [p.horizontal,p.vertical])for(const frame of [[0,1,2,3],[2,1,0,3],[0,3,2,1],[2,3,0,1]]){const st={world:w,id,frame},view=S.nearestView(st);for(let d=0;d<4;d++){const [x,y]=S.directions[d],tile=view.find(p=>p.x===x&&p.y===y);assert.equal(!tile?.wall, w.edges.has(`${id}:${frame[d]}`),'immediate view matches movement');}}}
 cases++;
}
assert(passes>0);assert(bends>0);assert.throws(()=>S.generate('doubleMaze',{wallStyle:'grid',dimensions:[[13,12],[12,12]]}));
console.log(`${cases} worlds: lattice/dense, four generators, three underpass shapes; ${passes} crossings (${bends} corners), connectivity, loops, reciprocal edges and local views passed.`);
