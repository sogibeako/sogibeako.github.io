const a=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
function room(){const cells=new Uint8Array(65);for(let x=1;x<12;x++)cells[26+x]=1;return {width:13,height:5,cells,start:27,exit:37,seed:'wand-test',topology:'plane',birdMode:true,validation:{floors:11}};}
const g=M.createGame(room());M.enableWands(g);g.wildlife.pets=[];g.bird.position=34;g.bird.cooldown=100;g.wands.items=[{id:28,spell:'freeze'}];
a(M.move(g,'right'));a.deepEqual(g.wands.held,['freeze']);a.equal(g.wands.items.length,0);
a(M.placeMarker(g));const mark=g.markers.get(28);g.wands.items.push({id:28,spell:'pull'});a.equal(M.featureAt(g,28),mark);M.waitTurn(g);a.equal(g.markers.get(28),mark);a(g.wands.held.includes('pull'));
const seen=[...g.cognition.memory_nodes.keys()],steps=g.steps,loops=JSON.stringify(g.cognition.loopProgress);a(M.castWand(g,'freeze',1));a.equal(g.wands.birds[0].frozen,5);a.equal(g.steps,steps);a.equal(JSON.stringify(g.cognition.loopProgress),loops);a(seen.every(k=>g.cognition.memory_nodes.has(k)));
const turns=g.turns;a.equal(M.castWand(g,'swap',1),false);a.equal(g.turns,turns);
// Bird wins the race to a staff, then fires at the player.
const b=M.createGame(room());M.enableWands(b);b.wildlife.pets=[];b.bird.position=34;b.wands.items=[{id:34,spell:'freeze'}];b.birdRandom=()=>0;M.waitTurn(b);a(b.wands.birds[0].held.includes('freeze'));a.equal(b.wands.items.length,0);M.waitTurn(b);a.equal(b.wands.frozen,5);
const id=b.player.world_position;M.move(b,'right');a.equal(b.player.world_position,id);a.equal(b.wands.frozen,4);
// Each displacement spell keeps marks and the current map even with split maps enabled.
for(const spell of ['push','swap','pull']){
 const g=M.createGame({...room(),separateMaps:true});M.enableWands(g);g.wildlife.pets=[];g.bird.position=34;g.bird.cooldown=100;g.wands.items=[];g.wands.held=[spell];M.placeMarker(g);
 const memory=[...g.cognition.memory_nodes.keys()],marks=[...g.markers];
 a(M.castWand(g,spell,1));a.equal(g.steps,0);a.deepEqual([...g.markers],marks);a(memory.every(k=>g.cognition.memory_nodes.has(k)));
 if(spell==='swap')a.equal(g.player.world_position,34);
 if(spell==='push')a.equal(g.bird.position,37);
 if(spell==='pull')a.equal(g.bird.position,28);
}
let saves=0,shots=0,pickups=0;
for(const topology of ['plane','torus'])for(let seed=0;seed<3;seed++){
 const g=S.attach(J.start({width:topology==='torus'?16:17,height:topology==='torus'?16:17,seed:'wand-save-'+seed,topology,birdMode:true,separateMaps:true,shiftX:topology==='torus'?2:0}));S.act(g,'wands');
 for(let turn=0;turn<100;turn++){
  if(g.won)S.act(g,'continue');
  if(g.wands.held.length&&turn%8===0){S.act(g,'cast',g.wands.held[0],turn%4);shots++;}
  else if(g.wands.items.length){
   const nav=M.wildlifeAdapter(g),queue=[nav.player],prev=new Map([[nav.player,null]]);let target=null;
   for(const id of queue){if(g.wands.items.some(i=>i.id===id)){target=id;break;}for(const e of nav.edges(id))if(!prev.has(e.to)){prev.set(e.to,[id,e.dir]);queue.push(e.to);}}
   if(target===null||target===nav.player)S.act(g,'wait');else{let action;while(prev.get(target)){const [parent,d]=prev.get(target);action=d;target=parent;}S.act(g,'move',Object.keys(M.DIRS)[action]);}
  }else S.act(g,'wait');
  if(turn%20===0){const text=S.encode(g,'birds'),restored=S.decode(text).game;a.deepEqual(restored.wands,g.wands);a.deepEqual(restored.markers,g.markers);a.deepEqual(restored.cognition,g.cognition);a.equal(S.encode(restored,'birds'),text);saves++;}
 }
 pickups+=g.wands.held.length;
}
a(shots>0);a(pickups>0);
console.log({inventoryAndMarkers:true,birdPickupCastFreeze:true,saveRoundTrips:saves,shots,pickups});
