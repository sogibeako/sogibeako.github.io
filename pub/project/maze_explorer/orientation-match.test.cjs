const assert=require('node:assert/strict'),O=require('./orientation.js');
const node=(x,y,feature,seenAt=1)=>({x,y,feature,terrain:1,world_id:y*17+x,seenAt});
const chart=nodes=>({frame:[99,99,99,99],origin:999,nodes:new Map(nodes.map(n=>[`${n.x},${n.y}`,n]))});
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
let rotation=O.identity();
for(let i=0;i<4;i++){
 for(const mirrored of [false,true]){
  const matrix=mirrored?O.compose(rotation,O.transforms.mirror):rotation,s=O.create();
  const raw=[node(0,0,'1'),node(2,0,'2'),node(0,3,'3'),node(1,1,'')];
  const mapped=raw.slice(0,3).map(n=>{const [x,y]=O.apply(matrix,n.x,n.y);return {...n,x:x+4,y:y-5,seenAt:9};});
  s.archives=[chart(raw)];s.chart.nodes=chart(mapped).nodes;
  const before=snap(s);assert.equal(O.inspectMatch(s,0).status,'ready');assert.equal(snap(s),before);
  const archive=snap(s.archives),visible=snap(s.chart.visible),player=snap(s.game.player);
  assert.equal(O.matchArchive(s,0).status,'matched');assert.equal(s.chart.nodes.size,4);
  for(const n of raw){const [x,y]=O.apply(matrix,n.x,n.y);assert.ok(s.chart.nodes.has(`${x+4},${y-5}`));}
  assert.equal(snap(s.archives),archive);assert.equal(snap(s.chart.visible),visible);assert.equal(snap(s.game.player),player);assert.equal(s.game.steps,0);
  assert.equal(O.inspectMatch(s,0).status,'matched');
 }
 rotation=O.compose(O.transforms.right,rotation);
}
for(const marks of [[node(0,0,'1')],[node(0,0,'1'),node(2,0,'2')]]){
 const s=O.create();s.archives=[chart(marks)];s.chart.nodes=chart(marks).nodes;
 const before=snap(s);assert.equal(O.matchArchive(s,0).status,'ambiguous');assert.equal(snap(s),before);
}
const s=O.create();s.archives=[chart([node(0,0,'O')])];s.chart.nodes=chart([node(0,0,'O')]).nodes;assert.equal(O.inspectMatch(s,0).status,'no-landmarks');
const real=O.create();for(const d of ['down','right']){O.move(real,d);O.placeMarker(real);}
for(const d of ['down','right','up','down'])O.move(real,d);
assert.equal(O.inspectMatch(real,0).status,'ready');const steps=real.game.steps;
O.matchArchive(real,0);assert.equal(real.game.steps,steps);
assert.equal(O.create().game.markers.size,0);
console.log('PASS: 8 observation-derived frame matches without stored frames/origins, ambiguous single/collinear marks withheld, no warp-pad identity, immutable preview/originals/visibility/player, actual marker/warp return matching, reset.');
