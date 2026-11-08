const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0;
for(const topology of ['plane','torus'])for(const algorithm of ['dfs','rooms'])for(const policy of ['far','unseen','known'])for(const memory of ['initial','all','none']) {
 const w=M.generate({width:topology==='plane'?31:30,height:topology==='plane'?25:24,topology,algorithm,shiftX:topology==='torus'?2:0,shiftY:topology==='torus'?-2:0,birdMode:true,birdCount:2,keyDoor:topology==='plane',keyCount:3,teleportPolicy:policy,seed:'destination'});
 const g=M.createGame(w),copy=M.createGame(w);
 for(const state of [g,copy]) {
  if(memory!=='initial')state.cognition.memory_nodes.clear();
  if(memory==='all')for(let id=0;id<w.cells.length;id++)if(w.cells[id])state.cognition.memory_nodes.set('copy-'+id,{world_id:id});
  state.bird.position=state.player.world_position;
 }
 const known=new Set([...g.cognition.memory_nodes.values()].map(n=>n.world_id));
 // Independent BFS over legal transitions, with all unopened doors blocked.
 const forbidden=new Set((w.puzzle?.locks||[]).map(l=>l.door));
 const distances=new Map([[w.start,0]]),queue=[w.start];
 for(let i=0;i<queue.length;i++)for(const dir of Object.keys(M.DIRS)){
  const edge=M.transition(w,{world_position:queue[i]},dir);
  if(edge&&!forbidden.has(edge.to)&&!distances.has(edge.to)){distances.set(edge.to,distances.get(queue[i])+1);queue.push(edge.to);}
 }
 const features=new Set((w.puzzle?.locks||[]).flatMap(l=>[l.key,l.door]));
 const eligible=queue.filter(id=>id!==w.start&&id!==w.exit&&!features.has(id)&&!g.birds.some(b=>b.position===id));
 const preferred=eligible.filter(id=>policy==='far'||(policy==='known'?known.has(id):!known.has(id)));
 const candidates=preferred.length?preferred:eligible,far=candidates.filter(id=>distances.get(id)>=8);
 M.waitTurn(g);M.waitTurn(copy);
 assert.equal(g.lastEvent,'teleport');assert.ok((far.length?far:candidates).includes(g.player.world_position));
 assert.deepEqual(g.player,copy.player);assert.deepEqual(g.lastTeleport,copy.lastTeleport);
 assert.equal(g.lastTeleport.wasKnown,known.has(g.player.world_position));
 assert.equal(g.lastTeleport.fallback,policy!=='far'&&!preferred.length);
 assert.equal(g.lastTeleport.distance,distances.get(g.player.world_position));
 assert.equal(g.cognition.loopVisits.size,1);cases++;
}
// A nearby eligible known destination wins over far unknown cells.
const w=M.generate({width:31,height:23,birdMode:true,teleportPolicy:'known'}),g=M.createGame(w);
const near=Object.keys(M.DIRS).map(d=>M.transition(w,g.player,d)).find(e=>e&&e.to!==w.exit).to;
g.cognition.memory_nodes.clear();g.cognition.memory_nodes.set('another-periodic-image',{world_id:near});g.bird.position=w.start;M.waitTurn(g);
assert.equal(g.player.world_position,near);assert.equal(g.lastTeleport.distance,1);
assert.throws(()=>M.generate({teleportPolicy:'invalid'}));
console.log(`PASS: ${cases} destination-policy cases; independent reachability, memory preferences, fallback, distance priority, two birds, keys, dual-shift torus, deterministic transfer.`);
