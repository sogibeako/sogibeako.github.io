const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),S=require('./connection-space.js'),Q=require('./quarter-turn-maze.js');
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])for(const size of [12,16,20]){
 let state,text=[],focused=null;const els={},events={},ctx=new Proxy({fillText(t){text.push(t);}},{get:(o,k)=>o[k]??(()=>{})});
 const defaults={mode,terrain:'maze',size:String(size),seed:'display',render:'hybrid'};
 const el=id=>els[id]??={value:defaults[id]??'',style:{},clientWidth:800,clientHeight:480,closest:()=>null,getContext:()=>ctx,focus(){focused=id;},setAttribute(){}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/quarter-turn-lab.js','utf8'),{GraphWands:require('./graph-wands.js'),GraphWandControls:{attach:()=>({state(){},busy:()=>false,projectile:()=>null})},SheetFeatures:require('./sheet-features.js'),QuarterTurnMemory:require('./quarter-turn-memory.js'),ConnectionSpace:S,QuarterTurnMaze:{...Q,create(){const world=Q.topology(mode,size);state={world,id:size+1,frame:[3,0,1,2],x:0,y:0,steps:0,history:[]};return state;}},document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(k,f)=>events[k]=f},ResizeObserver:class{observe(){}},Event,window:{addEventListener(){},dispatchEvent(){}},location:{search:''},URLSearchParams,devicePixelRatio:1});
 const press=key=>events.keydown({key,target:{closest:()=>false},preventDefault(){}});
 el('truth').onclick();a.equal(focused,'map');const before=state.id;press('ArrowRight');a.equal(state.id,before+1,'truth uses screen right despite rotated frame');
 focused='subjective';el('subjective').onclick();a.equal(focused,'map');const expected=state.world.edges.get(state.id+':'+state.frame[1]).to;press('ArrowRight');a.equal(state.id,expected,'subjective uses frame');
 text=[];el('truth').onclick();const numbers=text.filter(t=>/^\d+$/.test(t));a.equal(new Set(numbers).size,numbers.length);a(numbers.includes(String(size)));a(numbers.every(t=>Number(t)>=1&&Number(t)<=size));
}
console.log('15 mode/size cases: truth and subjective controls, unique diagonal labels through size 20 passed.');

let cases=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const w=Q.generate(mode,12,'screen-directions');
 for(let id=0;id<w.cells.length;id++)if(w.cells[id])for(const sign of [1,-1])for(let rot=0;rot<4;rot++){
 const frame=[0,1,2,3].map(d=>(sign*d+rot+4)%4),view=S.nearestView({world:w,id,frame},6);
 for(let d=0;d<4;d++){
 const [x,y]=S.directions[d],tile=view.find(t=>t.x===x&&t.y===y),p={world:w,id,frame:[...frame],x:0,y:0,steps:0,history:[]};
 const moved=S.move(p,d,false);a.equal(moved,!tile.wall);if(moved){a.equal(p.id,tile.id);a.deepEqual(p.frame,tile.frame);}cases++;
 }
 }
}
console.log(cases+' subjective moves agree with the visible adjacent tile and its orientation, including blocked walls.');
