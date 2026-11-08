const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),A=require('./quarter-turn-auto.js'),M=require('./quarter-turn-memory.js'),fs=require('node:fs'),vm=require('node:vm');
let runs=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])for(const size of [12,16,20]){
 const original=Q.create(mode,size,'auto-check');
 for(const strategy of ['explore','exit']){const p={...original,frame:[...original.frame],history:[]},visited=new Set([p.id]);let done=false;
 for(let i=0;i<20000;i++){const next=A.next(p,visited,strategy);if(next.done){a(!next.blocked);done=true;break;}const truth=i%3===0;a(S.move(p,truth?next.direction:p.frame.indexOf(next.direction),truth));visited.add(p.id);}
 a(done);a.equal(p.id,p.world.exit);if(strategy==='explore')a.equal(visited.size,p.world.cells.reduce((x,y)=>x+y,0));runs++;}
}
let timer=null,events={},els={};const defaults={mode:'cwTwist',terrain:'maze',size:'12',seed:'ui-auto',render:'hybrid',autoMode:'explore',autoSpeed:'250'};
const ctx=new Proxy({},{get:()=>()=>{}}),el=id=>els[id]??={value:defaults[id]??'',style:{},clientWidth:800,getContext:()=>ctx,focus(){},setAttribute(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/quarter-turn-lab.js','utf8'),{QuarterTurnSave:require('./quarter-turn-save.js'),localStorage:{setItem(){},getItem(){return null;}},QuarterTurnAuto:A,QuarterTurnMemory:M,ConnectionSpace:S,QuarterTurnMaze:Q,document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(n,f)=>events[n]=f},window:{addEventListener(){}},location:{search:''},URLSearchParams,devicePixelRatio:1,setInterval(fn){timer=fn;return 1;},clearInterval(){timer=null;}});
const key=k=>events.keydown({key:k,shiftKey:k==='A'||k==='G',target:{closest:()=>false},preventDefault(){}});
key('A');a(timer);key('+');a.equal(el('autoSpeed').value,'80');a(timer);el('truth').onclick();for(let n=0;timer&&n<20000;n++)timer();a.equal(timer,null);a.match(el('autoStatus').textContent,/全床探索を終えて出口/);
el('saveGame').onclick();const saved=el('saveText').value,oldStatus=el('status').textContent;el('reset').onclick();el('saveText').value=saved;el('loadGame').onclick();a.equal(timer,null);a.match(el('saveStatus').textContent,/JSONから再開/);a.match(el('status').textContent,/出口に到着/);const beforeBad=el('status').textContent;el('saveText').value='{}';el('loadGame').onclick();a.equal(el('status').textContent,beforeBad,'failed load preserves game');
const oldSeed=el('seed').value;el('boundaryLinks').checked=true;key('>');a.notEqual(el('seed').value,oldSeed);a.match(el('status').textContent,/0歩/);a.match(el('status').textContent,/開通 0か所/);const freshSeed=el('seed').value;key('>');a.equal(el('seed').value,freshSeed,'cannot advance away from exit');
el('reset').onclick();key('G');a(timer);key('ArrowRight');a.equal(timer,null);key('G');for(let n=0;timer&&n<20000;n++)timer();a.equal(timer,null);a.match(el('autoStatus').textContent,/出口に到着/);
el('terrain').value='fixed';el('terrain').onchange();key('G');a.equal(timer,null);a.match(el('autoStatus').textContent,/出口がありません/);
console.log(runs+' generated runs: all floors then exit, exit-only, true/subjective switching; UI shortcuts, timer completion, speed and manual cancellation passed.');
