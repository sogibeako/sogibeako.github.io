const assert=require('node:assert/strict'),O=require('./orientation.js'),S=require('./orientation-save.js'),M=require('./core.js');
function route(w){const q=[[w.start,[]]],seen=new Set([w.start]);for(const [id,path] of q){if(id===w.exit)return path;for(const d of Object.keys(M.DIRS)){const e=M.transition(w,{world_position:id},d);if(!e)continue;const to=w.warps.get(e.to)??e.to;if(!seen.has(to)){seen.add(to);q.push([to,[...path,d]]);}}}throw Error('unreachable');}
for(const course of ['plain','visible','all'])for(let i=0;i<5;i++){
 const seed=`begin-${i}`,s=O.createJourney(course,seed),w=s.game.world;
 assert.equal(s.config.stage,1);assert.equal(s.config.completedSteps,0);assert.equal(s.config.size,'small');assert.equal(s.config.course,course);assert.notEqual(s.config.layout,'demo');
 assert.equal(S.encode(s),S.encode(O.createJourney(course,seed)));
 if(course==='plain')assert.equal(w.warps.size,0);if(course!=='all')assert.equal(w.warpInvisible,false);
 assert.equal(w.validation.warp?.canExit??M.reachable(w,w.start).count,w.validation.floors);
 for(const d of route(w))assert(O.move(s,d,true));assert(s.game.won);
 const restored=S.decode(S.encode(s)),next=O.nextMaze(restored);assert.equal(next.config.stage,2);assert.equal(next.config.course,course);assert.equal(next.config.completedSteps,s.game.steps);
}
assert.throws(()=>O.createJourney('bad','seed'));for(const seed of ['',null,'x'.repeat(65)])assert.throws(()=>O.createJourney('all',seed));
console.log('PASS: 15 journey starts, course limits, deterministic seeds, reachable exits, save/replay and second-floor progression.');
