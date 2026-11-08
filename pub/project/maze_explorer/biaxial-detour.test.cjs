const assert=require('node:assert/strict'),K=require('./klein-biaxial.js'),R=require('./biaxial-rules.js');
const w=K.create('free',3,2,{width:12,height:10});w.cells=Array(120).fill(1);w.start=13;w.exit=119;w.seed='detour';
const s=R.create(w,'birds');s.features.bird=15;s.features.options.keys=true;s.features.door=119;s.features.warps=new Map([[40,60],[60,40]]);
const frame=[2,1,0,3],cycle=[13,25,26,14];let route=null,p;
for(let n=0;n<9;n++){s.steps=n;p={id:cycle[n%4],frame};route=R.detour(w,s,p,4);if(n<8)assert.equal(route,null);}
assert(route&&route.length>=4);assert.equal(R.detour(w,s,p,4),route,'same tick is idempotent');
const target=s.detour.target;assert(!cycle.includes(target));const original=JSON.stringify(s.features);
for(const d of route){p=K.step(w,p,d);assert.notEqual(p.id,15);assert.notEqual(p.id,119);assert(!s.features.warps.has(p.id));}assert.equal(p.id,target);assert.equal(JSON.stringify(s.features),original);
s.steps++;assert.equal(R.detour(w,s,p,4),null);assert.equal(s.detour.target,null);
s.detour.target=80;s.features.last={kind:'teleport'};s.steps++;assert.equal(R.detour(w,s,p,4),null);assert.equal(s.detour.target,null);
s.features.last=null;s.detour.target=80;s.steps++;assert.equal(R.detour(w,s,p,5),null);assert.equal(s.detour.target,null,'new floors resume normal exploration');
const plain=R.create(w,'plain');assert.equal(R.detour(w,plain,p),null);
console.log('Period-four encounter triggers distant detour; reflected route avoids bird/door/warp; idempotency, arrival, relocation and new-floor reset passed.');
