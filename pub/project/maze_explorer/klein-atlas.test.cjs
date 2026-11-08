const assert=require('node:assert/strict'),S=require('./connection-space.js'),K=require('./klein-learning.js');
const s=S.create('kleinMaze',{width:16,height:20,seed:'atlas',growth:'dfs',floorUnderpasses:2,underpassShape:'mixed',guaranteeLoops:true}),book={charts:[],active:-1};
S.observeWalkingMap(s,book);assert(!s.atlasComplete);
const floors=[...s.world.cells.keys()].filter(id=>s.world.cells[id]),missing=floors.find(id=>!s.seenFloors.has(id));assert.notEqual(missing,undefined);
// Feed observed floors only. A single unseen floor must keep the atlas incomplete.
const observed=floors.filter(id=>id!==missing).map((id,x)=>({id,x,y:0,wall:false,frame:[0,1,2,3]}));
S.observeWalkingMap(s,book,observed);assert(!s.atlasComplete);assert.equal(s.seenFloors.size,floors.length-1);
S.observeWalkingMap(s,book,[{id:missing,x:0,y:1,wall:false,frame:[0,1,2,3]}]);assert(s.atlasComplete);
s.loopThreshold=0;s.foldLoops=false;const empty={cells:new Map()},p=S.position(s.world,s.id);
for(const frame of [[0,1,2,3],[2,1,0,3]]){
 s.frame=frame;const tiles=K.memory(s,empty,12);assert.equal(tiles.length,25*25);assert(tiles.some(t=>t.wall));assert(tiles.some(t=>t.x===0&&t.y===0&&t.id===s.id));
 for(const t of tiles){const rawX=p.x+t.x,rawY=p.y+t.y*(frame[0]===0?1:-1),flipped=Math.abs(Math.floor(rawX/16))%2===1,mod=(n,m)=>((n%m)+m)%m;assert.equal(t.id,mod(flipped?-rawY:rawY,20)*16+mod(rawX,16));}
}
s.steps++;s.features={last:{kind:'teleport'}};K.observe(s);assert(s.atlasComplete);assert(K.memory(s,empty).some(p=>p.wall));
console.log('Klein atlas: every distinct floor required, persistent completion, walls, reflected coordinates and learning OFF passed.');
