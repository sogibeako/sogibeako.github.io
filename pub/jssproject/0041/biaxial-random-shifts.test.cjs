const assert=require('node:assert/strict'),G=require('./exploration-generation.js'),K=require('./klein-biaxial.js');
const base={mode:'free',size:'24,20',terrain:'atelier-prim',sx:'3',sy:'1',ruleMode:'plain'},kinds=new Set(),pairs=new Set();
for(let i=0;i<100;i++){
 const seed='free-random-shift-'+i,course={order:'random',shifts:{enabled:false,pool:['none']}};
 const o=G.chooseBiaxial(base,seed,course);assert.deepEqual(o,G.chooseBiaxial(base,seed,course));
 kinds.add(o.sx==='0'?(o.sy==='0'?'none':'y'):(o.sy==='0'?'x':'both'));pairs.add(o.sx+','+o.sy);
 assert([-4,-2,0,2,4].includes(Number(o.sx)));assert([-4,-2,0,2,4].includes(Number(o.sy)));
 const w=K.create('free',Number(o.sx),Number(o.sy),{width:24,height:20});assert(w);
 const fixed=G.chooseBiaxial(base,seed,{order:'sequence',shifts:{enabled:false,pool:['none']}});assert.equal(fixed.sx,'3');assert.equal(fixed.sy,'1');
 const onlyY=G.chooseBiaxial(base,seed,{order:'random',shifts:{enabled:true,pool:['y']}});assert.equal(onlyY.sx,'0');assert.notEqual(onlyY.sy,'0');
}
assert.equal(kinds.size,4);assert(pairs.size>10);assert.equal(base.sx,'3');console.log('100 seeds: random free shifts, four categories, legal connection construction, seed repeatability, explicit pool and sequence preservation passed.');
