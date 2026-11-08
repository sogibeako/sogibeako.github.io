const a=require('node:assert/strict'),M=require('./quarter-turn-memory.js'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js');
let crossings=0,remembered=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const world=Q.topology(mode,12),state={world,id:13,frame:[0,1,2,3],x:0,y:0,steps:0,history:[]},m=M.create();
 for(let step=0;step<80;step++){
 const view=S.nearestView(state,6,null,true);M.observe(m,state,view);const before=JSON.stringify([...m.tiles]);
 const chart=M.compose(m,state,view);a.equal(JSON.stringify([...m.tiles]),before,'drawing never learns');
 for(const t of view){const shown=chart.find(c=>c.x===t.x&&c.y===t.y);a.equal(shown.id,t.id);a.equal(shown.remembered,false);}
 remembered+=chart.filter(t=>t.remembered).length;
 const oldX=state.x,oldY=state.y,d=step%17<12?1:0,truth=step%5===0,local=truth?state.frame.indexOf(d):d;
 a(S.move(state,d,truth));a.equal(state.x,oldX+S.directions[local][0]);a.equal(state.y,oldY+S.directions[local][1]);if(state.last.kind!=='normal')crossings++;
 }
 a(m.tiles.size>0);a(m.visited.size>1);
 const t={id:9,frame:[0,1,2,3],x:1,y:0,wall:false};M.observe(m,state,[t]);M.observe(m,state,[{...t,id:8,wall:true}]);a.equal(m.tiles.get((state.x+1)+','+state.y).id,8,'latest observation replaces old scenery');
 a.equal(M.create().tiles.size,0);
}
a(remembered>0);a(crossings>0);console.log('400 observations: read-only rendering, current-view priority, old scenery replacement, remembered tiles and true/subjective movement offsets passed; boundaries '+crossings);
