const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
const g=S.attach(J.start({seed:'arrow-play',width:9,height:9,algorithm:'dfs',warpMode:true,warpStyle:'oneway',warpInvisible:true,separateMaps:true}));
function pathTo(target){const queue=[g.player.world_position],prev=new Map([[queue[0],null]]);for(let i=0;i<queue.length;i++){let at=queue[i];if(at===target){const out=[];while(prev.get(at)){const [p,d]=prev.get(at);out.unshift(d);at=p;}return out;}for(const d of Object.keys(M.DIRS)){const e=M.ruleTransition(g.world,{...g.player,world_position:at},d);if(!e)continue;const end=g.world.warps.get(e.to)??e.to;if(!prev.has(end)){prev.set(end,[at,d]);queue.push(end);}}}return null;}
function walk(path){for(const d of path){if(g.won)S.act(g,'continue');S.act(g,'move',d);}}
// Visit every physically reachable endpoint, collecting genuine observations.
for(let id=0;id<g.world.cells.length;id++)if(g.world.cells[id]){const p=pathTo(id);if(p)walk(p);}
if(g.won)S.act(g,'continue');

const [from,to]=[...g.world.warps][0];
walk(pathTo(to));if(g.won)S.act(g,'continue');assert.notEqual(g.player.world_position,from);
const before=[g.steps,g.turns,g.player.world_position],counts=g.cognition.archives.map(a=>a.nodes.size);
assert.equal(S.act(g,'zeroAt',from).status,'placed');assert.deepEqual([g.steps,g.turns,g.player.world_position],before);assert.deepEqual(g.cognition.archives.map(a=>a.nodes.size),counts);
assert(g.cognition.archives.some(a=>[...a.nodes.values()].some(n=>n.world_id===from&&n.feature==='0')));
const record=S.encode(g,'same');assert.equal(S.encode(S.decode(record).game,'same'),record);
const fresh=S.attach(J.start({seed:'unseen-zero',width:21,height:17,algorithm:'dfs',warpMode:true,warpInvisible:true}));
const seen=new Set([...fresh.cognition.memory_nodes.values()].map(n=>n.world_id)),unseen=fresh.world.cells.findIndex((v,i)=>v&&!seen.has(i));assert(unseen>=0);assert.equal(S.act(fresh,'zeroAt',unseen).status,'unknown');assert.equal(fresh.zeroMarks,undefined);
assert.equal(S.act(fresh,'zeroAt',-1).status,'unknown');assert.equal(S.act(fresh,'zeroAt',fresh.world.start).status,'blocked');
console.log('PASS: one-way source annotated remotely after arriving elsewhere; archived mark and replay preserved, no movement/time/discovery, unseen/invalid/protected targets rejected.');

assert.equal(S.act(g,'eraseZeroAt',from).status,'erased');assert(!g.zeroMarks.has(from));assert(!g.cognition.archives.some(a=>[...a.nodes.values()].some(n=>n.world_id===from&&n.feature==='0')));assert.deepEqual([g.steps,g.turns,g.player.world_position],before);
const erasedRecord=S.encode(g,'same');assert.equal(S.encode(S.decode(erasedRecord).game,'same'),erasedRecord);assert.equal(S.act(g,'eraseZeroAt',from).status,'absent');assert.equal(S.act(fresh,'eraseZeroAt',unseen).status,'unknown');
assert.equal(S.act(g,'zeroAt',from).status,'placed');assert.equal(M.featureAt(g,from),'0');
console.log('PASS: erase clears recorded images without changing time/location; absent/unseen safe, save replay and re-stamping work.');
