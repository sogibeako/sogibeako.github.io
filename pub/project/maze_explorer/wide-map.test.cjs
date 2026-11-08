const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),M=require('./quarter-turn-memory.js');
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const world=Q.topology(mode,16),s={world,id:17,frame:[0,1,2,3],x:0,y:0},m=M.create();
 m.tiles.set('24,0',{id:18,x:24,y:0,frame:[0,1,2,3],wall:false});
 a(!M.compose(m,s,[]).some(t=>t.x===24));a(M.compose(m,s,[],28).some(t=>t.x===24));
 const before=structuredClone(m);M.compose(m,s,[],28);a.deepEqual(m,before);
 m.complete=true;const wide=M.compose(m,s,[],28);a(wide.some(t=>t.x===28));a(wide.some(t=>t.x===-28));
}
console.log('Five connection modes: wide remembered/completed projection reaches both edges without learning unseen tiles.');
