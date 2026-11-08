const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function nextStep(g){const q=[[g.player.world_position,null]],seen=new Set();for(const [id,first]of q){if(id===g.world.exit)return first;if(seen.has(id))continue;seen.add(id);for(const d of Object.keys(M.DIRS)){const e=M.transition(g.world,{world_position:id},d);if(e)q.push([e.to,first||d]);}}throw Error('unreachable');}
let moves=0,transfers=0;
for(let trial=0;trial<8;trial++){
 let g=J.begin(J.start({width:9,height:9,seed:'old'}),'bird-start-'+trial,'birds');assert(!g.world.birdMode);
 for(let stage=0;stage<5;stage++){
  assert.equal(!!g.world.birdMode,stage%2===1);assert(!g.world.puzzle);assert(!g.world.warpMode);
  if(g.world.birdMode){
   assert.equal(g.birds.length,1);assert.equal(g.bird.state,'WANDER');assert.equal(g.bird.lastSeen,null);assert.equal(g.teleports,0);
   // Force a contact on a valid adjacent floor, then exercise the ordinary move handler.
   const dir=Object.keys(M.DIRS).find(d=>M.transition(g.world,g.player,d)?.to!==g.world.exit&&M.transition(g.world,g.player,d));
   g.bird.position=M.transition(g.world,g.player,dir).to;
   assert(M.move(g,dir));assert.equal(g.teleports,1);assert.equal(g.cognition.archives.length,1);assert.equal(g.bird.cooldown,4);
   assert(nextStep(g));const reset=J.restart(g);assert.equal(reset.teleports,0);assert.equal(reset.bird.lastSeen,null);assert.equal(reset.bird.state,'WANDER');assert.equal(reset.cognition.archives.length,0);
  }
  for(let i=0;!g.won&&i<10000;i++){assert(M.move(g,nextStep(g)));moves++;}assert(g.won,'dynamic route reaches exit');transfers+=g.teleports||0;
  if(stage===4)break;
  const before=snap(g),seed='bird-next-'+trial+'-'+stage,n=J.next(g,seed,'birds');assert.equal(snap(g),before);assert.equal(snap(n),snap(J.next(g,seed,'birds')));
  assert.equal(n.journey.completed,stage+1);assert.equal(n.journey.steps,g.journey.steps+g.steps);g=n;
 }
}
console.log(`PASS: 32 transitions / 40 exits, ${moves} moves and ${transfers} transfers; one bird, archived contact, reachable destination, fresh AI and progress.`);
