const assert=require('node:assert/strict'),G=require('./exploration-generation.js'),C=require('./exploration-course.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');
const base={width:16,height:16,growth:'dfs',wallStyle:'dense',floorUnderpasses:2,underpassShape:'mixed',stairPlacement:'random',newestBias:70};
assert.deepEqual(G.chooseCrossing(base,'new',{}),{...base,seed:'new'});
for(const growth of G.candidates('crossing',{}))for(const style of ['dense','grid']){
 const course={randomGeneration:true,generators:{main:['dfs'],skew:['dfs'],crossing:[growth]},styles:{enabled:true,pool:[style]},sizes:{enabled:true,widthMin:16,widthMax:20,heightMin:16,heightMax:20,periodMin:16,periodMax:24}};
 const o=G.chooseCrossing(base,'test',course);assert.deepEqual(o,G.chooseCrossing(base,'test',course));assert.equal(o.growth,growth);assert.equal(o.wallStyle,style);assert.equal(o.floorUnderpasses,2);assert.equal(o.stairPlacement,'random');
 const state=S.create('crossingMaze',o),seen=new Set([state.id]);while(seen.size<P.targets(state).size){const path=P.route(state,id=>!seen.has(id));assert(path?.length);for(const d of path){assert(S.move(state,d));seen.add(state.id);}}for(const d of P.route(state,id=>id===state.world.exit))assert(S.move(state,d));
}
assert.throws(()=>G.chooseCrossing(base,'bad',{sizes:{enabled:true,widthMin:41,widthMax:50,heightMin:16,heightMax:16,periodMin:16,periodMax:24}}));assert.throws(()=>G.validatePools({main:['dfs'],skew:['dfs'],crossing:[]}));
const c={enabled:true,completed:0,steps:0,order:'sequence',pool:['plane','crossing']};assert.equal(C.advance(c,'main',{steps:2,exit:true,topology:'plane'}).mode,'crossing');assert.equal(C.advance(c,'crossing',{steps:3,exit:true}).mode,'main');assert.equal(C.advance({...c,order:'random',pool:['crossing']},'crossing',{steps:3,exit:false},()=>0,true).course.completed,0);
console.log('Crossing random generation: 12 style/algorithm combinations fully connected, deterministic sizes, preserved underpasses/stairs, invalid ranges and sequence/random/skip passed.');
