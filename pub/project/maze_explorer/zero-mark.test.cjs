const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
for(const topology of ['plane','torus']){
 const g=S.attach(J.start({seed:'zero-'+topology,width:topology==='plane'?21:20,height:topology==='plane'?17:16,algorithm:'dfs',topology,warpMode:true,warpInvisible:true,separateMaps:true}));
 assert.equal(S.act(g,'zero').status,'blocked');assert.equal(g.zeroMarks,undefined);
 const direction=Object.keys(M.DIRS).find(d=>M.ruleTransition(g.world,g.player,d));S.act(g,'move',direction);
 const before=[g.steps,g.turns,g.markers.size],id=g.player.world_position;
 assert.equal(S.act(g,'zero').status,'placed');assert.equal(M.featureAt(g,id),'0');assert.deepEqual([g.steps,g.turns,g.markers.size],before);assert.equal(S.act(g,'zero').status,'existing');
 const text=S.encode(g,'same');assert.equal(S.encode(S.decode(text).game,'same'),text);assert.deepEqual([...S.decode(text).game.zeroMarks],[id]);
 const probe=M.createGame(g.world);probe.player.world_position=[...g.world.warps.keys()][0];assert.equal(M.placeZeroMark(probe).status,'placed');assert.equal(M.featureAt(probe,probe.player.world_position),'0');
 probe.player.world_position=g.world.exit;assert.equal(M.placeZeroMark(probe).status,'blocked');assert.equal(probe.markers.size,0);
 const archived=new Map([['a',{world_id:id,x:1,y:1,terrain:1,feature:'0'}]]);probe.cognition.archives=[{nodes:archived,sources:[]}];probe.cognition.memory_nodes=new Map([['b',{world_id:id,x:2,y:2,terrain:1,feature:'0'}]]);assert.deepEqual(M.matchRecordedMaps(probe),[]);
}
console.log('PASS: zero marks on ordinary and hidden warp floors, duplicate/protected cells, no turn or numbered marker cost, no zero-only matching, plane/torus replay.');
