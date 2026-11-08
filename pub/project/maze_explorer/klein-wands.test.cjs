const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('./graph-wands.js');globalThis.GraphWands=G;
function harness(free,oobFixture=false){
 const wandApi=oobFixture?{...G,cast(s,spell,d){const ok=G.cast(s,spell,d);if(ok)require('./graph-oob.js').enter(s,'@',d);return ok;}}:G;
 const els={},defaults=free?{mode:'free',sx:'3',sy:'-2',terrain:'atelier-prim',size:'24,20',seed:'wand-free',viewMode:'wide',memoryRadius:'10',loopThreshold:'3',underpassCount:'2',underpassShape:'mixed',ruleMode:'mixed'}:{shiftY:'-2',ruleMode:'warpAll',loopThreshold:'3',seed:'wand-klein',growth:'dfs',width:'16',height:'20',floorUnderpasses:'2',underpassShape:'mixed'};
 const ctx=new Proxy({},{get:()=>()=>{}}),el=id=>els[id]??={value:defaults[id]??'',checked:true,clientWidth:800,clientHeight:480,focus(){},setAttribute(){},getContext:()=>ctx};let get,options;
 const win={addEventListener(){},dispatchEvent(){}};
 const sandbox={console,Map,Set,Math,Event:class{},CustomEvent:class{},devicePixelRatio:1,window:win,document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},WandFlight:require('./wand-flight.js'),GraphOob:require('./graph-oob.js'),GraphWands:wandApi,GraphWandControls:{attach(g,d,t,c,o){get=g;options=o;return {state(){},busy:()=>false,projectile:()=>null};}}};
 for(const [key,file]of Object.entries({MazeWildlife:'maze-wildlife',MazeStroll:'maze-stroll',KleinBiaxial:'klein-biaxial',BiaxialRules:'biaxial-rules',BiaxialUnderpasses:'biaxial-underpasses',BiaxialExploration:'biaxial-exploration',ExplorationGeneration:'exploration-generation',SheetFeatures:'sheet-features',ConnectionSpace:'connection-space',ExplorationSolver:'exploration-solver',KleinLearning:'klein-learning'}))sandbox[key]=require('./'+file+'.js');
 sandbox.SheetAnnotations={...require('./sheet-annotations.js'),attach:()=>({render(){}})};
 vm.runInNewContext(fs.readFileSync(__dirname+'/'+(free?'klein-biaxial-ui':'klein-player')+'.js','utf8'),sandbox);
 const a=free?win.BiaxialExplorationAdapter:win.KleinExplorationAdapter;
 return {a,get,el,cast(spell,d){const s=get();assert(wandApi.cast(s,spell,d));options.recordCast(spell,d);sandbox.MazeWildlife.graphTick(s);options.afterCast();el('truth').onclick();}};
}
for(const free of [false,true]){
 const h=harness(free),{a}=h;assert(h.get().wands,'enabled in bird games');if(!free)h.el('mark').onclick();else assert(h.get().wands.items.every(p=>p.id%13!==0),'fixed numeric landmarks remain free of staffs');
 // Walk until staffs are collected; keep the replay legitimate rather than injecting inventory.
 const seen=new Set();for(let i=0;i<3000;i++){seen.add(a.autoPosition());const route=a.autoExplore(seen)||a.autoPlan();a.autoMove(route?.[0]??4);if(h.get().wands.held.length&&i>80)break;}
 assert(h.get().wands.held.length,'staff pickup');
 for(let i=0;i<12;i++){h.cast(h.get().wands.held[0],i%4);a.autoWait();}
 const saved=a.snapshot(),before=JSON.stringify({id:h.get().id,frame:h.get().frame,wands:h.get().wands,features:h.get().features,wildlife:h.get().wildlife},(_,v)=>v instanceof Map?[...v]:v);
 const ready=a.prepare(saved);assert.equal(a.snapshot(),saved,'prepare non-mutating');a.apply(ready);
 assert.equal(a.snapshot(),saved,'actions retained');assert.equal(JSON.stringify({id:h.get().id,frame:h.get().frame,wands:h.get().wands,features:h.get().features,wildlife:h.get().wildlife},(_,v)=>v instanceof Map?[...v]:v),before,'spell state and creatures replay identically');
 for(let i=0;i<5;i++)a.autoWait();const continued=a.snapshot();a.apply(a.prepare(saved));for(let i=0;i<5;i++)a.autoWait();assert.equal(a.snapshot(),continued,'deterministic continuation');
 const bad=JSON.parse(saved);(bad.moves||bad.actions).push({spell:'bad',d:0});assert.throws(()=>a.prepare(JSON.stringify(bad)));
 const legacy=JSON.parse(saved);legacy.version=1;if(free)legacy.actions=[];else{legacy.moves=[];legacy.marks=[];legacy.markEvents=[];delete legacy.annotations;}a.apply(a.prepare(JSON.stringify(legacy)));assert(h.get().wands);const migrated=a.snapshot();a.apply(a.prepare(migrated));assert.equal(a.snapshot(),migrated,'legacy save migration keeps the activation point');
 console.log((free?'Free':'Standard')+' Klein: pickups, casts, bird turns, reflected topology, save/load and continuation passed');
}
for(const free of [false,true])for(const spell of G.spells){
 const I=[0,1,2,3],R=[2,1,0,3],edges=new Map();for(const [from,d,to,t]of [[0,1,1,R],[1,3,0,R],[1,1,2,I],[2,3,1,I],[2,1,3,I],[3,3,2,I]])edges.set(from+':'+d,{to,transform:t});
 const s={world:{mode:free?'free':'kleinMaze',wandTopology:free?'biaxial':undefined,seed:'reflection',cells:new Uint8Array([1,1,1,1]),edges,start:0,exit:3,layouts:[{width:2,height:2}]},id:0,frame:I,x:0,y:0,steps:0,history:[],features:{options:{birds:true},bird:2,door:null,key:null,cooldown:100,warps:new Map(),marks:new Map([[0,'1']])}};
 G.init(s);s.wands.items=[];s.wands.held=[spell];const L=require('./klein-learning.js');L.start(s).counts.set('y',{axis:'y',offset:0,count:3});G.cast(s,spell,1);L.observe(s);assert.equal(L.knowledge(s)[0].count,3);assert.equal(s.features.marks.get(0),'1');
 if(spell==='swap'){assert.equal(s.id,2);assert.deepEqual(s.frame,R);}if(spell==='push')assert.equal(s.features.bird,3);if(spell==='pull')assert.equal(s.features.bird,1);if(spell==='freeze')assert.equal(s.wands.bird.frozen,5);
}
console.log('Both Klein adapters: all four effects across reflected edges preserve marks and learned loop counts.');

for(const free of [false,true]){
 const h=harness(free,true),a=h.a,O=require('./graph-oob.js'),seen=new Set();
 for(let i=0;i<3000&&!h.get().wands.held.length;i++){seen.add(a.autoPosition());a.autoMove((a.autoExplore(seen)||a.autoPlan())?.[0]??4);}
 assert(h.get().wands.held.length);h.cast(h.get().wands.held[0],1);assert(a.autoOob());
 a.autoMove(1);const outside=a.snapshot();a.apply(a.prepare(outside));assert(a.autoOob());assert.equal(a.snapshot(),outside);
 a.returnOob();assert(!a.autoOob());const home=a.snapshot();a.apply(a.prepare(home));assert.equal(a.snapshot(),home);assert(!a.autoOob());
 console.log((free?'Free':'Standard')+' Klein OOB UI fixture: room movement, save replay, return and replay passed');
}
