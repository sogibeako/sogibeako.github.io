const assert=require('node:assert/strict'),S=require('./connection-space.js'),C=require('./crossing-save.js'),G=require('./graph-wands.js'),W=require('./maze-wildlife.js'),P=require('./crossing-autowalk.js'),E=require('./exploration-generation.js');
global.GraphWands=G;
const journey={number:3,steps:200},display={truth:false,render:'hybrid'};
for(const wallStyle of ['dense','grid'])for(const growth of ['dfs','prim','growing','hunt','kruskal','frontier']){
 const s=S.create('crossingMaze',{seed:'cross-wands-'+growth,width:16,height:18,growth,wallStyle,stairPlacement:'random',floorUnderpasses:2,underpassShape:'mixed',ruleMode:'birds'});
 C.enableWands(s);assert(s.wands);const atlas=new Set(),book={charts:[],active:-1},visited=new Set([s.id]);
 const observe=()=>{visited.add(s.id);S.observeAtlas(s,atlas);S.observeWalkingMap(s,book,S.nearestView(s,4,{}));};observe();
 G.setAnimator(s,(path,commit)=>{observe();commit();});
 let casts=0;
 for(let turn=0;turn<240;turn++){
  if(s.wands.held.length&&turn%13===0){const spell=s.wands.held[turn%s.wands.held.length],d=turn%4;assert(G.cast(s,spell,d));C.recordCast(s,spell,d);W.graphTick(s);casts++;}
  else {const path=!s.wands.held.length?P.route(s,id=>s.wands.items.some(p=>p.id===id)):P.route(s,id=>!visited.has(id));S.move(s,path?.length?path[0]:4);}
  observe();
 }
 assert(casts>0);assert(s.steps>=240);
 // Waiting in truth mode also remains replayable.
 assert(S.move(s,4,true));observe();
 const text=C.snapshot(s,journey,display),r=C.prepare(text);
 assert.equal(C.snapshot(r.state,r.journey,r.display),text);assert.deepEqual(r.state,s);assert.deepEqual(r.atlasMemory,atlas);assert.deepEqual(r.walkingBook,book);assert.deepEqual(r.visited,visited);
 for(let i=0;i<8;i++){S.move(s,4);S.move(r.state,4);}assert.deepEqual(r.state,s);
 const bad=JSON.parse(text);bad.moves.push({spell:'invalid',d:0});assert.throws(()=>C.prepare(JSON.stringify(bad)));
 // Rays always follow the actual floor graph, including stairs and underpasses.
 for(let d=0;d<4;d++)for(const point of G.preview(s,'freeze',d))assert(s.world.cells[point.id]);
 console.log(wallStyle+' '+growth+': pickup/cast, waits, exact map/save replay and continuation passed');
}
const selected=E.chooseCrossing({width:16,height:16,wallStyle:'grid'},'birds-course',{rules:{enabled:true,pool:['birds']}});assert.equal(selected.ruleMode,'birds');assert(S.create('crossingMaze',selected).features.options.birds);
console.log('Crossing common-course bird selection passed');
