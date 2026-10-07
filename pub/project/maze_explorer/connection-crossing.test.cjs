const assert=require('node:assert/strict'),S=require('./connection-space.js');
const s=S.create('crossing');assert(S.move(s,1));assert.equal(s.id,27);
const before=JSON.stringify(s);assert(!S.move(s,0));assert(!S.move(s,2));assert.equal(JSON.stringify(s),before);
assert(!S.nearestView(s).some(p=>p.id===91));
const t=S.create('crossing');for(const d of [3,0,0,1,1,2,2])assert(S.move(t,d));assert.equal(t.id,91);assert.deepEqual(S.position(t.world,91),{sheet:1,x:3,y:3});
assert(!S.move(t,1));assert(!S.move(t,3));assert(!S.nearestView(t).some(p=>p.id===27));
assert(S.move(t,0));assert(S.move(t,2));assert.equal(t.id,91);
let ramps=0;for(const [key,e] of t.world.edges){const from=Number(key.split(':')[0]);if(Math.floor(from/64)!==Math.floor(e.to/64)){assert.equal(e.kind,'stairs');ramps++;}else assert.notEqual(e.kind,'stairs');}assert.equal(ramps,4);
// One whole circuit goes over the bridge, down the far stairs and back through the underpass.
const u=S.create('crossing');const route=[1,1,1,1,2,2,2,3,3,3,0,0,0,0,0,3,3,2,2,1];
for(const d of route)assert(S.move(u,d));assert.equal(u.id,u.world.start);assert.equal(u.x,0);assert.equal(u.y,0);
console.log('Crossing: independent coincident cells, no turning between layers, no through-floor sight, stair-only layer changes and full circuit passed');
