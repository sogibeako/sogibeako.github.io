const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0;
for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]])for(const learned of [false,true]){
 const w=M.generate({width:16,height:16,topology:'torus',shiftX,shiftY,birdMode:true,separateMaps:true,loopLearning:true}),g=M.createGame(w);
 if(learned)g.cognition.known_loops.add('x');
 const [ax,ay]=M.deckVector(w,-2,1),[bx,by]=M.deckVector(w,3,-2);
 const sx=w.start%w.width,sy=Math.floor(w.start/w.width);
 const nodes=new Map();
 // A frozen chart with exactly one entrance, shifted by a deck vector.
 for(let y=sy-2;y<=sy+2;y++)for(let x=sx-2;x<=sx+2;x++){
  const id=M.periodicId(w,x,y);nodes.set(`C${x+ax},${y+ay}`,{x:x+ax,y:y+ay,world_id:id,terrain:w.cells[id],firstSeen:0,seenAt:0});
 }
 assert.equal([...nodes.values()].filter(n=>n.world_id===w.start).length,1);
 g.cognition.archives.push({nodes});const snapshot=JSON.stringify([...nodes]);
 g.player.perceived_x=sx+bx;g.player.perceived_y=sy+by;
 g.cognition.memory_nodes.clear();M.observe(g,1);
 const vis=[...g.cognition.visible_cells],progress=JSON.stringify(g.cognition.loopProgress),basis=[...g.cognition.known_loops];
 assert.deepEqual(M.matchEntranceMaps(g),[0]);assert.deepEqual(M.matchEntranceMaps(g,true),[0]);
 for(const n of nodes.values()){
  const p=M.cognitivePosition(g,n.x-ax+bx,n.y-ay+by),r=g.cognition.memory_nodes.get(`C${p.x},${p.y}`);
  assert.ok(r);assert.equal(r.world_id,n.world_id);assert.equal(M.periodicId(w,r.x,r.y),r.world_id);
 }
 assert.equal(JSON.stringify([...nodes]),snapshot);assert.deepEqual([...g.cognition.visible_cells],vis);
 assert.equal(JSON.stringify(g.cognition.loopProgress),progress);assert.deepEqual([...g.cognition.known_loops],basis);
 // Two unrecognized entrance images are never arbitrarily picked.
 const [ux,uy]=M.deckVector(w,0,1);const ambiguous=new Map(nodes);ambiguous.set('second',{...nodes.values().next().value,x:sx+ax+ux,y:sy+ay+uy,world_id:w.start});
 g.cognition.archives.push({nodes:ambiguous});assert.deepEqual(M.matchEntranceMaps(g,true),[]);
 cases++;
}
console.log(`PASS: ${cases} torus alignments; positive/negative/dual shifts, learned/unlearned periods, real-cell consistency, frozen charts, unchanged visibility and learning, ambiguous images rejected.`);
