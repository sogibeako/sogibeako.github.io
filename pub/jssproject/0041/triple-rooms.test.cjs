const assert=require('node:assert/strict'),S=require('./connection-space.js'),A=require('./sheet-route-analysis.js');
let cases=0;
for(const wallStyle of ['dense','grid'])for(const tripleRoute of ['chain','return'])for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]]){
 const options={growth:'rooms',wallStyle,tripleRoute,returnShape:'irregular',dimensions:[[20,20],[24,20],[20,20]],holeSize:3,holeRimWalls:true,holeApproach:'screened',floorUnderpasses:0,shiftX,shiftY,seed:'rooms-'+cases};
 const state=S.create('tripleMaze',options),world=state.world;
 assert(world.rooms.length>0,'room areas must actually be present');
 for(const b of world.rooms){
  const l=world.layouts[b.sheet];
  for(let y=b.top;y<b.top+b.height;y++)for(let x=b.left;x<b.left+b.width;x++){
   const id=l.offset+y*l.width+x;assert(world.cells[id]&&world.domain.has(id)&&!world.holes.has(id));
   if(x+1<b.left+b.width)assert.equal(world.edges.get(`${id}:1`)?.to,id+1);
   if(y+1<b.top+b.height)assert.equal(world.edges.get(`${id}:2`)?.to,id+l.width);
  }
 }
 const analysis=A.analyze(world);assert(analysis.allConnected&&analysis.exitReachable);if(tripleRoute==='return'){assert(analysis.returnRequired);assert.deepEqual(analysis.requiredForExit,[1,2]);}
 const again=S.create('tripleMaze',options);assert.deepEqual(world.cells,again.world.cells);assert.deepEqual(world.rooms,again.world.rooms);
 const restored=S.decodeSave(S.encodeSave({state,journey:{number:1,steps:0},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{}})).snapshot.state;
 assert.deepEqual(restored.world.cells,world.cells);assert.deepEqual(restored.world.rooms,world.rooms);cases++;
}
console.log(cases+' room layouts: open rectangular interiors, connected corridors, required sheet detours, deterministic generation and save restoration passed.');
