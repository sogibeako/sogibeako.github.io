const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),F=require('./lattice-holes-fold.js'),L=require('./lattice.js'),Save=require('./lattice-holes-save.js');
// A controlled A-pocket → B-pocket → A-main chain, independent of random occurrence.
function chainFixture(){
 const st=H.create({walls:false,periodSize:12,shiftX:0,shiftY:0}),w=st.world,h=w.portals[0],l=w.layouts[0],id=(sheet,x,y)=>w.layouts[sheet].offset+y*l.width+x;
 const a=new Set([id(0,h.x,h.y-1)]),b=new Set([id(1,h.x,h.y-1),id(1,h.x+1,h.y-1),id(1,h.x+2,h.y-1),id(1,h.x+2,h.y)]);
 for(const pocket of [a,b])for(const n of pocket)for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e?.kind==='normal'&&!pocket.has(e.to))w.cells[e.to]=0;}
 for(const [key,e] of w.edges)if(!w.cells[+key.split(':')[0]]||!w.cells[e.to])w.edges.delete(key);
 w.guaranteedLoops=[{sheet:0,axis:'a',vector:[12,0],start:w.start,directions:Array(12).fill(1)}];
 const q=[w.start],seen=new Set(q);for(const n of q)for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));
 return st;
}
let cases=0,visits=0,chains=0,steps=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(let seed=0;seed<4;seed++){
 let st=H.create({maze:true,growth,wallStyle,periodSize:20,shiftX:seed%2?2:-2,shiftY:2,underpasses:4,underpassShape:seed%2?'corners':'mixed',holeRimWalls:true,seed:'pocket-learning-'+seed}),book={charts:[],active:-1};if(growth==='walls'&&wallStyle==='grid'&&seed===3)st=chainFixture();const w=st.world;
 const unseen=new Set([...w.cells.keys()].filter(n=>w.cells[n])),regions=[],owner=new Map();
 while(unseen.size){const ids=[unseen.values().next().value];unseen.delete(ids[0]);for(const n of ids){owner.set(n,regions.length);for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&e.kind!=='throat'&&unseen.delete(e.to))ids.push(e.to);}}regions.push(ids);}
 const mains=[0,1].map(sheet=>regions.filter(ids=>S.groundSheet(w,ids[0])===sheet).sort((a,b)=>b.length-a.length)[0]);
 const pockets=regions.filter(ids=>!mains.includes(ids));if(!pockets.length)continue;
 function check(){
  const chart=book.charts[book.active],here=S.position(w,st.id),right=S.directions[st.frame[1]],down=S.directions[st.frame[2]],before=[...chart.cells];
  for(const fold of [false,true]){st.foldLoops=fold;for(const p of F.memory(st,chart))if(!p.wall&&p.id>=0){const c=L.canonical(w.lattice,here.x+w.minX+p.x*right[0]+p.y*down[0],here.y+w.minY+p.x*right[1]+p.y*down[1]),at=S.position(w,p.id);assert.equal(c.x,at.x+w.minX);assert.equal(c.y,at.y+w.minY);assert.equal(S.groundSheet(w,p.id),S.groundSheet(w,st.id));}}
  assert.deepEqual([...chart.cells],before);
 }
 function move(d){R.start(st);assert(S.move(st,st.frame.indexOf(d)));R.observe(st,S.groundSheet(w,st.id));S.observeWalkingMap(st,book);steps++;if(st.last.kind==='throat')check();}
 function walk(goal){const q=[st.id],parents=new Map([[st.id,null]]);for(const n of q){if(n===goal)break;for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[n,d]);q.push(e.to);}}}assert(parents.has(goal));const path=[];for(let n=goal;parents.get(n);){const [p,d]=parents.get(n);path.unshift(d);n=p;}for(const d of path)move(d);S.observeWalkingMap(st,book);}
 // Learn only A's first period by real walking; B and the other period stay unknown.
 const loop=w.guaranteedLoops.find(p=>p.sheet===0&&p.axis==='a');walk(loop.start);for(let n=0;n<3;n++)for(const d of loop.directions)move(d);
 assert(R.knowledge(st).some(p=>p.sheet===0&&p.a===1&&p.b===0&&p.learned));assert(!R.knowledge(st).some(p=>p.sheet===1&&p.learned));
 const learnedBefore=R.knowledge(st).filter(p=>p.learned).map(p=>p.key);
 for(const pocket of pockets){walk(pocket[0]);visits++;check();const sheet=S.groundSheet(w,st.id),remembered=new Set([...book.charts[book.active].cells.values()].filter(p=>!p.wall&&!p.underpassProjection).map(p=>p.id));
  const saved=Save.decode(Save.encode({state:st,book,journey:{number:1,steps:0},controls:{}})).snapshot;assert.deepEqual(R.knowledge(saved.state),R.knowledge(st));book=saved.book;st=saved.state;
  walk(mains[sheet][0]);const known=new Set([...book.charts[book.active].cells.values()].filter(p=>!p.wall).map(p=>p.id));for(const id of remembered)assert(known.has(id));check();
 }
 for(const [key,e] of w.edges)if(e.kind==='throat'){const from=Number(key.split(':')[0]),a=regions[owner.get(from)],b=regions[owner.get(e.to)];if(pockets.includes(a)&&pockets.includes(b)){walk(from);move(Number(key.split(':')[1]));check();chains++;}}
 for(const key of learnedBefore)assert(R.knowledge(st).some(p=>p.key===key&&p.learned));cases++;
}
assert(cases>0&&visits>0&&chains>0);
console.log(`${cases} pocket worlds, ${visits} pocket visits, ${chains} direct pocket-to-pocket transitions, ${steps} moves: partial learning, rotated returns, unfolded/folded coordinates, retained ordinary floors and save/resume passed.`);
