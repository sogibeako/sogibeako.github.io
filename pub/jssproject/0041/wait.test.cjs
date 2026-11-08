const assert=require('node:assert/strict'),M=require('./core.js');
const world=M.generate({width:9,height:9,seed:'wait'}),g=M.createGame(world),player={...g.player};
for(let i=0;i<10;i++)assert.ok(M.waitTurn(g));
assert.deepEqual(g.player,player);assert.equal(g.steps,0);assert.equal(g.turns,10);assert.equal(g.lastEvent,'wait');
assert.equal(g.lastTransition.kind,'wait');M.move(g,'up');assert.equal(g.turns,10);
const direction=Object.keys(M.DIRS).find(d=>M.transition(world,g.player,d));M.move(g,direction);assert.equal(g.steps,1);assert.equal(g.turns,11);
// Waiting advances the bird at half action speed, including contact while stationary.
const cells=new Uint8Array(121);for(let y=1;y<10;y++)for(let x=1;x<10;x++)cells[y*11+x]=1;
const b=M.createGame({width:11,height:11,cells,start:24,exit:108,seed:'wait-bird',birdMode:true});
b.bird.position=26;M.waitTurn(b);assert.equal(b.bird.position,26);M.waitTurn(b);assert.equal(b.bird.position,25);assert.equal(b.bird.state,'CHASE');
M.waitTurn(b);M.waitTurn(b);assert.equal(b.lastEvent,'teleport');assert.equal(b.steps,0);assert.equal(b.turns,4);assert.equal(b.teleports,1);
const pos=b.bird.position;for(let i=0;i<4;i++){M.waitTurn(b);assert.equal(b.bird.position,pos);}assert.equal(b.bird.cooldown,0);
const restart=M.createGame(b.world);assert.equal(restart.steps,0);assert.equal(restart.turns,0);assert.equal(restart.teleports,0);
// A stationary action is not a loop traversal; adding waits cannot earn knowledge.
for(const learningLaps of [3,5]){
 const w=M.createTorusDemo({loopLearning:true,learningLaps}),a=M.createGame(w),b=M.createGame(w);
 for(let i=0;i<50;i++)M.waitTurn(a);
 assert.deepEqual(a.cognition.loopProgress,{x:0,y:0});assert.equal(a.cognition.known_loops.size,0);
 for(let i=0;i<8*learningLaps;i++){M.waitTurn(a);M.move(a,'right');M.move(b,'right');}
 assert.deepEqual(a.cognition.loopProgress,b.cognition.loopProgress);assert.deepEqual(M.knowledgeSummary(a),M.knowledgeSummary(b));assert.equal(a.steps,b.steps);
}
// Waiting never collects a key or opens a door on its own.
const keyed=M.createGame(M.generate({keyDoor:true,birdMode:true})),keys=[...keyed.player.keys],doors=[...keyed.openedDoors];
M.waitTurn(keyed);assert.deepEqual(keyed.player.keys,keys);assert.deepEqual([...keyed.openedDoors],doors);
keyed.won=true;const before=keyed.turns;assert.equal(M.waitTurn(keyed),false);assert.equal(keyed.turns,before);
console.log('PASS: wait actions, movement/action accounting, bird timing and stationary contact, cooldown, reset, no false loop learning, inventory preservation, won-state freeze.');
