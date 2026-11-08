const assert=require('node:assert/strict'),O=require('./orientation.js');
const snap=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const marks=Array.from({length:9},(_,i)=>({x:(i%3)*2,y:Math.floor(i/3)*4+(i%3===2?1:0),feature:String(i+1),terrain:1,seenAt:1}));
const chart=(nodes,matrix=O.identity(),offset=[0,0])=>({nodes:new Map(nodes.map(n=>{
 const [x,y]=O.apply(matrix,n.x,n.y),p={...n,x:x+offset[0],y:y+offset[1]};return [`${p.x},${p.y}`,p];
})),frame:[99,99,99,99],origin:999});
function fixture(){
 const s=O.create();s.chart.nodes=chart(marks.slice(0,3)).nodes;
 // Reverse dependency order: 3 -> 2 -> 1 needs three passes.
 s.archives=[chart([...marks.slice(6),{x:7,y:7,feature:'',terrain:1}],O.transforms.mirror,[10,3]),
 chart(marks.slice(3),O.transforms.left,[-9,2]),chart(marks.slice(0,6),O.transforms.half,[5,-8])];return s;
}
const s=fixture(),before=snap(s),preview=O.inspectAll(s);
assert.deepEqual(preview.matched,[2,1,0]);assert.equal(preview.pending.length,0);assert.equal(snap(s),before);
const originals=snap(s.archives),visible=snap(s.chart.visible),player=snap(s.game.player),frame=snap(s.frame),position=snap(s.chart.position);
assert.deepEqual(O.matchAll(s),preview);assert.equal(s.chart.nodes.size,10);assert.ok(s.chart.nodes.has('7,7'));
assert.equal(snap(s.archives),originals);assert.equal(snap(s.chart.visible),visible);assert.equal(snap(s.game.player),player);assert.equal(snap(s.frame),frame);assert.equal(snap(s.chart.position),position);assert.equal(s.game.steps,0);
assert.deepEqual(O.matchAll(s).matched,[]);
const blocked=fixture();blocked.archives.push(chart([marks[0]]));
const conflict=chart(marks.slice(0,3));conflict.nodes.set('0,0',{...marks[0],terrain:0});blocked.archives.push(conflict);
const outcome=O.matchAll(blocked);assert.deepEqual(outcome.matched,[2,1,0]);assert.deepEqual(outcome.pending.map(p=>p.status),['ambiguous','conflict']);assert.equal(blocked.chart.nodes.get('0,0').terrain,1);
const empty=O.create();assert.deepEqual(O.matchAll(empty),{matched:[],pending:[]});
console.log('PASS: three-stage rotation/reflection chain in reverse order, immutable preview/originals/player/frame/visibility/time, repeated-call stability, ambiguous and conflicting records withheld, empty records.');
