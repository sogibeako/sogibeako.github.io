const assert=require('node:assert/strict'),M=require('./core.js'),R=require('./rotation-bridge.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function route(g,target){const w=g.world,q=[[g.player.world_position,[]]],seen=new Set([g.player.world_position]);for(const [id,path] of q){if(id===target)return path;for(const d of Object.keys(M.DIRS)){const e=M.transition(w,{world_position:id},d);if(!e)continue;const to=w.warps?.get(e.to)??e.to;if(!seen.has(to)){seen.add(to);q.push([to,[...path,d]]);}}}throw Error('unreachable');}
for(const mode of ['none','right','mirror','mixed'])for(const warpStyle of ['pair','oneway','cycle3','cycle4']){
 const w=M.generate({width:21,height:17,algorithm:'rooms',seed:'continue-main-'+mode+warpStyle,warpMode:true,warpStyle,warpCount:2}),g=M.createGame(w);R.enable(g,mode);
 const initial=snap(g);assert.equal(M.continueExploring(g),false);assert.equal(snap(g),initial);
 for(const d of route(g,w.exit))assert(M.move(g,d));assert(g.won);
 const before=snap({...g,won:false});assert(M.continueExploring(g));const {firstClearSteps,exploringAfterExit,...rest}=g;assert.equal(snap(rest),before);assert.equal(firstClearSteps,g.steps);assert(exploringAfterExit);
 assert.equal(M.continueExploring(g),false);
 const leave=Object.keys(M.DIRS).find(d=>M.transition(w,g.player,d));assert(M.move(g,leave));for(const d of route(g,w.exit))assert(M.move(g,d));assert.equal(g.won,false);assert.equal(g.firstClearSteps,firstClearSteps);assert(M.waitTurn(g));
 const reset=M.createGame(w);assert(!reset.exploringAfterExit);assert.equal(reset.firstClearSteps,undefined);
}
console.log('PASS: 16 main-game goal/continue/revisit cases; exact retained state, repeated/premature rejection, wait and reset.');
