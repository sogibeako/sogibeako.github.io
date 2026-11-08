const assert=require('node:assert/strict'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');
let cases=0;
for(const growth of ['walls','dfs','prim','growing','hunt','wilson','rooms'])for(const wallStyle of ['dense','grid'])for(const holeRimWalls of [false,true]){
 if(growth==='wilson'&&wallStyle==='dense')continue;
 const s=S.create('tripleMaze',{growth,wallStyle,holeRimWalls,holePlacement:'offset',holeSize:3,dimensions:[[16,16],[24,16],[12,16]],floorUnderpasses:2,underpassShape:'mixed',loopStyle:'meander',seed:'triple-auto-'+growth}),seen=new Set([s.id]),sheets=new Set([0]);let portals=0;
 while(seen.size<P.targets(s).size){const path=P.route(s,id=>!seen.has(id));assert(path?.length,'unreachable floor');for(const d of path){const sheet=S.groundSheet(s.world,s.id);assert(S.move(s,d));if(S.groundSheet(s.world,s.id)!==sheet)portals++;seen.add(s.id);sheets.add(S.groundSheet(s.world,s.id));}}
 for(const d of P.route(s,id=>id===s.world.exit))assert(S.move(s,d));assert.equal(s.id,s.world.exit);assert.equal(sheets.size,3);assert(portals>=2);for(const p of s.world.passages){assert(seen.has(p.vertical));assert(seen.has(p.horizontal));}cases++;
}
console.log(cases+' triple tori: all floors, three different-sized sheets, holes with/without rim walls, both underpass lanes and exit reached.');
const fs=require('node:fs'),vm=require('node:vm'),els={},listeners={},movementListeners={};let pending=null;
const el=id=>els[id]??={value:id==='crossAutoSpeed'?'250':'',checked:false,focus(){},getContext(){return {};},setAttribute(){},addEventListener(){}};
const context=vm.createContext({Map,Set,ConnectionSpace:S,CrossingAutowalk:P,document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(n,f,c)=>{if(c)listeners[n]=f;else movementListeners[n]=f;}},window:{ExplorationSolver:require('./exploration-solver.js'),SheetFeatures:require('./sheet-features.js'),addEventListener(){}},setTimeout:(fn,delay)=>(pending={fn,delay},1),clearTimeout:()=>pending=null});
vm.runInContext(fs.readFileSync(__dirname+'/connections-lab.js','utf8').replace("window.addEventListener('resize',draw);draw();",''),context);vm.runInContext("draw=()=>{};state=S.create('tripleMaze',{ruleMode:'keys',seed:'ui',dimensions:[[12,12],[20,12],[12,12]],holeSize:2});truth=true",context);
el('spaceMode').value='tripleMaze';const key=key=>({key,shiftKey:true,target:{closest:()=>false},preventDefault(){},stopImmediatePropagation(){}});listeners.keydown(key('A'));
for(let n=0;pending&&pending.delay!==700&&n<10000;n++){const fn=pending.fn;pending=null;fn();}
assert(pending&&pending.delay===700);assert(vm.runInContext('state.id===state.world.exit',context));
assert(vm.runInContext('state.tripleLoops.counts.every(c=>c.every(n=>n===3))',context));
assert(el('crossAutoStatus').textContent.includes('縦横ループ理解が完了'));
const waitingState=vm.runInContext('state',context);
vm.runInContext('state.tripleLoops.counts[2][1]=2',context);
pending.fn();assert.equal(vm.runInContext('state',context),waitingState,'recheck knowledge before changing maze');
assert.equal(vm.runInContext('journey.number',context),1);
for(let n=0;pending&&pending.delay!==700&&n<10000;n++){const fn=pending.fn;pending=null;fn();}
assert(pending&&pending.delay===700);
assert(vm.runInContext('state.tripleLoops.counts.every(c=>c.every(n=>n===3))',context));
const before=vm.runInContext('state',context);pending.fn();assert.notEqual(vm.runInContext('state',context),before);assert.equal(vm.runInContext('journey.number',context),2);assert.equal(vm.runInContext('state.world.sheets',context),3);
el('crossAutoStop').onclick();listeners.keydown(key('G'));assert(pending);for(let i=0;i<5;i++)listeners.keydown(key('+'));assert.equal(el('crossAutoSpeed').value,'10');listeners.keydown(key('Escape'));assert.equal(pending,null);
console.log('Triple lab UI: Shift+A/G, truth-view movement, all-floor finish, next seed, counters, speed and stop passed.');

vm.runInContext("state=S.create('tripleMaze',{ruleMode:'keys',tripleRoute:'return',returnShape:'irregular',dimensions:[[20,20],[24,20],[20,20]],holeSize:4,wallStyle:'grid',growth:'wilson',floorUnderpasses:2});journey={number:1,steps:0}",context);
listeners.keydown(key('A'));
for(let n=0;pending&&pending.delay!==700&&n<15000;n++){const fn=pending.fn;pending=null;fn();}
assert(pending&&pending.delay===700);assert(vm.runInContext('state.id===state.world.exit&&state.tripleLoops.counts.flat().every(n=>n===3)',context));
pending.fn();assert.equal(vm.runInContext('state.world.tripleRoute',context),'return');assert.equal(vm.runInContext('state.world.returnShape',context),'irregular');assert.equal(vm.runInContext('journey.number',context),2);el('crossAutoStop').onclick();
console.log('Return-layout UI: all-floor auto learns all six loops before exit, then preserves return layout on next maze.');

