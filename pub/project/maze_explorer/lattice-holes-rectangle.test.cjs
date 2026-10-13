const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),Save=require('./lattice-holes-save.js'),O=require('./lattice-holes-options.js');
let count=0;
for(const [width,height]of [[8,24],[24,8],[14,22],[22,14],[10,16],[16,10]])for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid']){
 const state=H.create({maze:true,periodWidth:width,periodHeight:height,growth,wallStyle,shiftX:2,shiftY:-4,seed:'rect-'+count,underpasses:3,underpassShape:'mixed',holeRimWalls:true}),w=state.world;
 assert.equal(w.lattice.width,width);assert.equal(w.lattice.height,height);
 const q=[state.id],parents=new Map([[state.id,null]]);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[id,d]);q.push(e.to);}}
 assert.equal(q.length,w.cells.reduce((a,b)=>a+b,0));assert(parents.has(w.exit));
 for(const route of w.guaranteedLoops){let id=route.start;for(const d of route.directions){const e=w.edges.get(`${id}:${d}`);assert(e);id=e.to;}assert.equal(id,route.start);}
 const path=[];for(let n=w.exit;parents.get(n);){const [prev,d]=parents.get(n);path.unshift(d);n=prev;}
 for(const d of path)assert(S.move(state,state.frame.indexOf(d)));assert.equal(state.id,w.exit);
 const saved=Save.decode(Save.encode({state,book:{charts:[],active:-1},journey:{number:1,steps:0},controls:{}}));assert.equal(saved.snapshot.state.world.lattice.height,height);
 const next=H.create(O.applied(w,'next'));assert.equal(next.world.lattice.width,width);assert.equal(next.world.lattice.height,height);count++;
}
assert.throws(()=>H.create({periodWidth:13,periodHeight:20}));assert.throws(()=>H.create({periodWidth:26,periodHeight:20}));
console.log(count+' rectangular mazes: four generators, both wall styles, shifts, underpasses, pockets, full reachability, real exit walk, save and next maze passed.');
