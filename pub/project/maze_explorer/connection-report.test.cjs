const a=require('node:assert/strict'),M=require('./exploration-metrics.js'),S=require('./connection-space.js'),Q=require('./quarter-turn-maze.js'),B=require('./branch-maze.js'),L=require('./lattice-holes.js');
const cases=[S.create('crossingMaze',{width:16,height:16,seed:'console-check'}),S.create('tripleMaze',{width:20,height:20,seed:'console-check'}),B.create({size:20,seed:'console-check'}),L.create({maze:true,periodSize:20,seed:'console-check'})];
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])cases.push(Q.create(mode,16,'console-check'));
for(const s of cases){const before=structuredClone(s),report=M.connectionReport(s.world);a(report);a.match(report,/出口へ到達可能/);a.equal(M.connectionReport(s.world),report);a.deepEqual(s,before);}
const world={cells:[1,1,1],start:0,exit:2,edges:new Map([['0:1',{to:1}]])};a.match(M.connectionReport(world),/2 \/ 3床.*出口への地形経路なし/);a.equal(M.connectionReport({}),null);
console.log(cases.length+' generated worlds: structural exit reachability, read-only cached report, disconnected and unavailable data passed.');
