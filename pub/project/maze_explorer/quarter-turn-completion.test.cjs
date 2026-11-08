const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),M=require('./quarter-turn-memory.js'),A=require('./quarter-turn-auto.js'),Save=require('./quarter-turn-save.js');
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const options={mode,size:12,seed:'completion',terrain:'maze',boundaryLinks:false},state=Q.create(mode,12,options.seed),memory=M.create(),moves=[];
 const observe=()=>M.observe(memory,state,S.nearestView(state,6,null,true));observe();a.equal(memory.complete,false);
 for(let i=0;i<5000;i++){
  const plan=A.next(state,memory.visited,'explore');if(plan.done)break;
  const d=state.frame.indexOf(plan.direction);a(S.move(state,d));moves.push(d);observe();
 }
 a(memory.complete);a.equal(memory.seen.size,state.world.cells.reduce((a,b)=>a+b,0));
 const before=JSON.stringify([state.id,state.frame,state.x,state.y,[...memory.tiles],[...memory.seen]]);
 const view=S.nearestView(state,6,null,true),chart=M.compose(memory,state,view);
 a.equal(chart.length,441);a(chart.some(t=>t.revealed&&t.wall));
 for(const t of view){const c=chart.find(c=>c.x===t.x&&c.y===t.y);a.equal(c.id,t.id);a.equal(c.wall,t.wall);a.equal(c.remembered,false);}
 a(chart.filter(t=>t.revealed).every(t=>t.remembered));
 a.equal(JSON.stringify([state.id,state.frame,state.x,state.y,[...memory.tiles],[...memory.seen]]),before);
 const settings={render:'hybrid',truth:false,continuous:false,autoMode:'explore',autoSpeed:'250',completed:0,totalSteps:0};
 const restored=Save.decode(Save.encode(options,moves,state,settings));a(restored.memory.complete);a.deepEqual(restored.memory.seen,memory.seen);
 a.equal(M.create().complete,false);
}
console.log('5 modes: full sight completion, 441 projected cells, current-view priority, no state mutation, replay restoration and fresh reset passed.');
