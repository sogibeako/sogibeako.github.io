const assert=require('node:assert/strict'),S=require('./connection-space.js');let cases=0,crossings=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const loopStyle of ['straight','meander'])for(let seed=0;seed<4;seed++){
 const opts={holePlacement:"offset",growth,wallStyle,loopStyle,seed,holeSize:seed%4+1,holeRimWalls:seed%2===0,floorUnderpasses:2,underpassShape:['straight','mixed','corners'][seed%3],dimensions:[[[8,10],[12,8],[10,8]],[[10,14],[22,12],[18,16]],[[24,24],[24,22],[20,24]],[[16,12],[18,14],[12,16]]][seed]},st=S.create('tripleMaze',opts),w=st.world;
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

let staggered=0;
for(const mode of ['doubleMaze','tripleMaze'])for(const growth of ['walls','dfs','prim','growing'])for(let seed=0;seed<4;seed++){
 const options={seed,growth,holePlacement:'offset',wallStyle:'grid',holeSize:seed+1,holeRimWalls:true,dimensions:mode==='doubleMaze'?[[16,18],[20,16]]:[[16,18],[24,16],[18,16]],floorUnderpasses:2,underpassShape:'mixed'};
 const w=S.generate(mode,options);assert.deepEqual(w.portals,S.generate(mode,options).portals);
 for(const p of w.portals){const l=w.layouts[p.sheet];assert(p.x>=2&&p.y>=2&&p.x+p.size<=l.width-2&&p.y+p.size<=l.height-2);}
 if(mode==='tripleMaze'){const ps=w.portals.filter(p=>p.sheet===1);assert(Math.abs(ps[0].x-ps[1].x)>=w.holeSize+2);if(ps[0].y!==ps[1].y)staggered++;}
 const q=[w.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 assert(seen.has(w.exit));assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));
}
assert(staggered>0);console.log('Offset holes: deterministic placement, separated rims, different Y positions and 32 double/triple connected worlds passed.');
