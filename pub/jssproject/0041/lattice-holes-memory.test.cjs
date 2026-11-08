const assert=require('node:assert/strict'),S=require('./connection-space.js'),H=require('./lattice-holes.js'),L=require('./lattice.js');let cases=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(let seed=0;seed<4;seed++){
 const st=H.create({maze:true,seed,growth,wallStyle,periodSize:20,underpasses:2,underpassShape:seed%2?'mixed':'corners',shiftX:seed%2?2:-2,shiftY:seed<2?2:-2}),book={charts:[],active:-1};S.observeWalkingMap(st,book);
 const routeTo=(goal,sheet)=>{const q=[st.id],parent=new Map([[st.id,null]]);let end;for(const id of q){if(goal(id)){end=id;break;}for(let d=0;d<4;d++){const e=st.world.edges.get(`${id}:${d}`);if(e&&S.position(st.world,e.to).sheet===sheet&&!parent.has(e.to)){parent.set(e.to,[id,d]);q.push(e.to);}}}assert.notEqual(end,undefined);const route=[];for(let id=end;parent.get(id);){const [from,d]=parent.get(id);route.unshift(d);id=from;}for(const d of route){assert(S.move(st,st.frame.indexOf(d)));S.observeWalkingMap(st,book);}};
 // Follow a full skew period first; subjective memory should remain continuous.
 const initialChart=book.charts[book.active];
 const loop=st.world.guaranteedLoops.find(p=>p.sheet===0&&p.axis===(seed%2?'a':'b'));
 routeTo(id=>id===loop.start,0);
 for(const d of loop.directions){assert(S.move(st,st.frame.indexOf(d)));S.observeWalkingMap(st,book);assert.equal(book.charts[book.active],initialChart,'seam walking stays on one chart');}
 const throat=id=>[0,1,2,3].find(d=>st.world.edges.get(`${id}:${d}`)?.kind==='throat');
 routeTo(id=>throat(id)!==undefined,0);const before=book.charts[book.active],ids=new Set([...before.cells.values()].filter(p=>!p.wall).map(p=>p.id)),from=st.id,entryDirection=throat(st.id);
 S.move(st,st.frame.indexOf(throat(st.id)));S.observeWalkingMap(st,book);
 // Go to a different rim cell of the same hole before returning.
 routeTo(id=>{const d=throat(id);return d!==undefined&&d===(entryDirection+1+2*(seed%2))%4;},1);
 S.move(st,st.frame.indexOf(throat(st.id)));const o=S.observeWalkingMap(st,book);
 assert.equal(o.chart===before,true,`${growth}/${seed}: original A chart reused`);
 const after=new Set([...o.chart.cells.values()].filter(p=>!p.wall).map(p=>p.id));for(const id of ids)assert(after.has(id));
 // Every retained floor must still project to its actual cell under the new frame.
 const here=S.position(st.world,st.id),right=S.directions[st.frame[1]],down=S.directions[st.frame[2]];
 for(const p of o.chart.cells.values())if(!p.wall){const dx=p.x-st.x,dy=p.y-st.y,c=L.canonical(st.world.lattice,here.x+st.world.minX+dx*right[0]+dy*down[0],here.y+st.world.minY+dx*right[1]+dy*down[1]),actual=S.position(st.world,p.id);assert.equal(c.x,actual.x+st.world.minX);assert.equal(c.y,actual.y+st.world.minY);}
 // Display folding after rotated/reflected hole return must preserve real-cell projection.
 const F=require('./lattice-holes-fold.js'),R=require('./lattice-holes-loops.js');R.start(st);st.loopExperience.counts=new Map([['0:1:0',3],['0:0:1',3]]);
 const original=[...o.chart.cells];
 for(const p of F.memory(st,o.chart))if(!p.wall&&p.id>=0){const c=L.canonical(st.world.lattice,here.x+st.world.minX+p.x*right[0]+p.y*down[0],here.y+st.world.minY+p.x*right[1]+p.y*down[1]),actual=S.position(st.world,p.id);assert.equal(c.x,actual.x+st.world.minX);assert.equal(c.y,actual.y+st.world.minY);}
 assert.deepEqual([...o.chart.cells],original);
 const count=book.charts.length;S.observeWalkingMap(st,book);assert.equal(book.charts.length,count);cases++;
}
console.log(`${cases} A-B-A returns through different sides of the same hole: original chart identity and all remembered floors retained.`);

