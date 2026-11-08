const assert=require('node:assert/strict'),S=require('./connection-space.js'),G=require('./exploration-generation.js');
const base={growth:'wilson',wallStyle:'grid',dimensions:[[20,20],[24,20],[20,20]],holeSize:3,holeRimWalls:true,floorUnderpasses:2,underpassShape:'mixed',returnShape:'irregular'};
for(const tripleRoute of ['chain','return'])for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]]){
 const options={...base,tripleRoute,shiftX,shiftY,seed:`wilson-${tripleRoute}-${shiftX}-${shiftY}`},state=S.create('tripleMaze',options),again=S.create('tripleMaze',options);
 assert.deepEqual(state.world.cells,again.world.cells);assert.deepEqual(state.world.edges,again.world.edges);
 for(const {horizontal,vertical} of state.world.guaranteedLoops)for(const loop of [horizontal,vertical]){let id=loop.start;for(const d of loop.directions){assert(state.world.cells[id]);const edge=state.world.edges.get(`${id}:${d}`);assert(edge);id=edge.to;}assert.equal(id,loop.start);}
 const saved=S.encodeSave({state,journey:{number:1,steps:0},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{}}),restored=S.decodeSave(saved).snapshot.state;
 assert.equal(restored.world.growth,'wilson');assert.deepEqual(restored.world.cells,state.world.cells);assert.deepEqual(restored.world.edges,state.world.edges);
}
assert.throws(()=>S.create('tripleMaze',{...base,wallStyle:'dense'}),/格子状/);
assert.throws(()=>G.chooseTriple(base,'incompatible',{randomGeneration:true,generators:{...G.validatePools(),triple:['wilson']},styles:{enabled:true,pool:['dense']}}),/壁配置/);
const picked=G.chooseTriple(base,'compatible',{randomGeneration:true,generators:{...G.validatePools(),triple:['wilson']},styles:{enabled:true,pool:['dense','grid']}});assert.equal(picked.wallStyle,'grid');assert.equal(picked.growth,'wilson');
console.log('Wilson: eight layouts preserve six loops, deterministic terrain/edges and saved worlds; incompatible wall styles rejected or filtered.');
