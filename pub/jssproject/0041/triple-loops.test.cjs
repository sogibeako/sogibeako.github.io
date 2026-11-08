const assert=require('node:assert/strict'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['grid','dense']){
 const s=S.create('tripleMaze',{growth,wallStyle,seed:'loops-'+growth,holeRimWalls:true,holeApproach:'screened',holePlacement:'offset',dimensions:[[12,16],[24,16],[16,12]],floorUnderpasses:2,underpassShape:'mixed'});
 const progress=S.tripleLoopProgress(s);
 const first=[0,1,2,3].find(d=>s.world.edges.has(`${s.id}:${d}`));
 for(let i=0;i<12;i++){assert(S.move(s,first,true));assert(S.move(s,(first+2)%4,true));}
 assert(progress.counts.flat().every(n=>n===0),'backtracking is not winding');
 for(const circuit of s.world.guaranteedLoops){
  for(const axis of ['horizontal','vertical']){
   const path=circuit[axis];
   for(const d of P.route(s,id=>id===path.start))assert(S.move(s,d));
   for(let lap=0;lap<3;lap++)for(const d of path.directions)assert(S.move(s,d,true));
   assert.equal(progress.counts[circuit.sheet][axis==='horizontal'?0:1],3);
  }
 }
 assert(progress.counts.flat().every(n=>n===3),'all sheets retain knowledge after transfers');
 const snapshot={state:s,journey:{number:1,steps:0},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{}};
 const saved=S.encodeSave(snapshot),restored=S.decodeSave(saved).snapshot.state;
 assert.deepEqual(restored.tripleLoops,s.tripleLoops);
 const corrupt=JSON.parse(saved);corrupt.snapshot.state.tripleLoops.counts[0][0]=99;
 assert.throws(()=>S.decodeSave(JSON.stringify(corrupt)));
 delete snapshot.state.tripleLoops;
 assert.deepEqual(S.tripleLoopProgress(S.decodeSave(S.encodeSave(snapshot)).snapshot.state).counts,[[0,0],[0,0],[0,0]],'old save initializes without invented knowledge');
}
console.log('Eight triple tori: three actual laps on each axis, no backtracking credit, sheet transfer retention, save round-trip and invalid/legacy save handling passed.');
