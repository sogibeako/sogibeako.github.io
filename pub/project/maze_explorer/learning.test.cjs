const assert = require('node:assert/strict');
const M = require('./core.js');
const fresh = () => M.createGame(M.createTorusDemo({ loopLearning: true }));
function walk(game, direction, count) { for (let i = 0; i < count; i++) assert.ok(M.move(game, direction)); }
function verifyMemory(game) {
  for (const [id, node] of game.cognition.memory_nodes) {
    assert.equal(id, `C${node.x},${node.y}`);
    const wrap = (n, s) => (n % s + s) % s;
    assert.equal(node.world_id, wrap(node.y, game.world.height) * game.world.width + wrap(node.x, game.world.width));
    if (game.cognition.known_loops.has('x')) assert.ok(node.x >= 0 && node.x < game.world.width);
    if (game.cognition.known_loops.has('y')) assert.ok(node.y >= 0 && node.y < game.world.height);
  }
  for (const id of game.cognition.visible_cells) assert.ok(game.cognition.memory_nodes.has(id));
  assert.ok(game.cognition.visible_cells.has(game.player.perceived_position));
}

const game = fresh();
for (let lap = 1; lap <= 4; lap++) {
  walk(game, 'right', 8);
  assert.equal(game.cognition.loopProgress.x, lap, 'one award per whole lap, not per revisited cell');
  assert.equal(game.cognition.loopProgress.y, 0);
  assert.equal(game.cognition.known_loops.size, 0);
}
const before = game.cognition.memory_nodes.size;
const observed = new Set([...game.cognition.memory_nodes.values()].map(n => n.world_id));
walk(game, 'right', 8);
assert.deepEqual([...game.cognition.known_loops], ['x']);
assert.deepEqual(game.lastLoopEvent, { axis: 'x', count: 5, recognized: true });
assert.equal(game.player.world_position, 9);
assert.equal(game.player.perceived_x, 41, 'raw coordinates stay unwrapped for learning');
assert.deepEqual(M.cognitivePosition(game), { x: 1, y: 1 });
assert.equal(game.player.perceived_position, 'C1,1');
assert.ok(game.cognition.memory_nodes.size < before, 'duplicate memories collapse');
assert.deepEqual(new Set([...game.cognition.memory_nodes.values()].map(n => n.world_id)), observed, 'folding preserves observed real cells');
assert.ok([...game.cognition.memory_nodes.values()].some(n => n.y < 0), 'unknown vertical direction stays unfolded');
verifyMemory(game);
walk(game, 'right', 16);
assert.equal(game.cognition.loopProgress.x, 5, 'understood loops stop counting');
for (let lap = 1; lap <= 5; lap++) {
  walk(game, 'down', 8);
  assert.equal(game.cognition.loopProgress.y, lap);
  verifyMemory(game);
}
assert.deepEqual([...game.cognition.known_loops].sort(), ['x', 'y']);
assert.equal(game.cognition.memory_nodes.size, new Set([...game.cognition.memory_nodes.values()].map(n => n.world_id)).size);
const reset = M.createGame(game.world);
assert.equal(reset.cognition.known_loops.size, 0); assert.deepEqual(reset.cognition.loopProgress, { x: 0, y: 0 });
assert.equal(reset.player.perceived_x, 1); assert.equal(reset.steps, 0);

// Direction is irrelevant. Full reverse loops count; partial backtracking does not.
const reverse = fresh();
for (const dir of ['left', 'right', 'left', 'right', 'left']) walk(reverse, dir, 8);
assert.ok(reverse.cognition.known_loops.has('x')); verifyMemory(reverse);
const partial = fresh();
for (let i = 0; i < 12; i++) { walk(partial, 'left', 3); walk(partial, 'right', 3); }
assert.deepEqual(partial.cognition.loopProgress, { x: 0, y: 0 });
walk(partial, 'right', 8); assert.equal(partial.cognition.loopProgress.x, 1);

