const assert=require('node:assert/strict'),S=require('./connection-space.js');let count=0;
for(const growth of ['hunt','growing','prim','kruskal'])for(const wallStyle of ['dense','grid'])for(const newestBias of growth==='growing'?[0,70,100]:[70])for(const [width,height] of [[15,19],[40,40]])for(let seed=0;seed<4;seed++){
 const opts={growth,wallStyle,newestBias,width,height,seed},w=S.generate('crossingMaze',opts);assert.deepEqual(w.cells,S.generate('crossingMaze',opts).cells);assert.equal(w.growth,growth);if(growth==='growing')assert.equal(w.newestBias,newestBias);
 const q=[w.start],seen=new Set(q);let edgeCount=0;for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;edgeCount++;assert.equal(w.edges.get(`${e.to}:${(d+2)%4}`).to,id);if(S.position(w,id).sheet!==S.position(w,e.to).sheet)assert.equal(e.kind,'stairs');if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));assert.equal(edgeCount/2-seen.size+1,1);
 const st=S.create('crossingMaze',opts);for(const id of [...w.crossings,...w.stairs]){st.id=id;for(let d=0;d<4;d++){const [x,y]=S.directions[d],t=S.nearestView(st).find(t=>t.x===x&&t.y===y);assert.equal(t.wall,!w.edges.has(`${id}:${d}`));}}
 for(const id of w.crossings)for(const d of S.position(w,id).sheet===0?[0,2]:[1,3])assert(!w.edges.has(`${id}:${d}`));count++;
}
for(const newestBias of [-1,101,NaN])assert.throws(()=>S.generate('crossingMaze',{growth:'growing',newestBias}));
const opts={width:25,height:25,growth:'growing',seed:'contrast'};assert.notDeepEqual(S.generate('crossingMaze',{...opts,newestBias:0}).cells,S.generate('crossingMaze',{...opts,newestBias:100}).cells);
console.log(`${count} growing/hunt/prim/kruskal worlds: deterministic, bias endpoints, connectivity, exit, single protected cycle, stairs and previews passed`);

let primDifferences=0;for(let seed=0;seed<20;seed++){const opts={width:25,height:25,seed};if(!Buffer.from(S.generate('crossingMaze',{...opts,growth:'prim'}).cells).equals(Buffer.from(S.generate('crossingMaze',{...opts,growth:'frontier'}).cells)))primDifferences++;}assert(primDifferences>15);console.log(`Prim differs from uniform frontier in ${primDifferences}/20 comparison seeds`);

for(const wallStyle of ['dense','grid'])for(const [width,height] of [[15,15],[25,19],[40,40]])for(let seed=0;seed<10;seed++){
 const opts={wallStyle,width,height,seed,growth:'kruskal'},w=S.generate('crossingMaze',opts),base=S.generate('crossingMaze',{...opts,growth:'prim'});
 assert.notDeepEqual(w.cells,base.cells);
 const st=S.create('crossingMaze',opts);
 for(let id=0;id<w.cells.length;id++)if(w.cells[id]){st.id=id;const view=S.nearestView(st);for(let d=0;d<4;d++){const [x,y]=S.directions[d];assert.equal(view.find(t=>t.x===x&&t.y===y).wall,!w.edges.has(`${id}:${d}`));}}
}
console.log('60 Kruskal worlds: distinct from Prim, all-floor adjacent previews passed');
