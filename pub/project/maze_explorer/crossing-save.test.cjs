const assert=require('node:assert/strict'),S=require('./connection-space.js'),C=require('./crossing-save.js'),P=require('./crossing-autowalk.js');
for(const growth of ['dfs','prim','growing','hunt','kruskal','frontier'])for(const wallStyle of ['dense','grid']){
 const state=S.create('crossingMaze',{seed:'save-'+growth,width:16,height:18,growth,wallStyle,stairPlacement:'random',floorUnderpasses:2,underpassShape:'mixed'}),atlas=new Set(),book={charts:[],active:-1},seen=new Set([state.id]);
 const observe=()=>{S.observeAtlas(state,atlas);S.observeWalkingMap(state,book,S.nearestView(state,4,{}));};observe();
 while(seen.size<P.targets(state).size){for(const d of P.route(state,id=>!seen.has(id))){assert(S.move(state,d));seen.add(state.id);observe();}}
 const journey={number:4,steps:1234},display={truth:true,render:'hybrid'},text=C.snapshot(state,journey,display),restored=C.prepare(text);
 assert.equal(C.snapshot(restored.state,restored.journey,restored.display),text);assert.deepEqual(restored.walkingBook,book);assert.deepEqual(restored.atlasMemory,atlas);assert.deepEqual(restored.visited,seen);assert.deepEqual(restored.state,state);
 for(const d of P.route(restored.state,id=>id===restored.state.world.exit))assert(S.move(restored.state,d));assert.equal(restored.state.id,restored.state.world.exit);
 for(const mutate of [d=>d.version=8,d=>d.options.width=100000,d=>d.moves.push(5),d=>d.journey.steps=-1,d=>d.display.render='bad']){const bad=JSON.parse(text);mutate(bad);assert.throws(()=>C.prepare(JSON.stringify(bad)));assert.equal(C.snapshot(state,journey,display),text);}
}
const blocked=S.create('crossingMaze',{seed:'blocked',width:16,height:16});const d=[0,1,2,3].find(d=>!blocked.world.edges.has(blocked.id+':'+d));if(d!==undefined){const data=JSON.parse(C.snapshot(blocked,{number:1,steps:0},{truth:false,render:'tiles'}));data.moves=[d];assert.throws(()=>C.prepare(JSON.stringify(data)));}
console.log('12 crossing saves: exact maps, both floors, underpasses, visits, counters, display, continued movement and invalid-data isolation passed.');