// Starting away from the world entrance does not change the unit loop definition.
const offsetWorld = M.createTorusDemo({ loopLearning: true }); offsetWorld.start = 12;
const offset = M.createGame(offsetWorld);
walk(offset, 'right', 40); assert.ok(offset.cognition.known_loops.has('x')); verifyMemory(offset);
// Recognition order can be vertical first, with horizontal memory still unfolded.
const vertical = fresh(); walk(vertical, 'up', 40);
assert.deepEqual([...vertical.cognition.known_loops], ['y']);
assert.ok([...vertical.cognition.memory_nodes.values()].some(n => n.x < 0));
walk(vertical, 'left', 40); assert.equal(vertical.cognition.known_loops.size, 2); verifyMemory(vertical);

// A contractible rectangle is not a torus loop; a diagonal winding is learned separately from the axes.
const openWorld = { ...M.createTorusDemo({ loopLearning: true }), cells: new Uint8Array(64).fill(1) };
const local = M.createGame(openWorld);
for (let i = 0; i < 10; i++) for (const dir of ['right', 'down', 'left', 'up']) walk(local, dir, 1);
assert.deepEqual(local.cognition.loopProgress, { x: 0, y: 0 });
const diagonal = M.createGame(openWorld);
for (let i = 0; i < 48; i++) { walk(diagonal, 'right', 1); walk(diagonal, 'down', 1); }
assert.deepEqual(diagonal.cognition.loopProgress, { x: 0, y: 0 });
assert.equal(diagonal.cognition.compositeLoops.get('1,1').recognized, true);
assert.equal(diagonal.cognition.known_loops.size, 0);

const unlimited = M.createGame(M.createTorusDemo()); walk(unlimited, 'right', 80);
assert.equal(unlimited.cognition.known_loops.size, 0); assert.equal(unlimited.player.perceived_position, 'C81,1');
assert.ok(unlimited.cognition.memory_nodes.size > before);
const wall = fresh(); walk(wall, 'right', 1);
const stepCount = wall.steps;
assert.equal(M.move(wall, 'down'), false); assert.equal(wall.steps, stepCount);
assert.deepEqual(wall.cognition.loopProgress, { x: 0, y: 0 });
console.log('PASS: independent axis learning, five-lap threshold, no overlapping awards, inverse and offset loops, partial-backtrack/local rejection and independent composite handling, partial folding, memory preservation, reset and unlimited mode.');

const three = M.createGame(M.createTorusDemo({ loopLearning: true, learningLaps: 3 }));
walk(three, 'left', 16);
assert.equal(three.cognition.known_loops.size, 0);
walk(three, 'left', 8);
assert.deepEqual(three.lastLoopEvent, { axis: 'x', count: 3, recognized: true });
const bounds = { minX: -40, maxX: 0, minY: -12, maxY: 12 };
const snapshot = JSON.stringify([...three.cognition.memory_nodes]);
const tiles = M.subjectiveCells(three, bounds);
assert.equal(JSON.stringify([...three.cognition.memory_nodes]), snapshot, 'rendering does not alter memories');
assert.ok(tiles.some(n => n.familiar && n.terrain && n.visible));
assert.ok(tiles.some(n => n.familiar && n.terrain && !n.visible));
for (const node of tiles) {
  const p = M.cognitivePosition(three, node.x, node.y);
  assert.ok(three.cognition.memory_nodes.has(`C${p.x},${p.y}`), 'no invented terrain');
  assert.equal(node.visible, three.cognition.visible_positions.has(`C${node.x},${node.y}`), 'visibility belongs to each lifted image');
  assert.ok(Math.abs(node.y - three.player.perceived_y) <= 7, 'unknown vertical direction is not repeated');
}
walk(three, 'down', 24);
assert.deepEqual([...three.cognition.known_loops].sort(), ['x', 'y']);
assert.equal(M.createGame(three.world).world.learningLaps, 3);
assert.throws(() => M.createTorusDemo({ learningLaps: 4 }));
for (const algorithm of ['dfs', 'prim', 'rooms']) assert.equal(M.generate({ topology: 'torus', width: 16, height: 16, algorithm, loopLearning: true, learningLaps: 3 }).learningLaps, 3);
console.log('PASS: three-lap learning, continuous memory projection, no unknown-axis repetition, per-image visibility and render purity.');
