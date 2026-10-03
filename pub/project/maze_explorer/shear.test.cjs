const assert = require('node:assert/strict');
const M = require('./core.js');
const mod = (n, s) => (n % s + s) % s;
const inverse = { left:'right',right:'left',up:'down',down:'up' };
function next(w, id, dx, dy) {
  let x = id % w.width + dx, y = Math.floor(id / w.width) + dy;
  if (x < 0 || x >= w.width) y += (x < 0 ? -1 : 1) * w.shiftY;
  if (y < 0 || y >= w.height) x += (y < 0 ? -1 : 1) * w.shiftX;
  return mod(y,w.height)*w.width+mod(x,w.width);
}
let count = 0;
for (const algorithm of ['wilson', 'hunt', 'kruskal','dfs','prim','rooms']) for (const [width,height] of [[8,8],[30,22],[8,100],[100,8]]) for(const axis of ['shiftX','shiftY']) for(const sign of [-1,1]) {
  const options = {topology:'torus',width,height,algorithm,seed:'shift', [axis]:sign*2};
  const w=M.generate(options); assert.deepEqual(w,M.generate(options));
  const visited = new Set([w.start]), queue=[w.start];
  for(let i=0;i<queue.length;i++) for(const [d,[dx,dy]] of Object.entries(M.DIRS)) {
    const expected=next(w,queue[i],dx,dy), e=M.transition(w,{world_position:queue[i],orientation:1,sheet:0},d);
    if(!w.cells[expected]) {assert.equal(e,null);continue;}
    assert.equal(e.to,expected);assert.equal(e.orientation,1);
    assert.equal(M.transition(w,{world_position:e.to},inverse[d]).to,queue[i]);
    if(!visited.has(expected)){visited.add(expected);queue.push(expected);}
  }
  assert.equal(visited.size,w.validation.floors);
  assert.equal(w.validation.topology.index,1);
  const game=M.createGame(w), path=M.solvePuzzle(w).path;
  for(const d of path) {assert.ok(M.move(game,d));assert.equal(M.periodicId(w,game.player.perceived_x,game.player.perceived_y),game.player.world_position);}
  assert.ok(game.won);
  count++;
}
for(const axis of ['shiftX','shiftY']) for(const sign of [-1,1]) {
  const w=M.createTorusDemo({openRoom:true,loopLearning:true,learningLaps:3,[axis]:sign*2});
  const g=M.createGame(w), walk=(d,n)=>{for(let i=0;i<n;i++)assert.ok(M.move(g,d));};
  for(let lap=0;lap<3;lap++){
    walk(axis==='shiftY'?'right':'down',8);
    walk(axis==='shiftY'?(sign>0?'up':'down'):(sign>0?'left':'right'),2);
    assert.equal(g.player.world_position,w.start);
  }
  const learned=axis==='shiftY'?'x':'y';assert.ok(g.cognition.known_loops.has(learned));assert.equal(g.cognition.known_loops.size,1);
  for(const node of g.cognition.memory_nodes.values()) assert.equal(M.periodicId(w,node.x,node.y),node.world_id);
  const optical=M.createGame({...w,selfVision:true});
  assert.ok(optical.cognition.self_images.some(n=>n.axis===learned && n.x!==optical.player.perceived_x && n.y!==optical.player.perceived_y));
  for(const image of optical.cognition.self_images) {assert.equal(M.periodicId(w,image.x,image.y),w.start);assert.ok(optical.cognition.visible_positions.has(`C${image.x},${image.y}`));}
}
for(const options of [{shiftX:1},{shiftX:8},{shiftY:-8},{shiftX:NaN}]) assert.throws(()=>M.createTorusDemo(options));
console.log(`PASS: ${count} shifted worlds; independent seam destinations, inverse moves, connectivity, reproducibility, solutions, shifted learning and self-images.`);
