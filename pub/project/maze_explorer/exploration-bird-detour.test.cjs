const a=require('node:assert/strict'),C=require('./core.js'),J=require('./main-journey.js'),P=require('./exploration-solver.js');
// A repeated four-position chase in an open room must trigger a longer waypoint route.
const w={width:15,height:9,cells:new Uint8Array(135).fill(1),exit:134},g={world:w,player:{world_position:32,keys:[]},birds:[{position:34,cooldown:0}],turns:0,teleports:0};
const core={DIRS:C.DIRS,transition(w,p,d){const [dx,dy]=this.DIRS[d],x=p.world_position%15+dx,y=Math.floor(p.world_position/15)+dy;return x>=0&&x<15&&y>=0&&y<9?{to:y*15+x}:null;},ruleTransition(w,p,d){return this.transition(w,p,d);}};
let escape=null;for(let i=0;i<12;i++){g.turns=i;g.player.world_position=[32,17,16,31][i%4];g.birds[0].position=[34,34,19,19][i%4];escape=P.birdDetour(g,core);if(escape)break;}
a(escape?.length>=6);const chosen=escape[0],snapshot=JSON.stringify(g);a.deepEqual(P.birdDetour(g,core),escape);a.equal(JSON.stringify(g),snapshot);
g.player.world_position=core.ruleTransition(w,g.player,chosen).to;g.turns++;a(P.birdDetour(g,core)?.length);g.teleports++;g.turns++;a.equal(P.birdDetour(g,core),null);
let improved=[];
function walk(seed,detours,limit){const g=J.start({seed,width:21,height:17,algorithm:'rooms',roomCount:6,roomPlacement:'bsp',connectionStyle:'ring',loops:8,birdMode:true,birdCount:1});let escapes=0;for(let i=0;i<limit;i++){if(g.won)return {won:true,steps:g.steps,escapes};const path=(detours?P.birdDetour(g,C):null)||P.main(g,C);if(detours&&P.birdDetour(g,C))escapes++;a(C.move(g,path[0]));}return {won:g.won,steps:g.steps,escapes};}
for(const seed of ['room-cycle-26','room-cycle-37']){const old=walk(seed,false,300);a.equal(old.won,false);const fixed=walk(seed,true,300);a(fixed.won);improved.push({seed,old,fixed});}
a(improved.length>0);console.log(JSON.stringify(improved));
console.log('Four-position repetition, fixed waypoint, nonmutating planning, transfer reset, and actual room chase escapes passed.');
