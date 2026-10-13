const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),Session=require('./lattice-holes-session.js'),Save=require('./lattice-holes-save.js');
let moves=0,notices=0;
for(const growth of ['walls','dfs','prim','growing']){
 const options={maze:true,periodSize:20,growth,shiftX:-2,shiftY:4,underpasses:4,underpassShape:'mixed',holeRimWalls:true,seed:'session-'+growth};
 let actual=H.create(options),reference=H.create(options),book={charts:[],active:-1},oldBook={charts:[],active:-1};
 Session.observe(actual,book);S.observeWalkingMap(reference,oldBook);
 function step(d,truth){
  R.start(reference);const moved=S.move(reference,d,truth),loop=moved?R.observe(reference,S.groundSheet(reference.world,reference.id)):null,view=S.nearestView(reference,4);S.observeWalkingMap(reference,oldBook,view);
  const result=Session.step(actual,book,d,truth);assert.equal(result.moved,moved);assert.deepEqual(result.loop,loop);assert.deepEqual(result.view,view);assert.deepEqual(result.knowledge,R.knowledge(reference));assert.deepEqual(actual,reference);assert.deepEqual(book,oldBook);if(result.learned)notices++;moves++;
 }
 // Reach the reserved start, learn a period, and exercise world/screen input frames.
 const route=actual.world.guaranteedLoops[0];assert.equal(actual.id,route.start);
 for(let lap=0;lap<5;lap++)for(const wd of route.directions)step(lap%2?wd:actual.frame.indexOf(wd),Boolean(lap%2));
 let value=255;for(let i=0;i<400;i++){value=(Math.imul(value,1664525)+1013904223)>>>0;step(value%4,Boolean(i%2));}
 const before=Save.encode({state:actual,book});for(let i=0;i<4;i++)Session.observe(actual,book);assert.equal(JSON.stringify(JSON.parse(Save.encode({state:actual,book})).snapshot),JSON.stringify(JSON.parse(before).snapshot));
 const saved=Save.decode(Save.encode({state:actual,book,journey:{number:1,steps:0},controls:{}})).snapshot;actual=saved.state;book=saved.book;step(0,false);
}
assert(notices>=4);console.log(`${moves} operations across four generators: old/new movement, views, maps and loop learning match; notifications, blocked moves, redraws and restored states passed.`);
