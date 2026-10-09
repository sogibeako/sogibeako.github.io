const assert=require('node:assert/strict'),S=require('./connection-space.js');let cases=0,crossings=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const loopStyle of ['straight','meander'])for(let seed=0;seed<4;seed++){
 const opts={growth,wallStyle,loopStyle,seed,holeSize:seed%4+1,holeRimWalls:seed%2===0,floorUnderpasses:2,underpassShape:['straight','mixed','corners'][seed%3],dimensions:seed%2?[[16,16],[24,16],[16,16]]:[[12,12],[20,12],[12,12]]},st=S.create('tripleMaze',opts),w=st.world;
 assert.equal(w.sheets,3);assert.equal(w.portals.length,4);assert.deepEqual(w.cells,S.generate('tripleMaze',opts).cells);
 const q=[w.start],parents=new Map([[w.start,null]]);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert(w.cells[e.to]);assert.equal(w.edges.get(`${e.to}:${e.transform[(d+2)%4]}`)?.to,id);if(e.kind==='throat')assert.equal(Math.abs(S.groundSheet(w,id)-S.groundSheet(w,e.to)),1);if(!parents.has(e.to)){parents.set(e.to,[id,d]);q.push(e.to);}}
 assert.equal(q.length,w.cells.reduce((a,b)=>a+b,0));assert.equal(S.groundSheet(w,w.exit),2);
 for(const loop of w.guaranteedLoops)for(const path of [loop.horizontal,loop.vertical]){let id=path.start;for(const d of path.directions){const e=w.edges.get(`${id}:${d}`);assert(e);id=e.to;assert.equal(S.groundSheet(w,id),loop.sheet);}assert.equal(id,path.start);}
 const path=[];for(let id=w.exit;parents.get(id);){const [from,d]=parents.get(id);path.unshift(d);id=from;}
 const book={charts:[],active:-1},atlas=new Set(),seenSheets=new Set([0]);S.observeWalkingMap(st,book);const reverse=[];
 for(const d of path){const e=w.edges.get(`${st.id}:${d}`);reverse.unshift(e.transform[(d+2)%4]);assert(S.move(st,st.frame.indexOf(d)));if(e.kind==='throat')crossings++;seenSheets.add(S.groundSheet(w,st.id));S.observeWalkingMap(st,book);S.observeAtlas(st,atlas);}
 assert.equal(seenSheets.size,3);const before=new Set(atlas);for(const d of reverse){assert(S.move(st,st.frame.indexOf(d)));S.observeWalkingMap(st,book);S.observeAtlas(st,atlas);}assert.equal(st.id,w.start);for(const id of before)assert(atlas.has(id));
 for(const p of w.passages)assert.equal(S.groundSheet(w,p.vertical),p.baseSheet);
 cases++;
}
console.log(`${cases} triple-torus mazes: reproducible, all floors/exit reachable, six winding loops, reciprocal holes, ${crossings} hole transitions, A-B-C and return with retained atlas passed.`);
