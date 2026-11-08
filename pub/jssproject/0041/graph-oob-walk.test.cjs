const a=require('node:assert/strict'),G=require('./graph-wands.js');
const I=[0,1,2,3],edge=to=>({to,transform:I,kind:'normal'});
function fixture(){return {id:7,frame:I,x:0,y:0,steps:0,history:[],world:{mode:'kleinMaze',seed:'planner',cells:new Uint8Array([0,0,0,1,1,1,1,1,0]),layouts:[{offset:0,width:3,height:3}],edges:new Map([['7:0',edge(6)],['5:3',edge(4)],['4:1',edge(5)],['5:1',{...edge(3),kind:'seam'}]])},features:{options:{birds:true},bird:null,warps:new Map([[6,5]]),marks:new Map(),door:null,key:null,hasKey:false},wildlife:{pets:[{id:4,kind:'d'}]},wands:{held:['push'],items:[],reflectors:[],events:[],frozen:0,bird:{held:[],frozen:0,nextCast:0}}};}
let s=fixture();a.deepEqual(G.planOob(s),{path:[0]},'route follows warp destination');s.id=5;a.equal(G.planOob(s).cast,3);
s=fixture();s.wands.held=[];s.wands.items=[{id:5,spell:'push'}];a.deepEqual(G.planOob(s),{path:[0]},'collect reachable push wand');
s.features.door=6;a.equal(G.planOob(s),null,'closed door is not passable');s.features.hasKey=true;a.deepEqual(G.planOob(s),{path:[0]});
s=fixture();s.wands.held=[];s.wands.items=[];a.equal(G.planOob(s),null,'skip when no push wand');s.wands.oob={direction:1,id:130,from:7};a.deepEqual(G.planOob(s),{done:true});
// Shared UI bridge casts through the normal animation/recording path without stopping auto walk.
const vm=require('node:vm'),fs=require('node:fs');let recorded,cast,stops=0;
const state={...fixture(),frame:[1,2,3,0]},sandbox={WandFlight:{create:()=>({busy:()=>false,point:()=>null})},GraphWands:{...G,preview:()=>[],cast(s,spell,d){cast={spell,d};return true;},after(s,fn){fn();}},document:{addEventListener(){}},parent:{dispatchEvent(){},Event:class{},document:{getElementById:()=>({click(){stops++;}})}},setTimeout,clearTimeout};
vm.runInNewContext(fs.readFileSync(__dirname+'/graph-wands-ui.js','utf8'),sandbox);const ui=sandbox.GraphWandControls.attach(()=>state,()=>{},()=>false,{focus(){}},{recordCast:(spell,d)=>recorded={spell,d},visible:()=>new Set()});
a(ui.autoOobCast(3));a.deepEqual(cast,{spell:'push',d:3});a.deepEqual(recorded,cast);a.equal(stops,0);console.log('Graph OOB planner: warped routes, pickup, locked doors, skip, and rotated UI cast passed');
