const assert=require('node:assert/strict'),O=require('./orientation.js');
const node=(x,y,feature)=>({x,y,feature,terrain:1,seenAt:1});
const chart=(nodes,matches=[])=>({nodes:new Map(nodes.map(n=>[`${n.x},${n.y}`,n])),matches:new Set(matches)});
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
for(const transform of [O.transforms.right,O.transforms.left,O.transforms.half,O.transforms.mirror]){
 const s=O.create(),marks=[node(0,0,'1'),node(2,0,'2'),node(0,3,'3')];
 // Record 1 alone is ambiguous; record 2 already contains its confirmed match.
 s.archives=[chart([marks[0],node(1,1,'')]),chart([...marks,node(1,1,'')],[0])];
 s.chart.nodes=chart(marks.map(n=>{const [x,y]=O.apply(transform,n.x,n.y);return {...n,x:x+7,y:y-4};})).nodes;
 assert.equal(O.inspectMatch(s,0).status,'ambiguous');assert.equal(O.inspectMatch(s,1).status,'ready');
 const before=snap(s),preview=O.inspectAll(s);assert.equal(snap(s),before);
 assert.equal(preview.pending.length,0,'included original must not remain pending after its merged chart is imported');
 const original=snap(s.archives),frame=snap(s.frame),position=snap(s.game.player);
 const result=O.matchAll(s);assert.deepEqual(new Set(result.matched),new Set([0,1]));assert.deepEqual(s.chart.matches,new Set([1,0]));
 assert.equal(s.chart.nodes.size,4);assert.equal(snap(s.archives),original);assert.equal(snap(s.frame),frame);assert.equal(snap(s.game.player),position);
 assert.equal(O.inspectMatch(s,0).status,'matched');assert.equal(O.matchAll(s).matched.length,0);
}
console.log('PASS: known source records remain matched across rotated/reflected rearchival and chain imports; immutable previews/originals and stable repeat.');
