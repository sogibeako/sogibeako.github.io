const assert=require('node:assert/strict'),M=require('./core.js');
const serialize=x=>JSON.stringify(x,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const chart=nodes=>new Map(nodes.map(n=>[`C${n.x},${n.y}`,n]));
let cases=0;
for(const shifts of [{},{shiftX:2},{shiftY:-2},{shiftX:2,shiftY:2}]){
 const w={...M.createTorusDemo({...shifts,openRoom:true}),separateMaps:true};
 for(const winding of [[1,0],[0,1],[1,1],[2,1]]){
  const g=M.createGame(w),[dx,dy]=M.deckVector(w,...winding),[ux,uy]=M.deckVector(w,0,winding[0]?1:0);
  const other=winding[0]?[ux,uy]:M.deckVector(w,1,0);
  const n=(x,y,feature='1',seenAt=1)=>({x,y,world_id:M.periodicId(w,x,y),terrain:1,feature,seenAt,firstSeen:0});
  const base=n(1,1),extra=n(2,1,'',3);
  g.cognition.memory_nodes=chart([{...base,seenAt:8}]);
  g.cognition.archives=[{nodes:chart([base,n(1+dx,1+dy),extra,n(extra.x+other[0],extra.y+other[1],'')]),turn:1}];
  const original=serialize(g.cognition.archives);
  assert.deepEqual(M.matchRecordedMaps(g),[],'unlearned duplicate must remain ambiguous');
  g.cognition.knowledgeBasis={rank:1,x:dx,y:dy};
  // Normalize live memory just as learning does, without learning the other period.
  const b=M.cognitivePosition(g,base.x,base.y);g.cognition.memory_nodes=chart([{...base,...b,seenAt:8}]);
  const before=serialize(g);assert.deepEqual(M.matchRecordedMaps(g),[0]);assert.equal(serialize(g),before);
  assert.deepEqual(M.matchRecordedMaps(g,true),[0]);
  assert.equal(g.cognition.memory_nodes.size,3,'unlearned direction retains its two floor images');
  assert.equal(g.cognition.memory_nodes.get(`C${b.x},${b.y}`).seenAt,8);
  assert.equal(serialize(g.cognition.archives),original);assert.equal(g.steps,0);
  assert.deepEqual(g.cognition.knowledgeBasis,{rank:1,x:dx,y:dy});
  // A twice-longer learned period does not identify a single traversal.
  const partial=M.createGame(w);partial.cognition.memory_nodes=chart([base]);
  partial.cognition.archives=[{nodes:chart([base,n(1+dx,1+dy)]),turn:1}];
  partial.cognition.knowledgeBasis={rank:1,x:2*dx,y:2*dy};
  assert.deepEqual(M.matchRecordedMaps(partial,true),[]);
  cases++;
 }
}
const actual=M.createGame(M.createArchiveDemo());
assert.deepEqual(M.matchRecordedMaps(actual),[]);
for(let i=0;i<24;i++)M.move(actual,'right');
const original=serialize(actual.cognition.archives),turns=actual.turns;
M.move(actual,'right');assert.equal(M.currentLandmark(actual),null);
assert.deepEqual(M.matchRecordedMaps(actual,true),[0]);
assert.equal(actual.turns,turns+1);assert.equal(serialize(actual.cognition.archives),original);
assert.equal(M.archiveGroups(actual).find(g=>g.live).members[0],0);
console.log(`PASS: ${cases} shifted/diagonal learned-period cases, ambiguous images withheld, unknown direction retained, nonprimitive period retained, detached preview, originals preserved, real 3-lap learning and off-landmark registration.`);

// Several shared anchors may differ by distinct known deck translations.
for(const basis of [{rank:1,x:8,y:0},{rank:2,x:8,y:8,offset:0}]){
 const g=M.createGame({...M.createTorusDemo({openRoom:true}),separateMaps:true});
 const n=(x,y,f)=>({x,y,feature:f,world_id:M.periodicId(g.world,x,y),terrain:1,firstSeen:0,seenAt:1});
 g.cognition.knowledgeBasis=basis;
 g.cognition.memory_nodes=chart([n(1,1,'1'),n(2,1,'2')]);
 g.cognition.archives=[{nodes:chart([n(9,1,'1'),n(18,1,'2')]),turn:1}];
 assert.deepEqual(M.matchRecordedMaps(g,true),[0]);assert.equal(g.cognition.memory_nodes.size,2);
}
console.log('PASS: multiple anchors agree modulo rank-one/rank-two knowledge.');