for(const tripleRoute of ['chain','return']){
 vm.runInContext(`state=S.create('tripleMaze',{tripleRoute:'${tripleRoute}',shiftX:2,shiftY:-2,returnShape:'irregular',dimensions:[[20,20],[24,20],[20,20]],holeSize:4,wallStyle:'grid',growth:'prim',floorUnderpasses:2});journey={number:1,steps:0}`,context);
 listeners.keydown(key('A'));
 for(let n=0;pending&&pending.delay!==700&&n<18000;n++){const fn=pending.fn;pending=null;fn();}
 assert(pending&&pending.delay===700);
 assert(vm.runInContext('state.id===state.world.exit&&state.tripleLoops.counts.flat().every(n=>n===3)',context));
 pending.fn();
 assert.equal(vm.runInContext('state.world.shiftX',context),2);assert.equal(vm.runInContext('state.world.shiftY',context),-2);
 assert.equal(vm.runInContext('state.world.layouts[1].period.width',context),24);
 assert.equal(vm.runInContext('state.world.tripleRoute',context),tripleRoute);
 el('crossAutoStop').onclick();
}
console.log('Biaxial skew: both routes finish full exploration and six loops, retain nominal size/shifts on next maze.');

vm.runInContext("state=S.create('tripleMaze',{shiftX:2,shiftY:-2,dimensions:[[16,16],[24,16],[16,16]],holeSize:3});",context);
const tripleAdapter=context.window.TripleExplorationAdapter,known=new Set();
assert.equal(tripleAdapter.autoLoopPending(),6,'host learning is independent of standalone run');
let guard=0;while(guard++<20000){const path=tripleAdapter.autoExplore(known)??tripleAdapter.autoLoop()??tripleAdapter.autoPlan();if(!path.length)break;for(const d of path)tripleAdapter.autoMove(d);}
assert(guard<20000);assert.equal(tripleAdapter.autoLoopPending(),0);assert(tripleAdapter.progress().exit);
assert.equal(known.size,tripleAdapter.autoTargets().size);
console.log('Triple native host adapter: all floors and six learned periods before exit, without standalone auto state.');

// A shared-course save can contain an applied chain world and stale return controls.
let skipState=S.create('tripleMaze',{growth:'rooms',wallStyle:'grid',holeSize:2,holePlacement:'offset',dimensions:[[24,24],[24,22],[24,24]],seed:'skip-stale-controls'}),skipControls={};
if(process.argv[2]){let raw=fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'');const parsed=JSON.parse(raw);if(typeof parsed==='string')raw=parsed;const saved=S.decodeSave(raw).snapshot;skipState=saved.state;skipControls=saved.controls;}
context.skipState=skipState;vm.runInContext('state=skipState;truth=true',context);
for(const [id,value]of Object.entries(skipControls)){el(id).value=value.value;el(id).checked=value.checked;}
el('spaceMode').value='tripleMaze';el('tripleRoute').value='return';el('tripleHoleSize').value='2';el('tripleHolePlacement').value='offset';el('tripleRandomNext').checked=false;
const applied=S.randomTripleOptions('comparison',skipState.world,{});
movementListeners.keydown(key('N'));
const skipped=vm.runInContext('state',context);assert.notEqual(skipped,skipState,'Shift+N must generate despite stale return settings');assert.notEqual(skipped.world.seed,skipState.world.seed);assert.deepEqual(structuredClone(S.randomTripleOptions('comparison',skipped.world,{})),structuredClone(applied));assert.equal(el('sizeError').textContent,'');assert(vm.runInContext('truth',context));
console.log('Triple Shift+N: applied world retained despite incompatible stale form fields, new seed generated, truth view retained.');

