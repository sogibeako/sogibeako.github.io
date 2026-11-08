const assert=require('node:assert/strict'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');
let cases=0,screenedWalls=0,openWalls=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const holeSize of [2,3])for(let seed=0;seed<3;seed++){
 const options={growth,wallStyle,holeSize,seed:'screened-'+seed,holePlacement:'offset',holeRimWalls:true,dimensions:[[16,12],[24,16],[12,16]],floorUnderpasses:2,underpassShape:'mixed',loopStyle:'meander'};
 const s=S.create('tripleMaze',{...options,holeApproach:'screened'}),w=s.world;
 const ordinary=S.create('tripleMaze',options).world;
 screenedWalls+=w.holeRimWallCount;openWalls+=ordinary.holeRimWallCount;
 assert.deepEqual(w.cells,S.create('tripleMaze',{...options,holeApproach:'screened'}).world.cells);
 const visited=new Set([s.id]),queue=[s.id];
 for(let i=0;i<queue.length;i++)for(let d=0;d<4;d++){
  const e=w.edges.get(`${queue[i]}:${d}`);
  if(e&&w.cells[e.to]&&!visited.has(e.to)){visited.add(e.to);queue.push(e.to);}
 }
 assert.equal(visited.size,P.targets(s).size,'all remaining floors must connect');
 assert(visited.has(w.exit));assert.equal(new Set(queue.map(id=>S.groundSheet(w,id))).size,3);
 for(const loop of w.guaranteedLoops)for(const [axis,path] of [['horizontal',loop.horizontal],['vertical',loop.vertical]]){
  let id=path.start,x=0,y=0;
  for(const d of path.directions){
   const e=w.edges.get(`${id}:${d}`);assert(e);assert(w.cells[e.to]);id=e.to;
   x+=[0,1,0,-1][d];y+=[-1,0,1,0][d];
  }
  assert.equal(id,path.start);
  assert.equal(x,axis==='horizontal'?w.layouts[loop.sheet].width:0);
  assert.equal(y,axis==='vertical'?w.layouts[loop.sheet].height:0);
 }
 const withoutWalls={...options,holeRimWalls:false};
 assert.deepEqual(S.create('tripleMaze',{...withoutWalls,holeApproach:'screened'}).world.cells,S.create('tripleMaze',withoutWalls).world.cells);
 cases++;
}
assert(screenedWalls>openWalls,'screening should add more obstacles around holes across seeds');
console.log(`${cases} screened triple tori: connected floors/exit, all six winding circuits, deterministic generation and rim OFF verified; removed nearby floors ${openWalls} → ${screenedWalls}.`);
