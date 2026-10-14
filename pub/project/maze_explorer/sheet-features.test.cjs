const a=require('node:assert/strict'),L=require('./lattice-holes.js'),H=require('./return-enclosure.js'),S=require('./connection-space.js'),F=require('./sheet-features.js'),P=require('./exploration-solver.js'),Save=require('./return-enclosure-save.js');
(async()=>{let count=0;for(const kind of ['central','enclosure'])for(let bits=0;bits<8;bits++){
const features={keys:!!(bits&1),warp:!!(bits&2),birds:!!(bits&4)},s=kind==='central'?L.create({maze:true,seed:'features-'+bits,periodSize:16,features}):H.create('features-'+bits,{features,horizontalLoops:true});s.replayMoves=[];
F.mark(s);a.equal(F.glyph(s,s.id),'1');F.validate(s);
if(features.keys)a.equal(F.allowed(s,s.world.exit),false);
for(let n=0;n<3000&&s.id!==s.world.exit;n++){const path=P.connected(s);a(path?.length,'exit path');a(S.move(s,path[0],true));s.replayMoves.push(path[0]);}
a.equal(s.id,s.world.exit,kind+' '+bits);if(features.keys)a(s.features.hasKey);
if(kind==='central'){const Save=require('./lattice-holes-save.js'),book={charts:[],active:-1};S.observeWalkingMap(s,book);const restored=Save.decode(Save.encode({state:s,book,journey:{number:1,steps:0},controls:{}}));a.deepEqual(restored.snapshot.state.features,s.features);}
if(kind==='enclosure'){const restored=await Save.decode(Save.encode(s,0));a.equal(restored.state.id,s.id);a.deepEqual(restored.state.features,s.features);}
if(bits===7){const Loops=require('./lattice-holes-loops.js');Loops.start(s);for(let n=0;n<60;n++){const path=P.connectedLoop(s,S,Loops);if(!path)break;for(const d of path){a(S.move(s,d,true));Loops.observe(s,S.groundSheet(s.world,s.id));if(s.features.last)break;}}a.equal(P.connectedLoop(s,S,Loops),null);}
count++;}console.log(count+' feature combinations: actual exit walks, keys, warps, birds, marking and enclosure replay.');})().catch(e=>{console.error(e);process.exitCode=1;});
