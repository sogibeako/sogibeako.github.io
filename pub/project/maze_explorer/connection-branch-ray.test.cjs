const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const mode of ['branch4','branch3']){
 const s=S.create(mode);[3,3,2,2].forEach(d=>assert(S.move(s,d)));const current=s.world.sheets-1;
 assert.equal(Math.floor(s.id/64),current);
 const before=JSON.stringify(s),view=S.branchRayView(s);assert.equal(JSON.stringify(s),before);
 assert.equal(Math.floor(view.find(p=>p.x===6&&p.y===3).id/64),current);
 assert.equal(Math.floor(S.branchView(s,false).find(p=>p.x===6&&p.y===3).id/64),0);
 // Walls on another sheet cannot obstruct this ray, but a wall on its sheet can.
 s.world.cells[30]=0;assert(!S.branchRayView(s).find(p=>p.x===6&&p.y===3).wall);
 s.world.cells[current*64+30]=0;assert(S.branchRayView(s).find(p=>p.x===6&&p.y===3).wall);
 assert(!S.branchRayView(s).some(p=>p.x===7&&p.y===3));
 const st=S.create(mode);
 for(let id=0;id<st.world.cells.length;id++)if(st.world.cells[id]){
  st.id=id;const tiles=S.branchRayView(st),x=id%8,y=Math.floor(id%64/8);
  assert(tiles.some(t=>t.id===id&&t.x===x&&t.y===y));
  for(let d=0;d<4;d++){const edge=st.world.edges.get(`${id}:${d}`),[dx,dy]=S.directions[d],tile=tiles.find(t=>t.x===x+dx&&t.y===y+dy);if(edge)assert.equal(tile.id,edge.to);else if(tile)assert(tile.wall);}
  for(const t of tiles)if(!t.wall){
   // Independent analytic intersection with y=3.5, x<3.5 branch cut.
   let sheet=Math.floor(id/64);if((y<3.5)!==(t.y<3.5)){const at=x+(t.x-x)*(3.5-y)/(t.y-y);if(at<3.5)sheet=(sheet+(t.y>y?-1:1)+st.world.sheets)%st.world.sheets;}
   assert.equal(Math.floor(t.id/64),sheet);
  }
 }
 // Exact pillar corner must not reveal a diagonal cell through it.
 st.id=20;assert(!S.branchRayView(st).some(t=>t.x===2&&t.y===4));
}
console.log('Branch ray views: reported left-left-down-down, per-ray sheet intersection, foreign/local walls, corners, all-floor adjacent moves and purity passed');
