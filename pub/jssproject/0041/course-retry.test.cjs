const assert=require('node:assert/strict'),C=require('./exploration-course.js'),G=require('./exploration-generation.js');
(async()=>{
const course={enabled:true,completed:2,steps:20,order:'random',pool:['biaxial','quarter']},before=JSON.stringify(course);let tries=0;
const result=await C.prepareNext(course,'main',{exit:true,steps:100},n=>{tries++;if(n.mode==='biaxial')throw Error('bad candidate');return 'ready';},()=>tries?0.9:0);
assert.equal(result.attempts,2);assert.equal(result.fresh,'ready');assert.equal(result.next.mode,'quarter');assert.equal(result.next.course.completed,3);assert.equal(result.next.course.steps,120);assert.equal(JSON.stringify(course),before);
tries=0;await assert.rejects(C.prepareNext(course,'main',{exit:true,steps:100},()=>{tries++;throw Error('bad');}),/24/);assert.equal(tries,24);assert.equal(JSON.stringify(course),before);
const skipped=await C.prepareNext(course,'main',{exit:false,steps:100},()=>true,()=>0,true);assert.equal(skipped.next.course.completed,2);
for(const terrain of ['dfs','rooms','atelier-prim'])for(const style of ['dense','grid']){
 const o=G.chooseBiaxial({mode:'free',size:'30,18',terrain,sx:'0',sy:'-2'},'journey-rasbvzxg',{randomGeneration:false,styles:{enabled:true,pool:[style]}});
 assert.equal(o.terrain.startsWith('atelier-'),style==='grid');
}
console.log('Candidate retry, bounded failure, immutable counters, skip and generator/style compatibility passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
