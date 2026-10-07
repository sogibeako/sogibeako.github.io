const assert=require('node:assert/strict'),M=require('./core.js');
class CountedMap extends Map { scans=0; values(){this.scans++;return super.values();} }
const node=i=>({world_id:20+i,x:3+i,y:2,terrain:1,feature:String(i+1),seenAt:1,firstSeen:0});
const chart=(nodes,shift=0)=>new CountedMap(nodes.map(n=>['C'+(n.y*17+n.x+shift),{...n,x:n.x+shift}]));
const g=M.createGame(M.createWarpDemo());g.cognition.memory_nodes=chart([node(0)]);
// Older records depend on newer records: eight passes progressively reveal the chain.
g.cognition.archives=Array.from({length:8},(_,i)=>{const j=7-i;return {nodes:chart([node(j),node(j+1)],10),sources:[]};});
for(let i=0;i<100;i++)g.cognition.archives.push({nodes:chart([{world_id:100+i,x:i,y:8,terrain:1,feature:''}]),sources:[]});
const before=JSON.stringify([...g.cognition.memory_nodes]);
const expected=[7,6,5,4,3,2,1,0],result=M.inspectRecordedMatching(g);
assert.deepEqual(result.matches,expected);assert(result.reasons.slice(0,8).every(r=>r==='ready'));assert(result.reasons.slice(8).every(r=>r==='no-common'));
assert.equal(JSON.stringify([...g.cognition.memory_nodes]),before);assert.equal(g.cognition.matchedArchives.size,0);
for(const a of g.cognition.archives.slice(0,8))assert.equal(a.nodes.scans,2,'one anchor scan plus one merge scan');
for(const a of g.cognition.archives.slice(8))assert.equal(a.nodes.scans,1,'pending originals scanned once despite repeated passes');
// No cache survives the call: new observations and corrected notebook marks must be read.
const pending=g.cognition.archives[8];pending.nodes=chart([node(0)],30);
assert.deepEqual(M.matchRecordedMaps(g),[7,8,6,5,4,3,2,1,0]);
assert.equal(pending.nodes.scans,2);
const applied=M.matchRecordedMaps(g,true);assert.deepEqual(applied,[7,8,6,5,4,3,2,1,0]);
assert.equal(g.cognition.memory_nodes.size,9);assert.equal(g.turns,0);
for(const a of g.cognition.archives)a.nodes.scans=0;
assert.deepEqual(M.matchRecordedMaps(g),[]);
for(const a of g.cognition.archives.slice(0,9))assert.equal(a.nodes.scans,0,'already matched archives require no anchor scan');
console.log('PASS: eight-stage chain plus 100 pending archives; pending anchor scans drop from nine per call to one, identical ordered matches, fresh subsequent observations, read-only preview and zero scans for matched originals.');
