const assert=require('node:assert/strict'),S=require('./connection-space.js');
let localWins=0,hiddenWalls=0;
for(const [mode,dimensions] of [['double',[[8,8],[12,10]]],['triple',[[8,8],[14,8],[10,12]]]]){
 const st=S.create(mode,{dimensions,walls:true}),w=st.world;
 for(let id=0;id<w.cells.length;id++)if(w.cells[id])for(let r=0;r<4;r++){
  st.id=id;st.frame=[0,1,2,3].map(n=>(n+r)%4);const sheet=S.position(w,id).sheet,candidates=new Map();
  function visit(id,frame,x,y,depth){const wall=!w.cells[id],local=S.position(w,id).sheet===sheet,key=`${x},${y}`;if(!candidates.has(key))candidates.set(key,[]);candidates.get(key).push({id,wall,local,depth});if(wall||depth===4)return;
   for(let d=0;d<4;d++){const e=w.candidates.get(`${id}:${frame[d]}`);if(e){const [dx,dy]=S.directions[d];visit(e.to,frame.map(n=>e.transform[n]),x+dx,y+dy,depth+1);}}
  }
  visit(id,st.frame,0,0,0);const before=JSON.stringify(st),view=new Map(S.nearestView(st).map(t=>[`${t.x},${t.y}`,t]));assert.equal(JSON.stringify(st),before);
  for(const [key,cs] of candidates){const local=cs.filter(c=>c.local),foreignWalls=cs.filter(c=>!c.local&&c.wall),tile=view.get(key);hiddenWalls+=foreignWalls.length;
   if(local.length){assert(tile&&tile.local);const depth=Math.min(...local.map(c=>c.depth));assert.equal(tile.distance,depth);assert.equal(tile.wall,local.some(c=>c.depth===depth&&c.wall));if(cs.some(c=>!c.local&&c.depth<=depth))localWins++;}
   if(tile&&tile.wall)assert.equal(S.position(w,tile.id).sheet,sheet);
   if(cs.every(c=>!c.local&&c.wall))assert(!tile);
  }
 }
}
assert(localWins>0);assert(hiddenWalls>0);console.log(`Hole chart oracle: ${localWins} overlapping local candidates preferred; ${hiddenWalls} foreign wall candidates excluded; all observer positions and rotations passed`);

const e=to=>({to,transform:[0,1,2,3]}),edges=new Map([['0:0',e(1)],['0:1',e(64)],['1:1',e(2)],['2:2',e(3)]]);
const sample={id:0,frame:[0,1,2,3],world:{mode:'double',cells:new Uint8Array(65).fill(1),candidates:edges,edges}};
assert.equal(S.nearestView(sample).find(t=>t.x===1&&t.y===0).id,3);
sample.world.cells[64]=0;assert.equal(S.nearestView(sample).find(t=>t.x===1&&t.y===0).id,3);
console.log('Synthetic shorter foreign floor/wall both yield to farther current-sheet floor');
