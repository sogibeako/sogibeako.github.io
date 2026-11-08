const assert=require('node:assert/strict'),O=require('./orientation.js'),S=require('./orientation-save.js'),M=require('./core.js');
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
function roundtrip(s){const before=snap(s),text=S.encode(s);assert.equal(snap(s),before);const restored=S.decode(text);assert.equal(snap(restored),before);return text;}
for(const mode of [...Object.keys(O.transforms),'mixed']){
 const s=O.create(mode);O.move(s,'down');O.placeMarker(s);O.move(s,'right');O.placeMarker(s);
 for(const d of ['down','right'])O.move(s,d,true);
 // Walk back through the corridor while retaining the changed frame.
 for(const d of ['down',...Array(12).fill('left'),'up'])O.move(s,d,true);
 O.matchAll(s);assert.ok(s.chart.matches.size);const n=s.history.length;O.inspectAll(s);assert.equal(s.history.length,n);roundtrip(s);
}
for(const layout of ['dfs','prim'])for(const warpStyle of ['pair','oneway','cycle3','cycle4']){
 const s=O.create('mixed',{layout,warpStyle,warpCount:2,seed:'save-72'}),w=s.game.world;
 const q=[[w.start,[]]],seen=new Set([w.start]);let route;
 for(const [id,path] of q){if(route)break;for(const d of Object.keys(M.DIRS)){
  const e=M.transition(w,{world_position:id},d);if(!e)continue;
  if(w.warps.has(e.to)){route=[...path,d];break;}
  if(!seen.has(e.to)){seen.add(e.to);q.push([e.to,[...path,d]]);}
 }}
 for(const d of route)O.move(s,d,true);assert.equal(s.crossings,1);roundtrip(s);
}
const good=roundtrip(O.create()),data=JSON.parse(good);
assert.throws(()=>S.decode('not json'));assert.throws(()=>S.decode(JSON.stringify({...data,version:999})));
assert.throws(()=>S.decode(JSON.stringify({...data,actions:[['move','constructor']]})));
assert.throws(()=>S.decode(JSON.stringify({...data,actions:[['match',0]]})));
assert.throws(()=>S.decode(JSON.stringify({...data,check:'altered'})));
assert.throws(()=>S.decode(JSON.stringify({...data,actions:Array(20001).fill(['mark'])})));
console.log('PASS: complete state round-trip for 5 frames with markers/rotated matching, 8 generated directed/mixed worlds, immutable previews/export, invalid/version/corrupt/oversized history rejection.');
