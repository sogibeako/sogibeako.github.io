const a=require('node:assert/strict'),G=require('./exploration-generation.js'),B=require('./branch-maze.js');
const base={size:20,sheets:3,route:'return',pillar:'grown',direction:'left',algorithm:'dfs',wallStyle:'dense',underpasses:2,underpassShape:'mixed',density:.45,seed:'old',ruleMode:'randomPeaceful'};
const sizes={...G.validateSizes(),enabled:true,widthMin:8,widthMax:20,heightMin:8,heightMax:20},pools={...G.validatePools(),branch:['prim','growing']},course={randomGeneration:true,generators:pools,sizes,styles:{enabled:true,pool:['grid']}};
const foundSizes=new Set(),foundAlgorithms=new Set();for(let i=0;i<24;i++){const next=G.chooseBranch(base,'branch-shared-'+i,course);a.deepEqual(next,G.chooseBranch(base,next.seed,course));a.equal(next.wallStyle,'grid');a([12,16,20].includes(next.size));a(pools.branch.includes(next.algorithm));a.equal(next.ruleMode,base.ruleMode);a.equal(next.direction,'left');a.equal(next.underpasses,2);B.create(next);foundSizes.add(next.size);foundAlgorithms.add(next.algorithm);}
a.equal(foundSizes.size,3);a.equal(foundAlgorithms.size,2);a.equal(base.seed,'old');a.equal(base.wallStyle,'dense');
a.deepEqual(G.chooseBranch(base,'fixed',{}),{...base,seed:'fixed'});
a.throws(()=>G.chooseBranch(base,'bad',{sizes:{...sizes,widthMin:8,widthMax:8,heightMin:8,heightMax:8}}),/12/);
a.throws(()=>G.chooseBranch(base,'bad',{sizes:{...sizes,widthMin:16,widthMax:20,heightMin:8,heightMax:12}}),/正方形/);
a.throws(()=>G.validatePools({...pools,branch:[]}),/分枝/);
a.deepEqual(G.validatePools(pools).branch,['prim','growing']);a.equal(G.validatePools().branch,undefined);
console.log('24 generated mazes: supported pools, shared style/size, return minimum, deterministic selection, unchanged options, impossible ranges and legacy pools passed.');

for(const mode of ['plain','keys','warp','birds']){
 const next=G.chooseBranch(base,'rule-'+mode,{rules:{enabled:true,pool:[mode]}});
 a.equal(next.ruleMode,mode);a.deepEqual(next,G.chooseBranch(base,next.seed,{rules:{enabled:true,pool:[mode]}}));
}
a.equal(G.chooseBranch(base,'off',{order:'random',rules:{enabled:false,pool:['birds']}}).ruleMode,base.ruleMode);
const modes=new Set(Array.from({length:64},(_,i)=>G.chooseBranch(base,'rules-'+i,{order:'random'}).ruleMode));
a.deepEqual([...modes].sort(),['birds','keys','plain','warp']);
a.throws(()=>G.chooseBranch(base,'invalid',{rules:{enabled:true,pool:[]}}));
a.equal(base.ruleMode,'randomPeaceful');
console.log('Branch shared rule pools, random-course fallback, disabled preservation and deterministic selection passed.');
