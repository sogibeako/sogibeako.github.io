const a=require('node:assert/strict'),G=require('./exploration-generation.js'),C=require('./core.js'),Course=require('./exploration-course.js'),R=require('./random-journey.js');
const base={width:21,height:17,topology:'plane',algorithm:'dfs',loops:0},rules={enabled:true,pool:['plain','keys','warp','birds']},types=new Set();
for(let i=0;i<100;i++){
 const o=G.choose('main',base,true,'rule-'+i,undefined,undefined,{enabled:true,pool:['plane','torus']},'right',undefined,rules),w=C.generate(o);
 const type=o.keyDoor?'keys':o.warpMode?'warp':o.birdMode?'birds':'plain';types.add(type);
 if(o.keyDoor){a.equal(o.topology,'plane');a(w.puzzle.locks.length);}
 if(o.warpMode)a(w.warps.size>0);
 if(o.birdMode){a.equal(o.loops,8);a(C.createGame(w).birds.length>0);}
}
a.equal(types.size,4);
a.throws(()=>G.choose('main',{...base,topology:'torus',width:20,height:16},false,'bad',undefined,undefined,undefined,'none',undefined,{enabled:true,pool:['keys']}),/組合せ/);
a.equal(G.choose('main',{...base,loops:20},false,'birds',undefined,undefined,undefined,'none',undefined,{enabled:true,pool:['birds']}).loops,20);
a.deepEqual(G.choose('main',base,false,'off',undefined,undefined,undefined,'none',undefined,{...rules,enabled:false}),{...base,seed:'off'});
a.deepEqual(Course.validate({enabled:true,completed:0,steps:0,rules}).rules,rules);
for(const rule of ['birds','bird-keys']){const o=R.choose('birds',{...R.defaults,topologies:['plane'],rules:[rule]}).options;a.equal(o.loops,8);C.generate(o);}
console.log('100 compatible random mazes, all four rules present; birds loop floor, OFF preservation, incompatible pool rejection and course settings round trip passed.');
