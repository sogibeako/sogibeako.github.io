const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('./exploration-generation.js'),Q=require('./quarter-turn-maze.js'),S=require('./quarter-turn-save.js'),C=require('./exploration-course.js');
const generators={...G.validatePools(),quarter:['rooms']},course={randomGeneration:true,generators};
a.deepEqual(C.validate({enabled:true,completed:0,steps:0,order:'sequence',pool:['quarter'],...course}).generators.quarter,['rooms']);
for(const quarter of [[],['bogus'],['dfs','dfs']])a.throws(()=>G.validatePools({...generators,quarter}));
a.deepEqual(G.candidates('quarter',{}),Q.algorithms);
const options={mode:'quarterCCW',terrain:'maze',size:12,algorithm:'legacy',boundaryLinks:true,floorUnderpasses:0};
for(let i=0;i<40;i++){const result=G.chooseQuarter(options,'seed'+i,course);a.equal(result.algorithm,'rooms');a.deepEqual(result,G.chooseQuarter(options,'seed'+i,course));}
a.equal(G.chooseQuarter(options,'fixed',{...course,randomGeneration:false}).algorithm,'legacy');
a(Q.algorithms.includes(G.chooseQuarter(options,'old',{randomGeneration:true}).algorithm));
const sizes={...G.validateSizes(),enabled:true,widthMin:16,widthMax:20,heightMin:20,heightMax:24};a.equal(G.chooseQuarter(options,'size',{sizes}).size,20);
a.throws(()=>G.chooseQuarter(options,'none',{sizes:{...sizes,widthMax:18}}));
const source=fs.readFileSync(__dirname+'/quarter-turn-lab.js','utf8'),snippet=source.slice(source.indexOf('function courseFresh('),source.indexOf('window.QuarterExplorationAdapter='));
const c={Math,applied:options,ExplorationGeneration:G,QuarterTurnMaze:Q,QuarterTurnSave:S,displaySettings:()=>({render:'hybrid',truth:false,continuous:true,autoMode:'explore',autoSpeed:'20'})};vm.runInNewContext(snippet,c);
for(const family of ['doubleTwist','quarter','quarterTwist']){const save=c.courseFresh(family,'course-rooms',course),restored=S.decode(save);a.equal(restored.options.algorithm,'rooms');a.equal(restored.options.size,12);}
console.log('Quarter course: selected pools, old defaults, fixed mode, size intersection, all three native saves passed');

// Style choices must intersect generator choices, not silently replace them.
for(let i=0;i<60;i++){
 const seed='style'+i,all={randomGeneration:true,generators:{...generators,quarter:G.candidates('quarter',{})}};
 a.equal(G.chooseQuarter(options,seed,{...all,styles:{enabled:true,pool:['dense']}}).algorithm,'legacy');
 a.notEqual(G.chooseQuarter(options,seed,{...all,styles:{enabled:true,pool:['grid']}}).algorithm,'legacy');
}
a.equal(G.chooseQuarter(options,'fixed-style',{styles:{enabled:true,pool:['dense']}}).algorithm,'legacy');
a.throws(()=>G.chooseQuarter(options,'conflict',{...course,styles:{enabled:true,pool:['dense']}}),/候補が一致/);
a.throws(()=>G.chooseQuarter(options,'fixed-conflict',{styles:{enabled:true,pool:['grid']}}),/候補が一致/);
a.equal(G.chooseQuarter({...options,algorithm:'rooms'},'rooms',{styles:{enabled:true,pool:['grid']}}).algorithm,'rooms');
a.throws(()=>G.chooseQuarter(options,'bad-style',{styles:{enabled:true,pool:[]}}));
console.log('Quarter styles: 120 seeded intersections, fixed choices and incompatible-pool rejection passed');

const underCourse={enabled:true,completed:0,steps:0,order:'sequence',pool:['quarter'],randomQuarterUnderpasses:true};
a.equal(C.validate(underCourse).randomQuarterUnderpasses,true);
a.throws(()=>C.validate({...underCourse,randomQuarterUnderpasses:'yes'}));
const counts=new Set(),shapes=new Set();
for(let i=0;i<100;i++){const r=G.chooseQuarter(options,'under'+i,underCourse);counts.add(r.floorUnderpasses);shapes.add(r.underpassShape);a(r.floorUnderpasses>=0&&r.floorUnderpasses<=4);a.deepEqual(r,G.chooseQuarter(options,'under'+i,underCourse));}
a.equal(counts.size,5);a.equal(shapes.size,3);
const fixed={...options,floorUnderpasses:6,underpassShape:'corners'};a.equal(G.chooseQuarter(fixed,'off',{}).floorUnderpasses,6);a.equal(G.chooseQuarter(fixed,'off',{}).underpassShape,'corners');
for(const family of ['doubleTwist','quarter','quarterTwist']){const save=c.courseFresh(family,'under-native',underCourse),restored=S.decode(save),expected=G.chooseQuarter(options,'under-native',underCourse);a.equal(restored.options.floorUnderpasses,expected.floorUnderpasses);a.equal(restored.options.underpassShape,expected.underpassShape);}
console.log('Underpass lottery: all counts/shapes, reproducibility, fixed preservation and three native replays passed');

for(const family of ['doubleTwist','quarter','quarterTwist']){const text=c.courseFresh(family,'course-birds',{...course,rules:{enabled:true,pool:['birds']}}),loaded=S.decode(text);a.equal(loaded.options.ruleMode,'birds');a(loaded.state.features.options.birds);}
console.log('All three course families draw bird rules and retain them through native saves.');
