const a=require('node:assert/strict'),C=require('./core.js'),J=require('./main-journey.js'),P=require('./exploration-solver.js'),Session=require('./main-session.js');
let arrows=0,archives=0,matched=0;
for(const style of ['pair','oneway','cycle3','cycle4'])for(const rotation of ['none','right','mirror']){
 const g=Session.attach(J.start({seed:'notes-'+style,width:15,height:13,algorithm:'dfs',warpMode:true,warpCount:2,warpStyle:style,warpInvisible:true,separateMaps:true},rotation));
 const seen=new Set([g.player.world_position]);let n=0;
 while(true){if(g.won)Session.act(g,'continue');P.warpNotes(g,C,Session.act);P.birdNotes(g,C,Session.act);const path=P.main(g,C,seen)??P.mainMapPlan(g,C);if(path===null)break;for(const d of path){if(g.won)Session.act(g,'continue');P.birdNotes(g,C,Session.act);a(Session.act(g,'move',d));seen.add(g.player.world_position);if(g.lastTransition.kind==='warp'){seen.add(g.lastTransition.from);P.warpNotes(g,C,Session.act);a(g.zeroMarks.has(g.lastTransition.from)||g.markers.has(g.lastTransition.from));a(g.zeroMarks.has(g.lastTransition.to)||g.markers.has(g.lastTransition.to));}a(++n<5000);}}
 P.warpNotes(g,C,Session.act);
 for(const arrow of g.warpArrows||[]){a.equal(arrow.status,'confirmed');a.equal(g.world.warps.get(arrow.from),arrow.to);}arrows+=g.warpArrows?.length||0;
 const info=C.inspectRecordedMatching(g);archives+=info.reasons.length;matched+=info.reasons.filter(r=>r==='matched').length;
 const restored=Session.decode(Session.encode(g,'same')).game;a.deepEqual(restored.warpArrows,g.warpArrows);a.deepEqual(restored.zeroMarks,g.zeroMarks);
}
a(arrows>0);console.log({cases:12,arrows,archives,matched});
