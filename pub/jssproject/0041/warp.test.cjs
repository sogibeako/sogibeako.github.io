const assert=require('node:assert/strict'),M=require('./core.js');
const w=M.createWarpDemo(),g=M.createGame(w);
for(const d of ['down','down','right','right'])assert.ok(M.move(g,d));
assert.equal(g.player.world_position,64);assert.equal(g.lastEvent,'warp');assert.equal(g.turns,4);
assert.equal(g.lastTransition.from,54);assert.equal(g.lastTransition.to,64);assert.equal(g.lastTransition.kind,'warp');
assert.equal(g.player.direction,'right');assert.equal(g.player.orientation,1);assert.equal(g.cognition.archives.length,1);
assert.ok([...g.cognition.archives[0].nodes.values()].some(n=>n.world_id===54&&n.feature==='O'));
assert.equal(M.placeMarker(g).status,'blocked');
M.waitTurn(g);assert.equal(g.player.world_position,64);assert.equal(g.cognition.archives.length,1);
M.move(g,'up');M.move(g,'down');assert.equal(g.player.world_position,54);assert.equal(g.cognition.archives.length,2);
assert.equal(g.cognition.known_loops.size,0);assert.equal(g.cognition.loopVisits.size,1);
const queue=[w.start],seen=new Set(queue),paths=new Map([[w.start,[]]]);
for(const id of queue)for(const d of Object.keys(M.DIRS)){
 const edge=M.transition(w,{world_position:id},d);if(!edge)continue;
 const to=w.warps.get(edge.to)??edge.to;
 if(!seen.has(to)){seen.add(to);queue.push(to);paths.set(to,[...paths.get(id),d]);}
}
assert.equal(seen.size,w.validation.floors);assert.ok(seen.has(w.exit));
const win=M.createGame(w);paths.get(w.exit).forEach(d=>M.move(win,d));assert.ok(win.won);
const fresh=M.createGame(w);assert.equal(fresh.cognition.archives.length,0);assert.equal(fresh.player.world_position,w.start);
console.log('PASS: reciprocal entry-triggered warp, no arrival/wait bounce, one turn per move, direction preserved, archives split, no false learning, all cells/exit reachable, restart.');

// Transfer history records experienced chart changes, not hidden world coordinates.
assert.deepEqual(M.archiveTransfers(g),[
 {from:0,to:1,turn:4,kind:'warp',label:'ワープ床'},
 {from:1,to:2,turn:7,kind:'warp',label:'ワープ床'}
]);
assert.match(M.exportArchiveNotes(g),/7行動目：記録 2 → 記録 3（現在の探索）/);
const snapshot=JSON.stringify([...g.cognition.memory_nodes]);
const turns=g.turns,matched=[...g.cognition.matchedArchives];
const detached=M.archiveTransfers(g);detached[0].to=999;
assert.equal(M.archiveTransfers(g)[0].to,1);
assert.equal(JSON.stringify([...g.cognition.memory_nodes]),snapshot);
assert.equal(g.turns,turns);assert.deepEqual([...g.cognition.matchedArchives],matched);
assert.deepEqual(M.archiveTransfers(fresh),[]);
const hiddenWorld=M.createWarpDemo();hiddenWorld.warpInvisible=true;
const hidden=M.createGame(hiddenWorld);
for(const d of ['down','down','right','right'])M.move(hidden,d);
assert.deepEqual(M.archiveTransfers(hidden),[{from:0,to:1,turn:4,kind:'unknown',label:'突然の転移'}]);
assert.match(M.exportArchiveNotes(hidden),/突然の転移/);
assert.doesNotMatch(M.exportArchiveNotes(hidden),/ワープ床/);
console.log('PASS: transfer history, chronological chart references, detached reads, invisible cause withheld, reset and text export.');

const cells=new Uint8Array(121);
for(let y=1;y<10;y++)for(let x=1;x<10;x++)cells[y*11+x]=1;
const birdGame=M.createGame({width:11,height:11,cells,start:24,exit:108,seed:'history-bird',birdMode:true,separateMaps:true});
birdGame.bird.position=25;M.move(birdGame,'right');
assert.deepEqual(M.archiveTransfers(birdGame),[{from:0,to:1,turn:1,kind:'bird',label:'鳥人間との接触'}]);
console.log('PASS: bird contact shares experienced transfer history.');
