const a=require('node:assert/strict'),H=require('./lattice-holes.js'),G=require('./graph-wands.js'),O=require('./graph-oob.js'),Save=require('./lattice-holes-save.js'),Session=require('./lattice-holes-session.js');globalThis.GraphWands=G;
(async()=>{let hits=0,kinds=new Set();
for(const mode of ['enclosure','triple','triple-return'])for(const [sx,sy]of [[0,0],[2,0],[0,-2],[2,-2]]){
 const S=require('./connection-space.js');const base=mode==='enclosure'?require('./return-enclosure.js').create('oob-graph',{width:24,height:24,shiftX:sx,shiftY:sy,underpasses:2,features:{birds:true}}):S.create('tripleMaze',{dimensions:[[16,16],[24,16],[16,16]],holeSize:3,tripleRoute:mode==='triple-return'?'return':'chain',seed:'oob-graph',shiftX:sx,shiftY:sy,ruleMode:'birds'});base.replayMoves=[];base.verticalCrossings=[0,0];base.loopThreshold=3;base.foldLoops=true;G.init(base);
 for(const type of ['normal','throat']){
 let done=false;
 for(const [key,e]of base.world.edges){const [id,d]=key.split(':').map(Number);if(e.kind!==type||!O.boundary(base,id,d,e))continue;const back=(d+2)%4,inside=base.world.edges.get(id+':'+back);if(!inside||inside.kind!=='normal'||inside.to===e.to)continue;
 const s=structuredClone(base);s.id=id;s.features.bird=null;s.features.warps.clear();s.features.door=null;s.wands.held=['push'];s.wands.items=[];s.wildlife={rng:1,turn:0,food:[],...s.wildlife,pets:[{kind:'d',id:inside.to,mode:'wander',left:0}]};
 const book={charts:[],active:-1};Session.observe(s,book);const knowledge=JSON.stringify(book);const beforePlan=JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);const plan=G.planOob(s);a(plan?.cast!==undefined);a(G.oobProbe(s,s.id,plan.cast)!==undefined);a.equal(JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v),beforePlan,'planner must not change live state');G.preview(s,'push',back);a(!s.wands.oob);a(require('./wand-flight.js').near(s,s.id),'boundary hint near departure');a(G.preview(s,'push',d).some(p=>p.seam),'projectile flashes at boundary');G.cast(s,'push',back);if(!s.wands.oob)continue;a.equal(s.wands.oob.direction,d);a.equal(s.id,id);a.equal(JSON.stringify(book),knowledge);a(!G.cast(s,'push',back));
 const snap={state:s,walkingBook:book,atlasMemory:new Set(),journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},journey:{number:1,steps:0},controls:{}};const restored=mode==='enclosure'?await require('./return-enclosure-save.js').decode(require('./return-enclosure-save.js').encode(s,0,book)):S.decodeSave(S.encodeSave(snap)).snapshot;a.deepEqual(restored.state.wands,s.wands);a(O.move(s,1));a(G.returnOob(s));a(!s.wands.oob);Session.observe(s,book);a(s.world.cells[s.id]);
 restored.state.wands.oob.direction=9;a.throws(()=>O.validate(restored.state));done=true;hits++;kinds.add(type);break;}
 a(done,'need '+type+' reflection for '+sx+','+sy);
 }
}
console.log({hits,kinds:[...kinds],shifts:true,previewReadOnly:true,saveAndReturn:true});

})().catch(e=>{console.error(e);process.exitCode=1;});
