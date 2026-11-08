const a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
for(const mode of ['explore','exit']){
 const els={},timers=new Map();let serial=0,handler,created=0,checks=0,lastState;
 const context=new Proxy({},{get:()=>()=>{}});
 const defaults={sheets:'2',size:'8',route:'random',pillar:'random',direction:'random',algorithm:'random',wallStyle:'random',underpassShape:'mixed',underpasses:'2',density:'.45',seed:'continuous',speed:'10'};
 const element=id=>els[id]??=( {value:defaults[id]??'',textContent:'',clientWidth:900,clientHeight:480,setAttribute(){},focus(){},getContext:()=>context} );
 const B=require('./branch-maze.js');
 const env={GraphWands:require('./graph-wands.js'),GraphWandControls:{attach:()=>({state(){},busy:()=>false,projectile:()=>null})},SheetFeatures:require('./sheet-features.js'),BranchArrows:require('./branch-arrows.js'),BranchLearning:require('./branch-learning.js'),BranchUnderpasses:require('./branch-underpasses.js'),BranchMaze:{...B,create(o){if(lastState){a.equal(lastState.id,lastState.world.exit);if(mode==='explore'){a.equal(visits.size,lastState.world.branchStats.floors);a.equal(lastState.branchLearning.laps,3);}checks++;}created++;lastState=B.create(o);visits=new Set([lastState.id]);return lastState;}},BranchMemory:require('./branch-memory.js'),CrossingAutowalk:require('./crossing-autowalk.js'),ConnectionSpace:{...require('./connection-space.js'),move(s,d){const ok=require('./connection-space.js').move(s,d);if(ok)visits.add(s.id);return ok;}},document:{getElementById:element,querySelectorAll:()=>[],addEventListener:(name,fn)=>{handler=fn;}},window:{addEventListener(){}},devicePixelRatio:1,setTimeout(fn){const id=++serial;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);}};
 let visits=new Set();vm.runInNewContext(fs.readFileSync(__dirname+'/branch-maze-ui.js','utf8'),env);
 handler({key:mode==='explore'?'A':'G',shiftKey:true,target:{closest:()=>false},preventDefault(){}});
 for(let n=0;n<10000&&created<3;n++){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}
 a.equal(created,3);a.equal(checks,2);a(element('status').textContent.includes('踏破 2枚'));
 element('stop').onclick();a.equal(timers.size,0);
}
console.log('Both shortcuts: 3 consecutive maps, full-floor completion before exit, counters and cancellation.');
