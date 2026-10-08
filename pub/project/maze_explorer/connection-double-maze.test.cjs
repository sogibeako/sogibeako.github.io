const assert=require('node:assert/strict'),S=require('./connection-space.js');
let throat=0,bends=0;
for(const loopStyle of ['straight','meander'])for(const growth of ['walls','dfs','prim','growing'])for(let seed=0;seed<20;seed++){
 const st=S.create('doubleMaze',{seed,growth,loopStyle}),w=st.world;
 assert.deepEqual(w.cells,S.generate('doubleMaze',{seed,growth,loopStyle}).cells);assert(w.wallCount>80);assert.equal(w.holes.size,8);assert.equal(S.position(w,w.exit).sheet,1);
 for(const {sheet,horizontal,vertical} of w.guaranteedLoops){const l=w.layouts[sheet];
  for(const path of [horizontal,vertical])if(new Set(path.directions).size>1)bends++;
  for(const [path,dx,dy] of [[horizontal,l.width,0],[vertical,0,l.height]])for(const reverse of [false,true]){
   const loop=S.create('doubleMaze',{seed,growth,loopStyle});loop.id=path.start;
   const route=reverse?[...path.directions].reverse().map(d=>(d+2)%4):path.directions;
   for(const d of route){assert(S.move(loop,d));assert.equal(S.position(w,loop.id).sheet,sheet);}
   assert.equal(loop.id,path.start);assert.equal(loop.x,(dx*(reverse?-1:1)||0));assert.equal(loop.y,(dy*(reverse?-1:1)||0));assert.deepEqual(loop.frame,[0,1,2,3]);
  }
 }
 const q=[w.start],seen=new Set(q),parent=new Map();for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert.equal(w.edges.get(`${e.to}:${(e.transform[d]+2)%4}`)?.to,id);if(e.kind==='throat')throat++;if(!seen.has(e.to)){seen.add(e.to);parent.set(e.to,[id,d]);q.push(e.to);}}
 assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));assert(seen.has(w.exit));
 const path=[];for(let id=w.exit;id!==w.start;){const [from,d]=parent.get(id);path.unshift(d);id=from;}
 const walker=S.create('doubleMaze',{seed,growth,loopStyle});let crossed=false;
 for(const wd of path){assert(S.move(walker,walker.frame.indexOf(wd)));if(walker.last.kind==='throat')crossed=true;}
 assert.equal(walker.id,w.exit);assert(crossed);
 for(const id of seen)for(const frame of [[0,1,2,3],[2,1,0,3],[0,3,2,1],[2,3,0,1]]){st.id=id;st.frame=frame;const v=S.nearestView(st);for(let d=0;d<4;d++){const [x,y]=S.directions[d],p=v.find(p=>p.x===x&&p.y===y),e=w.edges.get(`${id}:${frame[d]}`);assert.equal(p?.wall??true,!e,`${seed,growth,loopStyle}/${id}/${frame}/${d}`);if(e)assert.equal(p.id,e.to);}}
}
assert(throat>0);assert(bends>0);console.log('160 double-torus mini mazes: repeatable, connected, opposite-sheet exits, reciprocal portals, all floor views in 4 frames passed.');
