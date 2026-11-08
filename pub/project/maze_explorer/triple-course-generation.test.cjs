const assert=require('node:assert/strict'),G=require('./exploration-generation.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');
const base={dimensions:[[20,20],[24,20],[20,20]],holeSize:4,holePlacement:'center',holeRimWalls:true,holeApproach:'screened',growth:'prim',wallStyle:'grid',floorUnderpasses:2,underpassShape:'mixed',loopStyle:'meander',shiftX:2,shiftY:-2,returnShape:'irregular'};
const sizes={...G.validateSizes(),enabled:true,widthMin:16,widthMax:24,heightMin:16,heightMax:24};
let count=0;
for(const tripleRoute of ['chain','return'])for(const type of ['none','x','y','both'])for(const growth of G.candidates('triple',{}))for(const style of ['dense','grid']){
 if(['kruskal','wilson'].includes(growth)&&style==='dense')continue;
 const options={...base,tripleRoute},before=structuredClone(options),course={randomGeneration:true,generators:{...G.validatePools(),triple:[growth]},styles:{enabled:true,pool:[style]},sizes,shifts:{enabled:true,pool:[type]}};
 const seed='triple-course-'+count,r=G.chooseTriple(options,seed,course);assert.deepEqual(r,G.chooseTriple(options,seed,course));assert.deepEqual(options,before);
 assert.equal(r.growth,growth);assert.equal(r.wallStyle,style);assert.equal(!!r.shiftX,['x','both'].includes(type));assert.equal(!!r.shiftY,['y','both'].includes(type));assert.equal(r.tripleRoute,tripleRoute);
 const state=S.create('tripleMaze',r),targets=P.targets(state),visited=new Set([state.id]);
 while(visited.size<targets.size){const path=P.route(state,id=>!visited.has(id));assert(path?.length,'all floors reachable');for(const d of path){assert(S.move(state,d));visited.add(state.id);}}
 const exit=P.route(state,id=>id===state.world.exit);assert(exit);for(const d of exit)assert(S.move(state,d));assert.equal(state.id,state.world.exit);count++;
}
assert.deepEqual(G.chooseTriple(base,'fixed',{}),{...base,seed:'fixed'});
assert.throws(()=>G.chooseTriple({...base,tripleRoute:'return'},'bad',{sizes:{...sizes,widthMax:18}}),/サイズ候補/);
assert.throws(()=>G.validatePools({...G.validatePools(),triple:[]}),/3トーラス/);
assert.throws(()=>G.chooseTriple({...base,dimensions:[[19,20],[24,20],[20,20]]},'odd',{styles:{enabled:true,pool:['grid']}}),/偶数/);
console.log(count+' shared-course triple mazes: deterministic choices, constrained sizes, both layouts, all shifts, all generators/styles, every floor and exit reachable.');

const C=require('./exploration-course.js');
const variation={randomTripleHole:true,randomTripleUnderpasses:true,randomRimWalls:true,sizes,shifts:{enabled:true,pool:['both']}};
const holes=new Set(),shapes=new Set(),counts=new Set(),rims=new Set();
for(const tripleRoute of ['chain','return'])for(let i=0;i<16;i++){
 const r=G.chooseTriple({...base,tripleRoute},'variation-'+i,variation);
 assert.deepEqual(r,G.chooseTriple({...base,tripleRoute},'variation-'+i,variation));
 if(tripleRoute==='return'){assert(r.holeSize>=3);assert.equal(r.holePlacement,'center');}
 holes.add(r.holeSize);shapes.add(r.underpassShape);counts.add(r.floorUnderpasses);rims.add(r.holeRimWalls);
 const state=S.create('tripleMaze',r),seen=new Set([state.id]);
 while(seen.size<P.targets(state).size){const path=P.route(state,id=>!seen.has(id));assert(path?.length);for(const d of path){assert(S.move(state,d));seen.add(state.id);}}
 assert(P.route(state,id=>id===state.world.exit));
}
for(let i=0;i<100;i++){const r=G.chooseTriple(base,'coverage-'+i,variation);counts.add(r.floorUnderpasses);}
assert.equal(holes.size,4);assert.equal(shapes.size,3);assert.equal(counts.size,5);assert.equal(rims.size,2);
const fixed=G.chooseTriple(base,'off',{rules:{enabled:false,pool:['plain']},randomTripleHole:false,randomTripleUnderpasses:false,randomRimWalls:false,order:'random'});assert.deepEqual(fixed,{...base,seed:'off'});
const c=C.validate({enabled:true,completed:0,steps:0,order:'sequence',pool:['triple'],randomTripleHole:true,randomTripleUnderpasses:true});assert.equal(C.validate(JSON.parse(JSON.stringify(c))).randomTripleHole,true);assert.equal(C.advance(c,'triple',{steps:1,exit:true}).course.randomTripleUnderpasses,true);
assert.throws(()=>C.validate({...c,randomTripleHole:1}),/抽選設定/);
console.log('32 randomized holes/underpasses: all floors and exit reachable, return layout retained, full value variety, OFF preservation and saved course validation passed.');

