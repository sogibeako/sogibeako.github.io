const a=require('node:assert/strict'),B=require('./branch-maze.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),L=require('./branch-learning.js'),M=require('./branch-memory.js'),Save=require('./branch-save.js');
let crossings=0,leaps=0,completed=0;
for(const sheets of [2,3])for(const ruleMode of ['warpBirds','warpAll']){
 const options={size:12,sheets,ruleMode,route:'return',pillar:'grown',direction:'both',algorithm:'prim',wallStyle:'grid',underpasses:2,underpassShape:'mixed',density:.45,seed:'bird-branch-'+sheets+ruleMode},s=B.create(options),known=new Set([s.id]),memory=new Map(),moves=[];L.init(s);M.observe(s,memory);
 for(let i=0;i<4000;i++){
  B.autoMark(s);const exploration=B.explore(s,known),path=B.detour(s)??exploration??P.route(s,id=>id===s.world.exit);if(!path?.length){if(s.id===s.world.exit){a.equal(P.warpPending(s).length,0);a.equal(known.size,P.targets(s).size);completed++;}break;}
  const from=s.id,bird=s.features.bird,laps=L.init(s).laps,remembered=memory.size,d=path[0],wd=s.frame[d];a(S.move(s,d));moves.push(d);L.moved(s,from,wd);B.afterMove(s,known,memory);known.add(s.id);M.observe(s,memory);a(memory.size>=remembered);
  if(Math.floor(bird/144)%sheets!==Math.floor(s.features.bird/144)%sheets)crossings++;
  if(s.last.kind==='teleport'){leaps++;a.equal(L.init(s).laps,laps);}
  a(s.world.cells[s.features.bird]);a.notEqual(s.features.bird,s.world.exit);a(s.features.hasKey||s.features.bird!==s.features.door);
 }
 const restored=Save.restore(Save.pack(options,moves,s,{truth:false,render:'hybrid',speed:10,policy:'explore'},{completed:0,totalSteps:moves.length,stageCleared:false}));a.equal(restored.state.id,s.id);a.deepEqual(restored.state.features,s.features);a.deepEqual(restored.memory,memory);a.equal(restored.state.branchLearning.laps,s.branchLearning.laps);
 a.notEqual(B.glyph(s,s.features.bird,false),'V'); // unseen birds are not exposed
}
a(crossings>0);a(leaps>0);console.log(`4 bird configurations: ${crossings} sheet transfers, ${leaps} player leaps, ${completed} completed searches; legal movement, persistent memory/learning, hidden birds, deterministic saves passed.`);

a.equal(completed,4);


// A warp and a bird collision in one move retain both visited warp endpoints.
const f={world:{branchMaze:true,cells:[1,1,1,1,1],edges:new Map([['0:1',{to:1,kind:'normal',transform:[0,1,2,3]}],['1:3',{to:0,kind:'normal',transform:[0,1,2,3]}],['2:1',{to:3,kind:'normal',transform:[0,1,2,3]}],['3:3',{to:2,kind:'normal',transform:[0,1,2,3]}]]),exit:4,seed:'collision'},id:0,frame:[0,1,2,3],steps:0,x:0,y:0,history:[],features:{options:{keys:false,warp:true,birds:true},key:null,door:null,hasKey:false,warps:new Map([[1,2],[2,1]]),bird:2,cooldown:0,marks:new Map(),last:null}};
a(S.move(f,1));a.equal(f.last.kind,'teleport');const seen=new Set(),memory=new Map();B.afterMove(f,seen,memory);a.deepEqual(f.features.warpTraversed,[1]);a(seen.has(1)&&seen.has(2));a(memory.has(1)&&memory.has(2));
console.log('Same-turn warp and bird collision preserves warp direction and both endpoints.');
