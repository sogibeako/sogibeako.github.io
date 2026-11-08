const assert=require('node:assert/strict'),G=require('./exploration-generation.js'),B=require('./exploration-bundle.js'),J=require('./main-journey.js'),M=require('./core.js'),H=require('./lattice-holes.js');
const shifts={enabled:true,pool:['none','x','y','both']},base={topology:'torus',width:20,height:16,algorithm:'dfs',shiftX:14,shiftY:-12};
const choose=(mode,options,seed,config=shifts,sizes)=>G.choose(mode,options,false,seed,undefined,sizes,undefined,'none',config);
const seen=new Set();
for(let i=0;i<1000;i++){const o=choose('main',base,'shift-'+i);seen.add([o.shiftX,o.shiftY].join(','));assert.deepEqual(o,choose('main',base,'shift-'+i));assert.equal(o.width,20);assert.equal(o.algorithm,'dfs');}
assert.equal(seen.size,25);assert.equal(base.shiftX,14);
for(const type of shifts.pool){for(let i=0;i<20;i++){const o=choose('main',base,'only-'+i,{enabled:true,pool:[type]});assert.equal(!!o.shiftX,['x','both'].includes(type));assert.equal(!!o.shiftY,['y','both'].includes(type));}}
assert.deepEqual(choose('main',base,'off',{...shifts,enabled:false}),{...base,seed:'off'});
assert.equal(choose('main',{...base,topology:'plane'},'plane').shiftX,0);
const sizes={enabled:true,widthMin:8,widthMax:8,heightMin:8,heightMax:8,periodMin:12,periodMax:12};const small=choose('main',base,'small',shifts,sizes);assert.equal(small.width,8);assert(Math.abs(small.shiftX)<8);
assert.throws(()=>G.validateShifts({enabled:true,pool:[]}));assert.throws(()=>G.validateShifts({enabled:true,pool:['x','x']}));assert.throws(()=>G.validateShifts({enabled:true,pool:['bad']}));
assert.deepEqual(B.unpack(B.encode('a','b','main',{enabled:true,completed:3,steps:21,shifts})).course.shifts,shifts);
assert.deepEqual(G.validateShifts(),{enabled:false,pool:['none','x','y','both']});
let count=0;
for(const type of shifts.pool){
 for(const algorithm of G.candidates('main',{topology:'torus'})){const o=choose('main',{...base,algorithm},'real-'+algorithm,{enabled:true,pool:[type]});const g=J.start(o);assert(M.solvePuzzle(g.world).path.length>0);count++;}
 for(const growth of G.candidates('skew',{})){const o=choose('skew',{maze:true,periodSize:20,growth,wallStyle:'grid',underpasses:3,underpassShape:'mixed',holeRimWalls:true},'real-'+growth,{enabled:true,pool:[type]});const st=H.create(o),seen=new Set([st.id]),q=[st.id];for(const id of q)for(let d=0;d<4;d++){const e=st.world.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}assert(seen.has(st.world.exit));assert.equal(st.world.lattice.shiftX,o.shiftX);assert.equal(st.world.lattice.shiftY,o.shiftY);count++;}
}
console.log(`${count} generated shift/topology/algorithm cases reach exits; all 25 pairs, type filtering, small-size replacement, determinism, OFF, plane and saved settings passed.`);

{
 const options={width:28,height:34,shiftX:6,shiftY:-6,underpasses:6,verticalLoops:3,layout:'random'},before=structuredClone(options),pairs=new Set();
 for(let i=0;i<200;i++){
  const seed='enclosure-shift-'+i,a=G.chooseEnclosure(options,seed,{enabled:true,pool:['both']});
  assert.deepEqual(a,G.chooseEnclosure(options,seed,{enabled:true,pool:['both']}));
  assert.deepEqual({...a,seed:undefined,shiftX:6,shiftY:-6},{...options,seed:undefined});pairs.add(a.shiftX+','+a.shiftY);
 }
 assert.equal(pairs.size,16);assert.deepEqual(options,before);assert.deepEqual(G.chooseEnclosure(options,'off'),{...options,seed:'off'});
 console.log('Enclosure shared shifts: all 16 two-axis pairs, deterministic seeds, preserved options and OFF behavior passed.');
}