const restoredSnapshot={state:skipState,journey:{number:2,steps:50},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{tripleRoute:{value:'return',checked:false},tripleHoleSize:{value:'4',checked:false},tripleMazeSize:{value:'small',checked:false},tripleMazeSeed:{value:'stale-seed',checked:false},tripleRandomNext:{value:'on',checked:true},randomTripleSize:{value:'on',checked:false},tripleFoldLoops:{value:'on',checked:false}}};
context.restoreInput=S.encodeSave(restoredSnapshot);el('tripleCustomSize').hidden=true;vm.runInContext('restoreDoubleText(restoreInput)',context);
assert.equal(el('tripleRoute').value,skipState.world.tripleRoute);assert.equal(el('tripleHoleSize').value,String(skipState.world.holeSize));assert.equal(el('tripleMazeSeed').value,skipState.world.seed);assert.equal(el('tripleMazeSize').value,'custom');assert.equal(el('tripleCustomSize').hidden,false);
assert(el('tripleRandomNext').checked);assert.equal(el('randomTripleSize').checked,false);assert.equal(el('tripleFoldLoops').checked,false);
assert.equal(vm.runInContext('state.steps',context),skipState.steps);
for(const [i,n]of ['A','B','C'].entries()){const l=skipState.world.layouts[i];assert.equal(Number(el('triple'+n+'Width').value),l.period?.width??l.width);assert.equal(Number(el('triple'+n+'Height').value),l.period?.height??l.height);}
const prepared=tripleAdapter.courseFresh({...applied,seed:'settings-course-enter',tripleRoute:'chain'});tripleAdapter.courseEnter(prepared);assert.equal(el('tripleMazeSeed').value,'settings-course-enter');assert.equal(el('tripleRoute').value,'chain');assert(el('tripleRandomNext').checked);assert.equal(el('randomTripleSize').checked,false);
console.log('Triple settings: direct saved-state restoration and course entry synchronize applied geometry, retain next-maze/learning preferences and show custom dimensions.');

tripleAdapter.courseEnter(tripleAdapter.courseFresh({...applied,seed:'host-triple-warps',ruleMode:'warpHidden'}));
const warpKnown=new Set();let warpGuard=0;
while(warpGuard++<20000){const path=tripleAdapter.autoExplore(warpKnown)??tripleAdapter.autoLoop()??tripleAdapter.autoPlan();if(!path.length)break;for(const d of path)tripleAdapter.autoMove(d);}
assert(warpGuard<20000);assert.equal(tripleAdapter.autoWarpPending(),0);assert.equal(tripleAdapter.autoLoopPending(),0);assert(tripleAdapter.progress().exit);assert.equal(warpKnown.size,tripleAdapter.autoTargets().size);
tripleAdapter.apply(tripleAdapter.prepare(tripleAdapter.snapshot()));assert.equal(tripleAdapter.autoWarpPending(),0);assert.equal(el('tripleRuleMode').value,'warpHidden');
console.log('Triple warp host adapter: every floor, every warp direction, all six loops, exit and saved traversal knowledge.');

tripleAdapter.courseEnter(tripleAdapter.courseFresh({...applied,seed:'host-triple-mixed',ruleMode:'warpHiddenKeys'}));const mixedKnown=new Set();let mixedGuard=0;while(mixedGuard++<20000){const path=tripleAdapter.autoExplore(mixedKnown)??tripleAdapter.autoLoop()??tripleAdapter.autoPlan();if(!path.length)break;for(const d of path)tripleAdapter.autoMove(d);}assert(mixedGuard<20000);assert(tripleAdapter.progress().exit);assert.equal(tripleAdapter.autoWarpPending(),0);assert.equal(tripleAdapter.autoLoopPending(),0);assert.equal(mixedKnown.size,tripleAdapter.autoTargets().size);tripleAdapter.apply(tripleAdapter.prepare(tripleAdapter.snapshot()));assert.equal(el('tripleRuleMode').value,'warpHiddenKeys');console.log('Mixed triple host: keys, hidden warps, full exploration, six loops, exit and save restoration.');

tripleAdapter.courseEnter(tripleAdapter.courseFresh({...applied,seed:'mark-buttons',ruleMode:'warp'}));el('tripleMark').onclick();assert.equal(vm.runInContext('state.features.marks.size',context),1);el('tripleMatch').onclick();assert.match(el('tripleMarkStatus').textContent,/1\/9/);tripleAdapter.apply(tripleAdapter.prepare(tripleAdapter.snapshot()));assert.equal(vm.runInContext('state.features.marks.size',context),1);console.log('Triple mark and match buttons: place, report and restore manual landmark.');

for(const ruleMode of ['birdsKeys','warpHiddenAll']){
tripleAdapter.courseEnter(tripleAdapter.courseFresh({...applied,seed:'host-triple-birds',ruleMode}));const birdKnown=new Set();let birdGuard=0;
while(birdGuard++<12000){tripleAdapter.autoPrepare();let path=tripleAdapter.autoExplore(birdKnown),learning=false;if(path===null){path=tripleAdapter.autoLoop();learning=!!path;path??=tripleAdapter.autoPlan();}if(!path.length)break;if(!learning)path=tripleAdapter.autoDetour()||path;for(const d of learning?path:path.slice(0,1)){tripleAdapter.autoMove(d);for(const id of tripleAdapter.autoTraversed())birdKnown.add(id);if(tripleAdapter.autoRelocated())break;}}
assert(birdGuard<12000);assert(tripleAdapter.progress().exit);assert.equal(tripleAdapter.autoLoopPending(),0);assert.equal(tripleAdapter.autoWarpPending(),0);assert.equal(birdKnown.size,tripleAdapter.autoTargets().size);tripleAdapter.apply(tripleAdapter.prepare(tripleAdapter.snapshot()));assert.equal(el('tripleRuleMode').value,ruleMode);console.log('Bird triple host adapter: dynamic exploration, marks, six loops, exit and restored rule.');

}
