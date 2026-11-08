const assert=require('node:assert/strict'),S=require('./connection-space.js'),K=require('./klein-learning.js');
let cases=0;
for(const growth of ['dfs','prim','growing','kruskal'])for(const shiftY of [-18,-4,0,2,18]){
 const s=S.create('kleinMaze',{width:16,height:20,shiftY,growth,seed:'shift-'+growth,guaranteeLoops:true,floorUnderpasses:2,underpassShape:'mixed'});s.loopThreshold=3;K.start(s);
 for(const [key,e]of s.world.edges){const [from,d]=key.split(':').map(Number),back=s.world.edges.get(e.to+':'+e.transform[(d+2)%4]);assert.equal(back?.to,from,'every connection is reversible');}
 for(let i=0;i<12;i++){const path=K.plan(s);if(!path)break;for(const d of path){assert(S.move(s,d,true));K.observe(s);}}
 assert(['x','y'].every(axis=>K.knowledge(s).some(k=>k.axis===axis&&k.learned)),growth+' '+shiftY);
 s.atlasComplete=true;const here=S.position(s.world,s.id),mod=(x,n)=>(x%n+n)%n;
 for(const frame of [[0,1,2,3],[2,1,0,3]]){s.frame=frame;for(const tile of K.memory(s,{cells:new Map()},18)){const x=here.x+tile.x,y=here.y+tile.y*(frame[0]===0?1:-1),flip=Math.abs(Math.floor(x/16))%2;assert.equal(tile.id,mod(flip?shiftY-y:y,20)*16+mod(x,16));}}
 cases++;
}
for(const shiftY of [1,20,-20,NaN])assert.throws(()=>S.create('kleinMaze',{width:16,height:20,shiftY}));
console.log(cases+' shifted Klein mazes: reverse edges, three actual laps on both axes, completed atlas in both orientations, invalid offsets rejected.');
