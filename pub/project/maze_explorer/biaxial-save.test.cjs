const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('./klein-biaxial.js'),E=require('./biaxial-exploration.js');
(async()=>{
const els={},main={},ev={},loads={},defaults={mode:'free',sx:'3',sy:'2',terrain:'atelier-prim',size:'24,20',seed:'free-7vzobe5',viewMode:'wide',memoryRadius:'10',loopThreshold:'3',underpassCount:'4',underpassShape:'mixed',ruleMode:'mixed'};
const ctx=new Proxy({},{get:()=>()=>{}}),el=id=>els[id]??={value:defaults[id]??'',checked:id==='foldLoops',clientWidth:500,getContext:()=>ctx,focus(){},setAttribute(){}};
const child={addEventListener(){}};vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{GraphWands:require('./graph-wands.js'),MazeWildlife:require('./maze-wildlife.js'),KleinBiaxial:K,BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:E,devicePixelRatio:1,window:child,document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}}});
const a=child.BiaxialExplorationAdapter;assert(a.autoTargets().size>0);assert.match(el('status').textContent,/アンダーパス [1-4] \/ 4か所/);let callback=null;
const m=id=>main[id]??={value:id==='autoWalkSpeed'?'250':'explore',addEventListener(n,f){loads[id]=f;}};
m('biaxialFrame').contentWindow=child;m('biaxialFrame').contentDocument={addEventListener(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-autowalk.js','utf8'),{document:{getElementById:m,addEventListener:(n,f)=>ev[n]=f},window:{ExplorationHost:{mode:()=> 'biaxial',autoAdvance:async()=>false},addEventListener(){}},setTimeout:f=>(callback=f,1),clearTimeout:()=>callback=null});
const key=k=>({type:'keydown',key:k,shiftKey:true,target:{closest:()=>false},preventDefault(){},stopImmediatePropagation(){}});
ev.keydown(key('W'));assert.equal(el('wallPass').textContent,'壁抜け ON · Shift+W');ev.keydown(key('W'));assert.equal(el('wallPass').textContent,'壁抜け OFF · Shift+W');
ev.keydown(key('A'));assert(m('autoWalkStart').disabled);ev.keydown(key('+'));assert.equal(m('autoWalkSpeed').value,'80');
for(let n=0;callback&&n<15000;n++){const f=callback;callback=null;await f();}
assert(a.progress().exit);assert.match(el('status').textContent,/鳥人間 V/);assert.match(el('status').textContent,/鍵取得済み/);assert.equal(a.autoWarpPending(),0);assert.equal(a.autoLoopPending(),0);assert(m('autoWalkProgress').textContent.includes('未訪問 0'));assert.equal(callback,null);
const saved=a.snapshot(),status=el('status').textContent,loops=el('loopStatus').textContent,stepCount=a.progress().steps;
const prepared=a.prepare(saved);assert.equal(a.snapshot(),saved,'validation leaves current game intact');
el('reset').onclick();a.apply(prepared);assert.equal(a.snapshot(),saved);assert.equal(a.progress().steps,stepCount);assert.equal(el('status').textContent,status);assert.equal(el('loopStatus').textContent,loops);assert(a.progress().exit);assert.equal(a.autoWarpPending(),0);
const Bundle=require('./exploration-bundle.js'),states={},adapters={biaxial:a};let commits=0;
for(const name of ['main','skew','enclosure','klein'])adapters[name]={prepare:JSON.parse,apply(v){states[name]=v;commits++;}};
const bundle=Bundle.encode('{}','{}','biaxial',undefined,'{}',undefined,'{}',saved),ready=await Bundle.prepare(bundle,adapters);assert.equal(Bundle.unpack(bundle).version,4);assert.equal(commits,0);
assert.equal(Bundle.apply(ready,adapters,ready),'biaxial');assert.equal(a.snapshot(),saved);
const badBundle=JSON.parse(bundle);badBundle.biaxial='{}';const priorCommits=commits;await assert.rejects(Bundle.prepare(JSON.stringify(badBundle),adapters));assert.equal(commits,priorCommits);assert.equal(a.snapshot(),saved);
const originalApply=a.apply;let fail=true;adapters.biaxial={prepare:a.prepare,apply(v){originalApply(v);if(fail){fail=false;throw Error('render failed');}}};assert.throws(()=>Bundle.apply(ready,adapters,ready),/元の探索へ/);assert.equal(a.snapshot(),saved);
const legacy=await Bundle.prepare(Bundle.encode('{}','{}','klein',undefined,'{}',undefined,'{}'),adapters);Bundle.apply(legacy,adapters,ready);assert.equal(a.snapshot(),saved,'legacy leaves free connection intact');
const G=require('./exploration-generation.js'),C=require('./exploration-course.js');
const course={enabled:true,completed:2,steps:50,order:'sequence',pool:['klein','biaxial'],randomGeneration:true,generators:{...G.validatePools(),biaxial:['atelier-rooms']},rules:{enabled:true,pool:['keys']},shifts:{enabled:true,pool:['both']},sizes:{...G.validateSizes(),enabled:true,widthMin:24,widthMax:24,heightMin:20,heightMax:20}};
const options=G.chooseBiaxial(a.courseOptions(),'course-free',course),fresh=a.courseFresh(options);assert.equal(a.snapshot(),saved,'fresh preparation preserves exploration');assert.equal(options.terrain,'atelier-rooms');assert.equal(options.ruleMode,'keys');assert.notEqual(options.sx,'0');assert.notEqual(options.sy,'0');assert.equal(options.size,'24,20');assert.deepEqual(G.chooseBiaxial(a.courseOptions(),'course-free',course),options);
a.courseEnter(fresh);assert.equal(a.progress().steps,0);assert.equal(JSON.parse(a.snapshot()).options.seed,'course-free');a.apply(prepared);
assert.equal(C.advance(course,'klein',{steps:7,exit:true}).mode,'biaxial');assert.equal(C.advance(course,'biaxial',{steps:7,exit:true}).mode,'klein');assert.equal(C.advance({...course,order:'random',pool:['biaxial']},'biaxial',{steps:7,exit:true},()=>.9).mode,'biaxial');
assert.throws(()=>G.chooseBiaxial(a.courseOptions(),'bad',{...course,sizes:{...course.sizes,widthMin:25,widthMax:25}}),/サイズ候補/);assert.equal(a.snapshot(),saved);
for(const change of [d=>d.actions.push(9),d=>d.options.size='999,999',d=>d.display.render='invalid',d=>d.version=99]){const bad=JSON.parse(saved);change(bad);assert.throws(()=>a.prepare(JSON.stringify(bad)));assert.equal(a.snapshot(),saved);}
el('reset').onclick();ev.keydown(key('G'));for(let n=0;callback&&n<15000;n++){const f=callback;callback=null;await f();}assert(a.progress().exit);assert(m('autoWalkProgress').textContent.includes('出口優先'));
console.log('Actual free runtime + shared UI: Shift+A full-floor/learning/exit, Shift+G exit and speed shortcut passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
