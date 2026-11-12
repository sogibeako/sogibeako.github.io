const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../ai_core.js"), "utf8"), sandbox);
const ai = sandbox.window.MizuharaAI;
const tiles = (codes) => codes.split(" ").map((code, id) => ({ suit: code[0], value: Number(code.slice(1)), id }));
const hand = tiles("m2 m3 m4 p2 p3 p4 s2 s3 s4 z5 z5 m8 p8 s8");
const context = {
  playerIndex: 3, hand, remainingTiles: hand.slice(0, -1), discardedTile: hand.at(-1),
  settings: {}, oracleEnabled: false, useLearning: false,
  state: { players: [25000, 25000, 25000, 25000].map(score => ({ score })), melds: [[], [], [], []], rivers: [[], [], [], []], wall: Array(60), dora: [] }
};
const normal = ai.scoreDiscard(context);
const behind = ai.scoreDiscard({ ...context, state: { ...context.state, players: [40000, 25000, 25000, 10000].map(score => ({ score })) } });
assert.equal(normal.strategy.comeback, 0);
assert.equal(behind.strategy.comeback, 1);
assert.ok(behind.weights.highValueRoute > normal.weights.highValueRoute);
assert.ok(behind.weights.fastTenpai < normal.weights.fastTenpai);
assert.equal(behind.weights.dealInRisk, normal.weights.dealInRisk);
const flushHand = tiles("m1 m2 m3 m4 m5 m6 m7 m8 m9 m9 z5 z5 p8 p9");
const flushContext = { ...context, hand: flushHand, remainingTiles: flushHand.slice(0, -1), discardedTile: flushHand.at(-1) };
const flush = ai.scoreDiscard(flushContext);
assert.equal(flush.strategy.flushCommitment, 1);
assert.ok(flush.weights.keepsFlushSuit > normal.weights.keepsFlushSuit);
const blocked = ai.scoreDiscard({ ...flushContext, state: { ...context.state, melds: [[], [], [], [{ tiles: tiles("p2 p3 p4") }]] } });
assert.equal(blocked.strategy.flushCommitment, 0);
const openFlush = ai.scoreDiscard({ ...context, hand: tiles("m1 m2 m3 m4 m5 m6 m7 z5 z5 p8 p9"), state: { ...context.state, melds: [[], [], [], [{ tiles: tiles("m8 m8 m8") }]] } });
assert.equal(openFlush.strategy.flushCommitment, 1);
assert.equal(ai.scoreDiscard({ ...context, playerIndex: 0 }).strategy, null);
assert.equal(ai.scoreDiscard(context).weights.highValueRoute, normal.weights.highValueRoute);
console.log("Mayoi strategy: score deficit, flush, incompatible melds, own melds, defense and isolation passed.");
