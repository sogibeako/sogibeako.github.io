const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const underpassShape of ['straight','mixed','corners']){
 const state=S.create('doubleMaze',{seed:'save-'+underpassShape,wallStyle:'grid',growth:'prim',holeRimWalls:true,dimensions:[[20,20],[24,18]],holeSize:3,floorUnderpasses:3,underpassShape}),snapshot={state,journey:{number:4,steps:321},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{doubleRandomNext:{checked:true,value:'on'}}};
 for(let n=0;n<70;n++){S.observeWalkingMap(state,snapshot.walkingBook);S.observeJourneyMap(state,snapshot.journeyMap);S.observeRegions(state,snapshot.regionBook);S.observeAtlas(state,snapshot.atlasMemory);const ds=[0,1,2,3].filter(d=>state.world.edges.has(`${state.id}:${state.frame[d]}`));S.move(state,ds[n%ds.length]);}
 const text=S.encodeSave(snapshot),restored=S.decodeSave(text).snapshot;assert.deepEqual(restored,snapshot);
 for(let n=0;n<20;n++){const ds=[0,1,2,3].filter(d=>state.world.edges.has(`${state.id}:${state.frame[d]}`)),d=ds[n%ds.length];assert.equal(S.move(restored.state,d),S.move(state,d));assert.deepEqual(S.nearestView(restored.state),S.nearestView(state));}
 assert.throws(()=>S.decodeSave(text.replace('"version":1','"version":999')));assert.throws(()=>S.decodeSave('{bad'));
 const bad={...snapshot,state:{...state,id:-1}};assert.throws(()=>S.decodeSave(S.encodeSave(bad)));
}
console.log('Three underpass shapes: exact save roundtrip for world/player/maps/counters, identical continuation and invalid-save rejection passed.');
