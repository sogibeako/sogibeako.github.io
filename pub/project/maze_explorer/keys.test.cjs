const assert = require('node:assert/strict');
const M = require('./core.js');

// Independent reference solver uses only floor coordinates and the puzzle description.
function reference(world, collectKey) {
  const lock = world.puzzle.locks[0];
  const seen = new Set(), queue = [[world.start, false, 0]];
  seen.add(`${world.start}:false`);
  for (let i = 0; i < queue.length; i++) {
    const [id, key, distance] = queue[i];
    if (id === world.exit) return distance;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x = id % world.width + dx, y = Math.floor(id / world.width) + dy;
      if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
      const next = y * world.width + x;
      if (!world.cells[next] || (next === lock.door && !key)) continue;
      const nextKey = key || (collectKey && next === lock.key), state = `${next}:${nextKey}`;
      if (!seen.has(state)) { seen.add(state); queue.push([next, nextKey, distance + 1]); }
    }
  }
  return -1;
}
let cases = 0, fallback = 0;
for (const algorithm of ['eller', 'division', 'wilson', 'hunt', 'kruskal', 'dfs', 'prim', 'rooms']) for (const [width, height] of [[9, 9], [31, 23], [101, 101], [9, 101]]) for (const loops of [0, 30]) for (const seed of ['a', 'b', '日本語']) {
  const options = { algorithm, width, height, loops, seed };
  const world = M.generate({ ...options, keyDoor: true }), base = M.generate(options);
  assert.deepEqual(world, M.generate({ ...options, keyDoor: true }), 'puzzle is deterministic');
  assert.deepEqual(world.cells, base.cells, 'puzzle placement preserves terrain');
  assert.equal(world.start, base.start); assert.equal(world.exit, base.exit);
  const { key, door, placement } = world.puzzle.locks[0];
  assert.ok(world.cells[key] && world.cells[door]);
  assert.notEqual(key, world.start); assert.notEqual(key, world.exit); assert.notEqual(key, door);
  assert.notEqual(door, world.start);
  const lockedRegion = M.reachable(world, world.start, door);
  assert.ok(lockedRegion.distances[key] >= 0, 'key reachable before door');
  assert.equal(lockedRegion.distances[world.exit], -1, 'door cannot be bypassed');
  assert.equal(reference(world, false), -1, 'independent solver cannot win without key');
  const solved = M.solvePuzzle(world);
  assert.equal(solved.distance, reference(world, true), 'state-space shortest distance agrees');
  assert.deepEqual(world.validation.puzzle, { solvable: true, keyRequired: true, ordered: true, distance: solved.distance });
  const game = M.createGame(world);
  for (const direction of solved.path) assert.ok(M.move(game, direction));
  assert.equal(game.won, true); assert.ok(game.openedDoors.has('A')); assert.deepEqual(game.player.keys, ['A']);
  assert.equal(game.steps, solved.distance);
  const restarted = M.createGame(world);
  assert.equal(restarted.openedDoors.size, 0); assert.deepEqual(restarted.player.keys, []); assert.equal(restarted.steps, 0);
  assert.equal(M.featureAt(restarted, key), 'a'); assert.equal(M.featureAt(restarted, door), '+');
  if (placement === 'exit-door') fallback++;
  cases++;
}
assert.ok(fallback > 0, 'cyclic maps exercise locked-exit fallback');

// A visible corridor and a key in a side alcove, so we can try the locked door first.
const fixture = { width: 9, height: 5, cells: new Uint8Array(45), start: 19, exit: 25, puzzle: { locks: [{ key: 10, door: 22, keyId: 'A', placement: 'passage-door' }], requestedCount: 1 } };
for (let id = 19; id <= 25; id++) fixture.cells[id] = 1;
fixture.cells[10] = 1;
const game = M.createGame(fixture), before = fixture.cells.slice();
assert.ok(M.lineOfSight(fixture, 19, 22, new Set([22])), 'closed door is visible');
assert.equal(M.lineOfSight(fixture, 19, 23, new Set([22])), false, 'closed door blocks light');
assert.equal(game.cognition.memory_nodes.has('C23'), false, 'hidden floor is not remembered');
assert.ok(M.move(game, 'right')); assert.ok(M.move(game, 'right'));
const steps = game.steps, position = game.player.world_position;
assert.equal(M.move(game, 'right'), false); assert.equal(game.lastEvent, 'locked');
assert.equal(game.steps, steps); assert.equal(game.player.world_position, position);
for (const dir of ['left', 'left', 'up']) assert.ok(M.move(game, dir));
assert.equal(game.lastEvent, 'key'); assert.deepEqual(game.player.keys, ['A']);
assert.equal(M.featureAt(game, 10), null); assert.equal(game.cognition.memory_nodes.get('C10').feature, null);
assert.equal(game.openedDoors.size, 0, 'owning key does not remotely open door');
for (const dir of ['down', 'right', 'right', 'right']) assert.ok(M.move(game, dir));
assert.equal(game.lastEvent, 'door'); assert.ok(game.openedDoors.has('A'));
assert.equal(M.featureAt(game, 22), '/'); assert.equal(game.cognition.memory_nodes.get('C22').feature, '/');
assert.ok(game.cognition.visible_cells.has('C23'), 'opening door reveals corridor');
assert.deepEqual(fixture.cells, before, 'game rules do not mutate geometry');
for (const dir of ['left', 'right', 'right', 'right', 'right']) assert.ok(M.move(game, dir));
assert.equal(game.won, true); assert.equal(M.move(game, 'left'), false);
assert.deepEqual(game.player.keys, ['A'], 'key is retained and not duplicated');

// A deliberately unsolvable layout is rejected by the state-space solver.
const impossible = { ...fixture, puzzle: { ...fixture.puzzle, locks: [{ ...fixture.puzzle.locks[0], key: 24 }] } };
assert.equal(M.solvePuzzle(impossible).solvable, false);
console.log(`PASS: ${cases} key/door worlds (${fallback} exit doors); independent solver, mandatory key, legal playthroughs, reset, locked collision, inventory, door opacity and memory.`);
