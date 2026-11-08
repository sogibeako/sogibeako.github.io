const assert=require('node:assert/strict'),M=require('./core.js');
const node=(id,feature='',seenAt=1)=>({world_id:id,x:id%17,y:Math.floor(id/17),terrain:1,feature,seenAt,firstSeen:0});
const chart=(nodes,dx=0)=>new Map(nodes.map(n=>['C'+(n.world_id+dx),{...n,x:n.x+dx}]));
function fixture(){
 const g=M.createGame(M.createWarpDemo());
 // Current chart sees marker 1; the older chart with marker 2 must wait for the bridge.
 g.cognition.memory_nodes=chart([node(20,'1',8)]);
 g.cognition.archives=[
  {nodes:chart([node(22,'2'),node(23)],-10),turn:1},
  {nodes:chart([node(20,'1'),node(21),node(22,'2')],10),turn:2},
  {nodes:chart([node(23),node(24)]),turn:3}
 ];
 g.archiveNotes.set(0,'残すメモ');return g;
}
const g=fixture(),serialize=x=>JSON.stringify(x,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const before=serialize(g),original=serialize(g.cognition.archives);
assert.deepEqual(M.matchRecordedMaps(g),[1,0]);assert.equal(serialize(g),before,'preview is read-only');
assert.deepEqual(M.matchRecordedMaps(g,true),[1,0]);
assert.deepEqual([...g.cognition.memory_nodes.values()].map(n=>n.world_id).sort((a,b)=>a-b),[20,21,22,23]);
assert.equal(g.cognition.memory_nodes.get('C20').seenAt,8,'keep latest observed feature');
assert.equal(serialize(g.cognition.archives),original);assert.equal(g.archiveNotes.get(0),'残すメモ');
assert.equal(g.turns,0);assert.equal(g.steps,0);assert.equal(g.player.world_position,g.world.start);
assert.deepEqual([...g.cognition.matchedArchives],[1,0]);assert.deepEqual(M.matchRecordedMaps(g,true),[]);
assert.deepEqual(M.archiveGroups(g).find(x=>x.live).members,[0,1]);
assert.equal(g.cognition.matchedArchives.has(2),false,'ordinary overlap is not evidence');
const bad=fixture();bad.cognition.memory_nodes=chart([node(20,'1'),node(22,'2')]);
bad.cognition.archives=[{nodes:chart([node(20,'1'),{...node(22,'2'),x:6}]),turn:1}];
assert.deepEqual(M.matchRecordedMaps(bad,true),[],'conflicting anchors stay separate');
const ambiguous=fixture();ambiguous.cognition.archives=[{nodes:chart([node(20,'1'),node(21,'1')]),turn:1}];
assert.deepEqual(M.matchRecordedMaps(ambiguous,true),[],'duplicate marker images stay separate');
const collision=fixture();collision.cognition.archives=[{nodes:chart([node(20,'1'),{...node(25),x:3,y:1}]),turn:1}];
assert.deepEqual(M.matchRecordedMaps(collision,true),[],'conflicting geometry stays separate');
const torus=M.createGame(M.createArchiveDemo()),torusBefore=serialize(torus);
assert.deepEqual(M.matchRecordedMaps(torus,true),[]);assert.equal(serialize(torus),torusBefore);
const actual=M.createGame(M.createWarpDemo());
for(const d of ['down','down','right','right','up','down'])M.move(actual,d);
assert.equal(M.currentLandmark(actual),null);
assert.ok(M.matchRecordedMaps(actual).includes(0),'remembered entrance can anchor while standing elsewhere');
const steps=actual.steps;M.matchRecordedMaps(actual,true);assert.equal(actual.steps,steps);
assert.deepEqual(M.matchRecordedMaps(M.createGame(actual.world)),[]);
console.log('PASS: fixed-point chain, offsets, latest observations, no ordinary-overlap merge, conflicting/ambiguous evidence, immutable originals/notes/preview, no time, unlearned torus ambiguity, actual warp return away from landmark, restart.');
