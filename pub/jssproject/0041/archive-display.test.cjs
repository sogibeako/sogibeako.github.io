const assert=require('node:assert/strict'),M=require('./core.js');
const world=M.generate({seed:'walk-r42kycev',algorithm:'dfs',topology:'torus',width:30,height:26,shiftX:2,shiftY:6,loopLearning:true});
const g=M.createGame(world),bounds=ns=>{const xs=ns.map(n=>n.x),ys=ns.map(n=>n.y);return [Math.max(...xs)-Math.min(...xs)+1,Math.max(...ys)-Math.min(...ys)+1];};
const raw=[];for(let y=0;y<26;y++)for(let x=0;x<30;x++)raw.push({x,y,world_id:M.periodicId(world,x,y),feature:'.',seenAt:3});
for(const basis of [{rank:1,x:2,y:-26},{rank:1,x:30,y:-6},{rank:2,x:384,y:2,offset:118},{rank:2,x:768,y:2,offset:118}]){
 g.cognition.knowledgeBasis=basis;
 const nodes=raw.map(n=>({...n,...M.cognitivePosition(g,n.x,n.y)}));
 const before=JSON.stringify(nodes),knowledge=JSON.stringify(basis);
 const shown=M.archiveDisplayCells(g,nodes);
 for(let i=0;i<nodes.length;i++){
  assert.deepEqual(M.cognitivePosition(g,shown[i].x,shown[i].y),M.cognitivePosition(g,nodes[i].x,nodes[i].y));
  assert.equal(M.periodicId(world,shown[i].x,shown[i].y),nodes[i].world_id);
  assert.equal(shown[i].feature,nodes[i].feature);
 }
 assert.equal(JSON.stringify(nodes),before);assert.equal(JSON.stringify(g.cognition.knowledgeBasis),knowledge);
 assert.deepEqual(M.archiveDisplayCells(g,nodes,false),nodes);
 if(basis.rank===1&&basis.x===2){
  assert.ok(bounds(nodes)[1]>300,'reproduce long narrow canonical strip');
  assert.ok(Math.max(...bounds(shown))<65,'compact drawing representatives');
 }
 if(basis.rank===2)assert.ok(Math.max(...bounds(shown))<100);
 assert.equal(new Set(shown.map(n=>`${n.x},${n.y}`)).size,new Set(nodes.map(n=>`${n.x},${n.y}`)).size,'no extra folding');
}
g.cognition.knowledgeBasis=null;assert.deepEqual(M.archiveDisplayCells(g,raw),raw);
console.log('PASS: reported seed and shifts, thin-strip reproduction, compact rank-one/rank-two display, same learned equivalence and world cells, no extra folding, immutable source/knowledge, original display unchanged.');
