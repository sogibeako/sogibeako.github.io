const a=require('node:assert/strict'),G=require('./exploration-generation.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),A=require('./triple-warp-arrows.js');
for(let i=0;i<8;i++){
 const base={dimensions:[[20,20],[24,20],[20,20]],holeSize:3,holeRimWalls:true,growth:'prim',wallStyle:'grid',floorUnderpasses:2,underpassShape:'mixed',loopStyle:'meander',tripleRoute:i%2?'return':'chain',returnShape:'irregular'},course={rules:{enabled:true,pool:['warp']},randomTripleRoute:false,randomTripleHole:true,randomTripleUnderpasses:true,shifts:{enabled:true,pool:['none','x','y','both']}};
 const options=G.chooseTriple(base,'warp-course-'+i,course);a(['warp','warpHidden'].includes(options.ruleMode));a.deepEqual(options,G.chooseTriple(base,'warp-course-'+i,course));const s=S.create('tripleMaze',options),seen=new Set([s.id]);let moves=0;
 const walk=path=>{for(const d of path){a(S.move(s,d));seen.add(s.id);if(s.last.kind==='warp')seen.add(s.last.from);a(++moves<20000);}};
 while(true){const path=P.explore(s,seen);if(path===null)break;a(path.length);walk(path);}a.equal(seen.size,P.targets(s).size);a.equal(P.warpPending(s).length,0);a.equal(A.records(s).length,s.features.warps.size);
 for(const pair of s.world.guaranteedLoops)for(const axis of ['horizontal','vertical']){const c=pair[axis];walk(P.route(s,id=>id===c.start));for(let n=0;n<8&&S.tripleLoopProgress(s).counts[pair.sheet][axis==='horizontal'?0:1]<3;n++)walk(c.directions.map(d=>s.frame.indexOf(d)));}
 a(S.tripleLoopProgress(s).counts.flat().every(n=>n===3));walk(P.route(s,id=>id===s.world.exit));a.equal(s.id,s.world.exit);
}
console.log('8 random-course warp worlds: varying holes, underpasses, seams, chain/return; all floors, all directed arrows, six learned loops and exit.');