const A=require('./sheet-route-analysis.js'),routeCounts={chain:0,return:0};
for(let i=0;i<24;i++){
 const settings={...variation,randomTripleRoute:true},r=G.chooseTriple(base,'routes-'+i,settings);
 assert.deepEqual(r,G.chooseTriple(base,'routes-'+i,settings));routeCounts[r.tripleRoute]++;
 const a=A.analyze(S.create('tripleMaze',r).world);assert(a.allConnected&&a.exitReachable);
 if(r.tripleRoute==='return'){assert(a.returnRequired);assert.deepEqual(a.requiredForExit,[1,2]);let next=0;for(const sheet of a.sheetRoute)if(sheet===[0,1,2,1,0][next])next++;assert.equal(next,5);assert.equal(a.sheetRoute.at(-1),0);}
 else {assert.equal(a.sheetRoute[0],0);assert.equal(a.sheetRoute.at(-1),2);assert(a.sheetRoute.includes(1));}
}
assert(routeCounts.chain>0&&routeCounts.return>0);
for(let i=0;i<20;i++)for(const constraint of [{holeSize:2},{holePlacement:'offset'},{dimensions:[[12,12],[20,12],[12,12]]}]){
 const r=G.chooseTriple({...base,...constraint},'fixed-route-'+i,{randomTripleRoute:true});assert.equal(r.tripleRoute,'chain');for(const [k,v]of Object.entries(constraint))assert.deepEqual(r[k],v);
}
assert.equal(G.chooseTriple({...base,tripleRoute:'return'},'keep-route',{randomTripleRoute:false}).tripleRoute,'return');
const routeSave=C.validate({...c,randomTripleRoute:true});assert(C.validate(JSON.parse(JSON.stringify(routeSave))).randomTripleRoute);assert.throws(()=>C.validate({...c,randomTripleRoute:'true'}),/抽選設定/);
assert.throws(()=>G.chooseTriple(base,'no-size',{randomTripleRoute:true,sizes:{...sizes,widthMin:8,widthMax:8,heightMin:8,heightMax:8}}),/サイズ候補/);
console.log('24 mixed-route mazes: both layouts, required A-B-C-B-A detour, fixed constraints, determinism and save validation passed.');

for(const dimensions of [[[8,8],[12,8],[8,8]],[[12,12],[20,12],[12,12]],[[23,23],[24,24],[17,19]]])for(const growth of G.candidates('triple',{})){
 const source={...base,dimensions,holeSize:1,holePlacement:'offset',tripleRoute:'chain',growth};
 const r=G.chooseTriple(source,'forced-'+growth,{forceTripleReturn:true,randomTripleRoute:true,randomTripleHole:true,sizes:{...sizes,widthMin:8,widthMax:12,heightMin:8,heightMax:12}});
 assert.equal(r.tripleRoute,'return');assert.equal(r.holePlacement,'center');assert(r.holeSize>=3);assert(r.dimensions.every(d=>d.every(n=>n>=16&&n<=24&&n%2===0)));assert(r.dimensions[1][0]>r.dimensions[1][1]);
 const a=A.analyze(S.create('tripleMaze',r).world);assert(a.allConnected&&a.exitReachable&&a.returnRequired);assert.deepEqual(a.requiredForExit,[1,2]);
 assert.deepEqual(source.dimensions,dimensions);assert.equal(source.holeSize,1);
}
const forceSave=C.validate({...c,forceTripleReturn:true});assert(C.validate(JSON.parse(JSON.stringify(forceSave))).forceTripleReturn);assert.throws(()=>C.validate({...c,forceTripleReturn:1}),/抽選設定/);
console.log('All generators / three size presets, forced return layouts: small/odd/tall sheets corrected, random/fixed conflicts overridden, all floors connected and B/C detour required.');
