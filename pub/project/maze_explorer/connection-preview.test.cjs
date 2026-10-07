const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const mode of ['double','chaos']){
 const s=S.create(mode);let maxStates=0,maxQueued=0,images=0;
 for(let id=0;id<s.world.cells.length;id++)if(s.world.cells[id])for(const mirrored of [false,true])for(let rotation=0;rotation<4;rotation++){
  s.id=id;s.frame=[0,1,2,3].map(n=>((mirrored?-n:n)+rotation+4)%4);
  const metrics={},view=S.candidateView(s,4,metrics);maxStates=Math.max(maxStates,metrics.states);maxQueued=Math.max(maxQueued,metrics.queued);
  const selfOffsets=new Set();
  const walk=(at,frame,x,y,depth)=>{
   if(!s.world.cells[at])return;if(at===id)selfOffsets.add(`${x},${y}`);if(depth===4)return;
   for(let d=0;d<4;d++){const edge=(s.world.candidates.size?s.world.candidates:s.world.edges).get(`${at}:${frame[d]}`);if(edge){const [dx,dy]=S.directions[d];walk(edge.to,frame.map(n=>edge.transform[n]),x+dx,y+dy,depth+1);}}
  };walk(id,s.frame,0,0,0);
  for(const p of view){assert.equal(p.selfCandidate,selfOffsets.has(`${p.x},${p.y}`));if(!p.wall&&p.selfCandidate&&(p.x||p.y))images++;}
  const before=JSON.stringify(view),cost=JSON.stringify(metrics);s.steps=1000000;s.history=Array(1000).fill({x:0,y:0,id});
  const afterMetrics={};assert.equal(JSON.stringify(S.candidateView(s,4,afterMetrics)),before);assert.equal(JSON.stringify(afterMetrics),cost);
 }
 console.log(mode,{maxStates,maxQueued,images});assert(maxQueued<=341);
 if(mode==='chaos')assert(images>0);
}
{
 const s=S.create('double');for(const d of [1,1,2])assert(S.move(s,d));
 assert(S.candidateView(s).some(p=>p.id>=64)); // See the other sheet before crossing the rim.
 assert(!S.candidateView(s).some(p=>p.id>=64&&p.selfCandidate));
}
{
 const s=S.create('chaos');for(let i=0;i<5000;i++){const d=[0,1,2,3].find(d=>s.world.edges.has(`${s.id}:${s.frame[d]}`));assert(S.move(s,d));}assert.equal(s.history.length,1000);
 assert.throws(()=>S.candidateView(s,100));
}
console.log('Preview: through-hole view, exact self candidates, sheet distinction, history-independent work and bounded history passed');
