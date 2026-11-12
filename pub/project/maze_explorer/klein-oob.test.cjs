const a=require('node:assert/strict'),G=require('./graph-wands.js'),O=require('./graph-oob.js'),S=require('./connection-space.js'),F=require('./sheet-features.js'),K=require('./klein-biaxial.js'),R=require('./biaxial-rules.js');
let cases=0;const directions=new Set();
for(const free of [false,true])for(const shift of [-2,0,2]){
 const base=free?R.create(K.maze(K.create('free',2,shift,{width:24,height:20}),'atelier-prim','oob-klein'),'birds'):S.create('kleinMaze',{width:24,height:20,shiftY:shift,seed:'oob-klein',growth:'dfs',guaranteeLoops:true});
 if(!free){base.world.domain=new Set(base.world.cells.keys());F.install(base,{birds:true});}G.init(base);
 for(let d=0;d<4;d++){
 let done=false;
 for(const [key,e]of base.world.edges){const [id,dir]=key.split(':').map(Number);if(dir!==d||!O.boundary(base,id,d,e))continue;const back=(d+2)%4,inside=base.world.edges.get(id+':'+back);if(!inside||O.boundary(base,id,back,inside)||inside.to===e.to)continue;
 const s=structuredClone(base);s.id=id;s.features.bird=null;s.features.warps.clear();s.features.door=null;s.wands.held=['push'];s.wands.items=[];s.wildlife={rng:1,turn:0,food:[],pets:[{kind:'d',id:inside.to,mode:'wander',left:0}]};
 const beforePlan=JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);const plan=G.planOob(s);a(plan?.cast!==undefined);a(G.oobProbe(s,s.id,plan.cast)!==undefined);a.equal(JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v),beforePlan,'planner must not change live state');G.preview(s,'push',back);a(!s.wands.oob);a(require('./wand-flight.js').near(s,s.id),'boundary hint near departure');a(G.preview(s,'push',d).some(p=>p.seam),'projectile flashes at boundary');G.cast(s,'push',back);a.equal(s.wands.oob?.direction,d);a.equal(s.id,id);O.validate(s);a(O.move(s,1));a(G.returnOob(s));a(!s.wands.oob);a(s.world.cells[s.id]);
 // The same reflected projectile can eject the bird; its normal-world actor disappears.
 const bird=structuredClone(base);bird.id=inside.to;bird.features.bird=id;bird.features.warps.clear();bird.features.door=null;bird.wands.items=[];bird.wands.bird.held=['push'];bird.wands.bird.cooldown=0;bird.wildlife={rng:1,turn:0,food:[],pets:[{kind:'d',id:inside.to,mode:'wander',left:0}]};
 // Test entry invariant separately from AI targeting/timing.
 O.enter(bird,'V',d);a.equal(bird.features.bird,null);O.validate(bird);a.equal(bird.wands.birdOob.direction,d);
 done=true;directions.add(d);cases++;break;
 }
 a(done,`missing boundary fixture free=${free} shift=${shift} d=${d}`);
 }
}
console.log({cases,directions:[...directions],reflectedPush:true,return:true,birdDormancy:true});
