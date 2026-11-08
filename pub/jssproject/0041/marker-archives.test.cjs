const assert=require('node:assert/strict'), M=require('./core.js');
for(const topology of ['plane','torus']) {
  const g=M.createGame(M.generate({topology,width:topology==='torus'?16:17,height:topology==='torus'?16:17,separateMaps:true,seed:'first-walk'}));
  // Find an ordinary floor reachable from the entrance through actual movement.
  const queue=[[g.player.world_position,[]]],seen=new Set();let route;
  while(queue.length){const [id,path]=queue.shift();if(seen.has(id))continue;seen.add(id);
    if(id!==g.world.start&&id!==g.world.exit){route=path;break;}
    for(const dir of Object.keys(M.DIRS)){const edge=M.transition(g.world,{...g.player,world_position:id},dir);if(edge)queue.push([edge.to,[...path,dir]]);}
  }
  route.forEach(dir=>M.move(g,dir));
  const before=new Map(g.cognition.memory_nodes);
  assert.equal(M.placeMarker(g).status,'placed');
  const record=new Map(g.cognition.memory_nodes), marker=g.player.world_position;
  const wrong=new Map([...record].map(([id,n])=>[id,{...n,feature:n.world_id===marker?'2':n.feature}]));
  g.cognition.archives.push({nodes:before},{nodes:record},{nodes:wrong},{nodes:new Map(record)});
  g.cognition.matchedArchives.add(1);
  const snapshot=JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
  assert.deepEqual(M.markerArchives(g,'1'),[1,3]);
  assert.deepEqual(M.markerArchives(g,'2'),[]);
  assert.deepEqual(M.markerArchives(g,null),[]);
  assert.equal(JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v),snapshot);
  M.nameMarker(g,'1','手がかり');assert.deepEqual(M.markerArchives(g,'1'),[1,3]);
  const result=M.markerArchives(g,'1');result.pop();assert.deepEqual(M.markerArchives(g,'1'),[1,3]);
  assert.deepEqual(M.markerArchives(M.createGame(g.world),'1'),[]);
}
console.log('PASS: marker archive search includes matched records, excludes pre-placement/wrong/unplaced markers, ignores names, preserves state, returns independent results, plane/torus.');
