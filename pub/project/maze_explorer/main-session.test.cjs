const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
for(const algorithm of ['dfs','prim','division','rooms','eller','wilson','kruskal','hunt','growing']){
 const g=S.attach(J.start({width:21,height:17,algorithm,seed:'session-'+algorithm}));g.journey={completed:3,steps:222};
 const path=M.solvePuzzle(g.world).path;
 S.act(g,'move','up');S.act(g,'wait');
 // Return to a fresh entrance so the solution path is applicable after testing a blocked move.
 const fresh=S.attach(J.restart(g));
 for(const [i,d]of path.entries()){
  S.act(fresh,'move',d);
  if(i===2){const result=S.act(fresh,'mark');if(result.label)S.act(fresh,'name',result.label,'分岐の目印');S.act(fresh,'wait');}
  if(i===Math.floor(path.length/2)){
   const before=snap(fresh),save=S.encode(fresh,'keys'),r=S.decode(save);assert.equal(snap(fresh),before);
   assert.deepEqual(r.game.player,fresh.player);assert.equal(snap(r.game.cognition),snap(fresh.cognition));assert.equal(snap(r.game.markers),snap(fresh.markers));assert.equal(snap(r.game.markerNames),snap(fresh.markerNames));assert.equal(r.game.steps,fresh.steps);assert.equal(r.game.turns,fresh.turns);assert.deepEqual(r.game.journey,fresh.journey);
   assert.equal(S.encode(r.game,'keys'),save);
  }
 }
 assert(fresh.won);assert(S.decode(S.encode(fresh,'same')).game.won);
 S.act(fresh,'continue');S.act(fresh,'wait');const r=S.decode(S.encode(fresh,'birds'));assert(r.game.exploringAfterExit);assert.equal(r.game.firstClearSteps,fresh.firstClearSteps);assert.equal(r.game.turns,fresh.turns);
 const corrupt=JSON.parse(S.encode(fresh,'same'));corrupt.actions.pop();assert.throws(()=>S.decode(JSON.stringify(corrupt)));
 corrupt.actions=[['bad']];assert.throws(()=>S.decode(JSON.stringify(corrupt)));
}
for(const options of [{warpMode:true},{birdMode:true}]){const g=J.start({width:21,height:17,seed:'unsupported',...options});assert(!S.supported(g));assert.throws(()=>S.encode(g,'same'));}
assert.throws(()=>S.decode('null'));assert.throws(()=>S.decode('x'.repeat(2000001)));
console.log('PASS: 9 generators with mid-route/exit/post-exit replay, markers, names, waits, exact memory and progress; unsupported/corrupt input rejected.');
