const assert=require('node:assert/strict');
const M=require('./core.js');
const walk=(g,d,n)=>{for(let i=0;i<n;i++)assert.ok(M.move(g,d));};
for(const shift of [2,-2,4,-4]) for(const axis of ['shiftX','shiftY']) for(const laps of [3,5]) {
 const g=M.createGame(M.createTorusDemo({openRoom:true,loopLearning:true,learningLaps:laps,[axis]:shift}));
 const dir=axis==='shiftY'?'right':'down', reverse=axis==='shiftY'?'left':'up';
 const period=shift%4===0?16:32;
 for(let n=1;n<=laps;n++) {
  walk(g,n%2?dir:reverse,period);
  const entries=[...g.cognition.compositeLoops.values()];assert.equal(entries.length,1);assert.equal(entries[0].count,n);
  assert.equal(entries[0].recognized,n===laps);
 }
 assert.equal(g.cognition.known_loops.size,0,'mixed route does not grant basic axes');
 const p=M.cognitivePosition(g,1,1);
 assert.deepEqual(M.cognitivePosition(g,1+(axis==='shiftY'?period:0),1+(axis==='shiftX'?period:0)),p);
 const [bx,by]=M.deckVector(g.world,axis==='shiftY'?1:0,axis==='shiftX'?1:0);
 assert.notDeepEqual(M.cognitivePosition(g,1+bx,1+by),p,'do not shorten the learned period');
 for(const node of g.cognition.memory_nodes.values()) assert.equal(M.periodicId(g.world,node.x,node.y),node.world_id);
 const transverse=axis==='shiftY'?'down':'right';
 for(let n=0;n<laps;n++)walk(g,transverse,8);
 assert.equal(g.cognition.knowledgeBasis.rank,2);
 assert.deepEqual(M.cognitivePosition(g,1+(axis==='shiftY'?period:8),1+(axis==='shiftX'?period:8)),M.cognitivePosition(g,1,1));
 const fresh=M.createGame(g.world);assert.equal(fresh.cognition.compositeLoops.size,0);assert.equal(fresh.cognition.knowledgeBasis,null);
}
const local=M.createGame(M.createTorusDemo({openRoom:true,shiftY:2,loopLearning:true}));
for(let i=0;i<20;i++){walk(local,'right',3);walk(local,'left',3);}
assert.equal(local.cognition.compositeLoops.size,0);
const off=M.createGame(M.createTorusDemo({openRoom:true,shiftY:2}));walk(off,'right',160);assert.equal(off.cognition.compositeLoops.size,0);
console.log('PASS: shifted straight cycles, inverse direction, 3/5 thresholds, independent route knowledge, exact subgroup folding, rank-two combination, no partial-backtrack awards and reset.');
