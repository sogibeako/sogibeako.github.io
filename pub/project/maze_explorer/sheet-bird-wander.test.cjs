const assert=require('node:assert/strict'),S=require('./connection-space.js'),F=require('./sheet-features.js');
function run(mode){
 const s=S.create(mode,{seed:'wander-regression',width:24,height:20,growth:'dfs',guaranteeLoops:true,floorUnderpasses:2,underpassShape:'mixed'}),w=s.world;
 w.domain=new Set(w.cells.keys());F.install(s,{birds:true,birdWander:true,birdAcross:true});
 const trail=[],visited=new Set();let seams=0;
 for(let i=0;i<400;i++){
  const f=s.features,from=f.bird,previous=f.birdMind?.previous;
  const visible=new Set(S.nearestView({...s,id:from,frame:[0,1,2,3]},6).filter(p=>!p.wall).map(p=>p.id));
  s.id=[...w.cells.keys()].find(id=>w.cells[id]&&!visible.has(id)&&id!==w.exit);assert.notEqual(s.id,undefined);
  const choices=Array.from({length:4},(_,d)=>w.edges.get(from+':'+d)).filter(e=>e&&w.cells[e.to]&&e.to!==w.exit);
  s.steps+=2;F.afterMove(s);assert.equal(f.birdMind.mode,'WANDER');assert(choices.some(e=>e.to===f.bird));
  if(choices.some(e=>e.to!==previous))assert.notEqual(f.bird,previous,'do not immediately reverse when another route exists');
  const a=S.position(w,from),b=S.position(w,f.bird);if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)>2)seams++;
  visited.add(f.bird);trail.push(f.bird);
 }
 assert(visited.size>25,'wander explores many cells');assert(seams>0,'wander crosses periodic/reflected boundaries');
 // A visible target is pursued, then its last position is searched after loss.
 const f=s.features,seen=S.nearestView({...s,id:f.bird,frame:[0,1,2,3]},6);
 s.id=seen.find(p=>!p.wall&&p.id!==w.exit&&p.distance>=3)?.id;assert.notEqual(s.id,undefined);
 s.steps+=2;F.afterMove(s);assert.equal(f.birdMind.mode,'CHASE');const target=s.id;assert.equal(f.birdMind.lastSeen,target);
 const visible=new Set(S.nearestView({...s,id:f.bird,frame:[0,1,2,3]},6).filter(p=>!p.wall).map(p=>p.id));
 s.id=[...w.cells.keys()].find(id=>w.cells[id]&&!visible.has(id)&&id!==w.exit);s.steps+=2;F.afterMove(s);
 assert.equal(f.birdMind.mode,'SEARCH');assert.equal(f.birdMind.lastSeen,target);
 console.log(mode,visited.size,'visited',seams,'boundary passages');return trail;
}
for(const mode of ['torusMaze','kleinMaze'])assert.deepEqual(run(mode),run(mode),'deterministic replay');
