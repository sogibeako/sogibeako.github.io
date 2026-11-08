const assert=require('node:assert/strict'),O=require('./orientation.js'),M=require('./core.js'),S=require('./orientation-save.js');
let transfers=0;
for(const mode of ['right','mirror','half']){
 let s=O.create(mode),rng=M.random('long-run-'+mode);
 for(let i=1;i<=1200;i++){
  const dirs=Object.keys(M.DIRS).filter(d=>M.transition(s.game.world,s.game.player,O.input(s,d)));
  assert(O.move(s,dirs[Math.floor(rng()*dirs.length)]));
  if(i%75===0){O.placeMarker(s);O.matchAll(s);}
  if(i%400===0){
   const before=S.encode(s);O.inspectAll(s);assert.equal(S.encode(s),before);
   const restored=S.decode(before);assert.equal(S.encode(restored),before);s=restored;
  }
 }
 assert.equal(s.game.steps,1200);assert(s.crossings>0);transfers+=s.crossings;
}
console.log(`PASS: 3 long explorations, 3600 moves, ${transfers} transfers, repeated matching and 9 exact save/restores.`);
