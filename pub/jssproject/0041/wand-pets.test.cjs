const assert=require('node:assert/strict'),E=require('./wand-engine.js');
for(const key of ['c','d']){
 const w={width:7,height:5,cells:Array(35).fill('.'),wrap:false};
 const pet={key,id:17,previous:16},bird={key:'V',id:19,wands:['freeze']};
 const actors=[{key:'@',id:0},bird,pet];
 E.petStep(w,actors,pet,()=>.5);
 assert.equal(pet.id,18); // Moves into the bird's ray, while @ is not aligned.
 const shot=E.birdCast(w,actors,bird,1);
 assert.equal(shot.target,key);
 const result=E.cast(w,actors,'V',shot.direction,shot.spell);
 assert.equal(result.target,'V');assert.equal(bird.frozen,5);assert.equal(pet.frozen,undefined);
 const before=pet.id;pet.rest=2;E.petStep(w,actors,pet,()=>.5);assert.equal(pet.id,before);assert.equal(pet.rest,1);
 for(let i=0;i<100;i++){E.petStep(w,actors,pet,()=>.5);assert(pet.id>=0&&pet.id<w.cells.length);assert(!actors.some(a=>a!==pet&&a.id===pet.id));}
}
const w={width:3,height:3,cells:Array(9).fill('#'),wrap:false};w.cells[4]='.';
const pet={key:'c',id:4};E.petStep(w,[pet],pet,()=>.5);assert.equal(pet.id,4);
console.log('Moving cat/dog become independent targets and reflect to bird; resting, occupancy, bounds and enclosed cells passed.');
