const assert=require('node:assert/strict'),S=require('./connection-space.js');let cases=0;
for(const wallStyle of ['dense','grid'])for(const underpassShape of ['straight','mixed','corners'])for(const growth of ['walls','dfs','prim','growing'])for(let seed=0;seed<3;seed++){
 const st=S.create('doubleMaze',{seed,growth,wallStyle,underpassShape,holeRimWalls:true,floorUnderpasses:3,dimensions:[[20,20],[24,18]]}),book={charts:[],active:-1};S.observeWalkingMap(st,book);
 const routeTo=(goal,sheet)=>{const q=[st.id],parent=new Map([[st.id,null]]);let end;for(const id of q){if(goal(id)){end=id;break;}for(let d=0;d<4;d++){const e=st.world.edges.get(`${id}:${d}`);if(e&&S.groundSheet(st.world,e.to)===sheet&&!parent.has(e.to)){parent.set(e.to,[id,d]);q.push(e.to);}}}assert.notEqual(end,undefined);const route=[];for(let id=end;parent.get(id);){const [from,d]=parent.get(id);route.unshift(d);id=from;}for(const d of route){assert(S.move(st,st.frame.indexOf(d)));S.observeWalkingMap(st,book);}};
 const throat=id=>[0,1,2,3].find(d=>st.world.edges.get(`${id}:${d}`)?.kind==='throat');
 routeTo(id=>throat(id)!==undefined,0);const before=book.charts[book.active],ids=new Set([...before.cells.values()].filter(p=>!p.wall).map(p=>p.id)),from=st.id;
 S.move(st,st.frame.indexOf(throat(st.id)));S.observeWalkingMap(st,book);
 // Return through the exact same opening; distant openings may lack a known anchor.
 S.move(st,st.frame.indexOf(throat(st.id)));const o=S.observeWalkingMap(st,book);
 assert.equal(o.chart===before,true,`${growth}/${seed}: original A chart reused`);
 const after=new Set([...o.chart.cells.values()].filter(p=>!p.wall).map(p=>p.id));for(const id of ids)assert(after.has(id));
 const count=book.charts.length;S.observeWalkingMap(st,book);assert.equal(book.charts.length,count);cases++;
}
console.log(`${cases} A-B-A returns through the same opening with rim walls: original chart identity and all remembered floors retained.`);