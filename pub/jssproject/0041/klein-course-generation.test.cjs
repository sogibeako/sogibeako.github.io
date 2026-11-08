const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('./exploration-generation.js'),S=require('./connection-space.js'),P=require('./exploration-solver.js'),K=require('./klein-learning.js'),F=require('./sheet-features.js');
const base={avoidWarpTrap:true,width:24,height:20,shiftY:4,growth:'dfs',ruleMode:'warpHiddenAll',floorUnderpasses:2,underpassShape:'mixed',guaranteeLoops:true,birdWander:true};
const course={randomGeneration:true,generators:{main:['dfs'],skew:['dfs'],klein:G.candidates('klein',{})},sizes:{...G.validateSizes(),enabled:true,widthMin:16,widthMax:24,heightMin:16,heightMax:24},rules:{enabled:true,pool:['plain','keys','warp','birds']},shifts:{enabled:true,pool:['none','y']}};
const before=structuredClone({base,course}),seen={growth:new Set(),ruleMode:new Set(),shiftY:new Set(),width:new Set(),height:new Set()};
for(let i=0;i<256;i++){const seed='random-klein-'+i,o=G.chooseKlein(base,seed,course);assert.deepEqual(o,G.chooseKlein(base,seed,course));for(const k in seen)seen[k].add(o[k]);assert(o.width>=16&&o.width<=24&&o.width%2===0);assert(o.height>=16&&o.height<=24&&o.height%2===0);assert.equal(o.seed,seed);}
assert.deepEqual({base,course},before);assert.deepEqual(G.chooseKlein(base,'keep'),{...base,seed:'keep'});assert.equal(seen.growth.size,4);assert.equal(seen.ruleMode.size,5);assert.equal(seen.shiftY.size,5);assert(seen.width.size>1&&seen.height.size>1);
assert.throws(()=>G.chooseKlein(base,'bad',{...course,shifts:{enabled:true,pool:['both']}}));
assert.throws(()=>G.chooseKlein(base,'bad',{...course,sizes:{...course.sizes,widthMin:8,widthMax:14}}));
assert.throws(()=>G.chooseKlein({...base,shiftY:22},'bad',{...course,shifts:{enabled:false,pool:['none']},sizes:{...course.sizes,heightMax:20}}));
assert.throws(()=>G.validatePools({...course.generators,klein:[]}));assert.throws(()=>G.validatePools({...course.generators,klein:['wilson']}));
console.log('256 Klein condition draws: repeatability, supported variation, OFF retention, immutable input and incompatible ranges/pools rejected.');
(async()=>{for(let i=0;i<8;i++){
 const els={},defaults={...base,seed:'initial-course',loopThreshold:'3'},el=id=>els[id]??={value:String(defaults[id]??''),checked:true,textContent:'',addEventListener(){},clientWidth:400,clientHeight:320,focus(){},setAttribute(){},getContext:()=>new Proxy({},{get:()=>()=>{}})},win={addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/klein-player.js','utf8'),{Map,Set,ExplorationGeneration:G,ConnectionSpace:S,ExplorationSolver:P,KleinLearning:K,SheetFeatures:F,SheetAnnotations:{...require('./sheet-annotations.js'),attach:()=>({render(){}})},document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},window:win,Event:class{},devicePixelRatio:1});
 const a=win.KleinExplorationAdapter,previous=a.progress().token,seed='random-klein-'+i;
 const prepared=a.courseFresh(seed,course);assert.equal(a.progress().token,previous);assert.deepEqual(JSON.parse(JSON.stringify(prepared.options)),G.chooseKlein(base,seed,course));a.courseEnter(prepared);
 const visited=new Set([a.autoPosition()]);for(let n=0;n<8000;n++){a.autoPrepare();const explore=a.autoExplore(visited),loop=explore===null?a.autoLoop():null,path=(!loop?a.autoDetour():null)??explore??loop??a.autoPlan();if(!path.length)break;for(const d of path){a.autoMove(d);for(const id of a.autoTraversed())visited.add(id);if(a.autoRelocated()&&loop||a.autoDynamic()&&!loop)break;}}
 assert(a.progress().exit,'exit '+seed);assert.deepEqual(visited,a.autoTargets());assert.equal(a.autoWarpPending(),0);assert.equal(a.autoLoopPending(),0);
 const B=require('./exploration-bundle.js'),native=a.snapshot(),tokenBefore=a.progress().token,adapters={klein:a};let commits=0;
 for(const name of ['main','skew','enclosure'])adapters[name]={prepare:text=>JSON.parse(text),apply:()=>commits++};
 const savedCourse={...course,enabled:true,completed:3,steps:123,order:'sequence',pool:['plane','klein']},bundle=B.encode('{}','{}','klein',savedCourse,'{}',undefined,native),ready=await B.prepare(bundle,adapters);
 assert.equal(B.unpack(bundle).version,3);assert.equal(a.progress().token,tokenBefore,'bundle validation cannot replace played map');assert.equal(a.snapshot(),native);assert.equal(commits,0);
 const corrupt=JSON.parse(bundle);corrupt.klein=JSON.stringify({...JSON.parse(native),moves:[9]});await assert.rejects(()=>B.prepare(JSON.stringify(corrupt),adapters));assert.equal(commits,0);assert.equal(a.snapshot(),native);
 assert.equal(B.apply(ready,adapters,ready),'klein');assert.equal(a.snapshot(),native);assert.equal(ready.course.completed,3);assert.equal(ready.course.steps,123);
 const pref={render:'ascii',threshold:3,folding:true,foldDisplay:'continuous'};let fail=true;adapters.preferences={apply(){if(fail){fail=false;throw Error('display failed');}}};const withPref=await B.prepare(B.encode('{}','{}','klein',savedCourse,'{}',pref,native),adapters);
 assert.throws(()=>B.apply(withPref,adapters,withPref),/元の探索へ戻しました/);assert.equal(a.snapshot(),native);
 const token=a.progress().token;assert.throws(()=>a.courseFresh('bad',{...course,shifts:{enabled:true,pool:['x']}}));assert.equal(a.progress().token,token);el('save').onclick();assert.equal(JSON.parse(el('saved').value).options.seed,seed);el('restore').onclick();assert.equal(el('error').textContent,'');assert(a.progress().exit);
}
console.log('8 random Klein runtime journeys: all floors, warp directions, loop learning, exit, save replay and failed preparation retention passed.');

})().catch(e=>{console.error(e);process.exitCode=1;});
