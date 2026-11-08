const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
const snapshot=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const bounds={minX:-80,maxX:100,minY:-20,maxY:80};
const raw=g=>M.unfoldedCells(g,bounds);
const a=M.createGame(M.createTorusDemo({loopLearning:true,learningLaps:3})),b=M.createGame(M.createTorusDemo({loopLearning:false}));
for(let i=0;i<40;i++){assert(M.move(a,'right'));assert(M.move(b,'right'));}
assert(a.cognition.known_loops.has('x'));
assert.deepEqual(raw(a),raw(b),'folded learning retains exactly the observations of an unlearned walk');
assert(raw(a).length>a.cognition.memory_nodes.size);
const fingerprint=snapshot(a),before=raw(a);M.subjectiveCells(a,bounds);assert.deepEqual(raw(a),before);assert.equal(snapshot(a),fingerprint);
const future={minX:60,maxX:64,minY:0,maxY:7};assert.equal(M.unfoldedCells(a,future).length,0);assert(M.subjectiveCells(a,future).length>0,'learned copies appear only in folded display');
const g=J.start({width:12,height:12,seed:'unfolded-save',topology:'torus',loopLearning:true,learningLaps:3});S.attach(g);
for(let i=0;i<180;i++)S.act(g,'move',['right','down','left','up'][Math.floor(i/9)%4]);
const restored=S.decode(S.encode(g,'same')).game;assert.deepEqual(raw(restored),raw(g));assert.equal(JSON.parse(S.encode(restored,'same')).check,JSON.parse(S.encode(g,'same')).check);
assert.equal(raw(J.restart(g)).some(n=>n.seenAt>0),false);
console.log('Unfolded memory: observed-only cells, retained learning, no unseen copies, reversible display, replay and restart passed.');

for(const [shiftX,shiftY]of [[2,0],[0,-2],[2,2]]){
 const options={width:12,height:12,topology:'torus',seed:'raw-shift',shiftX,shiftY};
 const learned=J.start({...options,loopLearning:true,learningLaps:3}),plain=J.start({...options,loopLearning:false});S.attach(learned);
 for(let i=0;i<240;i++){const d=['right','down','left','up'][(Math.floor(i/13)+i%3)%4];S.act(learned,'move',d);M.move(plain,d);}
 assert.deepEqual(raw(learned),raw(plain));assert.deepEqual(raw(S.decode(S.encode(learned,'same')).game),raw(learned));
}
console.log('Single/dual shifted torus observation and restored unfolded maps passed.');
