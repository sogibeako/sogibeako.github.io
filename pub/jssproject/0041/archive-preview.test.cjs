const assert=require('node:assert/strict'),M=require('./core.js');
let cases=0;
for(const [shiftX,shiftY]of [[0,0],[2,0],[0,-2],[2,-2]]){
 const w=M.generate({width:16,height:16,topology:'torus',shiftX,shiftY,separateMaps:true}),g=M.createGame(w),nodes=new Map();
 const sx=w.start%w.width,sy=Math.floor(w.start/w.width),[dx,dy]=M.deckVector(w,1,1);
 for(let i=0;i<3;i++)nodes.set(String(i),{x:sx+i*dx,y:sy+i*dy,world_id:w.start,terrain:1,firstSeen:i,seenAt:i,feature:i===2?'latest':'old'});
 g.cognition.archives.push({nodes});const saved=JSON.stringify([...nodes]),live=JSON.stringify([...g.cognition.memory_nodes]);
 assert.equal(M.archiveCells(g,0,true).length,3);
 g.cognition.knowledgeBasis={rank:1,x:2*dx,y:2*dy};assert.equal(M.archiveCells(g,0,true).length,2,'two periods do not imply one');
 g.cognition.knowledgeBasis={rank:1,x:dx,y:dy};const folded=M.archiveCells(g,0,true);
 assert.equal(folded.length,1);assert.equal(folded[0].firstSeen,0);assert.equal(folded[0].seenAt,2);assert.equal(folded[0].feature,'latest');
 assert.equal(M.periodicId(w,folded[0].x,folded[0].y),w.start);
 assert.equal(M.archiveCells(g,0).length,3);folded[0].terrain=0;M.archiveCells(g,0)[0].x=999;
 assert.equal(JSON.stringify([...nodes]),saved);assert.equal(JSON.stringify([...g.cognition.memory_nodes]),live);assert.equal(g.turns,0);assert.equal(g.cognition.matchedArchives.size,0);cases++;
}
assert.deepEqual(M.archiveCells(M.createGame(M.generate()),99,true),[]);
const g=M.createGame({...M.createTorusDemo({openRoom:true,loopLearning:true,learningLaps:3}),separateMaps:true});
for(let i=0;i<8;i++)M.move(g,'right');
g.cognition.archives.push({nodes:new Map(g.cognition.memory_nodes)});const before=M.archiveCells(g,0,true).length;
for(let i=0;i<16;i++)M.move(g,'right');
assert.ok(M.archiveCells(g,0,true).length<before);assert.equal(M.archiveCells(g,0).length,before);
console.log(`PASS: ${cases} shifted archive previews; partial and composite knowledge, timestamps, detached results, immutable live/original maps, no turns or matching, actual three-lap folding.`);
