const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0;
for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]])for(const winding of [[1,0],[1,1],[2,0]]){
 const w=M.generate({width:16,height:16,topology:'torus',shiftX,shiftY,separateMaps:true}),g=M.createGame(w);
 const sx=w.start%w.width,sy=Math.floor(w.start/w.width),[dx,dy]=M.deckVector(w,...winding);
 const nodes=new Map([['first',{x:sx,y:sy,world_id:w.start,terrain:1,firstSeen:0,seenAt:0}],['copy',{x:sx+dx,y:sy+dy,world_id:w.start,terrain:1,firstSeen:0,seenAt:2}]]);
 g.cognition.archives.push({nodes});const original=JSON.stringify([...nodes]);
 assert.deepEqual(M.inspectEntranceMemory(g,0),{images:2,classes:2});assert.deepEqual(M.matchEntranceMaps(g,true),[]);
 g.cognition.knowledgeBasis={rank:1,x:dx,y:dy};
 assert.deepEqual(M.inspectEntranceMemory(g,0),{images:2,classes:1});assert.deepEqual(M.matchEntranceMaps(g),[0]);
 if(winding[0]===2){const [x,y]=M.deckVector(w,1,0);g.cognition.archives.push({nodes:new Map([...nodes,['half',{x:sx+x,y:sy+y,world_id:w.start,terrain:1}]])});assert.equal(M.inspectEntranceMemory(g,1).classes,2);}
 const before={turns:g.turns,vis:[...g.cognition.visible_cells],knowledge:JSON.stringify(g.cognition.knowledgeBasis)};
 assert.deepEqual(M.matchEntranceMaps(g,true),[0]);assert.equal(JSON.stringify([...nodes]),original);
 assert.deepEqual({turns:g.turns,vis:[...g.cognition.visible_cells],knowledge:JSON.stringify(g.cognition.knowledgeBasis)},before);cases++;
}
// Independent diagonal knowledge of index two must not identify a basic period.
const g=M.createGame({...M.createTorusDemo({openRoom:true}),separateMaps:true});
const w=g.world,sx=w.start%w.width,sy=Math.floor(w.start/w.width);
g.cognition.knowledgeBasis={rank:2,x:16,y:8,offset:8};
g.cognition.archives.push({nodes:new Map([[0,{x:sx,y:sy,world_id:w.start}],[1,{x:sx+8,y:sy,world_id:w.start}]])});
assert.equal(M.inspectEntranceMemory(g,0).classes,2);assert.deepEqual(M.matchEntranceMaps(g,true),[]);
// Actual walking unlocks a previously ambiguous archived chart after three laps.
const walk=M.createGame({...M.createTorusDemo({openRoom:true,loopLearning:true,learningLaps:3}),separateMaps:true});
const p=walk.player;
walk.cognition.archives.push({nodes:new Map([[0,{x:p.perceived_x,y:p.perceived_y,world_id:walk.world.start,terrain:1}],[1,{x:p.perceived_x+8,y:p.perceived_y,world_id:walk.world.start,terrain:1}]])});
assert.deepEqual(M.matchEntranceMaps(walk),[]);
for(let i=0;i<24;i++)M.move(walk,'right');
assert.ok(walk.cognition.known_loops.has('x'));assert.deepEqual(M.matchEntranceMaps(walk,true),[0]);
console.log(`PASS: ${cases} shifted knowledge matches; composite and repeated periods, index-two ambiguity, immutable archives, no free learning, actual three-lap unlock.`);
