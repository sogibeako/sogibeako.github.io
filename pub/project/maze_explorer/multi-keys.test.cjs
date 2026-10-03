const assert = require('node:assert/strict');
const M = require('./core.js');

// Independent coordinate BFS: check all reachable inventory states, including
// paths other than the shortest solution. Do not call the production rule/solver.
function reference(world, forbiddenKey = null) {
  const locks = world.puzzle.locks, seen = new Set([`${world.start}:0`]);
  const queue = [[world.start, 0, 0]];
  let distance = -1, ordered = true;
  for (let i = 0; i < queue.length; i++) {
    const [id, mask, depth] = queue[i];
    if (id === world.exit && distance < 0) distance = depth;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x = id % world.width + dx, y = Math.floor(id / world.width) + dy;
      if (x < 0 || y < 0 || x >= world.width || y >= world.height) continue;
      const next = y * world.width + x, door = locks.findIndex(lock => lock.door === next);
      if (!world.cells[next] || (door >= 0 && !(mask & (1 << door)))) continue;
      const key = locks.findIndex(lock => lock.key === next);
      let newMask = mask;
      if (key >= 0 && locks[key].keyId !== forbiddenKey) {
        for (let preceding = 0; preceding < key; preceding++) if (!(mask & (1 << preceding))) ordered = false;
        newMask |= 1 << key;
      }
      const state = `${next}:${newMask}`;
      if (!seen.has(state)) { seen.add(state); queue.push([next, newMask, depth + 1]); }
    }
  }
  return { distance, ordered };
}
let cases = 0, reduced = 0, full = 0;
for (const algorithm of ['eller', 'division', 'wilson', 'hunt', 'kruskal', 'dfs', 'prim', 'rooms']) for (const [width, height] of [[9, 9], [31, 23], [101, 101], [101, 9]]) for (const loops of [0, 30]) for (const seed of ['a', 'b', '日本語']) for (const keyCount of [2, 3]) for (const connectionStyle of algorithm === 'rooms' ? ['tree','chain','ring','hub'] : ['tree']) for (const roomPlacement of algorithm === 'rooms' ? ['bsp','scatter','grid'] : ['bsp']) {
  const options = { algorithm, connectionStyle, roomPlacement, width, height, loops, seed, keyDoor: true, keyCount };
  const world = M.generate(options), { locks, requestedCount } = world.puzzle;
  assert.equal(requestedCount, keyCount); assert.ok(locks.length >= 1 && locks.length <= keyCount);
  if (locks.length === keyCount) full++; else reduced++;
  assert.deepEqual(world, M.generate(options));
  const base = M.generate({ ...options, keyDoor: false });
  assert.deepEqual(world.cells, base.cells); assert.equal(world.exit, base.exit);
  const occupied = new Set([world.start]);
  for (const [i, lock] of locks.entries()) {
    assert.equal(lock.keyId, String.fromCharCode(65 + i));
    assert.ok(world.cells[lock.key] && world.cells[lock.door]);
    assert.ok(!occupied.has(lock.key)); occupied.add(lock.key);
    assert.ok(!occupied.has(lock.door)); occupied.add(lock.door);
    assert.notEqual(lock.key, world.exit);
    const beforeDoor = M.reachable(world, world.start, lock.door).distances;
    assert.ok(beforeDoor[lock.key] >= 0, 'each key precedes its own door');
    assert.equal(beforeDoor[world.exit], -1, 'every door blocks the exit');
    for (const later of locks.slice(i + 1)) assert.equal(beforeDoor[later.key], -1, 'later key requires passing earlier door');
    assert.equal(reference(world, lock.keyId).distance, -1, 'every individual key is mandatory');
    assert.equal(M.solvePuzzle(world, true, lock.keyId).solvable, false);
  }
  const expected = reference(world), solved = M.solvePuzzle(world);
  assert.equal(expected.ordered, true); assert.equal(solved.ordered, true);
  assert.equal(solved.distance, expected.distance); assert.ok(solved.solvable);
  const game = M.createGame(world), events = [];
  for (const dir of solved.path) {
    assert.ok(M.move(game, dir));
    if (game.lastEvent) events.push(`${game.lastEvent}:${game.eventKeyId}`);
  }
  assert.deepEqual(events, locks.flatMap(lock => [`key:${lock.keyId}`, `door:${lock.keyId}`]));
  assert.ok(game.won); assert.equal(game.steps, solved.distance);
  assert.deepEqual(game.player.keys, locks.map(lock => lock.keyId));
  assert.equal(game.openedDoors.size, locks.length);
  const reset = M.createGame(world);
  assert.equal(reset.openedDoors.size, 0); assert.deepEqual(reset.player.keys, []);
  for (const lock of locks) {
    assert.equal(M.featureAt(reset, lock.key), lock.keyId.toLowerCase());
    assert.equal(M.featureAt(reset, lock.door), locks.length === 1 ? '+' : lock.keyId);
  }
  cases++;
}
assert.ok(full > 0 && reduced > 0, 'both full and reduced stage counts are exercised');
for (const keyCount of [0, 4, NaN, 2.5]) assert.throws(() => M.generate({ keyDoor: true, keyCount }));

const locks = [
  { keyId: 'A', key: 16, door: 34 },
  { keyId: 'B', key: 20, door: 38 },
  { keyId: 'C', key: 24, door: 42 }
];
const fixture = { width: 15, height: 5, cells: new Uint8Array(75), start: 31, exit: 43, puzzle: { locks, requestedCount: 3 } };
for (let id = 31; id <= 43; id++) fixture.cells[id] = 1;
for (const lock of locks) fixture.cells[lock.key] = 1;
const game = M.createGame(fixture);
assert.equal(M.ruleTransition(fixture, { world_position: 37, keys: ['A'] }, 'right'), null, 'A cannot open B');
assert.equal(M.ruleTransition(fixture, { world_position: 41, keys: ['A', 'B'] }, 'right'), null, 'A and B cannot open C');
for (const dir of ['up', 'down', 'right', 'right', 'right']) assert.ok(M.move(game, dir));
assert.deepEqual([...game.openedDoors], ['A']); assert.equal(M.featureAt(game, 38), 'B'); assert.equal(M.featureAt(game, 42), 'C');
assert.ok(game.cognition.visible_cells.has('C38'), 'next closed door is visible');
assert.ok(!game.cognition.visible_cells.has('C39'), 'unopened B still blocks light');
for (const dir of ['right', 'right', 'right']) assert.ok(M.move(game, dir));
const oldSteps = game.steps;
assert.equal(M.move(game, 'right'), false); assert.equal(game.lastEvent, 'locked'); assert.equal(game.eventKeyId, 'B');
assert.equal(game.steps, oldSteps);
// Key B is reachable too early in this deliberately invalid puzzle.
const invalidOrder = { ...fixture, puzzle: { ...fixture.puzzle, locks: [{ ...locks[0], key: 20 }, { ...locks[1], key: 16 }, locks[2]] } };
assert.equal(M.solvePuzzle(invalidOrder).ordered, false);
console.log(`PASS: ${cases} multi-key worlds (${full} full, ${reduced} reduced); independent solver, strict key/door ordering, each key mandatory, playthroughs, per-door opacity and wrong-key rejection.`);
