const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),F=require('./lattice-holes-fold.js'),Save=require('./lattice-holes-save.js'),Session=require('./lattice-holes-session.js');
let moves=0,holes=0,underpasses=0,maxRecords=0;
for(const growth of ['dfs','prim','growing','walls']){
 let st=H.create({maze:true,periodSize:24,shiftX:2,shiftY:-4,underpasses:6,underpassShape:'mixed',holeRimWalls:true,growth,seed:'endurance-'+growth}),book={charts:[],active:-1};
 function move(d){assert(Session.step(st,book,st.frame.indexOf(d)).moved);moves++;holes+=st.last.kind==='throat';underpasses+=st.last.kind==='underpass';assert(book.charts[book.active].cells.size>0);maxRecords=Math.max(maxRecords,...book.charts.map(c=>c.cells.size));}
 function walk(goal){const queue=[st.id],parent=new Map([[st.id,null]]);for(const n of queue){if(n===goal)break;for(let d=0;d<4;d++){const e=st.world.edges.get(`${n}:${d}`);if(e&&!parent.has(e.to)){parent.set(e.to,[n,d]);queue.push(e.to);}}}assert(parent.has(goal));const path=[];for(let n=goal;parent.get(n);){const [p,d]=parent.get(n);path.unshift(d);n=p;}for(const d of path)move(d);}
 for(let round=0;round<8;round++){
  for(const route of st.world.guaranteedLoops){walk(route.start);for(const d of route.directions)move(d);}
  for(const p of st.world.passages||[]){walk(p.horizontal);walk(p.vertical);}
  const chart=book.charts[book.active],size=chart.cells.size;
  for(const fold of [true,false]){st.foldLoops=fold;const visible=F.memory(st,chart);assert(visible.every(p=>Math.abs(p.x)<=9&&Math.abs(p.y)<=9));assert.equal(chart.cells.size,size);}
  const snapshot={state:st,book,journey:{number:1,steps:0},controls:{}},loaded=Save.decode(Save.encode(snapshot)).snapshot;assert.deepEqual(loaded.book,book);st=loaded.state;book=loaded.book;
 }
}
assert(holes>0&&underpasses>0&&moves>5000);
console.log(`${moves} moves, ${holes} hole transitions, ${underpasses} underpass transitions, up to ${maxRecords} records per chart: four generators, repeated loops, crossings, display toggles and 32 save/resume cycles passed.`);
// A large unfolded archive must allocate output only for visible coordinates.
const st=H.create({walls:false}),cells=new Map();st.foldLoops=false;for(let i=-50000;i<50000;i++)cells.set(`${i},0`,{x:i,y:0,id:st.id});const before=performance.now(),visible=F.memory(st,{cells});assert.equal(visible.length,19);assert.equal(cells.size,100000);console.log(`100,000-record unfolded map: ${visible.length} output cells, ${(performance.now()-before).toFixed(1)} ms (informational).`);
