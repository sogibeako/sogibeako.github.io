const assert=require('node:assert/strict'),S=require('./connection-space.js'),A=require('./sheet-route-analysis.js'),P=require('./crossing-autowalk.js');
let cases=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const holeSize of [3,4]){
 const s=S.create('tripleMaze',{tripleRoute:'return',seed:'return-'+growth,dimensions:[[16,16],[24,16],[16,16]],holeSize,holePlacement:'center',growth,wallStyle,floorUnderpasses:3,underpassShape:'mixed',holeRimWalls:true,holeApproach:'screened'}),r=A.analyze(s.world);
 assert(r.allConnected&&r.returnRequired);assert.deepEqual(r.requiredForExit,[1,2]);let at=0;for(const sheet of r.sheetRoute)if(sheet===[0,1,2,1,0][at])at++;assert.equal(at,5);
 for(const loop of s.world.guaranteedLoops)for(const axis of ['horizontal','vertical']){const path=loop[axis];for(const d of P.route(s,id=>id===path.start))assert(S.move(s,d));for(let lap=0;lap<3;lap++)for(const d of path.directions)assert(S.move(s,d,true));}
 assert(s.tripleLoops.counts.flat().every(n=>n===3));for(const d of P.route(s,id=>id===s.world.exit))assert(S.move(s,d));assert.equal(S.groundSheet(s.world,s.id),0);
 const o=S.randomTripleOptions('next-'+growth+wallStyle+holeSize,s.world,{generation:true,size:true,hole:true,loop:true,underpasses:true}),next=S.create('tripleMaze',o);
 assert.equal(o.tripleRoute,'return');assert.deepEqual(A.analyze(next.world).requiredForExit,[1,2]);cases++;
}
assert.throws(()=>S.create('tripleMaze',{tripleRoute:'return'}));
console.log(cases+' return mazes + randomized successors: A-B-C-B-A required, all floors connected, all six loops learned, exit reached, invalid dimensions rejected.');
