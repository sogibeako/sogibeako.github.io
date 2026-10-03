const assert=require('node:assert/strict'),O=require('./orientation.js'),S=require('./orientation-save.js'),M=require('./core.js');
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function route(w,start,target){const q=[[start,[]]],seen=new Set([start]);for(const [id,path] of q){if(id===target)return path;for(const d of Object.keys(M.DIRS)){
 const e=M.transition(w,{world_position:id},d);if(!e)continue;const to=w.warps.get(e.to)??e.to;
 if(!seen.has(to)){seen.add(to);q.push([to,[...path,d]]);}
}}throw Error('unreachable');}
for(const layout of ['dfs','prim'])for(const warpStyle of ['pair','oneway','cycle3','cycle4']){
 const s=O.create('mixed',{layout,warpStyle,warpCount:2,seed:'continue-74',warpInvisible:true}),w=s.game.world;
 const before=snap(s);assert.equal(O.continueExploring(s),false);assert.equal(snap(s),before);
 for(const d of route(w,w.start,w.exit))assert.ok(O.move(s,d,true));assert.ok(s.game.won);assert.ok(s.exitReached);
 assert.equal(snap(S.decode(S.encode(s))),snap(s));
 const steps=s.game.steps,player=snap(s.game.player),chart=snap(s.chart),archives=snap(s.archives),frame=snap(s.frame);
 assert.ok(O.continueExploring(s));assert.equal(s.game.steps,steps);assert.equal(snap(s.game.player),player);assert.equal(snap(s.chart),chart);assert.equal(snap(s.archives),archives);assert.equal(snap(s.frame),frame);
 assert.ok(s.exploringAfterExit);assert.equal(s.game.won,false);assert.equal(O.continueExploring(s),false);
 const ordinary=[...w.cells.keys()].find(id=>w.cells[id]&&id!==w.start&&id!==w.exit&&!w.warps.has(id));
 for(const d of route(w,s.game.player.world_position,ordinary))assert.ok(O.move(s,d,true));O.placeMarker(s);assert.ok(s.game.markers.size);
 for(const d of route(w,s.game.player.world_position,w.exit))assert.ok(O.move(s,d,true));
 assert.equal(s.game.player.world_position,w.exit);assert.equal(s.game.won,false);assert.ok(s.exitReached);
 assert.equal(snap(S.decode(S.encode(s))),snap(s));
 const leave=Object.keys(M.DIRS).find(d=>M.transition(w,s.game.player,d));assert.ok(O.move(s,leave,true));
 assert.equal(O.create('mixed',{layout,warpStyle}).exitReached,false);
}
const invalid=JSON.parse(S.encode(O.create()));invalid.actions=[['continue']];assert.throws(()=>S.decode(JSON.stringify(invalid)));
console.log('PASS: 8 generated goal/continue cycles, position/frame/memory/time preserved, marker placement and exit revisit without stopping, save restoration before/after continuation, premature/repeated resume rejected, reset.');
module.exports={route};
