const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
const make=()=>S.attach(J.start({seed:'first-walk',width:9,height:9,algorithm:'dfs',warpMode:true}));
const g=make(),ids=[...new Set([...g.cognition.memory_nodes.values()].filter(n=>n.terrain).map(n=>n.world_id))],a=ids[0],b=ids[1];assert.notEqual(a,b);
const act=(kind,...args)=>S.act(g,kind,...args),edge=()=>g.warpArrows?.find(e=>e.from===a&&e.to===b);
const replay=()=>{const text=S.encode(g,'same'),restored=S.decode(text).game;assert.equal(S.encode(restored,'same'),text);assert.deepEqual(S.arrowHistoryInfo(restored),S.arrowHistoryInfo(g));return restored;};
assert.equal(act('undoArrow'),false);assert(act('arrow',a,b));assert(act('curveArrow',a,b,1));assert(act('resetArrowCurve',a,b));assert(act('eraseArrow',a,b));assert.equal(edge(),undefined);
assert(act('undoArrow'));assert(edge());assert(!Object.hasOwn(edge(),'curve'));
assert(act('undoArrow'));assert.equal(edge().curve,1);assert(act('undoArrow'));assert(!Object.hasOwn(edge(),'curve'));
assert(act('undoArrow'));assert.equal(edge(),undefined);assert.equal(act('undoArrow'),false);replay();
for(let i=0;i<4;i++)assert(act('redoArrow'));assert.equal(edge(),undefined);assert.equal(act('redoArrow'),false);replay();
assert(act('undoArrow'));const restored=replay();assert(S.act(restored,'redoArrow'));assert.equal(restored.warpArrows.length,0);
assert(act('curveArrow',a,b,-0.8));assert.equal(S.arrowHistoryInfo(g).redo,0);assert.equal(act('redoArrow'),false);replay();
assert(act('undoArrow'));const pending=S.arrowHistoryInfo(g).redo;assert(act('arrow',a,b));assert.equal(S.arrowHistoryInfo(g).redo,pending);assert.equal(act('arrow',a,a),false);assert.equal(S.arrowHistoryInfo(g).redo,pending);
const beforePosition=g.player.world_position;act('wait');assert.equal(S.arrowHistoryInfo(g).redo,pending);assert(act('redoArrow'));assert.equal(g.player.world_position,beforePosition);replay();
assert.deepEqual(S.arrowHistoryInfo(make()),{undo:0,redo:0});
// Observations acquired after curve editing survive undo/redo; removal retains them for restoration.
edge().status='confirmed';assert(act('undoArrow'));assert.equal(edge().status,'confirmed');assert(act('redoArrow'));assert.equal(edge().status,'confirmed');
assert(act('eraseArrow',a,b));assert.equal(M.knownWarpAnchor(g,{world_id:a}),null);assert(act('undoArrow'));assert.equal(edge().status,'confirmed');assert(M.knownWarpAnchor(g,{world_id:a}));assert(act('redoArrow'));assert.equal(edge(),undefined);
console.log('PASS: undo/redo addition, deletion, curve/reset; stack replay, branch clearing, no-op preservation, movement isolation, observation preservation, evidence withdrawal/restoration, new game isolation.');

const reverseGame=make();S.act(reverseGame,'arrow',a,b);S.act(reverseGame,'curveArrow',a,b,0.6);S.act(reverseGame,'arrow',b,a);
assert.equal(reverseGame.warpArrows[1].status,'hypothesis');assert(!Object.hasOwn(reverseGame.warpArrows[1],'curve'));assert.equal(reverseGame.warpArrows[0].curve,0.6);
const reverseSave=S.encode(reverseGame,'same');assert.equal(S.encode(S.decode(reverseSave).game,'same'),reverseSave);
S.act(reverseGame,'undoArrow');assert.equal(reverseGame.warpArrows.length,1);assert.equal(reverseGame.warpArrows[0].from,a);S.act(reverseGame,'redoArrow');assert.equal(reverseGame.warpArrows[1].from,b);
console.log('PASS: reverse prediction is independent, preserves forward curve, replays and undoes/redoes as one addition.');
