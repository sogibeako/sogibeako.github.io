const assert=require('node:assert/strict'),C=require('./klein-route-comparison.js'),K=require('./klein-space.js');
const frames=C.roundTrip();assert.equal(frames.length,53);
const [start,turn,end]=[frames[0],frames[26],frames[52]];
assert.equal(turn.id,start.id);assert.equal(turn.flipped,true);assert.deepEqual([turn.x,turn.y],[24,-2]);
assert.equal(end.id,start.id);assert.equal(end.flipped,false);assert.deepEqual([end.x,end.y],[0,0]);
assert.deepEqual(K.intervalTransform(end.interval),K.inverseTransform(K.intervalTransform(turn.interval)));
assert.equal(end.path.length,0);
for(let i=0;i<53;i++){assert.equal(frames[i].step,i);assert.equal(frames[i].id,frames[52-i].id);assert.equal(frames[i].x,frames[52-i].x);assert.equal(frames[i].y,frames[52-i].y);}
const copy=JSON.stringify(frames);assert.deepEqual(C.roundTrip(),frames);assert.equal(JSON.stringify(frames),copy);
assert.notEqual(turn.interval,end.interval);
console.log('Seekable replay: 53 frames, exact reverse route, reflected return, inverse transform and stable snapshots passed');
{
 const repeated=C.roundTrip('repeat');assert.equal(repeated.length,53);
 assert.deepEqual(repeated.slice(0,27),frames.slice(0,27));
 assert.equal(repeated[52].id,frames[0].id);assert.equal(repeated[52].flipped,false);
 assert.deepEqual([repeated[52].x,repeated[52].y],[48,0]);
 assert.deepEqual(K.intervalTransform(repeated[26].interval),K.intervalTransform(repeated[52].interval));
 assert.deepEqual(repeated.filter(f=>f.interval?.toStep===f.step).map(f=>f.step),[26,52]);
 assert.equal(repeated[52].interval.fromFlipped,true);assert.equal(repeated[52].path.length,4);
 assert.deepEqual(C.roundTrip('reverse'),frames);assert.throws(()=>C.roundTrip('bad'));
 console.log('Repeated circuit: matching first leg, same normalized transform twice, distinct lifted endpoint and independent modes passed');
}
