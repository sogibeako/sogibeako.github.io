const assert=require('node:assert/strict'),S=require('./connection-space.js');
let cases=0;
for(const wallStyle of ['dense','grid'])for(const size of [15,31])for(let seed=0;seed<3;seed++){
 const state=S.create('crossingMaze',{wallStyle,width:size,height:size,seed,stairPlacement:'random',floorUnderpasses:3,growth:'dfs'}),w=state.world;
 const parents=new Map([[w.start,null]]),queue=[w.start];
 for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[id,d]);queue.push(e.to);}}
 for(const target of w.stairs){
  const st=S.create('crossingMaze',{wallStyle,width:size,height:size,seed,stairPlacement:'random',floorUnderpasses:3,growth:'dfs'}),book={charts:[],active:-1},memory=new Set(),path=[];
  for(let id=target;parents.get(id);){const [from,d]=parents.get(id);path.unshift(d);id=from;}
  const observe=()=>{const old=new Set(memory);S.observeAtlas(st,memory);for(const id of old)assert(memory.has(id));assert(memory.has(st.id));const o=S.observeWalkingMap(st,book);for(const c of book.charts){const floors=new Set([...c.cells.values()].filter(p=>!p.wall).map(p=>S.groundSheet(w,p.id)));assert.equal(floors.size,1,'a chart must not mix floors');}assert(o.chart.cells.has(`${st.x},${st.y}`));};
  observe();for(const d of path){assert(S.move(st,d));observe();}
  const d=[0,1,2,3].find(d=>w.edges.get(`${st.id}:${d}`)?.kind==='stairs');assert.notEqual(d,undefined);
  const before=st.id,sheet=S.groundSheet(w,before);assert(S.move(st,d));observe();assert.notEqual(S.groundSheet(w,st.id),sheet);assert(S.move(st,(d+2)%4));observe();assert.equal(st.id,before);
  const count=memory.size,steps=st.steps;observe();assert.equal(memory.size,count);assert.equal(st.steps,steps);
 }
 cases++;
}
console.log(`${cases} generated worlds: every stair traversed both ways, charts keep floors separate, atlas retains observations, repeated viewing costs no steps.`);
