const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-checkpoint.js');
const snap=g=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const configs=[{}, {keyDoor:true,keyCount:3}, {birdMode:true,separateMaps:true}, {birdMode:true,keyDoor:true,keyCount:2}, {topology:'torus',width:20,height:16,shiftX:2,shiftY:-2,loopLearning:true,learningLaps:3}];
for(const style of ['pair','oneway','cycle3','cycle4'])for(const rotation of ['none','right','mirror','mixed'])configs.push({warpMode:true,warpStyle:style,warpCount:2,warpInvisible:true,rotation});
for(const [i,c]of configs.entries()){
 const {rotation='none',...opts}=c;const g=J.start({width:21,height:17,algorithm:'rooms',seed:'checkpoint-'+i,...opts},rotation);g.journey={completed:7,steps:321};
 for(let k=0;k<10;k++){const d=Object.keys(M.DIRS).find(d=>M.ruleTransition(g.world,g.player,d));M.move(g,d);}
 const before=snap(g),encoded=S.encode(g,'birds'),{game:r,course}=S.decode(encoded);
 assert.equal(snap(g),before);assert.equal(course,'birds');assert.equal(snap(r.world),snap(g.world));assert.deepEqual(r.journey,g.journey);assert.equal(r.steps,0);assert.equal(r.player.world_position,r.world.start);assert.equal(r.cognition.archives.length,0);assert.equal(r.markers.size,0);assert.equal(r.player.keys.length,0);assert.equal(r.openedDoors.size,0);
 if(r.birds){assert.equal(r.bird.state,'WANDER');assert.equal(r.teleports,0);}
 const fresh=J.start(r.generationOptions,rotation);assert.deepEqual(r.viewFrame,fresh.viewFrame);
 const corrupt=JSON.parse(encoded);corrupt.check='wrong';assert.throws(()=>S.decode(JSON.stringify(corrupt)));
 for(const bad of [{version:99},{course:'unknown'},{journey:{completed:-1,steps:0}},{options:{width:999999}},{options:{...g.generationOptions,seed:3}},{options:{...g.generationOptions,extra:true}}])assert.throws(()=>S.decode(JSON.stringify({...JSON.parse(encoded),...bad})));
}
assert.throws(()=>S.decode('oops'));assert.throws(()=>S.decode('x'.repeat(20001)));assert.throws(()=>S.decode('null'));
console.log('PASS: 21 checkpoint round trips, exact world recreation, clean entrance state, progress/course retained, corruption/version/type/size rejection.');
