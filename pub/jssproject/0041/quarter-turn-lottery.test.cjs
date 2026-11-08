const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),Save=require('./quarter-turn-save.js');
const base={mode:'quarterCCW',terrain:'maze',size:12,seed:'lottery',algorithm:'dfs',seamRoutes:2,seamDetour:true,boundaryLinks:true};
let seed=771;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),modes=new Set(),algorithms=new Set(),sizes=new Set(),families={doubleTwist:0,quarter:0,quarterTwist:0};
for(let i=0;i<600;i++){const p=Q.nextOptions(base,{space:true,algorithm:true,size:true},random);modes.add(p.mode);algorithms.add(p.algorithm);sizes.add(p.size);families[p.mode==='doubleTwist'?'doubleTwist':p.mode.startsWith('quarter')?'quarter':'quarterTwist']++;a.equal(p.seamRoutes,2);a(p.seamDetour&&p.boundaryLinks);}
a.equal(modes.size,5);a.equal(algorithms.size,10);a.equal(sizes.size,3);for(const n of Object.values(families))a(n>140&&n<260);
for(const flags of [{},{algorithm:true},{size:true},{space:true}]){const p=Q.nextOptions(base,flags,random);if(!flags.space)a.equal(p.mode,base.mode);if(!flags.algorithm)a.equal(p.algorithm,base.algorithm);if(!flags.size)a.equal(p.size,base.size);}
const fixed=Q.nextOptions({...base,terrain:'fixed'},{space:true,algorithm:true,size:true},random);a.equal(fixed.mode,base.mode);a.equal(fixed.algorithm,base.algorithm);a.equal(fixed.size,base.size);
const state=Q.create(base.mode,base.size,base.seed,base),settings={render:'hybrid',truth:false,continuous:true,autoMode:'explore',autoSpeed:'250',completed:0,totalSteps:0,lottery:{space:true,algorithm:true,size:false}};
const saved=Save.encode(base,[],state,settings);a.deepEqual(Save.decode(saved).settings.lottery,settings.lottery);const bad=JSON.parse(saved);bad.settings.lottery.size='yes';a.throws(()=>Save.decode(JSON.stringify(bad)));
console.log('600 draws: 3 balanced families, 5 connections, 10 algorithms, 3 sizes; independent OFF switches, fixed terrain, safety settings and save validation passed.');
