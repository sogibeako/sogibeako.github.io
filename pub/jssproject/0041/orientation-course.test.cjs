const assert=require('node:assert/strict'),O=require('./orientation.js'),S=require('./orientation-save.js'),M=require('./core.js');
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const playState=s=>snap({...s,config:{...s.config,course:null}});
function route(w,start,target){const q=[[start,[]]],seen=new Set([start]);for(const [id,path] of q){if(id===target)return path;for(const d of Object.keys(M.DIRS)){
 const e=M.transition(w,{world_position:id},d);if(!e)continue;const to=w.warps.get(e.to)??e.to;
 if(!seen.has(to)){seen.add(to);q.push([to,[...path,d]]);}
}}throw Error('unreachable');}
for(const course of ['all','visible','plain']){
 let s=O.create('mixed',{layout:'dfs',seed:'course-78',warpInvisible:true});
 const d=route(s.game.world,s.game.player.world_position,s.game.world.exit)[0];O.move(s,d,true);
 const before=playState(s);O.setCourse(s,course);assert.equal(playState(s),before);assert.equal(s.game.world.warpInvisible,true);
 assert.equal(snap(S.decode(S.encode(s))),snap(s));
 for(let floor=0;floor<6;floor++){
  for(const d of route(s.game.world,s.game.player.world_position,s.game.world.exit))assert.ok(O.move(s,d,true));
  const restored=S.decode(S.encode(s)),next=O.nextMaze(s);assert.equal(snap(O.nextMaze(restored)),snap(next));
  assert.equal(next.config.course,course);assert.notEqual(next.config.layout,s.config.layout);assert.notEqual(next.config.size,s.config.size);
  if(course!=='all')assert.equal(next.game.world.warpInvisible,false);
  if(course==='plain'){assert.equal(next.game.world.warps.size,0);assert.equal(next.config.warpStyle,'none');}
  s=next;
 }
 const current=playState(s);O.setCourse(s,'all');assert.equal(playState(s),current);
 assert.throws(()=>O.setCourse(s,'unsupported'));assert.equal(s.config.course,'all');
}
const old=JSON.parse(S.encode(O.create()));delete old.config.course;assert.equal(S.decode(JSON.stringify(old)).config.course,'all');
old.config.course='invalid';assert.throws(()=>S.decode(JSON.stringify(old)));
console.log('PASS: 3 courses across 18 floors, future-only preference with current hidden world untouched, route/size variety, save restoration and deterministic descent, switching back, legacy default and invalid-course rejection.');
