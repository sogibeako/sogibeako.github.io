const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js'),C=require('./main-checkpoint.js');
let g=J.start({width:9,height:9,algorithm:'dfs',seed:'history-0'});
for(let i=0;i<25;i++){
 for(const d of M.solvePuzzle(g.world).path)M.move(g,d);assert(g.won);const clear=g.steps;
 if(i===0){M.continueExploring(g);const d=Object.keys(M.DIRS).find(d=>M.ruleTransition(g.world,g.player,d));M.move(g,d);const back={up:'down',down:'up',left:'right',right:'left'};M.move(g,back[d]);}
 const before=JSON.stringify(g.journey);const n=J.next(g,'history-'+(i+1),'same');assert.equal(JSON.stringify(g.journey),before);
 const h=n.journey.history.at(-1);assert.equal(h.number,i+1);assert.equal(h.seed,'history-'+i);assert.equal(h.clearSteps,clear);assert.equal(h.steps,g.steps);assert.equal(n.journey.history.length,Math.min(i+1,20));
 g=S.attach(n);S.act(g,'wait');if(i===3){g.journey.size='small';g.journey.layout='rooms';}
 const text=S.encode(g,'same');g=S.decode(text).game;assert.equal(S.encode(g,'same'),text);assert.deepEqual(C.decode(C.encode(g,'same')).game.journey,g.journey);assert.deepEqual(J.restart(g).journey,g.journey);
}
assert.equal(g.journey.history[0].number,6);assert.equal(g.journey.history.at(-1).number,25);assert(!J.begin(g,'fresh','same').journey.history);
for(const mutate of [d=>d.journey.history.push(d.journey.history[0]),d=>d.journey.history[0].clearSteps=1e9,d=>d.journey.history[0].number=999,d=>d.journey.history[0].rule='bad']){const d=JSON.parse(C.encode(g,'same'));mutate(d);assert.throws(()=>C.decode(JSON.stringify(d)));}
console.log('PASS: 25 walked mazes, first-clear versus extended steps, latest 20, non-mutation, session/entrance replay, preferences added after history, restart/new journey and malformed history.');
