const a=require('node:assert/strict'),E=require('./wand-engine.js');
const w={width:8,height:8,cells:Array(64).fill('.'),wrap:true};
for(const id of [0,9,14,55,63])a(E.nearSeam(w,id));a(!E.nearSeam(w,27));a(!E.nearSeam({...w,wrap:false},0));
for(const [id,d,to]of [[3,0,59],[31,1,24],[59,2,3],[24,3,31]]){
 const r=E.cast(w,[{key:'@',id}], '@',d,'freeze');a.equal(r.path[0].id,to);a.equal(r.path[0].seam,true);
}
const normal=E.cast({...w,wrap:false},[{key:'@',id:27}], '@',1,'freeze');a(normal.path.every(p=>!p.seam));
for(const key of ['c','d']){const pet={key,id:0};a(E.petHint(w,pet,1,()=>.2));a.equal(E.petHint(w,pet,2,()=>0),null);a(E.petHint(w,pet,9,()=>.2));a.equal(E.petHint(w,{key,id:27},1,()=>.2),null);a(E.petHint(w,{key,id:27},1,()=>.01));a.equal(E.petHint({...w,wrap:false},{key,id:0},1,()=>0),null);}
console.log('Four seam crossings, near-edge range, pet cooldown/ordinary gestures and planar exclusions passed.');
