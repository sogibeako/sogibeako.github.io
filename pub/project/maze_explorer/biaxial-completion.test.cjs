const a=require('node:assert/strict'),K=require('./klein-biaxial.js'),E=require('./biaxial-exploration.js'),U=require('./biaxial-underpasses.js');
for(const terrain of ['dfs','prim','atelier-rooms']){
 const w=U.add(K.maze(K.create('free',3,2,{width:24,height:20}),terrain,'complete-'+terrain),3,'mixed');
 let p={id:w.start,frame:[0,1,2,3]};const book=E.create(w,p),wall=id=>!w.cells[id];
 const observe=()=>E.observe(book,K.nearby(w,p,wall,6));observe();a.equal(book.complete,false);
 const floorIds=[...w.cells.keys()].filter(id=>w.cells[id]);
 for(const id of floorIds){const route=E.path(w,p,q=>q.id===id);a(route);for(const d of route){p=K.step(w,p,d);observe();}}
 a(book.complete);a.equal(book.seen.size,floorIds.length);
 const visible=K.nearby(w,p,wall,6),before=JSON.stringify([p,[...book.seen],book.counts,[...book.nodes]]);
 const chart=E.completedView(book,p,10,wall,visible);a.equal(chart.size,441);a([...chart.values()].some(t=>t.revealed&&t.wall));
 for(const [key,t]of visible)a.deepEqual(chart.get(key),t);
 for(const t of chart.values())a.equal(t.wall,wall(t.id),'underpass wall aliases remain walls');
 a.equal(JSON.stringify([p,[...book.seen],book.counts,[...book.nodes]]),before);
 // Relocation does not erase physical sight knowledge or rotate the observer.
 const landed={id:w.start,frame:[2,3,0,1]};E.observe(book,K.nearby(w,landed,wall,6));a(book.complete);
 a.equal(E.create(w,landed).complete,false);
}
console.log('3 generators: complete sight including separate underpass lanes, walls, current-view priority, relocation persistence and fresh reset passed.');
