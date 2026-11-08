const assert=require('node:assert/strict'),O=require('./orientation.js'),S=require('./orientation-save.js'),M=require('./core.js');
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function route(w,start,target){const q=[[start,[]]],seen=new Set([start]);for(const [id,path] of q){if(id===target)return path;for(const d of Object.keys(M.DIRS)){
 const e=M.transition(w,{world_position:id},d);if(!e)continue;const to=w.warps.get(e.to)??e.to;
 if(!seen.has(to)){seen.add(to);q.push([to,[...path,d]]);}
}}throw Error('unreachable');}
let s=O.create('right',{layout:'dfs',seed:'journey-75'}),total=0;
for(let floor=1;floor<=12;floor++){
 assert.equal(s.config.stage,floor);const initial=snap(s);assert.equal(O.nextMaze(s),null);assert.equal(snap(s),initial);
 for(const d of route(s.game.world,s.game.player.world_position,s.game.world.exit))assert.ok(O.move(s,d,true));assert.ok(s.game.won);
 if(floor%2===0){
  assert.ok(O.continueExploring(s));
  const leave=Object.keys(M.DIRS).find(d=>M.transition(s.game.world,s.game.player,d));O.move(s,leave,true);
  const away=snap(s);assert.equal(O.nextMaze(s),null);assert.equal(snap(s),away);
  for(const d of route(s.game.world,s.game.player.world_position,s.game.world.exit))assert.ok(O.move(s,d,true));assert.equal(s.game.won,false);
 }
 total+=s.game.steps;
 const saved=S.decode(S.encode(s));assert.equal(snap(saved),snap(s));
 const before=snap(s),next=O.nextMaze(s);assert.equal(snap(s),before);assert.equal(snap(O.nextMaze(saved)),snap(next));
 assert.notEqual(next.config.layout,s.config.layout);assert.notEqual(next.config.size,s.config.size);assert.notEqual(next.mode,s.mode);assert.notEqual(next.config.warpStyle,s.config.warpStyle);assert.notEqual(next.config.seed,s.config.seed);
 assert.equal(next.config.completedSteps,total);assert.equal(next.game.steps,0);assert.equal(next.archives.length,0);assert.equal(next.game.markers.size,0);assert.deepEqual(next.frame,O.identity());
 assert.equal(next.game.world.validation.warp?.canExit??M.reachable(next.game.world,next.game.world.start).count,next.game.world.validation.floors);s=next;
}
assert.equal(O.nextMaze(O.create()),null);
const old=JSON.parse(S.encode(O.create()));delete old.config.stage;delete old.config.completedSteps;assert.equal(S.decode(JSON.stringify(old)).config.stage,1);
old.config.stage=-1;assert.throws(()=>S.decode(JSON.stringify(old)));
console.log('PASS: 12 successive solvable mazes, changed generator/style/frame/seed, descent before/after continued exploration, exit-only gate, fresh per-floor memory, cumulative steps and save/deterministic next floor, legacy save defaults.');
