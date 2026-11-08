const assert=require('node:assert/strict'),K=require('./klein-space.js');
const make=()=>K.create(K.rasterize(K.generate('intervals','open')));
const walk=(s,d,n)=>{for(let i=0;i<n;i++)assert(K.move(s,d));};
{
 const s=make();walk(s,'S',40);
 assert.deepEqual(s.returnIntervals.map(e=>[e.dx,e.dy,e.steps,e.type]),[[0,20,20,'shifted'],[0,20,20,'shifted']]);
 walk(s,'E',1);walk(s,'W',1);
 assert.deepEqual(s.returnIntervals.at(-1),{fromStep:40,toStep:42,steps:2,fromFlipped:false,dx:0,dy:0,flipped:false,type:'revisit'});
}
{
 const s=make();walk(s,'S',20);walk(s,'N',20); // The origin is omitted from the old return log, but must delimit intervals.
 assert.equal(s.returns.length,1);assert.equal(s.returnIntervals.at(-1).dy,-20);
 walk(s,'S',20);assert.equal(s.returnIntervals.at(-1).fromStep,40);assert.equal(s.returnIntervals.at(-1).dy,20);
 K.setReference(s);assert.equal(s.returnIntervals.length,0);walk(s,'E',1);walk(s,'W',1);assert.equal(s.returnIntervals[0].fromStep,60);
}
{
 const s=make();walk(s,'E',24);walk(s,'N',2);assert.equal(s.returnIntervals[0].flipped,true);
 walk(s,'S',2);walk(s,'W',24);assert.equal(s.returnIntervals.at(-1).flipped,true);assert.equal(s.returnIntervals.at(-1).dx,-24);
}
{
 const s=make();for(let i=0;i<25;i++){walk(s,'E',1);walk(s,'W',1);}
 assert.equal(s.returnIntervals.length,20);assert.equal(s.returnIntervals[0].fromStep,10);assert.equal(s.returnIntervals.at(-1).toStep,50);assert.equal(s.returns.length,0);
}
{
 const s=K.create(K.rasterize(K.generate('walls','dfs'))),d=Object.keys(K.dirs).find(d=>!s.world.passages.has(`${s.id}:${d}`));
 assert(d);const before=JSON.stringify([s.returnIntervals,s.previousArrival]);assert.equal(K.move(s,d),false);assert.equal(JSON.stringify([s.returnIntervals,s.previousArrival]),before);
}
console.log('Arrival intervals: repeated laps, revisits, origin returns, reversal, resets, bounded records and walls passed');
