const assert=require('node:assert/strict'),M=require('./core.js');
function world(){const cells=new Uint8Array(65);for(let x=1;x<=11;x++)cells[26+x]=1;return {width:13,height:5,cells,start:27,exit:37,seed:'inspect',birdMode:true,puzzle:{locks:[{keyId:'A',key:28,door:32}],requestedCount:1}};}
const g=M.createGame(world());g.bird.position=31;g.player.world_position=35;
const closed=M.inspectBird(g);assert.ok(closed.visibleCells.includes(32));assert.ok(!closed.visibleCells.includes(33));assert.equal(closed.canSeePlayer,false);assert.equal(closed.target,null);assert.deepEqual(closed.path,[]);
g.openedDoors.add('A');const open=M.inspectBird(g);assert.ok(open.visibleCells.includes(35));assert.equal(open.canSeePlayer,true);
// A diagnostic must retain the recorded target even if the player is elsewhere.
g.bird.state='SEARCH';g.bird.lastSeen=29;g.bird.searchLeft=4;
const info=M.inspectBird(g);assert.equal(info.target,29);assert.deepEqual(info.path,[31,30,29]);assert.equal(info.searchLeft,4);
const {birdRandom,...data}=g,before=structuredClone(data);
for(let i=0;i<10;i++){const d=M.inspectBird(g);d.path.push(-1);d.visibleCells.length=0;}
const {birdRandom:ignored,...after}=g;assert.deepEqual(after,before);
assert.equal(M.inspectBird(M.createGame(M.generate())),null);
let cases=0;
for(const keyDoor of [false,true])for(const algorithm of ['dfs','rooms','prim'])for(const seed of ['a','b']){
 const w=M.generate({algorithm,seed,keyDoor,birdMode:true,width:15,height:15}),a=M.createGame(w),b=M.createGame(w);
 for(let i=0;i<30;i++){
  const d=M.inspectBird(a),blocked=new Set((w.puzzle?.locks||[]).filter(l=>!a.openedDoors.has(l.keyId)).map(l=>l.door));
  assert.equal(d.canSeePlayer,d.visibleCells.includes(a.player.world_position));
  for(let j=1;j<d.path.length;j++)assert.ok(!blocked.has(d.path[j])&&Object.keys(M.DIRS).some(dir=>M.transition(w,{world_position:d.path[j-1]},dir)?.to===d.path[j]));
  M.waitTurn(a);M.waitTurn(b);assert.deepEqual(a.bird,b.bird);assert.deepEqual(a.player,b.player);assert.equal(a.turns,b.turns);
 }
 cases++;
}
console.log(`PASS: bird diagnostics in ${cases} worlds; closed-door sight, opened-door sight, remembered target, legal route, immutable state and unchanged random evolution.`);
