const assert=require('node:assert/strict'),S=require('./connection-space.js');
const groups=['generation','size','hole','loop','underpasses'];let count=0;
for(const dimensions of [[[10,14],[22,12],[18,16]],[[9,11],[15,9],[11,13]]]){
 const source=S.generate('tripleMaze',{seed:'random-source',dimensions,wallStyle:dimensions[0][0]%2?'dense':'grid',growth:'prim',holeSize:3,holeRimWalls:true,loopStyle:'meander',floorUnderpasses:1,underpassShape:'mixed'});
 for(let mask=0;mask<32;mask++){
  const flags=Object.fromEntries(groups.map((g,i)=>[g,!!(mask&(1<<i))])),o=S.randomTripleOptions('switch-'+mask,source,flags);
  assert.deepEqual(o,S.randomTripleOptions('switch-'+mask,source,flags));
  if(!flags.size)assert.deepEqual(o.dimensions,dimensions);
  for(const [group,keys] of Object.entries({generation:['growth','wallStyle'],hole:['holeSize','holeRimWalls'],loop:['loopStyle'],underpasses:['floorUnderpasses','underpassShape']}))if(!flags[group])for(const key of keys)assert.equal(o[key],source[key]);
  assert(o.dimensions[1][0]>o.dimensions[1][1]);assert(o.holeSize<=S.holeLimit('triple',o.dimensions));
  const w=S.generate('tripleMaze',o),q=[w.start],seen=new Set(q);
  for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
  assert(seen.has(w.exit));assert.equal(seen.size,w.cells.reduce((a,b)=>a+b,0));count++;
 }
}
const large={layouts:[{width:24,height:24},{width:24,height:22},{width:24,height:24}],growth:'dfs',wallStyle:'grid',holeSize:9,holeRimWalls:false,loopStyle:'straight',floorUnderpasses:0,underpassShape:'straight'};
for(let n=0;n<10;n++){const o=S.randomTripleOptions(n,large,{size:true});assert(o.holeSize<=S.holeLimit('triple',o.dimensions));assert(o.dimensions[1][0]>o.dimensions[1][1]);}
console.log(`${count} randomized triple mazes: every switch combination, reproducibility, disabled settings retained, valid central holes and all floors/exit reachable passed.`);
