const assert=require('node:assert/strict'),M=require('./core.js');
for(const topology of ['plane','torus']){
 const w=M.generate({width:topology==='plane'?25:24,height:topology==='plane'?25:24,topology,shiftX:topology==='torus'?2:0,shiftY:topology==='torus'?-2:0,birdMode:true,separateMaps:true}),g=M.createGame(w);
 const edge=Object.keys(M.DIRS).map(d=>M.transition(w,g.player,d)).find(e=>e&&e.to!==w.exit),id=edge.to;
 Object.assign(g.player,{world_position:id,perceived_x:id%w.width,perceived_y:Math.floor(id/w.width)});M.observe(g);
 const beforeMark=new Map(g.cognition.memory_nodes);g.cognition.archives.push({nodes:beforeMark});
 M.placeMarker(g);assert.equal(M.currentLandmark(g).label,'目印 1');
 const marked=new Map(g.cognition.memory_nodes);g.cognition.archives.push({nodes:marked});
 const wrong=new Map([...marked].map(([k,n])=>[k,{...n,feature:n.world_id===id?'2':n.feature}]));g.cognition.archives.push({nodes:wrong});
 const snapshot=JSON.stringify([...marked]);
 assert.deepEqual(M.matchEntranceMaps(g),[]);assert.deepEqual(M.matchLandmarkMaps(g),[1]);
 if(topology==='torus'){
  const [dx,dy]=M.deckVector(w,1,0),n=[...marked.values()].find(n=>n.world_id===id);
  const copies=new Map(marked);copies.set('another',{...n,x:n.x+dx,y:n.y+dy});g.cognition.archives.push({nodes:copies});
  assert.equal(M.inspectLandmarkMemory(g,3).classes,2);assert.deepEqual(M.matchLandmarkMaps(g),[1]);
  g.cognition.knowledgeBasis={rank:1,x:dx,y:dy};assert.equal(M.inspectLandmarkMemory(g,3).classes,1);
 }
 const state={turns:g.turns,birds:JSON.stringify(g.birds),vis:[...g.cognition.visible_cells]};
 assert.deepEqual(M.matchLandmarkMaps(g,true),topology==='torus'?[1,3]:[1]);
 assert.equal(JSON.stringify([...marked]),snapshot);assert.deepEqual({turns:g.turns,birds:JSON.stringify(g.birds),vis:[...g.cognition.visible_cells]},state);
 assert.deepEqual(M.matchLandmarkMaps(g,true),[]);
 g.player.world_position=w.exit;assert.equal(M.currentLandmark(g),null);assert.deepEqual(M.matchLandmarkMaps(g,true),[]);
}
console.log('PASS: marker matching on plane/dual torus; unseen or pre-placement/wrong-number records excluded, ambiguous copies retained until learned, immutable archives, no time/AI/vision changes, no remote or duplicate matching.');
