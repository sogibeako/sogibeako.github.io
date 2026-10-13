const assert=require('node:assert/strict'),G=require('./exploration-generation.js'),J=require('./main-journey.js'),M=require('./core.js'),H=require('./lattice-holes.js'),B=require('./exploration-bundle.js');
let count=0;
for(const [mode,base]of [['main',{width:21,height:17,topology:'plane',algorithm:'dfs',keyDoor:true,keyCount:2}],['main',{width:20,height:16,topology:'torus',shiftX:2,shiftY:-2,algorithm:'dfs',loops:0}],['skew',{maze:true,periodSize:20,shiftX:-2,shiftY:4,growth:'dfs',wallStyle:'grid',underpasses:3,underpassShape:'mixed',holeRimWalls:true}]]){
 const before=structuredClone(base),found=new Map(),key=mode==='main'?'algorithm':'growth';
 for(let i=0;i<1000&&found.size<G.candidates(mode,base).length;i++){const seed='generator-'+i,options=G.choose(mode,base,true,seed);assert.deepEqual(options,G.choose(mode,base,true,seed));found.set(options[key],options);}
 assert.equal(found.size,G.candidates(mode,base).length);
 for(const options of found.values()){
  for(const k of Object.keys(base))if(k!==key)assert.deepEqual(options[k],base[k]);
  if(mode==='main'){const g=J.start(options);assert(M.solvePuzzle(g.world).path.length>0);assert.equal(g.world.algorithm,options.algorithm);}
  else{const st=H.create(options),seen=new Set([st.id]),queue=[st.id];for(const id of queue)for(let d=0;d<4;d++){const edge=st.world.edges.get(`${id}:${d}`);if(edge&&!seen.has(edge.to)){seen.add(edge.to);queue.push(edge.to);}}assert(seen.has(st.world.exit));assert.equal(st.world.growth,options.growth);}
  count++;
 }
 assert.deepEqual(G.choose(mode,base,false,'fixed'),{...base,seed:'fixed'});assert.deepEqual(base,before);
}
const c={enabled:true,completed:0,steps:0,randomGeneration:true};assert.equal(B.unpack(B.encode('main','skew','main',c)).course.randomGeneration,true);assert.throws(()=>B.unpack(B.encode('main','skew','main',{...c,randomGeneration:'yes'})));
console.log(`${count} supported generator/topology combinations generated with reachable exits; fixed fields, OFF mode, deterministic selection and saved settings passed.`);

const pools={main:['prim','division'],skew:['growing']};
for(let i=0;i<30;i++){
 assert.equal(G.choose('main',{topology:'torus'},true,'p'+i,pools).algorithm,'prim');
 assert.equal(G.choose('skew',{},true,'p'+i,pools).growth,'growing');
}
assert.throws(()=>G.choose('main',{topology:'torus'},true,'seed',{main:['division','eller'],skew:['dfs']}),/対応する生成方式/);
assert.throws(()=>G.validatePools({main:[],skew:['dfs']}));assert.throws(()=>G.validatePools({main:['dfs'],skew:['rooms']}));
const savedPools=B.unpack(B.encode('main','skew','main',{enabled:true,completed:2,steps:10,generators:pools})).course.generators;assert.deepEqual(savedPools,pools);savedPools.main.push('dfs');assert.equal(pools.main.length,2);
console.log('Generator pools: single-choice draws, topology filtering, empty/invalid rejection, no supported choice and save round trip passed.');
