const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),M=require('./quarter-turn-memory.js');
const source=fs.readFileSync(__dirname+'/quarter-turn-lab.js','utf8'),snippet=source.slice(source.indexOf('function autoPath('),source.indexOf('if(embedded){document.querySelector'));
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const state=Q.create(mode,16,'embedded-test',{algorithm:'prim',floorUnderpasses:2}),memory=M.create();
 const observe=()=>M.observe(memory,state,S.nearestView(state,6,null,true));observe();
 const c={saveText:()=>JSON.stringify({settings:{}}),loadText(){},state,memory,window:{},truth:false,stopAuto(){},toggleWallPass(){},advanceExit(){},move:d=>{a(Q.move(state,d));observe();},embeddedFamily:mode,generate(){}};vm.runInNewContext(snippet,c);const api=c.window.QuarterExplorationAdapter,seen=new Set();let count=0;
 for(;;){const route=api.autoExplore(seen);if(route===null)break;a(route.length>0);for(const d of route){api.autoMove(d);a(++count<10000);}}
 a.equal(seen.size,api.autoTargets().size);for(const d of api.autoPlan())api.autoMove(d);a(api.progress().exit);a(memory.complete);
}
console.log('Five embedded variants: shared-adapter exploration, completion, world-direction movement and exit passed');
