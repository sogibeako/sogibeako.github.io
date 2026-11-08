const assert=require('node:assert/strict'),O=require('./orientation.js'),M=require('./core.js'),S=require('./orientation-save.js');
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function route(w,start){const q=[[start,[]]],seen=new Set([start]);for(const [id,path] of q)for(const d of Object.keys(M.DIRS)){
 const edge=M.transition(w,{world_position:id},d);if(!edge)continue;
 if(w.warps.has(edge.to))return [...path,d];if(!seen.has(edge.to)){seen.add(edge.to);q.push([edge.to,[...path,d]]);}
}throw Error('no warp');}
for(const layout of ['demo','dfs','prim'])for(const mode of ['right','mirror','mixed'])for(const warpStyle of ['pair','oneway','cycle3','cycle4']){
 const options={layout,seed:'hidden-73',warpStyle,warpCount:2},a=O.create(mode,options),b=O.create(mode,{...options,warpInvisible:true});
 assert.deepEqual(a.game.world.cells,b.game.world.cells);assert.deepEqual(a.game.world.warps,b.game.world.warps);
 for(const d of route(a.game.world,a.game.player.world_position)){assert.ok(O.move(a,d,true));assert.ok(O.move(b,d,true));}
 assert.deepEqual(a.frame,b.frame);assert.deepEqual(a.game.player,b.game.player);assert.equal(a.game.steps,b.game.steps);assert.equal(b.crossings,1);
 for(const id of b.game.world.warps.keys()){assert.equal(M.featureAt(b.game,id),null);assert.equal(M.featureAt(a.game,id),'O');}
 for(const chart of [...b.archives,b.chart])assert.ok([...chart.nodes.values()].every(n=>n.feature!=='O'));
 const before=snap(b);O.inspectAll(b);assert.equal(snap(b),before);assert.equal(snap(S.decode(S.encode(b))),before);
}
const old=JSON.parse(S.encode(O.create()));delete old.config.warpInvisible;assert.equal(S.decode(JSON.stringify(old)).config.warpInvisible,false);
assert.throws(()=>S.decode(JSON.stringify({...old,config:{...old.config,warpInvisible:'false'}})));
console.log('PASS: 36 hidden-warp configurations, unchanged geometry/transitions/frame/player, O absent from real features and all remembered charts, save round-trip, old visible saves compatible, malformed flag rejected.');
