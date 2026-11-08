const assert=require('node:assert/strict'),C=require('./klein-route-comparison.js'),K=require('./klein-space.js');
const order=C.compare('order'),inverse=C.compare('inverse');
assert.equal(order.sameCell,true);assert.equal(order.sameFrame,true);assert.equal(order.sameLift,false);
assert.deepEqual(order.results.map(r=>[r.x,r.y]),[[24,-20],[24,20]]);
assert.deepEqual(order.results.map(r=>r.path.recent),['a → b','b → a']);
assert.equal(inverse.sameCell,true);assert.equal(inverse.sameFrame,true);assert.equal(inverse.sameLift,true);
assert.deepEqual(inverse.results.map(r=>[r.x,r.y]),[[24,-20],[24,-20]]);
assert.deepEqual(inverse.results.map(r=>r.path.recent),['a → b','b⁻¹ → a']);
assert(order.results.every(r=>r.steps===44&&r.column===2&&r.row===20&&r.flipped));
// Trials use independent states; existing exploration, prior result objects and repeated output remain unchanged.
const existing=K.create(K.rasterize(K.generate('playing','dfs'))),before=JSON.stringify(existing,(_,v)=>v instanceof Map||v instanceof Set?[...v]:v);
const previous=JSON.stringify(order);assert.deepEqual(C.compare('order'),order);
assert.equal(JSON.stringify(order),previous);assert.equal(JSON.stringify(existing,(_,v)=>v instanceof Map||v instanceof Set?[...v]:v),before);
assert.throws(()=>C.compare('invalid'));
console.log('Independent route comparisons: order, reversed vertical leg, endpoint/frame/lift distinction and isolation passed');
