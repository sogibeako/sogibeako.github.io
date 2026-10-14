const a=require('node:assert/strict'),P=require('./exploration-solver.js'),C=require('./core.js'),J=require('./main-journey.js'),R=require('./rotation-bridge.js'),Session=require('./main-session.js');
let count=0,warps=0;const styles=new Set(),rotations=new Set();
for(const style of ['pair','oneway','cycle3','cycle4'])for(const rotation of ['none','right','left','half','mirror','mixed'])for(const truth of [false,true]){
 let g=Session.attach(J.start({seed:'auto-warp-'+style,algorithm:'dfs',width:25,height:23,warpMode:true,warpStyle:style,warpCount:3,warpInvisible:true},rotation));
 let path=P.main(g,C);const before=Session.encode(g,'same');a.deepEqual(P.main(g,C),path);a.equal(Session.encode(g,'same'),before);
 let replanned=false;
 while(path.length){const d=path.shift(),screen=P.screenDirection(g,d,truth,R,C);a.equal(R.input(g,screen,truth),d);a(Session.act(g,'move',R.input(g,screen,truth)));if(g.lastEvent==='warp'){warps++;styles.add(style);rotations.add(rotation);if(!replanned){g=Session.decode(Session.encode(g,'same')).game;path=P.main(g,C);replanned=true;}}}
 a.equal(g.player.world_position,g.world.exit);a(g.won);a.deepEqual(P.main(g,C),[]);a.equal(Session.decode(Session.encode(g,'same')).game.steps,g.steps);count++;
}
a(warps>0);a.equal(styles.size,4);a.equal(rotations.size,6);
for(const style of ['pair','oneway','cycle3','cycle4']){
 const g=Session.attach(J.start({seed:'auto-torus-'+style,algorithm:'dfs',width:24,height:26,topology:'torus',shiftX:4,shiftY:-2,warpMode:true,warpStyle:style,warpCount:2}));for(const d of P.main(g,C))a(Session.act(g,'move',d));a.equal(g.player.world_position,g.world.exit);count++;
}
console.log(count+' warp exit walks, '+warps+' traversed warps: directed/cyclic/invisible, all rotations, both views, resume after warp and saved replay passed.');
