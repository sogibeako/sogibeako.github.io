const a=require('node:assert/strict'),E=require('./wand-engine.js');
const make=(line,wrap=false)=>({width:line.length,height:1,cells:[...line],wrap});
for(const spell of Object.keys(E.names)){
 const w=make('.......#'),actors=[{key:'@',id:1},{key:'V',id:4}],r=E.cast(w,actors,'@',1,spell);a.equal(r.target,'V');a.deepEqual(r.path.map(p=>p.id),[2,3,4]);
 if(spell==='freeze')a.equal(actors[1].frozen,5);
 if(spell==='push')a.equal(actors[1].id,6);
 if(spell==='pull')a.equal(actors[1].id,2);
 if(spell==='swap'){a.equal(actors[0].id,4);a.equal(actors[1].id,1);}
}
{const w=make('R......#'),actors=[{key:'@',id:2},{key:'V',id:6}],r=E.cast(w,actors,'@',3,'push');a.equal(r.reflected,true);a.equal(r.target,'@');a.equal(actors[0].id,5);}
{const w=make('....',true),actors=[{key:'@',id:0}];const r=E.cast(w,actors,'@',1,'push');a.equal(r.target,'@');a.equal(actors[0].id,3);}
{const w=make('.......',true),actors=[{key:'@',id:1},{key:'V',id:5}];E.cast(w,actors,'@',3,'pull');a.equal(actors[1].id,0);}
{const w=make('.#....'),actors=[{key:'@',id:0},{key:'V',id:4}],before=structuredClone(actors);E.cast(w,actors,'@',1,'swap');a.deepEqual(actors,before);}
{const w=make('R.R'),actors=[{key:'@',id:1}];a.equal(E.cast(w,actors,'@',1,'freeze').target,'@');a.equal(actors[0].frozen,5);}
console.log('Four spells, reflected self-hit, blocking walls/actors, wrapped pull and bounded cyclic push passed.');

for(const pet of ['c','d'])for(const spell of Object.keys(E.names)){const w=make('.......'),actors=[{key:'@',id:1},{key:pet,id:4}],r=E.cast(w,actors,'@',1,spell);a.equal(r.target,'@');a.equal(r.reflected,true);a(r.path.some(p=>p.tail===pet));a.equal(actors[1].id,4);a.equal(actors[1].frozen,undefined);}
{const w=make('......'),actors=[{key:'@',id:0},{key:'V',id:2}],items=[{id:4,spell:'freeze'}];a.equal(E.birdStep(w,actors,actors[1],items,1),null);a.equal(actors[1].id,3);a.equal(E.birdStep(w,actors,actors[1],items,2).spell,'freeze');a.equal(items.length,0);a.deepEqual(actors[1].wands,['freeze']);a.equal(E.pickup(actors[1],items),null);}
console.log('Both pets reflect all four spells without receiving effects; bird approaches and picks up a wand exactly once.');
