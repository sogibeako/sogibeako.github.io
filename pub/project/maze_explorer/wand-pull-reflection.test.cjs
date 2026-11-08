const a=require('node:assert/strict'),E=require('./wand-engine.js');
const world=(wrap=false)=>({width:9,height:1,cells:Array(9).fill('.'),wrap});
for(const key of ['c','d']){const actors=[{key:'@',id:1},{key,id:6}];E.cast(world(),actors,'@',1,'pull');a.equal(actors[0].id,5);a.equal(actors[1].id,6);}
for(const [dir,want]of [[1,3],[3,5]]){const actors=[{key:'@',id:4}];E.cast(world(true),actors,'@',dir,'pull');a.equal(actors[0].id,want);}
for(const spell of Object.keys(E.names)){const actors=[{key:'c',id:2},{key:'d',id:6}],before=structuredClone(actors),r=E.cast(world(),actors,'c',1,spell);a.equal(r.reflections,6);a.equal(r.target,undefined);a.deepEqual(actors,before);}
const w=world(true);w.oob=true;w.cells[2]='R';w.cells[8]='#';const p={key:'@',id:0};a.equal(E.cast(w,[p],'@',1,'push').oob,undefined);
const bird={key:'V',id:4,previous:3},actors=[{key:'@',id:0},bird];E.birdStep(world(),actors,bird,[],1,()=>0);a.equal(bird.id,5);
const dead=world();dead.cells[6]='#';bird.id=5;bird.previous=4;E.birdStep(dead,actors,bird,[],2,()=>0);a.equal(bird.id,4);
console.log('Pet-origin pull, full-lap self pull both directions, sixth-reflection cancellation all spells, closed seam blocked, bird reversal avoidance and dead-end escape passed.');
