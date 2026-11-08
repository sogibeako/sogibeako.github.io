const a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),C=require('./exploration-course.js');
const els={},defaults={sheets:'2',size:'12',route:'return',pillar:'grown',direction:'left',algorithm:'prim',wallStyle:'grid',underpassShape:'mixed',underpasses:'2',density:'.45',seed:'course-branch',speed:'10'},ctx=new Proxy({},{get:()=>()=>{}});
const el=id=>els[id]??={value:defaults[id]??'',clientWidth:900,clientHeight:480,setAttribute(){},focus(){},getContext:()=>ctx};
const env={BranchArrows:require('./branch-arrows.js'),BranchLearning:require('./branch-learning.js'),document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},devicePixelRatio:1,setTimeout(){},clearTimeout(){}};
for(const [name,file]of Object.entries({BranchMaze:'branch-maze',BranchMemory:'branch-memory',BranchUnderpasses:'branch-underpasses',BranchSave:'branch-save',ConnectionSpace:'connection-space',CrossingAutowalk:'crossing-autowalk'}))env[name]=require('./'+file+'.js');
vm.runInNewContext(fs.readFileSync(__dirname+'/branch-maze-ui.js','utf8'),env);
const adapter=env.window.BranchExplorationAdapter,seen=new Set([adapter.autoPosition()]),targets=adapter.autoTargets();
a(targets.size>30);let count=0;
while(true){const path=adapter.autoExplore(seen);if(path===null)break;a(path.length>0);adapter.autoMove(path[0]);seen.add(adapter.autoPosition());a(++count<10000);}
a.equal(seen.size,targets.size);a(adapter.autoRequireLoops());let loops=0;while(adapter.autoLoopPending()){const path=adapter.autoLoop();a(path?.length);for(const d of path)adapter.autoMove(d);a(++loops<7);}a.equal(adapter.autoLoopPending(),0);for(const d of adapter.autoPlan())adapter.autoMove(d);a(adapter.progress().exit);
const course={enabled:true,completed:0,steps:0,order:'sequence',pool:['plane','branch']};
a.equal(C.advance(course,'main',{exit:true,steps:10,topology:'plane'}).mode,'branch');
const n=C.advance(course,'branch',adapter.progress());a.equal(n.topology,'plane');a.equal(n.course.completed,1);a.equal(n.course.steps,adapter.progress().steps);
a.equal(C.advance({...course,order:'random'},'main',{exit:true,steps:0},()=>.99).mode,'branch');
a.equal(C.advance(course,'branch',{exit:false,steps:8},Math.random,true).course.completed,0);
const saved=adapter.snapshot(),backup=adapter.prepare(saved),old=adapter.progress().token;
adapter.courseEnter(adapter.courseFresh('course-next'));a.notEqual(adapter.progress().token,old);a.equal(adapter.progress().steps,0);a.equal(JSON.parse(adapter.snapshot()).options.size,12);
adapter.apply(backup);a.equal(adapter.snapshot(),saved);
console.log('Branch common adapter: all floors and exit, sequence/random/skip accounting, fresh settings, and rollback passed.');
