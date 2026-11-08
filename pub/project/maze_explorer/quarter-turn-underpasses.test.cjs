const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),M=require('./quarter-turn-memory.js'),Auto=require('./quarter-turn-auto.js'),Save=require('./quarter-turn-save.js');
let placed=0,walks=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])for(const shape of ['straight','corners','mixed']){
 const options={mode,terrain:'maze',size:20,seed:'test',algorithm:'prim',floorUnderpasses:2,underpassShape:shape,seamRoutes:2,seamDetour:true,boundaryLinks:true},s=Q.create(mode,20,'test',options),memory=M.create(),moves=[];
 const observe=()=>M.observe(memory,s,S.nearestView(s,6,null,true));observe();
 placed+=s.world.passages?.length||0;
 for(const c of s.world.passages||[])for(const id of [c.horizontal,c.vertical]){
  a.equal([0,1,2,3].filter(d=>s.world.edges.has(id+':'+d)).length,2);
  for(const frame of [[0,1,2,3],[1,2,3,0],[0,3,2,1]])a.ok(S.underpassSymbol(s.world,id,frame));
 }
 for(let n=0;n<15000;n++){const next=Auto.next(s,memory.visited);if(next.done){a(!next.blocked);break;}const d=s.frame.indexOf(next.direction);a(Q.move(s,d));moves.push(d);observe();}
 a.equal(memory.visited.size,s.world.cells.reduce((a,b)=>a+b,0));a.equal(s.id,s.world.exit);a(memory.complete);walks+=moves.length;
 for(const c of s.world.passages||[])for(const id of [c.horizontal,c.vertical]){
  const here={...s,id,frame:[1,2,3,0]};const view=M.compose(memory,here,[]);
  a.equal(view.find(t=>t.x===0&&t.y===0).id,id);
  for(let d=0;d<4;d++)if(!s.world.edges.has(id+':'+here.frame[d])){const [x,y]=S.directions[d];a(view.find(t=>t.x===x&&t.y===y)?.wall,'forbidden turn stays a wall on completed map');}
 }
 const settings={render:'hybrid',truth:false,continuous:true,autoMode:'explore',autoSpeed:'20',completed:0,totalSteps:0};
 const restored=Save.decode(Save.encode(options,moves,s,settings));a.deepEqual(restored.state,s);a.deepEqual(restored.memory,memory);
}
a(placed>0);console.log({placed,walks,cases:15,fullExploration:true,completedWalls:true,replay:true});
