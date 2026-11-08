const assert=require('node:assert/strict'),S=require('./connection-space.js');
let crossings=0;
for(const underpassShape of ['straight','mixed','corners'])for(const mode of ['kleinMaze','torusMaze'])for(const growth of ['dfs','prim','growing','kruskal'])for(const count of [0,3]){
 const st=S.create(mode,{seed:'seam-memory',growth,floorUnderpasses:count,underpassShape}),book={charts:[],active:-1};S.observeWalkingMap(st,book);
 // Visit every reachable cell via a DFS walk and return along each edge.
 const visited=new Set([st.id]);
 function walk(){const origin=st.id;for(let wd=0;wd<4;wd++){const edge=st.world.edges.get(`${origin}:${wd}`);if(!edge||visited.has(edge.to))continue;
  const d=st.frame.indexOf(wd),x=st.x,y=st.y,frame=[...st.frame];visited.add(edge.to);assert(S.move(st,d));if(edge.kind==='seam')crossings++;
  assert.equal(st.x,x+S.directions[d][0]);assert.equal(st.y,y+S.directions[d][1]);S.observeWalkingMap(st,book);assert.equal(book.charts.length,1,`${mode} ${growth} ${count} step ${st.steps}`);
  walk();assert(S.move(st,(d+2)%4));assert.equal(st.id,origin);assert.deepEqual(st.frame,frame);S.observeWalkingMap(st,book);assert.equal(book.charts.length,1);
 }}
 walk();assert.equal(st.id,st.world.start);assert.equal(st.x,0);assert.equal(st.y,0);
}
assert(crossings>0);console.log(`48 full maze walks: ${crossings} seam crossings, one continuous subjective chart, reverse paths and frames restored.`);
