const a=require('node:assert/strict'),B=require('./branch-maze.js'),Save=require('./branch-save.js');
const results=new Map();
for(const ruleMode of ['random','randomPeaceful']){
 const seen=new Set();for(let i=0;i<64;i++){
  const options={size:8,sheets:2,route:'normal',pillar:'small',direction:'both',algorithm:'prim',wallStyle:'grid',underpasses:2,underpassShape:'mixed',density:.45,seed:'random-rules-'+i,ruleMode},s=B.create(options);seen.add(s.world.ruleMode);
  const fixed=B.create({...options,ruleMode:s.world.ruleMode});a.deepEqual(s.world.cells,fixed.world.cells);a.deepEqual(s.features,fixed.features);
  const data=Save.pack(options,[],s,{truth:false,render:'hybrid',speed:10,policy:'explore'},{completed:0,totalSteps:0,stageCleared:false}),restored=Save.restore(data);a.equal(restored.options.ruleMode,ruleMode);a.equal(restored.state.world.ruleMode,s.world.ruleMode);a.deepEqual(restored.state.features,s.features);
  if(ruleMode==='randomPeaceful')a(!s.features?.options.birds);
 }a.equal(seen.size,ruleMode==='random'?8:4);results.set(ruleMode,[...seen]);
}
console.log('128 seeds: all 8 / peaceful 4 variants, deterministic generation, unchanged geometry and save restoration passed.');
