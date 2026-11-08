const assert=require('node:assert/strict');
const K=require('./klein-space.js');
const world=()=>K.rasterize(K.generate('optics','open'));
const keys=(w,id=w.start,flip=false)=>new Set(K.visibleCells(w,id,flip).map(p=>`${p.x},${p.y}`));
{
 const w=world(),v=keys(w);
 assert(v.has('6,0'));assert(v.has('0,-6'));assert(!v.has('5,5'));
 const wall=K.project(w,w.start,false,1,0);w.cells[wall.id]=0;
 const blocked=keys(w);assert(blocked.has('1,0'));assert(!blocked.has('2,0'));assert(!blocked.has('1,1'));
 // A reachable turn is not a direct line of sight.
 assert(blocked.has('0,1'));assert(!blocked.has('2,1'));
}
{
 const w=world(),id=3*w.width+w.width-1;
 const p=K.project(w,id,false,1,1);
 assert.equal(p.id,16*w.width);assert.equal(p.flipped,true);
 w.cells[p.id]=0;
 const v=keys(w,id);assert(v.has('1,1'));assert(!v.has('2,2'));
 // Changing the observer frame mirrors visibility vertically.
 const mirrored=keys(w,id,true);
 for(const key of v){const [x,y]=key.split(',').map(Number);assert(mirrored.has(`${x},${-y}`));}
 // Local E then S agrees with S then E, including at corners of the chart.
 for(let id=0;id<w.cells.length;id++)for(const flip of [false,true]){
  const a=K.project(w,id,flip,1,1),b=K.project(w,id,flip,0,1),c=K.project(w,b.id,b.flipped,1,0);
  assert.equal(a.id,c.id);assert.equal(a.flipped,c.flipped);
 }
}
{
 const s=K.create(world());assert(s.visible.has('-6,0'));
 for(let i=0;i<8;i++)K.move(s,'E');
 assert(s.memory.has('-6,0'));assert(!s.visible.has('-6,0'));
}
console.log('Klein optical visibility: occlusion, corners, reflected seam, local frame and memory passed');
