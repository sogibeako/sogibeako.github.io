const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/quarter-turn-lab.js','utf8');
const controls=new Map();const $=id=>{if(!controls.has(id))controls.set(id,{value:id==='autoSpeed'?'125':id==='autoMode'?'stroll':'hybrid',checked:true,options:[]});return controls.get(id);};
const original={id:4,steps:25001},history=Array(25001).fill(1),memory={seen:new Set([4])};
const c={$,state:original,moves:history,memory,applied:{mode:'quarterCW',terrain:'maze',size:12,seed:'long-history'},crossings:12,completed:2,totalSteps:5,truth:false,steps:25001,last:'',embedded:true,embeddedFamily:'quarter',lottery:()=>({}),stopAuto(){},syncFamily(){},draw(){},canvas:{focus(){}},descriptions:{quarterCW:''},document:{createElement:()=>({})},QuarterTurnSave:{encode(o,m,s,p){assert(m.length<=20000);return JSON.stringify({options:o,moves:m,settings:p});}},ExplorationGeneration:{chooseQuarter:o=>o},QuarterTurnMaze:{create:()=>({})}};
$('autoSpeed').options=[{value:'125'}];
vm.createContext(c);
vm.runInContext(src.slice(src.indexOf('function displaySettings('),src.indexOf("$('saveGame').onclick")),c);
vm.runInContext(src.slice(src.indexOf('function courseFresh('),src.indexOf('window.QuarterExplorationAdapter=')),c);
const checkpoint=c.checkpoint();const fresh=JSON.parse(c.courseFresh('quarter','next-seed',{}));
assert.equal(fresh.moves.length,0);assert.equal(fresh.settings.autoSpeed,'125');assert.equal(c.state,original);assert.equal(c.moves,history);
c.state={};c.moves=[];c.memory={};c.applyLoaded(checkpoint);assert.equal(c.state,original);assert.equal(c.moves,history);assert.equal(c.memory,memory);
// The host must never serialize an over-limit destination to switch or roll back.
const host=fs.readFileSync(__dirname+'/main-skew-pilot.js','utf8');
(async()=>{for(const fail of [false,true]){let restored=false,selected=false,entered=false;const token={},target={checkpoint:()=>checkpoint,snapshot(){throw Error('must not serialize');},courseFresh:()=>fresh,courseEnter(){entered=true;if(fail)throw Error('generation/apply failed');},restoreCheckpoint(x){assert.equal(x,checkpoint);restored=true;}};
const source={progress:()=>({token,steps:25001,exit:true})},nodes={};const ctx={busy:false,active:'main',course:{enabled:true,order:'sequence',pool:['quarter']},courseToken:token,$:id=>nodes[id]??(nodes[id]={}),lock(){},adapters:async()=>({main:source,quarter:target}),isQuarter:m=>m==='quarter',ExplorationCourse:{prepareNext:async(c,m,p,prepare)=>{const next={mode:'quarter',course:{}};return {next,fresh:await prepare(next)};}},select:()=>{selected=true;}};
vm.createContext(ctx);vm.runInContext(host.slice(host.indexOf(' async function crossSpace('),host.indexOf(' window.ExplorationHost=')),ctx);const result=await ctx.crossSpace();assert.equal(result,!fail);assert(entered);assert.equal(restored,fail);assert.equal(selected,!fail);}
console.log('25001-step quarter runtime: next settings without serialization, reference checkpoint restore, host transition and failure rollback passed.');})();
