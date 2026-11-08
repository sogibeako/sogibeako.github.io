const a=require('node:assert/strict'),S=require('./connection-space.js'),G=require('./graph-wands.js'),O=require('./graph-oob.js'),C=require('./crossing-save.js'),P=require('./crossing-autowalk.js');globalThis.GraphWands=G;
let cases=0;
for(const wallStyle of ['dense','grid'])for(const growth of ['dfs','prim','growing','hunt','kruskal','frontier']){
 const base=S.create('crossingMaze',{seed:'cross-oob-'+growth,width:16,height:18,wallStyle,growth,stairPlacement:'random',floorUnderpasses:2,underpassShape:'mixed',ruleMode:'birds'});G.init(base);let done=false;
 for(const [key,e]of base.world.edges){const [id,d]=key.split(':').map(Number);if(e.kind!=='stairs')continue;const back=(d+2)%4,inside=base.world.edges.get(id+':'+back);if(!inside||inside.to===e.to||base.world.edges.get(inside.to+':'+d)?.to!==id)continue;
 const s=structuredClone(base);s.id=id;s.features.bird=null;s.wands.items=[];s.wands.held=['push'];s.wildlife={rng:1,turn:0,food:[],pets:[{kind:'d',id:inside.to}]};const before=JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v);const plan=G.planOob(s);a(plan?.cast!==undefined);a.equal(JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v),before);G.cast(s,'push',back);a.equal(s.wands.oob?.direction,d);a(O.move(s,1));a(G.returnOob(s));a(!s.wands.oob);done=true;cases++;break;}
 a(done,wallStyle+' '+growth);
 for(const [key,e]of base.world.edges)if(e.kind==='underpass'){const [id,d]=key.split(':').map(Number);a(!O.boundary(base,id,d,e));}
}
// Control entry only to isolate replay bookkeeping from placement/AI timing.
const original=G.cast;G.cast=(s,spell,d)=>{const ok=original(s,spell,d);if(ok)O.enter(s,'@',d);return ok;};
try{const s=S.create('crossingMaze',{seed:'cross-save',width:16,height:18,growth:'dfs',wallStyle:'grid',floorUnderpasses:2,underpassShape:'mixed',ruleMode:'birds'});C.enableWands(s);
 for(let i=0;i<500&&!s.wands.held.length;i++){const p=P.route(s,id=>s.wands.items.some(x=>x.id===id));a(S.move(s,p?.[0]??4));}a(s.wands.held.length);const spell=s.wands.held[0];G.cast(s,spell,1);C.recordCast(s,spell,1);a(S.move(s,1));const j={number:1,steps:0},v={truth:false,render:'hybrid'},saved=C.snapshot(s,j,v),restored=C.prepare(saved);a.deepEqual(restored.state.wands,s.wands);a.equal(C.snapshot(restored.state,j,v),saved);a(C.returnOob(s));const home=C.snapshot(s,j,v),r=C.prepare(home);a.deepEqual(r.state.wands,s.wands);a.equal(r.state.id,s.id);a.equal(C.snapshot(r.state,j,v),home);
}finally{G.cast=original;}
console.log({cases,planner:true,underpassExcluded:true,saveReturnReplay:true});
