const assert = require('node:assert/strict');
const M = require('./core.js');
const world = () => M.createTorusDemo({ selfVision: true, loopLearning: true, learningLaps: 3 });
const both = M.createGame(world());
assert.equal(both.steps, 0);
assert.deepEqual([...both.cognition.known_loops].sort(), ['x', 'y']);
assert.equal(both.cognition.self_images.length, 4);
for (const image of both.cognition.self_images) {
  assert.equal(image.distance, 8);
  assert.ok(both.cognition.visible_positions.has(`C${image.x},${image.y}`));
}
assert.deepEqual(both.cognition.loopProgress, { x: 0, y: 0 });
const blockedWorld = world(); blockedWorld.cells[1 * 8 + 5] = 0;
const blocked = M.createGame(blockedWorld);
assert.deepEqual([...blocked.cognition.known_loops], ['y']);
assert.ok(blocked.cognition.self_images.every(n => n.axis === 'y'));
const noneWorld = world(); noneWorld.cells[13] = 0; noneWorld.cells[41] = 0;
const none = M.createGame(noneWorld);
assert.equal(none.cognition.self_images.length, 0);
assert.equal(none.cognition.known_loops.size, 0);
const noLearning = M.createGame(M.createTorusDemo({ selfVision: true }));
assert.equal(noLearning.cognition.self_images.length, 4);
assert.equal(noLearning.cognition.known_loops.size, 0);
const off = M.createGame(M.createTorusDemo({ loopLearning: true }));
assert.equal(off.cognition.self_images.length, 0);
assert.equal(off.cognition.known_loops.size, 0);
// Large periods do not generate self-images outside the optical horizon.
const large = { ...world(), width: 16, height: 16, start: 17, cells: new Uint8Array(256).fill(1) };
assert.equal(M.createGame(large).cognition.self_images.length, 0);
// Moving into the crossing discovers a new axis; blocked moves do not replay that event.
const enteringWorld = world(); enteringWorld.start = 10;
const entering = M.createGame(enteringWorld);
assert.deepEqual([...entering.cognition.known_loops], ['x']);
assert.ok(M.move(entering, 'left'));
assert.deepEqual(entering.selfRecognized, ['y']);
assert.ok(M.move(entering, 'right'));
assert.equal(M.move(entering, 'down'), false);
assert.deepEqual(entering.selfRecognized, []);
assert.deepEqual([...M.createGame(world()).cognition.known_loops].sort(), ['x', 'y']);
console.log('PASS: bounded cardinal self-images, optical visibility, wall occlusion, local recognition, learning off, opt-in defaults and reset.');

const open = M.createGame(M.createTorusDemo({ selfVision: true, loopLearning: true, openRoom: true }));
assert.equal(open.cognition.self_images.length, 8);
assert.equal(open.cognition.self_images.filter(n => n.axis === null).length, 4);
for (const image of open.cognition.self_images) {
  assert.ok(image.distance <= 12);
  assert.ok(open.cognition.visible_positions.has(`C${image.x},${image.y}`));
}
const cornerWorld = { ...open.world, cells: open.world.cells.slice() };
cornerWorld.cells[1 * 8 + 2] = 0;
const corner = M.createGame(cornerWorld);
assert.ok(!corner.cognition.self_images.some(n => n.winding[0] === 1 && n.winding[1] === 1), 'supercover prevents corner peeking');
// A diagonal band winds in both coordinates but provides no pure-axis sightline.
const bandWorld = { ...open.world, cells: new Uint8Array(64) };
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ([0, 1, 7].includes((x - y + 8) % 8)) bandWorld.cells[y * 8 + x] = 1;
const band = M.createGame(bandWorld);
assert.equal(band.cognition.self_images.length, 2);
assert.ok(band.cognition.self_images.every(n => n.axis === null));
assert.equal(band.cognition.known_loops.size, 0, 'composite sight does not imply independent basic loops');
assert.deepEqual(band.selfRecognized, ['複合（横1・縦1）']);
assert.equal(band.cognition.compositeLoops.get('1,1').source, 'vision');
assert.deepEqual(M.cognitivePosition(band,9,9),M.cognitivePosition(band,1,1));
assert.notDeepEqual(M.cognitivePosition(band,9,1),M.cognitivePosition(band,1,1));
M.observe(band);assert.deepEqual(band.selfRecognized, [], 'do not replay recognition every observation');
const disabledBand=M.createGame({...bandWorld,loopLearning:false});
assert.equal(disabledBand.cognition.compositeLoops.size,0);
const demoBand=M.createGame(M.createTorusDemo({diagonalRoom:true,selfVision:true,loopLearning:true}));
assert.equal(demoBand.world.validation.topology.index,1);
assert.equal(demoBand.cognition.known_loops.size,0);
assert.equal(demoBand.cognition.compositeLoops.get('1,1').recognized,true);
// Rectangular periods: horizontal image in range, vertical/diagonal beyond it.
const rectangle = M.createGame({ ...open.world, width: 8, height: 12, cells: new Uint8Array(96).fill(1) });
assert.equal(rectangle.cognition.self_images.length, 4);
assert.ok(rectangle.cognition.self_images.every(n => n.axis));
console.log('PASS: diagonal periodic images, circular horizon, corner occlusion, mixed winding isolation and rectangular periods.');
