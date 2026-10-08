const assert=require('node:assert/strict'),S=require('./connection-space.js');
const w=S.generate('doubleMaze',{seed:'random-source',growth:'dfs',wallStyle:'grid',dimensions:[[20,20],[24,18]],holeSize:3,holeRimWalls:true,floorUnderpasses:3,underpassShape:'mixed'});let count=0;const methods=new Set(),styles=new Set();
const names=['generation','size','hole','loop','underpasses'];
for(let mask=0;mask<32;mask++)for(let seed=0;seed<3;seed++){
 const groups=Object.fromEntries(names.map((n,i)=>[n,!!(mask&(1<<i))])),o=S.randomDoubleOptions('test-'+seed,w,groups);assert.deepEqual(o,S.randomDoubleOptions('test-'+seed,w,groups));
 if(!groups.generation){assert.equal(o.growth,w.growth);assert.equal(o.wallStyle,w.wallStyle);}if(!groups.size)assert.deepEqual(o.dimensions,[[20,20],[24,18]]);
 if(!groups.hole){assert.equal(o.holeSize,w.holeSize);assert.equal(o.holeRimWalls,w.holeRimWalls);}if(!groups.loop)assert.equal(o.loopStyle,w.loopStyle);if(!groups.underpasses){assert.equal(o.floorUnderpasses,3);assert.equal(o.underpassShape,'mixed');}
 const n=S.generate('doubleMaze',o),q=[n.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=n.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}assert.equal(seen.size,n.cells.reduce((a,b)=>a+b,0));assert(seen.has(n.exit));methods.add(n.growth);styles.add(n.wallStyle);count++;
}
const odd={...w,layouts:[{width:19,height:21},{width:21,height:19}]};assert.equal(S.randomDoubleOptions('odd',odd,{generation:true}).wallStyle,'dense');
const large={...w,holeSize:20};assert(S.randomDoubleOptions('big',large,{size:true}).dimensions.flat().every(n=>n>=24));
console.log(`${count} randomized worlds: all 32 switch combinations, deterministic choices, retained settings, connected floors and exits; ${methods.size} generators / ${styles.size} wall styles.`);
