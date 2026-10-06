const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
const g=S.attach(J.start({seed:'arrow-play',width:9,height:9,algorithm:'dfs',warpMode:true,warpInvisible:true,separateMaps:true}));
function pathTo(target){const queue=[g.player.world_position],prev=new Map([[queue[0],null]]);for(let i=0;i<queue.length;i++){let at=queue[i];if(at===target){const out=[];while(prev.get(at)){const [p,d]=prev.get(at);out.unshift(d);at=p;}return out;}for(const d of Object.keys(M.DIRS)){const e=M.ruleTransition(g.world,{...g.player,world_position:at},d);if(!e)continue;const end=g.world.warps.get(e.to)??e.to;if(!prev.has(end)){prev.set(end,[at,d]);queue.push(end);}}}return null;}
function walk(path){for(const d of path){if(g.won)S.act(g,'continue');S.act(g,'move',d);}}
// Visit every physically reachable endpoint, collecting genuine observations.
for(let id=0;id<g.world.cells.length;id++)if(g.world.cells[id]){const p=pathTo(id);if(p)walk(p);}
if(g.won)S.act(g,'continue');
const [from,to]=[...g.world.warps][0],known=new Set([...g.cognition.memory_nodes.values(),...g.cognition.archives.flatMap(a=>[...a.nodes.values()])].filter(n=>n.terrain).map(n=>n.world_id));assert(known.has(from)&&known.has(to));const wrong=[...known].find(id=>id!==from&&id!==to);
assert(S.act(g,'arrow',from,to));assert(S.act(g,'arrow',from,wrong));assert.equal(g.warpArrows[0].status,'hypothesis');assert.equal(M.knownWarpAnchor(g,{world_id:from}),null);
let approach;for(let id=0;id<g.world.cells.length&&!approach;id++)if(g.world.cells[id])for(const d of Object.keys(M.DIRS)){const e=M.ruleTransition(g.world,{...g.player,world_position:id},d);if(e?.to===from){const p=pathTo(id);if(p)approach=[...p,d];}}
assert(approach);walk(approach);assert.equal(g.lastTransition.kind,'warp');assert.deepEqual(g.warpArrows.map(a=>a.status),['confirmed','contradicted']);assert(M.knownWarpAnchor(g,{world_id:from}));assert.equal(M.knownWarpAnchor(g,{world_id:wrong}),null);
const record=S.encode(g,'same');assert.equal(S.encode(S.decode(record).game,'same'),record);
// Confirmed endpoints can align remembered maps, hypotheses cannot.
const p=M.createGame(g.world);p.cognition.memory_nodes=new Map([['C2,2',{x:2,y:2,world_id:from,terrain:1,feature:'0'}]]);p.cognition.archives=[{nodes:new Map([['C1,1',{x:1,y:1,world_id:from,terrain:1,feature:'0'}]]),sources:[]}];p.warpArrows=[{from,to,status:'hypothesis'}];assert.deepEqual(M.matchRecordedMaps(p),[]);p.warpArrows[0].status='confirmed';assert.deepEqual(M.matchRecordedMaps(p,true),[0]);
console.log('PASS: manually recorded correct/wrong hypotheses verified by actual traversal, no premature anchors, confirmed-only matching and exact session replay.');
const R=require('./rotation-bridge.js'),O=require('./orientation.js');
for(const mode of ['right','mirror']){
 const a=M.createGame(M.createWarpDemo());R.enable(a,mode);a.viewFrame=[...O.transforms[mode]];
 const nodes=new Map([[1,{x:2,y:2,world_id:36,feature:'0',terrain:1}],[2,{x:3,y:2,world_id:37,feature:'0',terrain:1}],[3,{x:2,y:4,world_id:70,feature:'0',terrain:1}]]);
 a.cognition.archives=[{nodes,viewFrame:O.identity(),sources:[]}];a.cognition.memory_nodes=new Map(nodes);a.cognition.matchedArchives=new Set();a.warpArrows=[{from:36,to:37,status:'hypothesis'},{from:37,to:70,status:'contradicted'}];assert.deepEqual(M.matchRecordedMaps(a),[]);
 for(const edge of a.warpArrows)edge.status='confirmed';assert.deepEqual(M.matchRecordedMaps(a,true),[0]);
}
console.log('PASS: confirmed endpoint evidence also aligns rotated/reflected charts; zero-only predictions do not.');
// Deleting a confirmed arrow withdraws that evidence for future matching, and is replayed.
const deleteRecordBefore=S.encode(g,'same');assert(S.act(g,'eraseArrow',from,to));assert.equal(M.knownWarpAnchor(g,{world_id:to}),null);assert(g.warpArrows.some(a=>a.to===wrong));const deleteRecord=S.encode(g,'same');assert.equal(S.encode(S.decode(deleteRecord).game,'same'),deleteRecord);assert.notEqual(deleteRecord,deleteRecordBefore);assert.equal(S.act(g,'eraseArrow',from,to),false);
console.log('PASS: selected arrow deletion withdraws evidence, preserves other arrows and survives session replay.');

const status=g.warpArrows[0].status,position=g.player.world_position;
for(const curve of [-0.75,0,1.25]){assert(S.act(g,'curveArrow',from,wrong,curve));const saved=S.encode(g,'same');assert.equal(S.encode(S.decode(saved).game,'same'),saved);assert.equal(g.warpArrows[0].curve,curve);}
assert.equal(g.warpArrows[0].status,status);assert.equal(g.player.world_position,position);
assert.equal(M.curveWarpArrow(g,from,wrong,NaN),false);assert.equal(M.curveWarpArrow(g,from,wrong,4),false);assert.equal(M.curveWarpArrow(g,from,to,0),false);
console.log('PASS: signed/straight curve replay, unchanged evidence and player, invalid curves rejected.');

const otherArrow={from:wrong,to:from,status:'hypothesis',curve:-1};
const fixture={warpArrows:[{from,to:wrong,status:'confirmed',curve:2},otherArrow]};
assert(M.resetWarpArrowCurve(fixture,from,wrong));assert(!Object.hasOwn(fixture.warpArrows[0],'curve'));assert.equal(otherArrow.curve,-1);assert.equal(fixture.warpArrows[0].status,'confirmed');assert.equal(M.resetWarpArrowCurve(fixture,from,to),false);
assert(S.act(g,'resetArrowCurve',from,wrong));assert(!Object.hasOwn(g.warpArrows[0],'curve'));let resetSave=S.encode(g,'same');assert.equal(S.encode(S.decode(resetSave).game,'same'),resetSave);
assert(S.act(g,'curveArrow',from,wrong,0));assert.equal(g.warpArrows[0].curve,0);resetSave=S.encode(g,'same');assert.equal(S.encode(S.decode(resetSave).game,'same'),resetSave);
console.log('PASS: standard curve reset removes override, preserves other arrows and evidence; reset and straight edits replay exactly.');
