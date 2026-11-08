const assert=require('node:assert/strict'),S=require('./connection-space.js');
const s=S.create('crossing'),memory=new Set();S.move(s,1);let o=S.observeAtlas(s,memory);assert(memory.has(27));assert(!memory.has(91));const initial=[...memory];
for(const d of [3,3,0,0,1,1,2,2])assert(S.move(s,d));o=S.observeAtlas(s,memory);assert(memory.has(91));assert(memory.has(27));assert(!o.visible.has(27));assert(o.visible.has(91));for(const id of initial)assert(memory.has(id));
const before=JSON.stringify(s),count=memory.size;S.observeAtlas(s,memory);assert.equal(memory.size,count);assert.equal(JSON.stringify(s),before);
for(const [width,height] of [[8,8],[40,40]]){
 const t=S.create('crossingMaze',{width,height,seed:'atlas'}),seen=new Set();let v=S.observeAtlas(t,seen);assert.deepEqual([...seen],[...v.visible]);assert(seen.size<t.world.cells.length);assert([...seen].every(id=>id>=0&&id<t.world.cells.length));
 const fresh=S.observeAtlas(S.create('crossingMaze',{width,height,seed:'next'}));assert.notEqual(fresh.memory,seen);
}
console.log('Atlas: separate coincident layers, remembered vs visible cells, idempotent observation, state purity, hidden unexplored cells and fresh memory passed');
