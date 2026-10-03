const assert=require('node:assert/strict'),M=require('./core.js');
const g=M.createGame(M.createWarpDemo()),copy=()=>new Map([...g.cognition.memory_nodes].map(([id,n])=>[id,{...n}]));
g.cognition.archives.push({nodes:copy(),turn:0},{nodes:new Map(),turn:0},{nodes:copy(),turn:0});
g.archiveNotes.set(0,'最初の記録');g.archiveNotes.set(2,'戻った記録');
const original=JSON.stringify(g.cognition.archives,(_,v)=>v instanceof Map?[...v]:v);
assert.deepEqual(M.archiveGroups(g).map(x=>x.members),[[0],[1],[2]],'same cells alone do not merge');
assert.deepEqual(M.matchEntranceMaps(g,true),[0,2]);
assert.deepEqual(M.archiveGroups(g),[{members:[0,2],representative:2,live:true},{members:[1],representative:1,live:false}]);
const read=M.archiveGroups(g);read[0].members.push(99);assert.equal(M.archiveGroups(g)[0].members.length,2);
assert.equal(JSON.stringify(g.cognition.archives,(_,v)=>v instanceof Map?[...v]:v),original);
for(const d of ['down','down','right','right'])M.move(g,d);
assert.deepEqual(g.cognition.archives[3].sources,[0,2]);
assert.deepEqual(M.archiveGroups(g),[{members:[0,2,3],representative:3,live:false},{members:[1],representative:1,live:false}]);
// Matching an older source must not grant the later snapshot's extra observations.
g.cognition.matchedArchives.add(0);const partial=M.archiveGroups(g);
assert.deepEqual(partial.find(x=>x.live).members,[0]);assert.equal(partial.find(x=>x.representative===3).live,false);g.cognition.matchedArchives.clear();
assert.equal(g.archiveNotes.get(0),'最初の記録');assert.equal(g.archiveNotes.get(2),'戻った記録');
const before=g.turns;M.archiveGroups(g);assert.equal(g.turns,before);
assert.deepEqual(M.archiveGroups(M.createGame(g.world)),[]);
// Periodic ambiguity is retained until actual learning permits a match.
const t=M.createGame(M.createArchiveDemo());assert.deepEqual(M.matchEntranceMaps(t,true),[]);assert.equal(M.archiveGroups(t)[0].live,false);
for(let i=0;i<24;i++)M.move(t,'right');assert.deepEqual(M.matchEntranceMaps(t,true),[0]);assert.equal(M.archiveGroups(t)[0].live,true);
console.log('PASS: explicit matching only, unknown/ambiguous records remain separate, grouped persistence across warp, original notes/maps preserved, detached results, no turns, reset, learned torus matching.');
