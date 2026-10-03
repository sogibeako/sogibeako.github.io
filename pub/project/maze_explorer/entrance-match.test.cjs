const assert=require('node:assert/strict'),M=require('./core.js');
for(const algorithm of ['dfs','rooms']){
 const w=M.generate({algorithm,birdMode:true,separateMaps:true}),g=M.createGame(w);
 const original=g.cognition.memory_nodes,saved=JSON.stringify([...original]);
 g.bird.position=w.start;M.waitTurn(g);
 assert.deepEqual(M.matchEntranceMaps(g,true),[],'away from entrance cannot match');
 g.cognition.archives.push({nodes:new Map([['unmatched',{world_id:w.exit,x:w.exit%w.width,y:Math.floor(w.exit/w.width)}]])});
 Object.assign(g.player,{world_position:w.start,perceived_x:w.start%w.width,perceived_y:Math.floor(w.start/w.width)});M.observe(g);
 const before={turns:g.turns,steps:g.steps,birds:JSON.stringify(g.birds),vis:[...g.cognition.visible_cells],player:JSON.stringify(g.player)};
 const current=new Map(g.cognition.memory_nodes);
 assert.deepEqual(M.matchEntranceMaps(g),[0]);assert.equal(g.cognition.matchedArchives.size,0);
 assert.deepEqual(M.matchEntranceMaps(g,true),[0]);
 assert.ok([...original.keys()].every(k=>g.cognition.memory_nodes.has(k)));
 assert.ok(!g.cognition.memory_nodes.has('unmatched'));
 for(const [id,node]of current)assert.deepEqual(g.cognition.memory_nodes.get(id),node);
 assert.equal(JSON.stringify([...original]),saved);
 assert.deepEqual({turns:g.turns,steps:g.steps,birds:JSON.stringify(g.birds),vis:[...g.cognition.visible_cells],player:JSON.stringify(g.player)},before);
 assert.deepEqual(M.matchEntranceMaps(g,true),[]);
 g.bird.position=w.start;M.waitTurn(g);assert.equal(g.cognition.matchedArchives.size,0);
 assert.equal(M.createGame(w).cognition.matchedArchives.size,0);
}
const t=M.createGame(M.generate({width:16,height:16,topology:'torus',birdMode:true,separateMaps:true}));
t.world.separateMaps=false;t.cognition.archives.push({nodes:new Map(t.cognition.memory_nodes)});assert.deepEqual(M.matchEntranceMaps(t,true),[]);
console.log('PASS: entrance-only matching, unanchored notebooks excluded, read-only eligibility, current memory wins, frozen archives, no turns or AI changes, no duplicate matches, reset after transfer, disabled mode guarded.');
