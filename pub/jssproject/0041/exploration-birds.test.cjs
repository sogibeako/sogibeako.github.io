const a=require('node:assert/strict'),C=require('./core.js'),J=require('./main-journey.js'),P=require('./exploration-solver.js'),Session=require('./main-session.js');
let clears=0,transfers=0,marks=0;
for(const explore of [false,true])for(let i=0;i<4;i++){
 const g=Session.attach(J.start({seed:'auto-bird-'+i,width:15,height:13,algorithm:'dfs',loops:8,birdMode:true,birdCount:i%2+1,keyDoor:i%2===1,keyCount:1,separateMaps:true}));
 const seen=new Set([g.player.world_position]),targets=P.mainTargets(g,C);let done=false;
 for(let turn=0;turn<2000;turn++){
  if(g.won&&explore)Session.act(g,'continue');P.birdNotes(g,C,Session.act);
  const before=g.turns;let path=explore?P.main(g,C,seen):null;const finishing=!explore||path===null;if(finishing)path=P.main(g,C);
  a.equal(g.turns,before);
  if(finishing&&g.player.world_position===g.world.exit){done=true;break;}
  a(path.length);a(Session.act(g,'move',path[0]));seen.add(g.player.world_position);if(g.lastTransition.kind==='teleport'){transfers++;seen.add(g.lastTransition.from);}
 }
 if(done){clears++;if(explore)a.deepEqual(seen,targets);}marks+=g.markers.size;
 a(g.markers.size<=9);a.equal(Session.decode(Session.encode(g,'same')).game.steps,g.steps);
}
a(clears>0);a(marks>0);a(transfers>0);
console.log({cases:8,clears,transfers,marks});
