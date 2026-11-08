const assert=require('node:assert/strict'),L=require('./lattice-holes.js'),H=require('./return-enclosure.js'),F=require('./sheet-features.js'),S=require('./connection-space.js');
let count=0;
for(const kind of ['central','enclosure']){
 const state=kind==='central'?L.create({maze:true,seed:'bird-cross',features:{birds:true,birdAcross:true}}):H.create('bird-cross',{features:{birds:true,birdAcross:true}});
 const w=state.world;
 for(const [key,e]of w.edges){
  const from=Number(key.split(':')[0]);if(e.kind!=='throat'||!w.cells[from]||!w.cells[e.to]||e.to===w.exit)continue;
  const next=Array.from({length:4},(_,d)=>w.edges.get(e.to+':'+d)?.to).find(id=>id!==undefined&&w.cells[id]&&id!==from&&id!==w.exit);
  if(next===undefined)continue;
  state.id=next;state.steps=2;state.features.bird=from;state.features.cooldown=0;
  F.afterMove(state);
  assert.equal(state.features.bird,e.to,'bird follows legal portal toward player');
  assert.notEqual(S.groundSheet(w,from),S.groundSheet(w,e.to));count++;break;
 }
}
assert.equal(count,2);
console.log('Birds cross actual central/enclosure portal edges toward the player.');

// A tiny directed portal graph isolates blockers and verifies the cached index
// still honours changing door/warp state without adding anything to the save.
function fixture(){return {id:2,steps:2,world:{seed:'test',exit:3,cells:[1,1,1,1],edges:new Map([['0:0',{to:1,kind:'throat'}],['1:1',{to:2,kind:'normal'}]])},features:{options:{birds:true,birdAcross:true},bird:0,key:null,door:null,hasKey:false,warps:new Map(),cooldown:0}};}
let t=fixture();F.afterMove(t);assert.equal(t.features.bird,1);
t.features.bird=0;t.features.door=1;F.afterMove(t);assert.equal(t.features.bird,0);
t.features.hasKey=true;F.afterMove(t);assert.equal(t.features.bird,1);
t.features.bird=0;t.features.warps.set(1,3);F.afterMove(t);assert.equal(t.features.bird,0);
t=fixture();t.world.cells[1]=0;F.afterMove(t);assert.equal(t.features.bird,0);
t=fixture();t.features.cooldown=2;F.afterMove(t);assert.equal(t.features.bird,0);assert.equal(t.features.cooldown,1);
t=fixture();delete t.features.options.birdAcross;F.afterMove(t);assert.equal(t.features.bird,0,'legacy replay keeps its old movement');
// Reusing a world's immutable connections must not scan every edge each turn.
t=fixture();let scans=0;const iterator=t.world.edges[Symbol.iterator].bind(t.world.edges);t.world.edges[Symbol.iterator]=()=>{scans++;return iterator();};
for(let n=0;n<100;n++){t.features.bird=0;F.afterMove(t);assert.equal(t.features.bird,1);}
assert.equal(scans,1);assert(!Object.keys(t.world).some(k=>k.includes('incoming')));
console.log('Directed portals: walls, locked/unlocked doors, warp avoidance, cooldown, legacy behavior and one index build per world passed.');
