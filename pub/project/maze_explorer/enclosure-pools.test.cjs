const a=require('node:assert/strict'),G=require('./exploration-generation.js'),B=require('./exploration-bundle.js');
const base={growth:'prim',width:24,height:28},old={main:['dfs'],skew:['dfs']};a.deepEqual(G.validatePools(old),old);
for(const growth of G.candidates('enclosure',{})){const pools={...old,enclosure:[growth]};for(let i=0;i<40;i++){const o=G.chooseEnclosure(base,'pool-'+i,undefined,undefined,true,pools);a.equal(o.growth,growth);a.equal(o.width,24);a.equal(o.height,28);}a.equal(G.chooseEnclosure(base,'off',undefined,undefined,false,pools).growth,'prim');const c={enabled:true,completed:0,steps:0,generators:pools};a.deepEqual(B.unpack(B.encode('main','main','skew',c)).course.generators,pools);}
for(const enclosure of [[],['invalid'],['prim','prim']])a.throws(()=>G.validatePools({...old,enclosure}));
console.log('Enclosure pools: 280 selected-only draws, OFF retention, old save compatibility, saved choices and invalid candidates passed');
