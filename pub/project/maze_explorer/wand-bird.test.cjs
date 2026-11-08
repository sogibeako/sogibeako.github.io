const a=require('node:assert/strict'),E=require('./wand-engine.js');
const w={width:8,height:3,cells:Array(24).fill('.'),wrap:false};
for(const spell of Object.keys(E.names)){
 const actors=[{key:'@',id:9},{key:'V',id:14,wands:[spell]}],bird=actors[1];
 const before=structuredClone(actors),shot=E.birdCast(w,actors,bird,2);a.equal(shot.direction,3);a.equal(shot.spell,spell);a.deepEqual(actors,before);
 a.equal(E.cast(w,actors,'V',shot.direction,shot.spell).target,'@');
}
const actors=[{key:'@',id:9},{key:'V',id:14,wands:['freeze','push']}],b=actors[1];
a.equal(E.birdCast(w,actors,{...b,wands:[]},1),null);a.equal(E.birdCast(w,actors,{...b,frozen:1},1),null);a.equal(E.birdCast(w,actors,{...b,nextCastTurn:7},6),null);a(E.birdCast(w,actors,{...b,nextCastTurn:7},7));a.equal(E.birdCast(w,actors,{...b,casts:1},1).spell,'push');
for(const wall of ['#','R']){w.cells[12]=wall;a.equal(E.birdCast(w,actors,b,1),null);}w.cells[12]='.';
a.equal(E.birdCast(w,[{key:'@',id:0},b],b,1),null);
for(const pet of ['c','d']){const all=[...structuredClone(actors),{key:pet,id:12}];const shot=E.birdCast(w,all,all[1],1);a(shot);const r=E.cast(w,all,'V',shot.direction,shot.spell);a.equal(r.target,'V');a.equal(all[1].frozen,5);a.equal(all[0].frozen,undefined);}
const wrap={...w,wrap:true},shot=E.birdCast(wrap,actors,b,1);a.equal(shot.direction,1);a.equal(shot.distance,3);
console.log('Bird casting: all spells, pure planning, empty inventory, freeze/cooldown, blockers, no diagonal targeting, pet reflection and shortest wrapped ray passed.');
