const a=require('node:assert/strict'),M=require('./core.js'),P=require('./exploration-solver.js'),L=require('./lattice-holes.js'),S=require('./connection-space.js'),A=require('./sheet-annotations.js');
let cases=0;
for(const topology of ['plane','torus'])for(const warpStyle of ['pair','oneway','cycle3','cycle4'])for(const warpInvisible of [false,true]){
 const g=M.createGame(M.generate({width:24+(topology==='plane'?1:0),height:20+(topology==='plane'?1:0),topology,algorithm:'rooms',seed:'close-'+cases,warpMode:true,warpCount:4,warpStyle,warpInvisible})),seen=new Set();
 for(let steps=0;steps<10000;steps++){
  seen.add(g.player.world_position);if(g.lastTransition?.kind==='warp'){seen.add(g.lastTransition.from);M.recordObservedWarp(g);}
  const path=P.mainExplore(g,M,seen);if(path===null)break;a(path.length,'must leave a known landing to verify its outgoing edge');if(g.won)M.continueExploring(g);M.move(g,path[0]);a(steps<9999,'exploration terminates');
 }
 a.equal(P.mainWarpPending(g).size,0,topology+' '+warpStyle);cases++;
}
for(const wallStyle of ['dense','grid']){
 const s=L.create({maze:true,growth:'rooms',periodSize:16,wallStyle,seed:'sheet-close',features:{warp:true}}),seen=new Set();
 for(let steps=0;steps<10000;steps++){seen.add(s.id);if(s.features.last?.kind==='warp'){seen.add(s.features.last.from);A.recordWarp(s);}const path=P.connectedExplore(s,seen);if(path===null)break;a(path.length);a(S.move(s,path[0],true));a(steps<9999);}
 a.equal(P.connectedWarpPending(s).size,0);cases++;
}
console.log(cases+' worlds: all directed warp connections witnessed and confirmed, including invisible / one-way / cycles and two sheets');
