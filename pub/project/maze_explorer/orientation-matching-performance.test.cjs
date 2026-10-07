const assert=require('node:assert/strict'),O=require('./orientation.js');
class CountedMap extends Map { scans=0; values(){this.scans++;return super.values();} }
const group=i=>[[0,0],[2,0],[0,3]].map(([x,y],j)=>({x:x+i*10,y,terrain:1,feature:'',warpAnchor:`known-${i}-${j}`,seenAt:1}));
const chart=nodes=>({nodes:new CountedMap(nodes.map(n=>[`${n.x},${n.y}`,n])),matches:new Set()});
function fixture(){return {history:[],chart:chart(group(0)),archives:[...Array.from({length:6},(_,i)=>chart([...group(5-i),...group(6-i)])),...Array.from({length:100},(_,i)=>chart([{x:i,y:30,terrain:1,feature:''}]))]};}
// Prior public-API workflow: no cache passed between individual comparisons.
function reference(state){const before=new Set(state.chart.matches);let changed;do{changed=false;for(let i=0;i<state.archives.length;i++){if(state.chart.matches.has(i))continue;if(O.matchArchive(state,i).status==='matched')changed=true;}}while(changed);return {matched:[...state.chart.matches].filter(i=>!before.has(i)),pending:state.archives.map((_,index)=>({index,...O.inspectMatch(state,index)})).filter(r=>r.status!=='matched')};}
const snapshot=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const old=fixture(),fresh=fixture();
const expected=reference(old),result=O.matchAll(fresh);
assert.deepEqual(result,expected);assert.deepEqual(result.matched,[5,4,3,2,1,0]);assert.equal(snapshot(fresh),snapshot(old));
assert(old.archives.slice(6).every(a=>a.nodes.scans===8));assert(fresh.archives.slice(6).every(a=>a.nodes.scans===1));
const preview=fixture(),before=snapshot(preview);assert.deepEqual(O.inspectAll(preview),expected);assert.equal(snapshot(preview),before);
// A changed observation on the same Map must be re-indexed in a later call.
const uncertain={history:[],chart:chart(group(0)),archives:[chart([{...group(0)[0],warpAnchor:undefined}])]};
assert.equal(O.matchAll(uncertain).pending[0].status,'no-landmarks');
const nodes=uncertain.archives[0].nodes;nodes.clear();for(const n of group(0))nodes.set(`${n.x},${n.y}`,n);
assert.deepEqual(O.matchAll(uncertain).matched,[0]);
// Duplicate evidence must remain ambiguous in both versions.
const ambiguous=fixture();ambiguous.archives=[chart([group(0)[0],{...group(0)[0],x:40}])];
assert.equal(O.matchAll(ambiguous).pending[0].status,'ambiguous');
console.log('PASS: six-stage rotation chain plus 100 pending charts exactly matches uncached results, candidate matrices, history and merged state; pending landmark scans 8 -> 1; read-only preview, fresh subsequent observations and ambiguity preserved.');
