const assert=require('node:assert/strict'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),F=require('./sheet-features.js');
for(const mode of ['crossingMaze','underpassMaze','torusMaze','doubleMaze']){
 const s=S.create(mode,{width:16,height:16,seed:'complete-all',floorUnderpasses:2,underpassShape:'mixed'}),book={charts:[],active:-1};
 S.observeWalkingMap(s,book);assert(!s.atlasComplete,mode);assert.deepEqual(S.completedTripleView(s),[]);
 const floors=Array.from(s.world.cells,(v,id)=>v?id:-1).filter(id=>id>=0);
 // Observe each reachable floor through real movement; both crossing lanes count.
 const visited=new Set([s.id]);
 while(visited.size<floors.length){const path=P.route(s,id=>!visited.has(id));assert(path?.length,mode);for(const d of path){assert(S.move(s,d));visited.add(s.id);S.observeWalkingMap(s,book);}}
 assert(s.atlasComplete,mode);
 for(const id of floors.filter((_,i)=>i%17===0)){
  s.id=id;const before=JSON.stringify([s.x,s.y,s.frame]);const view=S.completedTripleView(s,20);
  assert(view.some(p=>p.wall),mode);assert.equal(view.find(p=>!p.x&&!p.y).id,id);assert.equal(JSON.stringify([s.x,s.y,s.frame]),before);
  assert(view.every(p=>S.groundSheet(s.world,p.id)===S.groundSheet(s.world,id)));
 }
 S.observeWalkingMap(s,{charts:[],active:-1},[]);assert(s.atlasComplete,'completion survives chart changes');
 console.log(mode+': complete after real exploration; walls, lanes, sheets and camera verified');
}
const s=S.create('tripleMaze',{seed:'live-bird'});F.install(s,{birds:true});const id=s.features.bird;
assert.equal(F.glyph(s,id,false),null);s.atlasComplete=true;assert.equal(F.glyph(s,id,false),'V');s.features.bird=s.id;assert.notEqual(F.glyph(s,id,false),'V');
console.log('Completed map shows current bird, never its old position');

const partial=S.create('underpassMaze',{seed:'last-lane',floorUnderpasses:3}),book={charts:[],active:-1};
const missing=partial.world.passages[0].vertical;
const records=Array.from(partial.world.cells,(v,id)=>({id,wall:!v,x:id,y:0,frame:[0,1,2,3]})).filter(p=>p.id!==missing);
S.observeWalkingMap(partial,book,records);assert(!partial.atlasComplete,'unseen lower lane prevents completion');
S.observeWalkingMap(partial,book,[{id:missing,wall:true,x:0,y:0,frame:[0,1,2,3]}]);assert(!partial.atlasComplete,'occluding wall is not a seen floor');
S.observeWalkingMap(partial,book,[{id:missing,wall:false,x:0,y:0,frame:[0,1,2,3]}]);assert(partial.atlasComplete);
