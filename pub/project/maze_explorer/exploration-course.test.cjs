const assert=require('node:assert/strict'),C=require('./exploration-course.js'),B=require('./exploration-bundle.js');
const base={enabled:true,completed:2,steps:20,order:'random',pool:['main','skew']},before=structuredClone(base);
for(const current of ['main','skew'])for(const [r,expected]of [[0,'main'],[.499,'main'],[.5,'skew'],[.999,'skew']]){
 const next=C.advance(base,current,{exit:true,steps:8},()=>r);assert.equal(next.mode,expected);assert.equal(next.course.completed,3);assert.equal(next.course.steps,28);
}
for(const allowed of ['main','skew'])for(const current of ['main','skew'])assert.equal(C.advance({...base,pool:[allowed]},current,{exit:true,steps:5},()=>.999).mode,allowed);
assert.deepEqual(base,before);assert.throws(()=>C.validate({...base,pool:[]}));assert.throws(()=>C.validate({...base,pool:['main','main']}));assert.throws(()=>C.validate({...base,pool:['other']}));assert.throws(()=>C.advance(base,'main',{exit:false,steps:8}));assert.throws(()=>C.advance(base,'main',{exit:true,steps:8},()=>1));
const restored=B.unpack(B.encode('main-save','skew-save','main',{...base,pool:['skew']}));assert.deepEqual(restored.course,{...base,pool:['skew'],randomGeneration:false});
const old=C.validate({enabled:true,completed:1,steps:5});assert.equal(old.order,'alternate');assert.equal(C.advance(old,'main',{exit:true,steps:3}).mode,'skew');
console.log('Random course: both interval boundaries, single-choice pools, same-space repeats, counters, immutable inputs, invalid pools and save compatibility passed.');

for(const [mode,next] of [['main','skew'],['skew','enclosure'],['enclosure','main']])assert.equal(C.advance({...base,order:'cycle'},mode,{exit:true,steps:1}).mode,next);
for(const [r,next] of [[0,'main'],[.34,'skew'],[.99,'enclosure']])assert.equal(C.advance({...base,pool:['main','skew','enclosure']},'enclosure',{exit:true,steps:2},()=>r).mode,next);
