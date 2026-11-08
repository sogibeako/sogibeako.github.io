const assert=require('node:assert/strict'),K=require('./klein-biaxial.js'),E=require('./biaxial-exploration.js'),U=require('./biaxial-underpasses.js'),R=require('./biaxial-rules.js');
let placed=0;
for(const algorithm of ['dfs','prim','growing','atelier-dfs','atelier-prim','atelier-rooms','atelier-kruskal'])for(const [sx,sy] of [[3,2],[-5,5],[0,0]]){
 const w=U.add(K.maze(K.create('free',sx,sy,{width:24,height:20}),algorithm,'warp-'+placed),3,'mixed'),s=R.create(w,'warp');if(!s.features)continue;placed++;
 for(const [from,to]of s.features.warps){assert.notEqual(from%13,0);assert.equal(s.features.warps.get(to),from);}
 let p={id:w.start,frame:[2,1,0,3]},steps=0;const seen=new Set([p.id]),book=E.create(w,p);
 function move(d){const from=p,q=K.step(w,p,d);assert(w.cells[q.id]);seen.add(q.id);E.moved(book,from,d,q);p=R.afterMove(s,q,++steps);seen.add(p.id);if(p.id!==q.id){book.trail=[p.id];book.trailAxes=[];}}
 for(let n=0;n<4000;n++){const path=R.path(w,s,p,q=>!seen.has(q.id)||(q.entered!==undefined&&!seen.has(q.entered)));if(path===null)break;assert(path.length);for(const d of path)move(d);}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0),algorithm+' full floors');
 for(let n=0;E.pending(book,3).length&&n<10;n++){const path=R.loop(w,s,book,p,3);assert(path);for(const d of path)move(d);}assert.equal(E.pending(book,3).length,0);
 const exit=R.path(w,s,p,q=>q.id===w.exit);assert(exit);for(const d of exit)move(d);assert.equal(p.id,w.exit);
}
assert(placed>=15);console.log(placed+' warp worlds: preserved numeric landmarks, all floors, three loop experiences, reflected frames and exit passed.');
