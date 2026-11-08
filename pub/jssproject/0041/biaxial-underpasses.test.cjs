const assert=require('node:assert/strict'),K=require('./klein-biaxial.js'),U=require('./biaxial-underpasses.js'),E=require('./biaxial-exploration.js');
let count=0,placed=0,corners=0;
for(const algorithm of ['dfs','prim','growing','atelier-dfs','atelier-prim','atelier-growing','atelier-kruskal','atelier-wilson','atelier-hunt','atelier-rooms','atelier-division','atelier-eller'])for(const shape of ['straight','corners','mixed'])for(const [sx,sy]of [[3,2],[-5,5],[0,0]]){
 const original=K.maze(K.create('free',sx,sy,{width:24,height:20}),algorithm,'underpass-'+count++),w=U.add(original,4,shape);for(const axis of ['x','y'])if(E.cycles(original)[axis])assert(E.cycles(w)[axis],'preserve original seam loops');placed+=w.passages.length;corners+=w.passages.filter(p=>p.arms).length;
 const seen=new Set([w.start]),queue=[w.start];for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);assert(e);if(!w.cells[e.to])continue;const q=K.step(w,{id,frame:[0,1,2,3]},d),back=K.step(w,q,(d+2)%4);assert.equal(back.id,id);if(!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));
 for(const p of w.passages)for(const id of [p.horizontal,p.vertical])for(const frame of [[0,1,2,3],[2,1,0,3]]){
  const state={id,frame},dirs=[0,1,2,3].filter(d=>w.cells[K.step(w,state,d).id]);assert.equal(dirs.length,2);assert(!dirs.some(d=>K.step(w,state,d).id===(id===p.horizontal?p.vertical:p.horizontal)));
  const symbols={'02':'｜','13':'ー','01':'└','12':'┌','23':'┐','03':'┘'};assert.equal(U.symbol(w,id,frame),symbols[dirs.join('')]);
  const view=K.nearby(w,state,n=>!w.cells[n],6);for(let d=0;d<4;d++){const [x,y]=K.D[d];assert.equal(view.get(x+','+y).wall,!dirs.includes(d));}
 }
 let p={id:w.start,frame:[2,1,0,3]};for(const d of K.solve(w,p)){p=K.step(w,p,d);assert(w.cells[p.id]);}assert.equal(p.id,w.exit);
 assert.deepEqual(U.add(original,4,shape).cells,w.cells);
}
assert(placed>0&&corners>0);console.log(count+' conditions: '+placed+' underpasses ('+corners+' corners), all lanes connected, reversible, symbols and adjacent walls agree in both frames.');
