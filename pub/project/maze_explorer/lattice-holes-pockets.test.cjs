const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),Save=require('./lattice-holes-save.js');let cases=0,pockets=0,blocked=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const shift of [[2,2],[-4,2],[0,-2]])for(const size of [12,20])for(let seed=0;seed<2;seed++){
 const options={maze:true,growth,wallStyle,periodSize:size,seed:'pocket-'+seed,shiftX:shift[0],shiftY:shift[1],holeRimWalls:true,underpasses:2,underpassShape:'mixed'},st=H.create(options),w=st.world,book={charts:[],active:-1};
 assert.deepEqual(H.create(options).world.cells,w.cells);
 const q=[w.start],seen=new Set(q);for(const n of q)for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e){assert(w.cells[n]&&w.cells[e.to]);if(!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));assert.equal(w.holeRimWallCount,[...w.rimCells].filter(n=>!w.cells[n]).length);
 for(const route of w.guaranteedLoops){let n=route.start,x=0,y=0;for(const d of route.directions){const e=w.edges.get(`${n}:${d}`);assert(e);n=e.to;x+=S.directions[d][0];y+=S.directions[d][1];}assert.equal(n,route.start);assert.deepEqual([x||0,y||0],route.vector.map(n=>n||0));}
 for(const [key,e] of w.candidates)if(e.kind==='throat'&&!w.cells[e.to]&&w.cells[Number(key.split(':')[0])]){
  const [from,d]=key.split(':').map(Number);assert(!w.edges.has(key));
  for(const frame of [[0,1,2,3],[0,3,2,1],[1,2,3,0]]){const test={...st,id:from,frame},local=frame.indexOf(d),[x,y]=S.directions[local];assert(!S.move(test,local));const tile=S.nearestView(test).find(p=>p.x===x&&p.y===y);assert(tile?.wall,'blocked hole appears as a wall');}blocked++;
 }
 const left=new Set(seen),regions=[];while(left.size){const ids=[left.values().next().value];left.delete(ids[0]);for(const n of ids)for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&e.kind!=='throat'&&left.delete(e.to))ids.push(e.to);}regions.push(ids);}
 const pocket=regions.find(ids=>regions.some(other=>S.groundSheet(w,other[0])===S.groundSheet(w,ids[0])&&other.length>ids.length));
 if(pocket){pockets++;const sheet=S.groundSheet(w,pocket[0]),main=regions.filter(ids=>S.groundSheet(w,ids[0])===sheet).sort((a,b)=>b.length-a.length)[0];
  const walk=goal=>{const queue=[st.id],parents=new Map([[st.id,null]]);for(const n of queue){if(n===goal)break;for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[n,d]);queue.push(e.to);}}}assert(parents.has(goal));const path=[];for(let n=goal;parents.get(n);){const [p,d]=parents.get(n);path.unshift(d);n=p;}S.observeWalkingMap(st,book);for(const d of path){assert(S.move(st,st.frame.indexOf(d)));S.observeWalkingMap(st,book);}};
  walk(main[0]);const chart=book.charts[book.active];walk(pocket[0]);const remembered=new Set([...book.charts[book.active].cells.values()].filter(p=>!p.wall).map(p=>p.id));assert(remembered.has(pocket[0]));walk(main[0]);assert.equal(book.charts[book.active],chart);const returned=new Set([...chart.cells.values()].filter(p=>!p.wall).map(p=>p.id));for(const id of remembered)assert(returned.has(id),'pocket stays in same sheet map after return');
 }
 const loaded=Save.decode(Save.encode({state:st,book,journey:{number:1,steps:0},controls:{}})).snapshot;assert.equal(loaded.state.world.holeRimWalls,true);assert.deepEqual(loaded.state.world.cells,w.cells);assert.deepEqual(loaded.book,book);cases++;
}
assert(pockets>0&&blocked>0);
console.log(`${cases} rim-wall worlds: deterministic generation, all floors/exit connected, four period loops, ${blocked} blocked hole entries in three frames, ${pockets} pocket journeys with retained maps, save roundtrip passed.`);
