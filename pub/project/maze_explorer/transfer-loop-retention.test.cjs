const assert=require('node:assert/strict'),L=require('./lattice-holes.js'),H=require('./return-enclosure.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),F=require('./sheet-features.js');
let cases=0;
for(const kind of ['central','enclosure'])for(const transfer of ['warp','teleport'])for(const [shiftX,shiftY]of [[0,0],[2,0],[0,-2],[2,-2]]){
 const features={warp:transfer==='warp',birds:transfer==='teleport',birdWander:true,birdAcross:true,birdLeap:true};
 const s=kind==='central'?L.create({maze:true,seed:'loop-retention',shiftX,shiftY,features}):H.create('loop-retention',{shiftX,shiftY,features});
 const w=s.world,f=s.features,edge=[...w.edges].find(([key,e])=>w.cells[Number(key.split(':')[0])]&&e.to!==w.exit&&(transfer==='warp'?f.warps.has(e.to):e.kind!=='throat'));
 assert(edge);const [key,e]=edge;s.id=Number(key.split(':')[0]);s.frame=[0,1,2,3];if(transfer==='teleport')f.bird=e.to;
 R.start(s);s.loopExperience.counts=new Map([['0:1:0',3],['0:0:1',2],['1:1:0',2],['1:0:1',3]]);const before=R.knowledge(s);
 assert(S.move(s,Number(key.split(':')[1]),true));assert.equal(f.last.kind,transfer);R.observe(s,S.groundSheet(w,s.id));assert.deepEqual(R.knowledge(s),before);assert.equal(s.loopExperience.path.length,1);
 const book={charts:[],active:-1};S.observeWalkingMap(s,book);F.mark(s);S.observeWalkingMap(s,book);assert.deepEqual(R.knowledge(s),before,'observation and markers do not erase or add laps');
 if(kind==='central'){const Save=require('./lattice-holes-save.js');const loaded=Save.decode(Save.encode({state:s,book,journey:{number:1,steps:0},controls:{}})).snapshot.state;assert.deepEqual(R.knowledge(loaded),before);}
 cases++;
}
console.log(cases+' central/enclosure transfers: partial and learned counts on both sheets retained across birds, warps, shifted seams, observations and central snapshots.');
