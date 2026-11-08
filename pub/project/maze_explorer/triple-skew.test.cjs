const assert=require('node:assert/strict'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),A=require('./sheet-route-analysis.js');
let cases=0;
for(const tripleRoute of ['chain','return'])for(const shiftX of [-2,0,2])for(const shiftY of [-2,0,2]){
 if(!shiftX&&!shiftY)continue;
 for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid']){
  const options={tripleRoute,shiftX,shiftY,growth,wallStyle,seed:`skew-${growth}`,dimensions:[[20,20],[24,20],[20,20]],holeSize:4,returnShape:'irregular',holeRimWalls:true,holeApproach:'screened',floorUnderpasses:2,underpassShape:'mixed'};
  const s=S.create('tripleMaze',options),w=s.world,r=A.analyze(w);
  assert(r.allConnected&&r.exitReachable,JSON.stringify(options));
  if(tripleRoute==='return')assert(r.tripleReturnCandidates.length>0,'both intermediate sheets remain required');
  for(const [key,e]of w.edges){
   const [from,d]=key.split(':').map(Number),back=w.edges.get(`${e.to}:${e.transform[(d+2)%4]}`);
   assert.equal(back?.to,from,'each step has a reciprocal return');
  }
  for(const loop of w.guaranteedLoops)for(const axis of ['horizontal','vertical']){
   const path=loop[axis];for(const d of P.route(s,id=>id===path.start))assert(S.move(s,d));
   for(let lap=0;lap<3;lap++)for(const d of path.directions)assert(S.move(s,d,true));
   assert.equal(S.tripleLoopProgress(s).counts[loop.sheet][axis==='horizontal'?0:1],3,'learn actual skew period');
  }
  assert(S.tripleLoopProgress(s).counts.flat().every(n=>n===3));
  const next=S.randomTripleOptions('next-skew',w,{});
  assert.equal(next.shiftX,shiftX);assert.equal(next.shiftY,shiftY);assert.deepEqual(next.dimensions,options.dimensions);
  const saved=S.encodeSave({state:s,journey:{number:1,steps:0},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{}});
  const restored=S.decodeSave(saved).snapshot.state;
  assert.deepEqual(restored.world.layouts,w.layouts);
  assert.deepEqual(restored.tripleLoops,s.tripleLoops);
  // A remembered tile displaced by a learned skew period returns to the same screen location.
  const l=w.layouts[S.groundSheet(w,s.id)],v=S.sheetPeriods(l)[0],right=S.directions[s.frame[1]],down=S.directions[s.frame[2]];
  const record={id:s.id,x:s.x+v[0]*right[0]+v[1]*right[1],y:s.y+v[0]*down[0]+v[1]*down[1],frame:[...s.frame]};
  assert(S.foldedTripleMemory(s,{cells:new Map([['p',record]])}).some(p=>p.x===0&&p.y===0));
  s.atlasComplete=true;
  assert(S.completedTripleView(s).every(p=>w.domain.has(p.id)||w.cells[p.id]),'no bounding-box padding appears');
  cases++;
 }
}
console.log(`${cases} skew triple tori: 8 shift pairs, both routes, 4 generators, 2 wall styles; reciprocal edges, all floors, required returns, six learned loops and projections passed.`);
