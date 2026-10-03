const assert = require('node:assert/strict');
const M = require('./core.js');
let cases = 0;
for (const algorithm of ['eller', 'division', 'wilson', 'hunt', 'kruskal', 'dfs', 'prim']) for (const size of [9, 31, 101]) for (const loops of [0, 30]) for (const seed of ['a', 'b', '日本語']) {
  const options = { width: size, height: size === 31 ? 23 : size, algorithm, loops, seed };
  const world = M.generate(options);
  assert.deepEqual(world.cells, M.generate(options).cells);
  assert.equal(world.validation.reachable, world.validation.floors);
  assert.notEqual(world.start, world.exit);
  const reach = M.reachable(world, world.start);
  assert.equal(reach.distances[world.exit], Math.max(...reach.distances));
  for (let x = 0; x < world.width; x++) { assert.equal(world.cells[x], 0); assert.equal(world.cells[(world.height - 1) * world.width + x], 0); }
  for (let y = 0; y < world.height; y++) { assert.equal(world.cells[y * world.width], 0); assert.equal(world.cells[y * world.width + world.width - 1], 0); }
  let edges = 0;
  for (let i = 0; i < world.cells.length; i++) if (world.cells[i]) for (const dir of ['right', 'down']) if (M.transition(world, { world_position: i, orientation: 1, sheet: 0 }, dir)) edges++;
  if (loops === 0) assert.equal(edges, world.validation.floors - 1);
  cases++;
}
for (const width of [8, 10, 103, NaN, 9.5]) assert.throws(() => M.generate({ width }));
const world = M.generate(), game = M.createGame(world);
assert.equal(M.move(game, 'left'), false); assert.equal(game.steps, 0); assert.equal(game.player.world_position, world.start);
const memory = new Set(game.cognition.memory_nodes.keys());
// Follow a shortest path using distance-to-exit, exercising transitions and game rules.
const distances = M.reachable(world, world.exit).distances;
while (!game.won) {
  const before = game.player.world_position;
  const dir = Object.keys(M.DIRS).find(d => { const e = M.transition(world, game.player, d); return e && distances[e.to] === distances[before] - 1; });
  assert.ok(dir); assert.equal(M.move(game, dir), true);
  assert.equal(game.lastTransition.from, before); assert.equal(game.lastTransition.to, game.player.world_position);
}
assert.equal(game.steps, world.validation.distance); assert.equal(M.move(game, 'up'), false);
for (const id of memory) assert.ok(game.cognition.memory_nodes.has(id));
assert.ok(game.cognition.memory_nodes.size > game.cognition.visible_cells.size);
const fixture = { width: 5, height: 5, cells: new Uint8Array(25).fill(1) };
fixture.cells[12] = 0;
assert.equal(M.lineOfSight(fixture, 10, 12), true, 'wall itself visible');
assert.equal(M.lineOfSight(fixture, 10, 14), false, 'wall blocks beyond');
assert.equal(M.lineOfSight(fixture, 0, 4), true);
fixture.cells[1] = 0;
assert.equal(M.lineOfSight(fixture, 0, 6), false, 'no corner peeking');
assert.equal(M.lineOfSight(fixture, 6, 0), false);
let roomCases = 0, extraCount = 0;
for (const [width, height] of [[9, 9], [9, 101], [101, 9], [31, 23], [101, 101]]) for (const roomCount of [2, 8, 24]) for (const seed of ['a', 'b', '日本語']) {
  const options = { algorithm: 'rooms', width, height, roomCount, seed };
  const base = M.generate(options);
  for (const loops of [0, 30]) {
    const world = M.generate({ ...options, loops });
    assert.deepEqual(world, M.generate({ ...options, loops }), 'reproducible rooms, corridors and geometry');
    assert.deepEqual(world.rooms, base.rooms, 'extra corridors preserve room layout');
    assert.deepEqual(world.connections.filter(e => e.kind === 'tree'), base.connections, 'base corridors remain unchanged');
    for (let i = 0; i < base.cells.length; i++) if (base.cells[i]) assert.equal(world.cells[i], 1, 'extra connections never remove floors');
    assert.ok(world.rooms.length >= 2 && world.rooms.length <= roomCount);
    assert.equal(world.connections.filter(e => e.kind === 'tree').length, world.rooms.length - 1);
    const reach = M.reachable(world, world.start);
    assert.equal(reach.count, world.validation.floors);
    assert.equal(reach.distances[world.exit], Math.max(...reach.distances));
    const occupied = new Set();
    for (const room of world.rooms) {
      assert.ok(room.w >= 3 && room.h >= 3);
      assert.ok(room.x >= 1 && room.y >= 1 && room.x + room.w < width && room.y + room.h < height);
      for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) {
        const id = y * width + x;
        assert.equal(world.cells[id], 1); assert.ok(reach.distances[id] >= 0);
        assert.ok(!occupied.has(id), 'rooms do not overlap'); occupied.add(id);
      }
    }
    const connectedRooms = new Set([0]), edges = new Set();
    for (const edge of world.connections) {
      assert.ok(!edges.has(`${edge.a}:${edge.b}`), 'no duplicate planned connections'); edges.add(`${edge.a}:${edge.b}`);
      const a = world.rooms[edge.a], b = world.rooms[edge.b];
      assert.equal(edge.path[0], a.cy * width + a.cx);
      assert.equal(edge.path.at(-1), b.cy * width + b.cx);
      edge.path.forEach((id, index) => {
        assert.equal(world.cells[id], 1);
        if (index) { const prev = edge.path[index - 1]; assert.equal(Math.abs(id % width - prev % width) + Math.abs(Math.floor(id / width) - Math.floor(prev / width)), 1); }
      });
      if (edge.kind === 'extra') extraCount++;
    }
    for (let pass = 0; pass < world.rooms.length; pass++) for (const edge of world.connections.filter(e => e.kind === 'tree')) {
      if (connectedRooms.has(edge.a) || connectedRooms.has(edge.b)) { connectedRooms.add(edge.a); connectedRooms.add(edge.b); }
    }
    assert.equal(connectedRooms.size, world.rooms.length, 'planned tree connects every room');
    for (let x = 0; x < width; x++) { assert.equal(world.cells[x], 0); assert.equal(world.cells[(height - 1) * width + x], 0); }
    for (let y = 0; y < height; y++) { assert.equal(world.cells[y * width], 0); assert.equal(world.cells[y * width + width - 1], 0); }
    const game = M.createGame(world), toExit = M.reachable(world, world.exit).distances;
    while (!game.won) {
      const dir = Object.keys(M.DIRS).find(d => { const e = M.transition(world, game.player, d); return e && toExit[e.to] === toExit[e.from] - 1; });
      assert.ok(dir); assert.ok(M.move(game, dir));
    }
    assert.equal(game.steps, world.validation.distance);
    roomCases++;
  }
}
assert.ok(extraCount > 0, 'positive rate can add connections');
assert.equal(M.generate({ algorithm: 'rooms', width: 9, height: 9, roomCount: 24 }).rooms.length, 4, 'small map reports actual capacity');
for (const roomCount of [1, 25, 3.5, NaN]) assert.throws(() => M.generate({ algorithm: 'rooms', roomCount }));
console.log(`PASS: ${cases} mazes + ${roomCases} room dungeons; reproducibility, connectivity, bounds, goal traversal, visibility, memory, room placement and extra connections.`);

