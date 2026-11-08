const a=require('node:assert/strict'),E=require('./wand-engine.js');
for(let d=0;d<4;d++)for(const key of ['@','V']){
 const w={width:7,height:7,cells:Array(49).fill('.'),wrap:true,oob:true};
 const id=[3,27,45,21][d],inward=(d+2)%4;w.cells[E.next(w,E.next(w,id,inward),inward)]='R';
 const actor={key,id},r=E.cast(w,[actor],key,inward,'push');
 a.equal(r.oob,d);a.equal(actor.region,'oob-'+d);a.equal(actor.id,24);a.equal(actor.dormant,key==='V');
 for(const change of [{wrap:false},{oob:false}]){const copy={key,id};const result=E.cast({...w,...change},[copy],key,inward,'push');a.equal(result.oob,undefined);a.equal(copy.region,undefined);}
 for(const spell of ['freeze','swap','pull']){const copy={key,id};a.equal(E.cast(w,[copy],key,inward,spell).oob,undefined);}
 const interior=E.next(w,id,inward);const copy={key,id:interior};a.equal(E.cast(w,[copy],key,inward,'push').oob,undefined);
 // Direct outward hit stays on the torus even when target is at the edge.
 const shooter={key:'S',id:E.next(w,id,inward)},target={key,id};
 a.equal(E.cast(w,[shooter,target],'S',d,'push').oob,undefined);
}
// Pets can supply the reflection; an actor in another region is not hit.
const w={width:7,height:3,cells:Array(21).fill('.'),wrap:true,oob:true};
const bird={key:'V',id:7},pet={key:'c',id:9};
a.equal(E.cast(w,[bird,pet],'V',1,'push').oob,3);
console.log('OOB all 4 sides for player/bird, dormant bird, pet reflection, negative conditions passed.');
