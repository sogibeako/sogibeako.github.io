const assert=require('node:assert/strict'),M=require('./core.js');
function fixture(wall=false){
 const width=11,height=11,cells=new Uint8Array(121);
 for(let y=1;y<10;y++)for(let x=1;x<10;x++)if(!wall||x!==5||y===9)cells[y*width+x]=1;
 return {width,height,cells,start:24,exit:108,seed:'bird-fixture',birdMode:true};
}
function place(g,x,y){Object.assign(g.player,{world_position:y*11+x,perceived_x:x,perceived_y:y,perceived_position:'C'+(y*11+x)});M.observe(g);}
const g=M.createGame(fixture());g.bird.position=25;
const oldMemory=[...g.cognition.memory_nodes.keys()];
assert.ok(M.move(g,'right'));assert.equal(g.lastEvent,'teleport');assert.equal(g.teleports,1);
assert.notEqual(g.player.world_position,g.bird.position);assert.notEqual(g.player.world_position,g.world.exit);
assert.equal(g.player.perceived_position,'C'+g.player.world_position);
assert.ok(oldMemory.every(k=>g.cognition.memory_nodes.has(k)));assert.equal(g.bird.cooldown,4);
const stopped=g.bird.position;
for(let i=0;i<4;i++){
 const d=Object.keys(M.DIRS).find(d=>{const e=M.transition(g.world,g.player,d);return e&&e.to!==stopped&&e.to!==g.world.exit;});
 M.move(g,d);assert.equal(g.bird.position,stopped);
}
assert.equal(g.bird.cooldown,0);
const catchGame=M.createGame(fixture());place(catchGame,5,2);catchGame.bird.position=25;catchGame.steps=1;catchGame.turns=1;
M.move(catchGame,'left');assert.equal(catchGame.lastEvent,'teleport');
// Visible player can trigger CHASE, but a wall blocks sight and live tracking.
const chase=M.createGame(fixture());place(chase,6,2);chase.bird.position=24;chase.steps=1;chase.turns=1;
M.move(chase,'right');assert.equal(chase.bird.state,'CHASE');assert.equal(chase.bird.lastSeen,29);
const a=M.createGame(fixture(true)),b=M.createGame(fixture(true));
for(const [game,x] of [[a,7],[b,8]]){
 place(game,x,2);Object.assign(game.bird,{position:24,state:'CHASE',lastSeen:79,searchLeft:6});game.steps=1;game.turns=1;
 M.move(game,'down');assert.equal(game.bird.state,'SEARCH');assert.equal(game.bird.lastSeen,79);
}
assert.equal(a.bird.position,b.bird.position,'unseen player position must not affect pursuit');
for(let i=0;i<16;i++)M.move(a,i%2?'down':'up');
assert.equal(a.bird.state,'WANDER');assert.equal(a.bird.lastSeen,null);
const blocked=M.createGame(fixture());place(blocked,1,1);const before={...blocked.bird};M.move(blocked,'left');assert.deepEqual(blocked.bird,before);assert.equal(blocked.steps,0);
const won=M.createGame(fixture());place(won,8,9);won.bird.position=107;M.move(won,'right');assert.ok(won.won);assert.equal(won.teleports,0);assert.equal(M.move(won,'left'),false);
let cases=0;
for(const algorithm of ['dfs','prim','growing','kruskal','hunt','wilson','division','eller','rooms'])for(const size of [9,31])for(const seed of ['bird','鳥']){
 const options={width:size,height:size,algorithm,seed,birdMode:true},world=M.generate(options),a=M.createGame(world),b=M.createGame(M.generate(options));
 assert.ok(world.cells[a.bird.position]);assert.notEqual(a.bird.position,world.start);assert.notEqual(a.bird.position,world.exit);
 for(let i=0;i<150;i++){
  const dirs=Object.keys(M.DIRS).filter(d=>M.transition(world,a.player,d));const d=dirs[i%dirs.length];
  const previous=a.bird.position,steps=a.steps;M.move(a,d);M.move(b,d);
  assert.deepEqual(a.bird,b.bird);assert.deepEqual(a.player,b.player);assert.equal(a.teleports,b.teleports);
  assert.ok(world.cells[a.bird.position]);assert.ok(world.cells[a.player.world_position]);
  if(a.bird.position!==previous)assert.ok(Object.keys(M.DIRS).some(d=>M.transition(world,{world_position:previous},d)?.to===a.bird.position));
  assert.ok([...a.cognition.memory_nodes.values()].every(n=>n.feature!=='V'),'moving birds are not terrain memories');
  if(a.won)break;
 }
 assert.deepEqual(M.createGame(world).bird,M.createGame(world).bird);cases++;
}
assert.ok(M.createGame(M.generate({birdMode:true,keyDoor:true})).bird);
assert.ok(M.createGame(M.generate({width:8,height:8,topology:'torus',birdMode:true})).bird);
console.log(`PASS: ${cases} bird worlds; deterministic movement, legal steps, wall occlusion, last-seen-only search, both contacts, safe teleport, memory retention, cooldown, reset, exit priority.`);
