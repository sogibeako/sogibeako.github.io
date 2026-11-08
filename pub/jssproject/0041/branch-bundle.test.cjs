const a=require('node:assert/strict'),B=require('./exploration-bundle.js'),Save=require('./branch-save.js'),Maze=require('./branch-maze.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');
(async()=>{
const options={sheets:3,size:12,route:'return',pillar:'grown',direction:'left',algorithm:'dfs',wallStyle:'dense',underpasses:2,underpassShape:'mixed',density:.45,seed:'bundle-branch'};
const state=Maze.create(options),moves=P.route(state,id=>id===state.world.exit).slice(0,12);for(const d of moves)S.move(state,d);
const native=JSON.stringify(Save.pack(options,moves,state,{truth:false,render:'ascii',speed:80,policy:'explore'},{completed:2,totalSteps:100,stageCleared:false}));
const course={enabled:true,completed:4,steps:500,order:'sequence',pool:['plane','branch']};
const text=B.encode('{}','{}','branch',course,'{}',undefined,'{}',undefined,undefined,undefined,native),d=B.unpack(text);a.equal(d.version,7);a.equal(d.triple,undefined);a.equal(d.branch,native);
const current={},adapters={};let commits=0,fail=false;
for(const key of ['main','skew','enclosure','klein','triple','crossing','biaxial'])adapters[key]={prepare:JSON.parse,apply:v=>{current[key]=v;commits++;}};
adapters.branch={prepare:t=>Save.restore(JSON.parse(t)),apply:v=>{if(fail){fail=false;throw Error('branch render failed');}current.branch=v;commits++;}};
const ready=await B.prepare(text,adapters);a.equal(commits,0);a.equal(ready.branch.state.id,state.id);a.equal(ready.branch.moves.length,moves.length);a.equal(ready.branch.counters.completed,2);a.deepEqual(ready.course.pool,course.pool);
B.apply(ready,adapters,ready);const before={...current};fail=true;a.throws(()=>B.apply(ready,adapters,before),/元の探索へ/);a.deepEqual(current,before);
const count=commits;await a.rejects(B.prepare(JSON.stringify({...d,branch:'{}'}),adapters));a.equal(commits,count);
for(const patch of [{branch:undefined},{active:'triple'},{crossing:42}])a.throws(()=>B.unpack(JSON.stringify({...d,...patch})));
const full=B.encode('{}','{}','triple',course,'{}',undefined,'{}','{}','{}','{}',native);a((await B.prepare(full,adapters)).triple);
const old=B.encode('{}','{}','main',course,'{}',undefined,'{}');const prior=current.branch;const legacy=await B.prepare(old,adapters);B.apply(legacy,adapters,ready);a.equal(current.branch,prior);
console.log('v7: real branch replay, optional spaces, course counters, invalid saves, rollback, and legacy preservation passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
