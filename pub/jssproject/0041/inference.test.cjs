const assert = require('node:assert/strict');
const M = require('./core.js');
const g=M.createGame(M.createTorusDemo({diagonalRoom:true,selfVision:true,loopLearning:true}));
assert.equal(g.cognition.known_loops.size,0);
const oldWorlds=new Set([...g.cognition.memory_nodes.values()].map(n=>n.world_id));
for(const d of ['right','down','right','down','down']) assert.ok(M.move(g,d));
assert.equal(g.cognition.knowledgeSources.x,'vision');
assert.equal(g.cognition.knowledgeSources.y,'inference');
assert.deepEqual(g.inferredRecognized,['y']);
assert.equal(g.cognition.loopProgress.y,0,'inference never fabricates walked laps');
assert.ok(g.cognition.known_loops.has('y'));
assert.deepEqual(M.cognitivePosition(g,1,1),M.cognitivePosition(g,1,9));
for(const id of oldWorlds) assert.ok([...g.cognition.memory_nodes.values()].some(n=>n.world_id===id));
assert.equal(M.move(g,'down'),false);assert.deepEqual(g.inferredRecognized,[]);
const reset=M.createGame(g.world);assert.equal(reset.cognition.knowledgeSources.y,null);
// Two diagonals span an index-two subgroup: neither basic axis may be inferred.
const parity=M.createGame(M.createTorusDemo({openRoom:true,loopLearning:true,learningLaps:3}));
for(const dirs of [['right','down'],['right','up']]) for(let n=0;n<24;n++) for(const d of dirs) assert.ok(M.move(parity,d));
assert.ok(parity.cognition.compositeLoops.get('1,1').recognized);
assert.ok(parity.cognition.compositeLoops.get('1,-1').recognized);
assert.equal(parity.cognition.known_loops.size,0);
assert.notDeepEqual(M.cognitivePosition(parity,1,1),M.cognitivePosition(parity,9,1));
// Shifted geometry uses its own periods, not raw Cartesian directions.
const shifted=M.createGame(M.createTorusDemo({openRoom:true,shiftY:2,loopLearning:true,learningLaps:3}));
for(let lap=0;lap<3;lap++) for(let n=0;n<32;n++) M.move(shifted,'right');
for(let lap=0;lap<3;lap++) for(let n=0;n<8;n++) M.move(shifted,'down');
assert.equal(shifted.cognition.knowledgeSources.y,'walk');
assert.equal(shifted.cognition.knowledgeSources.x,null,'(4,1) and (0,1) do not imply (1,0)');
console.log('PASS: inferred axis from optical knowledge, sources, no invented lap counts, memory preservation, reset, parity obstruction and shifted periods.');
