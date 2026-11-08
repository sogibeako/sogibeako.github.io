const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('./graph-wands.js');globalThis.GraphWands=G;
function harness(branch,variant){
 const els={},defaults=branch?{ruleMode:'warpAll',sheets:String(variant),size:'12',route:'return',pillar:'grown',direction:'both',algorithm:'dfs',wallStyle:'grid',underpasses:'2',underpassShape:'mixed',density:'.45',seed:'branch-staff',speed:'20'}:{ruleMode:'birds',mode:variant,terrain:'maze',size:'12',seed:'turn-staff',algorithm:'prim',render:'hybrid',underpassCount:'2',underpassShape:'mixed',seamRoutes:'2',autoMode:'explore',autoSpeed:'20'};
 const ctx=new Proxy({},{get:()=>()=>{}}),el=id=>els[id]??={value:defaults[id]??'',checked:true,style:{},options:[{value:'20'}],clientWidth:800,clientHeight:480,closest:()=>null,focus(){},setAttribute(){},getContext:()=>ctx};let get,opts,remembered;
 const win={addEventListener(){},dispatchEvent(){}},sandbox={Map,Set,Math,Event:class{},ResizeObserver:class{observe(){}},URLSearchParams,location:{search:''},devicePixelRatio:1,window:win,document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},clearTimeout(){},clearInterval(){},WandFlight:require('./wand-flight.js'),GraphOob:require('./graph-oob.js'),GraphWands:G,GraphWandControls:{attach(g,d,t,c,o){get=g;opts=o;return {state(){},busy:()=>false,projectile:()=>null};}}};
 for(const [key,file]of Object.entries({MazeWildlife:'maze-wildlife',MazeStroll:'maze-stroll',ConnectionSpace:'connection-space',SheetFeatures:'sheet-features',ExplorationGeneration:'exploration-generation',BranchMaze:'branch-maze',BranchMemory:'branch-memory',BranchUnderpasses:'branch-underpasses',BranchLearning:'branch-learning',BranchArrows:'branch-arrows',BranchSave:'branch-save',CrossingAutowalk:'crossing-autowalk',QuarterTurnMaze:'quarter-turn-maze',QuarterTurnMemory:'quarter-turn-memory',QuarterTurnAuto:'quarter-turn-auto',QuarterTurnSave:'quarter-turn-save'}))sandbox[key]=require('./'+file+'.js');
 const memKey=branch?'BranchMemory':'QuarterTurnMemory',memBase=sandbox[memKey];sandbox[memKey]={...memBase,observe(...args){remembered=args[branch?1:0];return memBase.observe(...args);}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/'+(branch?'branch-maze-ui':'quarter-turn-lab')+'.js','utf8'),sandbox);
 const a=branch?win.BranchExplorationAdapter:win.QuarterExplorationAdapter;
 return {a,get,el,memory:()=>remembered,cast(spell,d){const s=get();assert(G.cast(s,spell,d));opts.recordCast(spell,d);sandbox.MazeWildlife.graphTick(s);opts.afterCast();el('truth').onclick();}};
}
for(const [branch,variants]of [[true,[2,3]],[false,['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']]])for(const variant of variants){
 const h=harness(branch,variant),{a}=h;assert(h.get().wands);if(branch)h.el('placeMarker').onclick();else assert(h.get().wands.items.every(p=>p.id%(h.get().world.size+1)!==0));
 const seen=new Set();for(let i=0;i<2500;i++){seen.add(a.autoPosition());const path=a.autoExplore(seen)||a.autoPlan();a.autoMove(path?.[0]??4);if(h.get().wands.held.length&&i>60)break;}
 assert(h.get().wands.held.length,'pickup '+variant);
 for(let i=0;i<8;i++){h.cast(h.get().wands.held[0],i%4);a.autoWait();}
 const summarize=()=>JSON.stringify({id:h.get().id,frame:h.get().frame,wands:h.get().wands,features:h.get().features,wildlife:h.get().wildlife},(_,v)=>v instanceof Map?[...v]:v);
 const saved=a.snapshot(),before=summarize(),memoryBefore=structuredClone(h.memory());const ready=a.prepare(saved);assert.deepEqual(JSON.parse(a.snapshot()),JSON.parse(saved));a.apply(ready);assert.deepEqual(JSON.parse(a.snapshot()),JSON.parse(saved));assert.equal(summarize(),before,'exact replay '+variant);assert.deepEqual(h.memory(),memoryBefore,'map memory '+variant);
 for(let i=0;i<5;i++)a.autoWait();const continued=summarize();a.apply(a.prepare(saved));for(let i=0;i<5;i++)a.autoWait();assert.equal(summarize(),continued);
 const bad=JSON.parse(saved);bad.moves.push({spell:'bad',d:0});assert.throws(()=>a.prepare(JSON.stringify(bad)));
 console.log((branch?'Branch ':'Rotation ')+variant+': pickup, cast, memory/marker replay, creatures and continuation passed');
}

// Controlled entry isolates the room UI and replay from probabilistic staff placement.
for(const [branch,variant]of [[true,3],[false,'quarterCCW']]){
 const original=G.cast;G.cast=(s,spell,d)=>{const ok=original(s,spell,d);if(ok)require('./graph-oob.js').enter(s,'@',d);return ok;};
 try{const h=harness(branch,variant),a=h.a,seen=new Set();
 for(let i=0;i<2500&&!h.get().wands.held.length;i++){seen.add(a.autoPosition());a.autoMove((a.autoExplore(seen)||a.autoPlan())?.[0]??4);}
 assert(h.get().wands.held.length);h.cast(h.get().wands.held[0],1);assert(a.autoOob());
 a.autoMove(1);const saved=a.snapshot();a.apply(a.prepare(saved));assert(a.autoOob());assert.deepEqual(JSON.parse(a.snapshot()),JSON.parse(saved));
 a.returnOob();assert(!a.autoOob());const returned=a.snapshot();a.apply(a.prepare(returned));assert.deepEqual(JSON.parse(a.snapshot()),JSON.parse(returned));
 console.log((branch?'Branch':'Quarter')+' OOB fixture: room movement, save/load and return replay passed');
 }finally{G.cast=original;}
}
