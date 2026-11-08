const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),Session=require('./lattice-holes-session.js'),O=require('./lattice-holes-options.js'),Save=require('./lattice-holes-save.js'),D=require('./lattice-holes-display.js');
let exits=0;
for(const growth of ['walls','dfs','prim','growing']){
 let run={state:H.create({maze:true,periodSize:16,growth,shiftX:2,shiftY:-2,underpasses:2,underpassShape:'mixed',holeRimWalls:true,seed:'course-'+growth}),book:{charts:[],active:-1},journey:{number:1,steps:0},truth:true};
 run.state.loopThreshold=5;run.state.foldLoops=false;
 for(let stage=0;stage<2;stage++){
  const st=run.state,w=st.world,q=[st.id],parents=new Map([[st.id,null]]);
  for(const id of q)for(let d=0;d<4;d++){const edge=w.edges.get(`${id}:${d}`);if(edge&&!parents.has(edge.to)){parents.set(edge.to,[id,d]);q.push(edge.to);}}
  assert(parents.has(w.exit));const path=[];for(let id=w.exit;parents.get(id);){const [p,d]=parents.get(id);path.unshift(d);id=p;}
  for(const d of path){const obs=Session.step(st,run.book,d,true);assert(D.compose(st,run.book,obs.view).tiles.some(t=>t.glyph==='@'));}
  assert.equal(st.id,w.exit);exits++;
  const saved=Save.decode(Save.encode({...run,controls:{}})).snapshot;run={...saved,truth:true};
  const before=structuredClone(run),base=O.applied(run.state.world,'next-'+growth+'-'+stage),options=O.randomize(base,{enabled:false});
  const next=Session.begin(H.create(options),run,true);assert.deepEqual(run,before);assert.equal(next.journey.number,stage+2);assert.equal(next.journey.steps,run.journey.steps+run.state.steps);assert.equal(next.truth,false);assert.equal(next.state.loopThreshold,5);assert.equal(next.state.foldLoops,false);assert.equal(next.book.charts.length,0);assert.equal(next.state.steps,0);assert.equal(next.state.world.growth,growth);assert.equal(next.state.world.holeRimWalls,true);run=next;
 }
 const restarted=Session.begin(H.create(O.applied(run.state.world,'restart')),run);assert.equal(restarted.journey.number,1);assert.equal(restarted.journey.steps,0);
}
const base={growth:'dfs',periodSize:20,shiftX:2,underpasses:2},original=structuredClone(base);
assert.deepEqual(O.randomize(base,{enabled:false,size:true,min:24,max:12}),base);
assert.throws(()=>O.randomize(base,{enabled:true,size:true,min:24,max:12}));assert.deepEqual(base,original);
const config={enabled:true,growth:true,wall:true,size:true,min:16,max:24,shift:true,passages:true};
assert.equal(O.randomize(base,config,()=>0).periodSize,16);assert.equal(O.randomize(base,config,()=>.999).periodSize,24);
console.log(`${exits} exits across four generators: DOM-free generation, movement, display, save/resume and next-stage lifecycle passed; progress, preferences, prior-state isolation and random-range guards passed.`);