for (const [width,height] of [[9,101],[101,9]]) {
  const options={algorithm:'division',width,height,seed:'thin-division'};
  const base=M.generate(options), extra=M.generate({...options,loops:30});
  base.cells.forEach((v,i)=>{if(v)assert.equal(extra.cells[i],1);});
  const g=M.createGame(base);for(const d of M.solvePuzzle(base).path)assert.ok(M.move(g,d));assert.ok(g.won);
}
for (const shifts of [{},{shiftX:2},{shiftX:2,shiftY:2}]) assert.throws(()=>M.generate({algorithm:'division',topology:'torus',width:8,height:8,...shifts}),/平面専用/);
console.log('PASS: division thin maps, stable base floors with added loops and explicit torus rejection.');

for(const [width,height] of [[9,101],[101,9]]) for(const seed of ['rows','sets','末尾']) {
 const options={algorithm:'eller',width,height,seed};
 const w=M.generate(options),extra=M.generate({...options,loops:30});
 w.cells.forEach((v,i)=>{if(v)assert.equal(extra.cells[i],1);});
 const game=M.createGame(w);for(const d of M.solvePuzzle(w).path)assert.ok(M.move(game,d));assert.ok(game.won);
}
for(const shifts of [{},{shiftX:2},{shiftX:2,shiftY:2}])assert.throws(()=>M.generate({algorithm:'eller',topology:'torus',width:8,height:8,...shifts}),/平面専用/);
console.log('PASS: Eller thin worlds, stable floors with extra loops, traversal and explicit torus rejection.');
