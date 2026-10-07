const assert=require('node:assert/strict'),S=require('./connection-space.js'),w=S.generate('chaos');
assert(w.directed);
for(let id=0;id<64;id++)if(w.cells[id])for(let d=0;d<4;d++){
 const e=w.candidates.get(`${id}:${d}`),x=id%8,y=Math.floor(id/8),[dx,dy]=S.directions[d];
 const boundary=x+dx<0||x+dx>7||y+dy<0||y+dy>7;
 assert.deepEqual(e.transform,boundary?[1,2,3,0]:[0,1,2,3]);
 assert.equal(w.edges.has(`${id}:${d}`),Boolean(w.cells[e.to]));
}
let conflicts=0,noncommuting=false,noninverse=false,blockedBoundary=false;
for(let id=0;id<64;id++)if(w.cells[id])for(let rotation=0;rotation<4;rotation++){
 const s={...S.create('chaos'),id,frame:[0,1,2,3].map(n=>(n+rotation)%4)},before=JSON.stringify(s);
 const view=S.candidateView(s);
 assert.equal(JSON.stringify(s),before);
 for(const tile of view){if(tile.wallCandidate)assert(tile.wall);if(tile.wall)assert.equal(w.cells[tile.id],0);if(tile.wallCandidate&&tile.floorCandidate)conflicts++;}
 // Independent exhaustive walk enumeration, including detours and reverse inputs.
 const expected=new Map();
 const visit=(at,frame,x,y,depth)=>{
  const key=`${x},${y}`,flags=expected.get(key)||{wall:false,floor:false};
  flags.wall||=!w.cells[at];flags.floor||=Boolean(w.cells[at]);expected.set(key,flags);
  if(!w.cells[at]||depth===4)return;
  for(let d=0;d<4;d++){const [dx,dy]=S.directions[d],e=w.candidates.get(`${at}:${frame[d]}`);visit(e.to,frame.map(n=>e.transform[n]),x+dx,y+dy,depth+1);}
 };visit(id,s.frame,0,0,0);
 assert.equal(view.length,expected.size);
 for(const tile of view){const flags=expected.get(`${tile.x},${tile.y}`);assert.equal(tile.wall,flags.wall);assert.equal(tile.floorCandidate,flags.floor);}
 for(let d=0;d<4;d++){
  const a={...s,history:[]},edge=w.candidates.get(`${id}:${s.frame[d]}`);
  if(!S.move(a,d)){assert.equal(a.id,id);assert.deepEqual(a.frame,s.frame);if(edge.kind==='clockwise')blockedBoundary=true;continue;}
  const b={...a,history:[]};if(S.move(b,(d+2)%4)&& (b.id!==id||String(b.frame)!==String(s.frame)))noninverse=true;
 }
 const a={...s,history:[]},b={...s,history:[]};
 if(S.move(a,1)&&S.move(a,3)&&S.move(b,3)&&S.move(b,1)&&(a.id!==b.id||String(a.frame)!==String(b.frame)))noncommuting=true;
}
assert(conflicts>0);assert(noncommuting);assert(noninverse);assert(blockedBoundary);
console.log('All-clockwise: every boundary, blocked landing, noncommuting moves, noninverse return and wall-priority oracle passed; mixed candidates:',conflicts);
