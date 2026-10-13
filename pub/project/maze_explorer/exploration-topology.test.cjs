const assert=require('node:assert/strict'),G=require('./exploration-generation.js'),B=require('./exploration-bundle.js'),J=require('./main-journey.js'),M=require('./core.js');
const setting={enabled:true,pool:['plane','torus']},base={topology:'plane',width:21,height:17,algorithm:'dfs',shiftX:2,shiftY:-2};
const seen=new Set();
for(let i=0;i<50;i++){
 const o=G.choose('main',base,false,'topology-'+i,undefined,undefined,setting);seen.add(o.topology);assert.equal(o.width,o.topology==='plane'?21:20);assert.equal(o.height,o.topology==='plane'?17:16);assert.equal(o.shiftX,2);assert.equal(o.shiftY,-2);assert.equal(o.algorithm,'dfs');assert.deepEqual(o,G.choose('main',base,false,'topology-'+i,undefined,undefined,setting));
}
assert.equal(seen.size,2);assert.equal(base.width,21);
assert.equal(G.choose('main',{...base,topology:'torus',width:20,height:16},false,'x',undefined,undefined,{enabled:true,pool:['plane']}).width,21);
for(const restricted of [{keyDoor:true},{warpMode:true}])assert.equal(G.choose('main',{...base,...restricted},true,'x',undefined,undefined,setting,'right').topology,'plane');
assert.equal(G.choose('main',{...base,algorithm:'division'},false,'x',undefined,undefined,setting).topology,'plane');
const sizes={enabled:true,widthMin:11,widthMax:11,heightMin:13,heightMax:13,periodMin:12,periodMax:24};assert.equal(G.choose('main',base,true,'x',undefined,sizes,setting).topology,'plane');
assert.throws(()=>G.choose('main',base,true,'x',undefined,sizes,{enabled:true,pool:['torus']}),/組合せ/);
assert.equal(G.choose('main',{...base,shiftX:40},true,'x',undefined,undefined,setting).topology,'plane');
assert.throws(()=>G.validateTopologies({enabled:true,pool:[]}));assert.throws(()=>G.validateTopologies({enabled:true,pool:['plane','plane']}));assert.throws(()=>G.validateTopologies({enabled:'yes',pool:['plane']}));
const c={enabled:true,completed:2,steps:9,topologies:setting};assert.deepEqual(B.unpack(B.encode('a','b','main',c)).course.topologies,setting);
assert.deepEqual(G.choose('skew',{periodSize:20,growth:'dfs'},false,'x',undefined,undefined,setting),{periodSize:20,growth:'dfs',seed:'x'});
assert.deepEqual(G.choose('main',base,false,'x'),{...base,seed:'x'});
let count=0;
for(const topology of setting.pool)for(const algorithm of G.candidates('main',{topology})){
 const o=G.choose('main',base,true,'actual-'+algorithm,{main:[algorithm],skew:['dfs']},{...sizes,widthMin:15,widthMax:23,heightMin:15,heightMax:21},{enabled:true,pool:[topology]});const g=J.start(o);assert.equal(g.world.topology||'plane',topology);assert(M.solvePuzzle(g.world).path.length>0);count++;
}
console.log(`${count} generated topology/algorithm combinations reach exits; fixed-size parity, compatible filtering, rule retention, bounds, determinism, old saves and saved selection passed.`);
