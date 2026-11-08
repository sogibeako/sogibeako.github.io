const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),M=require('./quarter-turn-memory.js');
const D=[[0,-1],[1,0],[0,1],[-1,0]],frames=[1,-1].flatMap(sign=>[0,1,2,3].map(rot=>[0,1,2,3].map(d=>(sign*d+rot+4)%4)));let checked=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const world=Q.topology(mode,12);
 for(const id of [0,11,132,143,5,60,71,137,65]){
  const base={world,id,frame:[0,1,2,3]};
  for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){
   const expected=M.traceCompleted(base,x,y);
   for(const frame of frames){const right=D[frame[1]],down=D[frame[2]],actual=M.traceCompleted({...base,frame},x*right[0]+y*right[1],x*down[0]+y*down[1]);
    a.equal(actual.id,expected.id,`${mode} ${id} ${x},${y} ${frame}`);a.equal(actual.seams,expected.seams);
    a.deepEqual([0,1,2,3].map(d=>actual.frame[frame.indexOf(d)]),expected.frame);checked++;
   }
  }
 }
 const state={world,id:65,frame:[0,1,2,3]},before=M.traceCompleted(state,8,7);world.cells.fill(0);const after=M.traceCompleted(state,8,7);a.equal(before.id,after.id);a.deepEqual(before.frame,after.frame);
}
console.log({checked,allEdgesAndCorners:true,rotationsAndReflections:true,terrainIndependent:true});
