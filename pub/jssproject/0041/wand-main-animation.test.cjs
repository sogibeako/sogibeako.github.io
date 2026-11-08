const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('./wand-engine.js');
let jobs=[],casts=0,path=[{id:2},{id:3}],handler;
const canvas={getContext:()=>({}),focus(){}},ctx={document:{getElementById:id=>id==='map'?canvas:{click(){}},addEventListener:(t,f)=>handler=f},window:{dispatchEvent(){}},WandFlight:{create:()=>({busy:()=>false,point:()=>null})},MainWands:{spells:['freeze','push','swap','pull'],names:{swap:'場所替え'}},MazeCore:{DIRS:{up:0,right:1,down:2,left:3},previewWand:()=>({path})},MazeRotationBridge:{input:(g,d)=>d},MazeSession:{act(g){casts++;g.wands.shots++;g.turns++;g.player.world_position=3;}},render(){},CustomEvent:function(){},setTimeout(fn,ms){a.equal(ms,30);jobs.push(fn);return jobs.length;},clearTimeout(){jobs=[];}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8').split('let archiveNavigation=')[0],ctx);
vm.runInContext("game={turns:0,player:{world_position:1},wands:{shots:0,held:['swap'],events:[]},cognition:{visible_cells:new Set(['2','3']),memory_nodes:new Map([['2',{world_id:2}],['3',{world_id:3}]])}};wandVisualGame=game",ctx);
const ui=ctx.window.MainWandsUI;ui.begin();ui.select(2);ui.aim(1);ui.fire();a.equal(casts,0);a.equal(vm.runInContext('game.player.world_position',ctx),1);jobs.shift()();a.equal(casts,0);jobs.shift()();a.equal(casts,1);a.equal(vm.runInContext('wandVisual',ctx),null);a.equal(vm.runInContext('wandFlight',ctx),false);
// Player rays animate outside sight too; impact follows the last frame.
path=[{id:2},{id:9},{id:3}];ui.begin();ui.select(2);ui.aim(1);ui.fire();a.equal(casts,1);jobs.shift()();a.equal(casts,1);a.equal(vm.runInContext('wandVisual.id',ctx),9);jobs.shift()();a.equal(casts,1);a.equal(vm.runInContext('wandVisual.id',ctx),3);jobs.shift()();a.equal(casts,2);a.equal(jobs.length,0);
// Changing the world during flight cancels the pending action.
path=[{id:2}];ui.begin();ui.select(2);ui.aim(1);ui.fire();vm.runInContext('game={...game}',ctx);jobs.shift()();a.equal(casts,2);
const w={width:7,height:1,cells:Array(7).fill('.')};let actors=[{key:'@',id:0},{key:'V',id:2},{key:'c',id:4}];let r=E.cast(w,actors,'@',1,'push');a.equal(r.caughtBy,'c');a.equal(actors[1].id,3);a.match(r.message,/猫 f は鳥人間 Vを猫パンチで叩き落としました/);
actors=[{key:'@',id:2},{key:'c',id:4},{key:'d',id:0}];r=E.cast(w,actors,'@',1,'push');a.equal(r.caughtBy,'d');a.equal(actors[0].id,1);a.match(r.message,/犬 d はあなたを空中でキャッチ/);
console.log('PASS: impact before swap, 30ms flight, hidden-ray termination, world-change cancellation, cat punch and dog catch.');
