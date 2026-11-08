const assert=require('node:assert/strict'),G=require('./exploration-generation.js'),C=require('./exploration-course.js'),B=require('./exploration-bundle.js'),M=require('./core.js'),J=require('./main-journey.js'),H=require('./lattice-holes.js');
const sizes={enabled:true,widthMin:9,widthMax:17,heightMin:9,heightMax:15,periodMin:12,periodMax:24};
const seen=new Set();
for(let i=0;i<80;i++){
 const seed='size-'+i;
 for(const topology of ['plane','torus']){
  const base={topology,width:31,height:23,algorithm:'dfs',shiftX:topology==='torus'?10:0,shiftY:0};
  const o=G.choose('main',base,false,seed,undefined,sizes);
  assert.equal(o.width%2,topology==='torus'?0:1);assert.equal(o.height%2,o.width%2);assert(o.width>=9&&o.width<=17&&o.height>=9&&o.height<=15);if(topology==='torus')assert(o.width>10);
  assert.equal(o.algorithm,'dfs');assert.deepEqual(o,G.choose('main',base,false,seed,undefined,sizes));assert.equal(base.width,31);
 }
 seen.add(G.choose('skew',{},false,seed,undefined,sizes).periodSize);
}
assert.deepEqual([...seen].sort((a,b)=>a-b),[12,16,20,24]);
assert.throws(()=>G.choose('main',{topology:'plane'},false,'x',undefined,{...sizes,widthMin:10,widthMax:10}),/対応サイズ/);
assert.throws(()=>G.choose('main',{topology:'torus',shiftX:18},false,'x',undefined,sizes),/対応サイズ/);
assert.throws(()=>G.validateSizes({...sizes,heightMin:16,heightMax:15}));assert.throws(()=>G.validateSizes({...sizes,widthMin:NaN}));assert.throws(()=>G.validateSizes({...sizes,periodMin:13}));
const original={width:21,height:17};assert.deepEqual(G.choose('main',original,false,'fixed',undefined,{...sizes,enabled:false}),{...original,seed:'fixed'});
const course=C.validate({enabled:true,completed:2,steps:45,sizes});const saved=B.unpack(B.encode('a','b','main',course));assert.deepEqual(saved.course.sizes,sizes);assert.equal(C.advance(course,'main',{exit:true,steps:3}).course.steps,48);assert.deepEqual(C.advance(course,'main',{exit:true,steps:3}).course.sizes,sizes);
let count=0;
for(const topology of ['plane','torus'])for(const algorithm of G.candidates('main',{topology})){
 const options=G.choose('main',{topology,algorithm,shiftX:topology==='torus'?2:0,shiftY:topology==='torus'?-2:0},false,'real-'+algorithm,undefined,sizes);const game=J.start(options);assert(M.solvePuzzle(game.world).path.length>0);count++;
}
for(const periodSize of [12,16,20,24])for(const growth of G.candidates('skew',{})){
 const st=H.create(G.choose('skew',{maze:true,growth,shiftX:2,shiftY:-2,wallStyle:'grid',underpasses:2,underpassShape:'mixed',holeRimWalls:true},false,'real-'+growth,undefined,{...sizes,periodMin:periodSize,periodMax:periodSize}));
 assert.equal(st.world.lattice.width,periodSize);const seen=new Set([st.id]),q=[st.id];for(const id of q)for(let d=0;d<4;d++){const e=st.world.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}assert(seen.has(st.world.exit));count++;
}
console.log(`${count} generated size/topology/algorithm cases reach exits; bounds, parity, shifts, determinism, OFF, invalid ranges and save round trip passed.`);
