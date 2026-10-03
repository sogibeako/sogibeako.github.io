const assert = require('node:assert/strict');
const M = require('./core.js');
const mod = (n, s) => (n % s + s) % s;
const gcd = (a, b) => b ? gcd(b, a % b) : a;
// Inspect raw floors, with an independent seam calculation and lifted BFS.
function inspect(w) {
  const positions = new Map([[w.start, [0, 0]]]), queue = [w.start], cycles = new Map();
  let edges = 0;
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i], [lx, ly] = positions.get(id);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      let x = id % w.width + dx, y = Math.floor(id / w.width) + dy;
      if (w.topology === 'torus') {
        if (x < 0 || x >= w.width) y += (x < 0 ? -1 : 1) * w.shiftY;
        if (y < 0 || y >= w.height) x += (y < 0 ? -1 : 1) * w.shiftX;
        x = mod(x, w.width); y = mod(y, w.height);
      } else if (x < 0 || y < 0 || x >= w.width || y >= w.height) continue;
      const next = y * w.width + x;
      if (!w.cells[next]) continue;
      edges++;
      if (!positions.has(next)) { positions.set(next, [lx + dx, ly + dy]); queue.push(next); }
      else if (w.topology === 'torus') {
        const [px, py] = positions.get(next), ux = lx + dx - px, uy = ly + dy - py;
        const b = w.shiftX ? uy / w.height : (uy + ux / w.width * w.shiftY) / w.height;
        const a = (ux + b * w.shiftX) / w.width;
        assert.ok(Number.isInteger(a) && Number.isInteger(b));
        if (a || b) cycles.set(`${a},${b}`, [a,b]);
      }
    }
  }
  assert.equal(positions.size, w.cells.reduce((a,b) => a+b, 0));
  assert.ok(positions.has(w.exit));
  if (w.topology === 'torus') {
    let index = 0;
    for (const [a,b] of cycles.values()) for (const [c,d] of cycles.values()) index = gcd(index, Math.abs(a*d-b*c));
    assert.equal(index, 1, 'all integer periods remain traversable');
  }
  return edges / 2;
}
let cases = 0;
for (const topology of ['plane', 'torus']) for (const newestBias of [0, 40, 70, 100])
for (const size of [8, 30, 100]) for (const seed of ['branch', '道']) {
  const width = size + (topology === 'plane' ? 1 : 0), height = size === 100 ? (topology === 'plane' ? 9 : 8) : width;
  const shifts = topology === 'torus' ? [{shiftX:0,shiftY:0},{shiftX:2,shiftY:0},{shiftX:-2,shiftY:0},{shiftX:0,shiftY:2},{shiftX:0,shiftY:-2}] : [{}];
  for (const shift of shifts) {
    const options = { topology, width, height, algorithm:'growing', newestBias, seed, ...shift };
    const w = M.generate(options), edges = inspect(w);
    assert.deepEqual(w, M.generate(options));
    if (topology === 'plane') {
      assert.equal(edges, w.validation.floors - 1, 'zero-loop plane is a tree');
      for (let id=0; id<w.cells.length; id++) if (id<width || id>=width*(height-1) || id%width===0 || id%width===width-1) assert.equal(w.cells[id],0);
    }
    if (newestBias === 100) assert.deepEqual(w.cells, M.generate({...options,algorithm:'dfs'}).cells);
    const extra = M.generate({...options, loops:30}); inspect(extra);
    w.cells.forEach((floor,id) => { if(floor) assert.equal(extra.cells[id],1); });
    if (size === 8) {
      const game = M.createGame(w);
      for (const direction of M.solvePuzzle(w).path) assert.ok(M.move(game,direction));
      assert.ok(game.won);
    }
    cases++;
  }
}
for (const newestBias of [0,70,100]) {
  const w=M.generate({algorithm:'growing',newestBias,keyDoor:true,keyCount:3,seed:'locks'});
  assert.equal(w.puzzle.locks.length,3);
  const game=M.createGame(w);
  for (const direction of M.solvePuzzle(w).path) assert.ok(M.move(game,direction));
  assert.ok(game.won);
  for (const lock of w.puzzle.locks) assert.equal(M.solvePuzzle(w,true,lock.keyId).solvable,false);
}
for (const newestBias of [-1,101,NaN,Infinity,'70']) assert.throws(()=>M.generate({algorithm:'growing',newestBias}));
assert.notDeepEqual(M.generate({algorithm:'growing',newestBias:0}).cells,M.generate({algorithm:'growing',newestBias:100}).cells);
console.log(`PASS: ${cases} Growing Tree worlds, tree structure, full shifted winding lattice, deterministic bias, DFS endpoint, added loops, traversal and mandatory keys.`);
