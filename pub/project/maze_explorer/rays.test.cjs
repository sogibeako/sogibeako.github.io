const assert = require('node:assert/strict');
const M = require('./core.js');
for(const shift of [{},{shiftX:2},{shiftY:2},{shiftX:-6},{shiftY:-6}]) for(const learning of [false,true]) {
 const g=M.createGame(M.createTorusDemo({openRoom:true,selfVision:true,loopLearning:learning,...shift}));
 for(let i=0;i<10;i++) M.move(g,'left');
 const snapshot=JSON.stringify([...g.cognition.memory_nodes]);
 for(const image of g.cognition.self_images) for(const space of ['continuous','truth','folded']) {
  const segments=M.selfRaySegments(g,image,space);
  let length=0;
  for(const {from:a,to:b} of segments) {
   length+=Math.hypot(b.x-a.x,b.y-a.y);
   if(space==='truth') {
    for(const p of [a,b]) assert.ok(p.x>=-.50000001&&p.x<=7.50000001&&p.y>=-.50000001&&p.y<=7.50000001,'projected segments stay within map');
    assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<=Math.SQRT2+1e-8,'no spurious seam-spanning line');
   }
  }
  assert.ok(Math.abs(length-image.distance)<1e-8,'projection preserves total optical length');
  if(space==='continuous') {assert.equal(segments.length,1);assert.deepEqual(segments[0].to,{x:image.x,y:image.y});}
 }
 assert.equal(JSON.stringify([...g.cognition.memory_nodes]),snapshot);
 assert.deepEqual(M.selfRaySegments(g,{x:100,y:100},'truth'),[],'unobserved targets cannot be drawn');
}
console.log('PASS: optical segment bounds, seam splitting, preserved lengths, negative coordinates, partial/unfolded views and render purity.');
