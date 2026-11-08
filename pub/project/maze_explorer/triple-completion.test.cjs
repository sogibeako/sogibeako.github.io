const assert=require('node:assert/strict'),S=require('./connection-space.js');
const s=S.create('tripleMaze',{seed:'complete-405',dimensions:[[12,16],[24,16],[16,12]],floorUnderpasses:2,underpassShape:'mixed'});
const memory=new Set(),floors=Array.from(s.world.cells,(v,id)=>v?id:-1).filter(id=>id>=0);
const live=S.observeAtlas(s,memory).visible;
assert(!s.atlasComplete);
assert.deepEqual(S.completedTripleView(s),[]);
const missing=floors.find(id=>!live.has(id)&&id!==s.id);
for(const id of floors)if(id!==missing)memory.add(id);
S.observeAtlas(s,memory);
assert(!s.atlasComplete,'one unseen floor prevents completion');
memory.add(missing);S.observeAtlas(s,memory);
assert(s.atlasComplete);
assert(s.world.cells.every((_,id)=>s.world.holes.has(id)||!s.world.domain.has(id)&&!s.world.cells[id]||memory.has(id)),'all walls enter permanent atlas');
const snapshot={state:s,journey:{number:1,steps:0},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:memory,walkingBook:{charts:[],active:-1},controls:{}};
const restored=S.decodeSave(S.encodeSave(snapshot)).snapshot;
assert(restored.state.atlasComplete);
for(let sheet=0;sheet<3;sheet++){
 s.id=floors.find(id=>S.groundSheet(s.world,id)===sheet);s.x=137;s.y=-59;s.frame=[1,2,3,0];
 const before=JSON.stringify(s),view=S.completedTripleView(s);
 assert(view.some(p=>p.wall),'completed subjective map contains walls');
 assert(view.every(p=>S.groundSheet(s.world,p.id)===sheet&&!s.world.holes.has(p.id)));
 assert.equal(view.find(p=>!p.x&&!p.y).id,s.id);
 assert.equal(JSON.stringify(s),before,'camera, heading and loop knowledge remain unchanged');
 S.observeAtlas(s,memory);assert(s.atlasComplete,'sheet changes retain completion');
}
const fresh=S.create('tripleMaze',{seed:'complete-next'});
S.observeAtlas(fresh,new Set());assert(!fresh.atlasComplete,'new maze resets completion');
console.log('Triple completion: unseen-floor guard, permanent walls, save round-trip, all sheets, camera retention and new-maze reset passed.');

let distant=0;const kinds=new Set();
for(const underpassShape of ['straight','corners'])for(const shifts of [[0,0],[2,-2]]){
 const q=S.create('tripleMaze',{seed:'complete-underpass',growth:'prim',wallStyle:'grid',dimensions:[[20,20],[24,20],[20,20]],holeSize:3,floorUnderpasses:6,underpassShape,shiftX:shifts[0],shiftY:shifts[1]});q.atlasComplete=true;
 for(const c of q.world.passages){
  kinds.add(c.arms?'corner':'straight');
  for(const frame of [[0,1,2,3],[1,2,3,0],[0,3,2,1]]){
   q.frame=frame;
   for(let id=0;id<q.world.cells.length;id++){
    if(!q.world.cells[id]||S.groundSheet(q.world,id)!==c.baseSheet||id===c.horizontal||id===c.vertical)continue;
    q.id=id;const view=S.completedTripleView(q),center=view.find(p=>(p.id===c.horizontal||p.id===c.vertical)&&Math.max(Math.abs(p.x),Math.abs(p.y))>4&&Math.max(Math.abs(p.x),Math.abs(p.y))<8);if(!center)continue;
    const before=JSON.stringify(q);assert(!center.wall);
    const right=S.directions[frame[1]],down=S.directions[frame[2]],dx=-center.x*right[0]-center.y*down[0],dy=-center.x*right[1]-center.y*down[1];
    const d=Math.abs(dy)>Math.abs(dx)?(dy<0?0:2):(dx<0?3:1),vertical=c.arms?!c.arms.includes(d):Math.abs(dy)>Math.abs(dx);
    assert.equal(center.id,vertical?c.vertical:c.horizontal);
    const arms=c.arms?(vertical?[0,1,2,3].filter(d=>!c.arms.includes(d)):c.arms):(vertical?[0,2]:[1,3]);
    for(let local=0;local<4;local++)if(!arms.includes(frame[local])){
     const [x,y]=S.directions[local],tile=view.find(p=>p.x===center.x+x&&p.y===center.y+y);assert(tile?.wall,'distant hidden lane must remain a wall');
    }
    assert.equal(JSON.stringify(q),before);distant++;break;
   }
  }
  for(const id of [c.horizontal,c.vertical]){q.id=id;const center=S.completedTripleView(q).find(p=>p.x===0&&p.y===0);assert.equal(center.id,id);assert(!center.wall);}
 }
}
assert(distant>0);assert.equal(kinds.size,2);
console.log(distant+' distant underpass views: approach-dependent straight/corner walls, rotations/reflection, skew periods and player lanes passed.');
