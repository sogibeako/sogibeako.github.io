const assert = require('node:assert/strict');
const M = require('./core.js');
const mod = (n, s) => (n % s + s) % s;
const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };

// Reference BFS reads the periodic raster directly, independently of transition().
function inspect(world) {
  const nodes = new Map([[world.start, [0, 0]]]), queue = [world.start], cycles = [];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i], [lx, ly] = nodes.get(id);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = mod(id % world.width + dx, world.width), y = mod(Math.floor(id / world.width) + dy, world.height), next = y * world.width + x;
      if (!world.cells[next]) continue;
      if (!nodes.has(next)) { nodes.set(next, [lx + dx, ly + dy]); queue.push(next); }
      else {
        const [nx, ny] = nodes.get(next), a = (lx + dx - nx) / world.width, b = (ly + dy - ny) / world.height;
        assert.ok(Number.isInteger(a) && Number.isInteger(b));
        if (a || b) cycles.push([a, b]);
      }
    }
  }
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  let index = 0;
  for (const [ax, ay] of cycles) for (const [bx, by] of cycles) index = gcd(index, Math.abs(ax * by - ay * bx));
  return { count: nodes.size, index };
}
let cases = 0, wraps = 0;
for (const algorithm of ['wilson', 'hunt', 'kruskal', 'dfs', 'prim', 'rooms']) for (const [width, height] of [[8, 8], [30, 22], [100, 100], [8, 100]]) for (const loops of [0, 30]) for (const seed of ['a', 'b', '日本語']) {
  const options = { topology: 'torus', algorithm, width, height, loops, seed };
  const world = M.generate(options);
  assert.deepEqual(world, M.generate(options));
  assert.equal(world.topology, 'torus'); assert.equal(world.width, width); assert.equal(world.height, height);
  const reference = inspect(world);
  assert.equal(reference.count, world.validation.floors);
  assert.equal(reference.index, 1, 'raster admits the full two-dimensional winding lattice');
  assert.equal(world.validation.topology.rank, 2); assert.equal(world.validation.topology.index, 1);
  let horizontalSeams = 0, verticalSeams = 0;
  for (let id = 0; id < world.cells.length; id++) if (world.cells[id]) for (const [direction, [dx, dy]] of Object.entries(M.DIRS)) {
    const edge = M.transition(world, { world_position: id, orientation: 1, sheet: 0 }, direction);
    const x = id % width, y = Math.floor(id / width);
    const expected = mod(y + dy, height) * width + mod(x + dx, width);
    if (!world.cells[expected]) { assert.equal(edge, null); continue; }
    assert.equal(edge.to, expected);
    const back = M.transition(world, { world_position: edge.to, orientation: 1, sheet: 0 }, opposite[direction]);
    assert.equal(back.to, id); assert.equal(back.wrapX + edge.wrapX, 0); assert.equal(back.wrapY + edge.wrapY, 0);
    assert.equal(edge.orientation, 1); assert.equal(edge.sheet, 0); assert.equal(edge.direction, direction);
    if (edge.kind === 'wrap') { wraps++; if (dx) horizontalSeams++; else verticalSeams++; }
  }
  assert.ok(horizontalSeams && verticalSeams, 'both seam directions have passages');
  const game = M.createGame(world), solution = M.solvePuzzle(world);
  assert.ok(solution.solvable);
  for (const direction of solution.path) {
    const oldX = game.player.perceived_x, oldY = game.player.perceived_y;
    assert.ok(M.move(game, direction));
    assert.equal(game.player.perceived_x, oldX + M.DIRS[direction][0]);
    assert.equal(game.player.perceived_y, oldY + M.DIRS[direction][1]);
    assert.equal(game.player.world_position % width, mod(game.player.perceived_x, width));
    assert.equal(Math.floor(game.player.world_position / width), mod(game.player.perceived_y, height));
  }
  assert.ok(game.won); assert.equal(game.steps, world.validation.distance);
  cases++;
}

