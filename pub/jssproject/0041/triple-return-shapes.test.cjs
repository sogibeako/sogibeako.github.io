const assert=require('node:assert/strict'),S=require('./connection-space.js'),A=require('./sheet-route-analysis.js');
const shapes=new Set();let count=0;
for(const size of [16,20])for(const holeSize of [3,4])for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(let seed=0;seed<3;seed++){
 const options={tripleRoute:'return',returnShape:'irregular',seed:'shape-'+seed,dimensions:[[size,size],[24,size],[size,size]],holeSize,holePlacement:'center',growth,wallStyle,floorUnderpasses:2,holeRimWalls:true,holeApproach:'screened'};
 const w=S.create('tripleMaze',options).world,r=A.analyze(w);
 assert(r.allConnected&&r.returnRequired);assert.deepEqual(r.requiredForExit,[1,2]);
 assert(w.returnEnclosures.some(b=>b.notch));shapes.add(JSON.stringify(w.returnEnclosures));
 for(const loop of w.guaranteedLoops)for(const axis of ['horizontal','vertical']){let id=loop[axis].start;for(const d of loop[axis].directions){assert(w.edges.has(`${id}:${d}`));id=w.edges.get(`${id}:${d}`).to;}assert.equal(id,loop[axis].start);}
 if(seed===0){const again=S.create('tripleMaze',options).world;assert.deepEqual(w.cells,again.cells);assert.deepEqual(w.returnEnclosures,again.returnEnclosures);}
 const next=S.randomTripleOptions('next',w,{});assert.equal(next.returnShape,'irregular');count++;
}
assert(shapes.size>4);console.log(count+' irregular return layouts: required B/C, all floors, six cycles, reproducible contours and continuation; '+shapes.size+' distinct shapes.');
