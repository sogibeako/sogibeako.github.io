const assert=require('node:assert/strict'),S=require('./connection-space.js');
const s=S.create('branch4'),step=d=>{assert(S.move(s,d));assert(S.move(s,d));};
assert.deepEqual(S.quadrantSheets(s),[0,0,0,0]);
step(2);assert.deepEqual(S.quadrantSheets(s),[1,0,0,0]);assert.equal(Math.floor(s.id/64),0);
assert(!S.branchView(s).some(p=>p.x===2&&p.y===2));assert(S.branchView(s,false).some(p=>p.x===2&&p.y===2&&p.id>=64));
step(3);assert.deepEqual(S.quadrantSheets(s),[1,1,0,0]);
step(0);assert.deepEqual(S.quadrantSheets(s),[1,1,1,0]);assert.equal(Math.floor(s.id/64),1);
step(1);assert.deepEqual(S.quadrantSheets(s),[1,1,1,1]);assert.equal(s.id,84);
for(const d of [2,3,0,1])step(d);assert.deepEqual(S.quadrantSheets(s),[0,0,0,0]);assert.equal(s.id,20);
for(const d of [3,2,1,0])step(d);assert.deepEqual(S.quadrantSheets(s),[1,1,1,1]);
for(const d of [2,3,0,1])step(d);assert.deepEqual(S.quadrantSheets(s),[0,0,0,0]);
// Every reachable position renders itself and immediate move destinations on the actual sheet.
for(let id=0;id<128;id++)if(s.world.cells[id]){
 const p={...s,id},view=S.branchView(p,false);assert(view.some(c=>c.id===id));assert(S.branchView(p).some(c=>c.id===id));
 for(let d=0;d<4;d++){const e=s.world.edges.get(`${id}:${d}`);if(e)assert(view.some(c=>c.id===e.to),`${id}:${d}`);}
}
assert.equal(S.branchView(s,false).length,64);
console.log('Four-sector views: exact requested sequence, reverse unwind, two laps, pillar occlusion and movement/view consistency passed');
