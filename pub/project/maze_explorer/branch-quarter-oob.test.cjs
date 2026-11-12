const a=require('node:assert/strict'),B=require('./branch-maze.js'),Q=require('./quarter-turn-maze.js'),G=require('./graph-wands.js'),O=require('./graph-oob.js');let hits=0;
for(const mode of [2,3,'doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const branch=typeof mode==='number',wanted=branch?[0,2]:[0,1,2,3];
 for(const d of wanted){let found=false;
 for(let seed=0;seed<20&&!found;seed++){
 const base=branch?B.create({sheets:mode,size:20,route:'return',pillar:'grown',direction:'both',algorithm:'dfs',wallStyle:'grid',underpasses:2,underpassShape:'mixed',density:.45,seed:'oob-'+seed,ruleMode:'birds'}):Q.create(mode,16,'oob-'+seed,{ruleMode:'birds',boundaryLinks:true,algorithm:'prim',seamRoutes:2,seamDetour:true,floorUnderpasses:2,underpassShape:'mixed'});G.init(base);
 for(const [key,e]of base.world.edges){const [id,dir]=key.split(':').map(Number);if(dir!==d||!O.boundary(base,id,d,e))continue;const back=(d+2)%4,inside=base.world.edges.get(id+':'+back);if(!inside||O.boundary(base,id,back,inside)||inside.to===e.to||inside.transform.some((v,i)=>v!==i)||base.world.edges.get(inside.to+':'+d)?.to!==id)continue;
 const s=structuredClone(base);s.id=id;s.features.bird=null;s.features.warps.clear();s.features.door=null;s.wands.held=['push'];s.wands.items=[];s.wildlife={rng:1,turn:0,food:[],pets:[{kind:'d',id:inside.to,mode:'wander',left:0}]};
 const beforePlan=JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);const plan=G.planOob(s);a(plan?.cast!==undefined);a(G.oobProbe(s,s.id,plan.cast)!==undefined);a.equal(JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v),beforePlan,'planner must not change live state');G.preview(s,'push',back);a(!s.wands.oob);a(require('./wand-flight.js').near(s,s.id),'boundary hint near departure');a(G.preview(s,'push',d).some(p=>p.seam),'projectile flashes at boundary');G.cast(s,'push',back);a.equal(s.wands.oob?.direction,d);a.equal(s.id,id);O.validate(s);a(O.move(s,1));a(G.returnOob(s));a(!s.wands.oob);a(s.world.cells[s.id]);found=true;hits++;break;
 }
 }a(found,mode+' direction '+d);
 }console.log(mode+' reflected OOB and safe return passed');
}
console.log({hits});
