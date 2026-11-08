const assert=require('node:assert/strict'),M=require('./core.js');
function corridor(){
 const cells=new Uint8Array(65);for(let x=1;x<=11;x++)cells[26+x]=1;
 return {width:13,height:5,cells,start:27,exit:37,seed:'doors',birdMode:true,puzzle:{locks:[{keyId:'A',key:28,door:32}],requestedCount:1}};
}
function place(g,id){Object.assign(g.player,{world_position:id,perceived_x:id%g.world.width,perceived_y:Math.floor(id/g.world.width),perceived_position:'C'+id});M.observe(g);}
function region(g,start){
 const w=g.world,blocked=new Set(w.puzzle.locks.filter(l=>!g.openedDoors.has(l.keyId)).map(l=>l.door));
 const seen=new Set([start]),q=[start];
 for(let i=0;i<q.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const x=q[i]%w.width+dx,y=Math.floor(q[i]/w.width)+dy,id=y*w.width+x;
  if(x<0||y<0||x>=w.width||y>=w.height||!w.cells[id]||blocked.has(id)||seen.has(id))continue;
  seen.add(id);q.push(id);
 }
 return seen;
}
const unseen=M.createGame(corridor());place(unseen,34);unseen.bird.position=31;unseen.steps=1;unseen.turns=1;
M.move(unseen,'right');assert.equal(unseen.bird.state,'WANDER');assert.notEqual(unseen.bird.position,32);
const opened=M.createGame(corridor());place(opened,34);opened.bird.position=31;opened.openedDoors.add('A');opened.player.keys=['A'];opened.steps=1;opened.turns=1;
M.move(opened,'right');assert.equal(opened.bird.state,'CHASE');assert.equal(opened.bird.position,32);
// A held key alone does not let the bird or a teleport bypass its unopened door.
for(let i=0;i<20;i++){
 const g=M.createGame({...corridor(),seed:'contact'+i});place(g,29);g.bird.position=30;g.player.keys=['A'];
 M.move(g,'right');assert.equal(g.lastEvent,'teleport');assert.ok(g.player.world_position<32);assert.deepEqual(g.player.keys,['A']);assert.equal(g.openedDoors.size,0);
}
// No ordinary landing cell: keep a valid position and allow the player to leave.
const tiny=corridor();tiny.cells.fill(0);[27,28,29,30,31].forEach(id=>tiny.cells[id]=1);tiny.exit=30;tiny.puzzle.locks=[{keyId:'A',key:28,door:29}];
const stuck=M.createGame(tiny);place(stuck,28);stuck.player.keys=['A'];stuck.bird.position=27;
M.move(stuck,'left');assert.equal(stuck.lastEvent,'bird-stay');assert.equal(stuck.player.world_position,27);assert.deepEqual(stuck.player.keys,['A']);assert.equal(stuck.teleports,0);
// Moving through a key never grants it to a bird.
const walker=M.createGame(corridor());place(walker,35);walker.bird.position=27;walker.steps=1;walker.turns=1;
M.move(walker,'left');assert.equal(walker.bird.position,28);assert.deepEqual(walker.player.keys,[]);
let cases=0,contacts=0;
for(const algorithm of ['dfs','prim','growing','kruskal','hunt','wilson','division','eller','rooms'])
for(const width of [9,31])for(const seed of ['mixed','扉'])for(const keyCount of [1,2,3]){
 const w=M.generate({algorithm,width,height:width,seed,keyCount,keyDoor:true,birdMode:true});
 const locks=w.puzzle.locks,special=new Set(locks.flatMap(l=>[l.key,l.door]));
 for(let stage=0;stage<=locks.length;stage++){
  const g=M.createGame(w);assert.ok(w.cells[g.bird.position]);assert.ok(!special.has(g.bird.position));
  g.player.keys=locks.slice(0,stage).map(l=>l.keyId);g.openedDoors=new Set(g.player.keys);
  const accessible=region(g,w.start);let pair;
  for(const id of accessible){
   if(special.has(id)||id===w.exit)continue;
   for(const d of Object.keys(M.DIRS)){
    const e=M.transition(w,{world_position:id},d);
    if(e&&accessible.has(e.to)&&!special.has(e.to)&&e.to!==w.exit){pair={id,d,to:e.to};break;}
   }
   if(pair)break;
  }
  if(!pair)continue;
  place(g,pair.id);g.bird.position=pair.to;
  const keys=[...g.player.keys],doors=[...g.openedDoors],memory=[...g.cognition.memory_nodes.keys()];
  M.move(g,pair.d);
  assert.equal(g.lastEvent,'teleport');assert.ok(accessible.has(g.player.world_position));assert.ok(!special.has(g.player.world_position));assert.notEqual(g.player.world_position,w.exit);
  assert.deepEqual(g.player.keys,keys);assert.deepEqual([...g.openedDoors],doors);assert.ok(memory.every(k=>g.cognition.memory_nodes.has(k)));contacts++;
 }
 cases++;
}
assert.ok(contacts>200);
console.log(`PASS: ${cases} bird/key worlds, ${contacts} staged contacts; independent reachability, unopened-door isolation, preserved inventory, door sight/movement, held-key restriction, safe no-destination fallback.`);
