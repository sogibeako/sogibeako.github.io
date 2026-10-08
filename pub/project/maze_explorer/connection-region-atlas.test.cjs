const assert=require('node:assert/strict'),S=require('./connection-space.js');let pockets=0;
for(let seed=0;seed<12;seed++){
 const st=S.create('doubleMaze',{seed,growth:'prim',wallStyle:'grid',dimensions:[[20,20],[24,18]],holeSize:3,holeRimWalls:true,floorUnderpasses:3,underpassShape:'mixed'}),book={records:new Map(),owners:new Map(),nextNumber:1};
 const w=st.world,first=S.observeRegions(st,book,[{id:st.id}]);assert.equal(first.regions.length,1);assert.equal(first.current.ids.length,1);assert.equal(first.current.complete,false);
 const unseen=new Set([...w.cells.keys()].filter(id=>w.cells[id])),components=[];
 while(unseen.size){const q=[unseen.values().next().value];unseen.delete(q[0]);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&e.kind!=='throat'&&unseen.has(e.to)){unseen.delete(e.to);q.push(e.to);}}components.push(q);}
 for(const ids of components){for(const id of ids){st.id=id;S.observeRegions(st,book,[{id}]);}const r=book.regions.find(r=>r.ids.includes(ids[0]));assert(r.complete);assert.equal(r.ids.length,ids.length);const number=r.number;for(const id of [...ids].reverse()){st.id=id;const r=S.observeRegions(st,book,[{id}]).current;assert.equal(r.number,number);assert.equal(r.ids.length,ids.length);}if(ids.length<20)pockets++;}
 assert.equal(book.regions.length,components.length);assert.equal([...book.records.values()].filter(r=>!r.wall).length,w.cells.reduce((a,b)=>a+b,0));
 // Opposite sides of an underpass remain distinct unless an observed path joins them.
 for(const p of w.passages){const isolated={records:new Map(),owners:new Map(),nextNumber:1};S.observeRegions(st,isolated,[{id:p.horizontal},{id:p.vertical}]);assert.equal(isolated.regions.length,2);}
}
console.log(`12 worlds: observed-only regions, completion, stable revisits, merges and separate underpass lanes passed (${pockets} small pockets).`);