let roomCases = 0, seamRooms = 0;
for (const [width, height] of [[8, 8], [8, 100], [100, 8], [30, 22], [100, 100]]) for (const roomCount of [2, 8, 24]) for (const seed of ['rooms-a', 'rooms-b', '部屋']) {
  const options = { topology: 'torus', algorithm: 'rooms', width, height, roomCount, seed };
  const base = M.generate(options), extra = M.generate({ ...options, loops: 30 });
  assert.deepEqual(base.rooms, extra.rooms);
  assert.deepEqual(base.connections, extra.connections.filter(e => e.kind !== 'extra'));
  for (const world of [base, extra]) {
    assert.ok(world.rooms.length <= roomCount && world.rooms.length >= 1);
    const occupied = new Set();
    for (const room of world.rooms) {
      if (room.x + room.w > width || room.y + room.h > height) seamRooms++;
      for (let y = 0; y < room.h; y++) for (let x = 0; x < room.w; x++) {
        const id = mod(room.y + y, height) * width + mod(room.x + x, width);
        assert.equal(world.cells[id], 1); assert.ok(!occupied.has(id), 'rooms do not overlap across seams'); occupied.add(id);
      }
    }
    for (const edge of world.connections) {
      const a = world.rooms[edge.a], b = world.rooms[edge.b];
      assert.equal(edge.path[0], a.cy * width + a.cx);
      assert.equal(edge.path.at(-1), b.cy * width + b.cx);
      for (let i = 1; i < edge.path.length; i++) {
        const from = edge.path[i - 1], to = edge.path[i];
        assert.ok(Object.keys(M.DIRS).some(d => M.transition(world, { world_position: from }, d)?.to === to));
      }
    }
    assert.equal(inspect(world).index, 1);
    assert.equal(inspect(world).count, world.validation.floors);
    roomCases++;
  }
}
assert.ok(seamRooms > 0, 'rooms themselves can span the display seam');
console.log(`PASS: ${roomCases} periodic BSP cases; wrapped room geometry, corridor continuity, room counts and stable base connections.`);

const demo = M.createTorusDemo(), game = M.createGame(demo), initial = game.player.world_position;
assert.equal(demo.exit, -1);
assert.ok(game.cognition.visible_cells.has('C-1,1'), 'vision continues across left seam');
assert.equal(game.cognition.memory_nodes.get('C-1,1').world_id, 15);
assert.equal(game.cognition.memory_nodes.get('C7,1').world_id, 15, 'one real cell can have two visible cognitive copies');
const initialCount = game.cognition.memory_nodes.size;
for (let i = 0; i < 8; i++) assert.ok(M.move(game, 'right'));
assert.equal(game.player.world_position, initial); assert.equal(game.player.perceived_x, 9);
assert.equal(game.player.perceived_position, 'C9,1'); assert.ok(!game.won);
assert.ok(game.cognition.memory_nodes.size > initialCount);
assert.equal(game.cognition.memory_nodes.get('C1,1').world_id, initial);
assert.equal(game.cognition.memory_nodes.get('C9,1').world_id, initial);
assert.equal(game.cognition.known_loops.size, 0, 'circling does not yet fold memory');
for (let i = 0; i < 16; i++) assert.ok(M.move(game, 'left'));
assert.equal(game.player.world_position, initial); assert.equal(game.player.perceived_x, -7);
for (let i = 0; i < 8; i++) assert.ok(M.move(game, 'down'));
assert.equal(game.player.world_position, initial); assert.equal(game.player.perceived_y, 9);
const reset = M.createGame(demo);
assert.equal(reset.player.perceived_position, 'C1,1'); assert.equal(reset.steps, 0);
assert.equal(reset.cognition.memory_nodes.size, initialCount);

const occluded = M.createTorusDemo(); occluded.cells[15] = 0;
const limited = M.createGame(occluded);
assert.ok(limited.cognition.visible_cells.has('C-1,1'), 'wall across seam is visible');
assert.ok(!limited.cognition.visible_cells.has('C-2,1'), 'wall across seam blocks farther images');
assert.ok(M.move(limited, 'left')); const before = limited.player.perceived_x;
assert.equal(M.move(limited, 'left'), false); assert.equal(limited.player.perceived_x, before);

for (const size of [7, 9, 101, NaN]) assert.throws(() => M.generate({ topology: 'torus', width: size, height: 8 }));
assert.throws(() => M.generate({ topology: 'torus', width: 8, height: 8, algorithm: 'rooms', roomCount: 1 }));
assert.throws(() => M.generate({ topology: 'torus', width: 8, height: 8, keyDoor: true }));
console.log(`PASS: ${cases} torus worlds, ${wraps} wrap transitions; independent periodic connectivity/winding validation, reversibility, winning paths, unfolded memory, negative coordinates, seam vision and wall occlusion.`);
