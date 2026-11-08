const assert=require('node:assert/strict'),K=require('./klein-biaxial.js'),E=require('./biaxial-exploration.js');
let trials=0,total=0,learned=0;
for(const algorithm of ['dfs','prim','growing','atelier-dfs','atelier-prim','atelier-kruskal','atelier-rooms','atelier-wilson'])for(const [sx,sy]of [[3,2],[-5,5],[0,0]]){
 const w=K.maze(K.create('free',sx,sy,{width:24,height:20}),algorithm,'auto-'+trials++);let p={id:w.start,frame:[0,1,2,3]};const book=E.create(w,p),seen=new Set([p.id]);
 const walk=route=>{for(const d of route){const q=K.step(w,p,d);assert(w.cells[q.id]);E.moved(book,p,d,q);p=q;seen.add(p.id);total++;E.observe(book,K.nearby(w,p,id=>!w.cells[id],6));}};
 for(let n=0;n<w.cells.length;n++){const path=E.path(w,p,q=>!seen.has(q.id));if(path===null)break;assert(path.length);walk(path);}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));
 for(let n=0;E.pending(book,3).length&&n<20;n++)walk(E.loop(book,p,3));
 assert.equal(E.pending(book,3).length,0,'learning must finish: '+algorithm);learned+=Object.values(book.counts).filter(n=>n>=3).length;
 const before=JSON.stringify(p),view=E.overlay(book,p,10,3);assert.equal(JSON.stringify(p),before);for(const t of view.values())assert(book.nodes.has(t.id),'no unknown terrain');assert.equal(E.overlay(book,p,10,0).size,0);
 walk(E.path(w,p,q=>q.id===w.exit));assert.equal(p.id,w.exit);
}
// A reverse step is not a lap; drawing cannot invent observation or experience.
const w=K.maze(K.create('free',3,2),'prim','backtrack');let p={id:w.start,frame:[0,1,2,3]},b=E.create(w,p),d=[0,1,2,3].find(d=>w.cells[K.step(w,p,d).id]),q=K.step(w,p,d);for(let i=0;i<20;i++){E.moved(b,p,d,q);E.moved(b,q,(d+2)%4,p);}assert.deepEqual(b.counts,{x:0,y:0});assert.equal(E.overlay(b,p,10,3).size,0);
console.log(trials+' full-floor runs, '+total+' steps, '+learned+' learned axes: all floors, loop experience and exits; no backtrack learning or unknown reveal.');
