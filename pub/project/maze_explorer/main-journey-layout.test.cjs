const assert=require('node:assert/strict'),J=require('./main-journey.js'),S=require('./main-session.js'),C=require('./main-checkpoint.js');
let count=0;
for(const layout of ['all','corridors','rooms'])for(const size of ['small','standard','large'])for(const course of ['plain','variety','torus','keys','birds']){
 const source=J.start({width:9,height:9,seed:'layout-source'});source.journey={completed:0,steps:0,size,layout};let g=J.begin(source,'begin-'+layout+size+course,course);
 for(let i=0;i<4;i++){
  if(layout==='rooms')assert.equal(g.world.algorithm,'rooms');if(layout==='corridors')assert.notEqual(g.world.algorithm,'rooms');
  assert.equal(g.journey.layout,layout);assert.equal(g.journey.size,size);
  S.attach(g);S.act(g,'wait');const text=S.encode(g,course);assert.equal(S.encode(S.decode(text).game,course),text);assert.equal(C.decode(C.encode(g,course)).game.journey.layout,layout);
  S.markExport(g,course);assert(S.info(g,course).current);g.journey.layout=layout==='all'?'rooms':'all';assert(!S.info(g,course).current);g.journey.layout=layout;
  assert.equal(J.restart(g).journey.layout,layout);g.won=true;g.player.world_position=g.world.exit;
  const n=J.next(g,'next-'+layout+size+course+i,course);if(layout!=='rooms')assert.notEqual(n.world.algorithm,g.world.algorithm);g=n;count++;
 }
}
const g=J.start({width:9,height:9,seed:'same',algorithm:'dfs'});g.journey.layout='rooms';g.won=true;g.player.world_position=g.world.exit;assert.equal(J.next(g,'same-next','same').world.algorithm,'dfs');
const bad=JSON.parse(C.encode(g,'same'));bad.journey.layout='invalid';assert.throws(()=>C.decode(JSON.stringify(bad)));
console.log(`PASS: ${count} filtered generations across 3 layouts, 3 sizes and 5 courses; initial/next floors, save replay, restart, same-course precedence, dirty state and invalid layout.`);
