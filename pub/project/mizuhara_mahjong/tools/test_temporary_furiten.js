const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const names = ["markRonPass", "clearTemporaryFuritenOnDraw", "isFuriten", "canWinNow", "skipPendingWin", "drawIntoHand", "drawRinshanIntoHand"];
const code = names.map(name => {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, end < 0 ? undefined : end);
}).join("\n");
const tile = { id: 1, suit: "s", value: 2 };
const ctx = {
  state: {}, players: Array.from({ length: 4 }, () => ({ name: "test" })),
  isRonWin: win => win.type === "ロン", canWinIgnoringFuriten: () => true,
  keyOf: t => `${t.suit}${t.value}`, allPrototypeTiles: () => [tile],
  label: () => "tile", addLog() {}, render() {}, discardDrawnAfterRiichi() {}, recordOracleDraw() {},
  continueAfterRonSkip() {}, continueAddedKanRobCheck() {}, nextOpenUnitOrder: () => 1
};
vm.createContext(ctx);
vm.runInContext(code, ctx);
function reset() {
  ctx.state = {
    riichi: [false, false, false, false], temporaryFuriten: [false, false, false, false],
    riichiFuriten: [false, false, false, false], rivers: [[], [], [], []],
    hands: [[], [], [], []], flowers: [[], [], [], []], wall: [tile]
  };
}
const ron = { type: "ロン", player: 0, tile, discarder: 1 };
reset();
ctx.state.pendingWin = ron;
ctx.skipPendingWin();
assert.equal(ctx.canWinNow(0, ron), false);
assert.equal(ctx.canWinNow(0, { ...ron, type: "ツモ" }), true);
ctx.drawIntoHand(1);
assert.equal(ctx.canWinNow(0, ron), false, "opponent draw must not clear furiten");
ctx.drawIntoHand(0);
assert.equal(ctx.canWinNow(0, ron), false, "empty wall is not a draw");
ctx.state.wall.push(tile);
ctx.drawIntoHand(0);
assert.equal(ctx.canWinNow(0, ron), true);
reset();
ctx.state.riichi[0] = true;
ctx.state.pendingWin = ron;
ctx.skipPendingWin();
ctx.drawIntoHand(0);
assert.equal(ctx.canWinNow(0, ron), false, "riichi pass survives draw");
reset();
ctx.state.pendingWin = { ...ron, chankan: true };
ctx.state.pendingAddedKan = {};
ctx.skipPendingWin();
assert.equal(ctx.canWinNow(0, ron), false, "chankan pass counts");
ctx.state.deadWall = { rinshan: [tile], tiles: [tile], replenished: [] };
ctx.drawRinshanIntoHand(0);
assert.equal(ctx.canWinNow(0, ron), true, "rinshan is a draw");
reset();
ctx.state.pendingWin = { ...ron, type: "ツモ" };
ctx.skipPendingWin();
assert.equal(ctx.state.temporaryFuriten[0], false);
ctx.state.rivers[0].push(tile);
assert.equal(ctx.canWinNow(0, ron), false, "discard furiten still applies");
reset();
assert.equal(ctx.canWinNow(0, ron), true, "new round clears pass flags");
console.log("Temporary furiten lifecycle tests passed.");
