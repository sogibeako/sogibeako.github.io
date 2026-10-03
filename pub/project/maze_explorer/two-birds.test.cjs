const assert=require('node:assert/strict'),M=require('./core.js');
assert.throws(()=>M.generate({birdMode:true,birdCount:3}),/1体/);
const small=M.createGame(M.generate({width:9,height:9,birdMode:true,birdCount:2}));assert.equal(small.birds.length,1);
function fixture(){const width=17,height=17,cells=new Uint8Array(width*height);for(let y=1;y<16;y++)for(let x=1;x<16;x++)if(x!==8||y===15)cells[y*width+x]=1;return {width,height,cells,start:38,exit:270,seed:'two',birdMode:true,birdCount:2};}
function place(g,id){Object.assign(g.player,{world_position:id,perceived_x:id%g.world.width,perceived_y:Math.floor(id/g.world.width),perceived_position:'C'+id});M.observe(g);}
const g=M.createGame(fixture());assert.equal(g.birds.length,2);assert.equal(g.bird,g.birds[0]);g.birds[0].position=36;g.birds[1].position=47;
M.waitTurn(g);M.waitTurn(g);assert.equal(g.birds[0].state,'CHASE');assert.equal(g.birds[0].lastSeen,38);assert.equal(g.birds[1].state,'WANDER');assert.equal(g.birds[1].lastSeen,null);
assert.equal(M.inspectBird(g,0).target,38);assert.equal(M.inspectBird(g,1).target,null);assert.equal(M.inspectBird(g,2),null);
// Entering either bird resolves contact before other birds act. Landing on the
// second bird and repeated contacts within the same action are prohibited.
for(const index of [0,1]) {
 const g=M.createGame(fixture());place(g,38);g.birds[index].position=39;g.birds[1-index].position=40;
 M.move(g,'right');assert.equal(g.teleports,1);assert.ok(g.birds.every(b=>b.position!==g.player.world_position));assert.ok(g.birds.every(b=>b.cooldown===4&&b.lastSeen===null));
 const positions=g.birds.map(b=>b.position);for(let i=0;i<4;i++)M.waitTurn(g);assert.deepEqual(g.birds.map(b=>b.position),positions);assert.ok(g.birds.every(b=>b.cooldown===0));
}
let cases=0,contacts=0;
for(const algorithm of ['dfs','prim','rooms'])for(const keyDoor of [false,true])for(const seed of ['duo','pair','ふたり']) {
 const options={width:31,height:23,algorithm,seed,keyDoor,keyCount:3,birdMode:true,birdCount:2},w=M.generate(options),a=M.createGame(w),b=M.createGame(M.generate(options));
 assert.equal(a.birds.length,2);const special=new Set((w.puzzle?.locks||[]).flatMap(l=>[l.key,l.door]));
 assert.ok(a.birds.every(b=>!special.has(b.position)&&b.position!==w.start&&b.position!==w.exit));
 for(let i=0;i<180;i++) {
  const old=a.birds.map(b=>b.position),previousTransfers=a.teleports;
  M.inspectBird(a,i%2);
  const dirs=Object.keys(M.DIRS).filter(d=>M.ruleTransition(w,a.player,d));
  if(i%3===0){M.waitTurn(a);M.waitTurn(b);}else{const d=dirs[i%dirs.length];M.move(a,d);M.move(b,d);}
  assert.deepEqual(a.birds,b.birds);assert.deepEqual(a.player,b.player);assert.equal(new Set(a.birds.map(b=>b.position)).size,2);
  for(let k=0;k<2;k++)if(a.birds[k].position!==old[k])assert.ok(Object.keys(M.DIRS).some(d=>M.transition(w,{world_position:old[k]},d)?.to===a.birds[k].position));
  assert.ok(a.teleports-previousTransfers<=1);if(a.teleports>previousTransfers){assert.ok(a.birds.every(b=>b.position!==a.player.world_position));contacts++;}
  if(a.won)break;
 }
 assert.deepEqual(M.createGame(w).birds,M.createGame(M.generate(options)).birds);cases++;
}
console.log(`PASS: ${cases} two-bird worlds; separate perception/targets, occupancy exclusion, legal movement, deterministic reset, both contact orders, shared respite, no teleport chains (${contacts} natural contacts).`);
