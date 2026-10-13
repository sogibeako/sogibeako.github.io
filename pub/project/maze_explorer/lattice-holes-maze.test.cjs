const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js');let count=0;
for(const wallStyle of ['dense','grid'])for(const growth of ['walls','dfs','prim','growing'])for(const shiftX of [-4,-2,0,2,4])for(const shiftY of [-4,-2,0,2,4])for(let seed=0;seed<3;seed++){
 const st=H.create({maze:true,shiftX,shiftY,seed,growth,wallStyle}),w=st.world;assert.deepEqual(w.cells,H.create({maze:true,shiftX,shiftY,seed,growth,wallStyle}).world.cells);assert.equal(w.guaranteedLoops.length,4);
 if(wallStyle==='grid')for(const n of w.domain){const p=S.position(w,n),x=p.x+w.minX,y=p.y+w.minY;if(x%2===0&&y%2===0&&!w.rimCells.has(n))assert.equal(w.cells[n],0,'lattice pillar');if(growth!=='walls'&&Math.abs(x%2)===1&&Math.abs(y%2)===1&&!w.holes.has(n))assert.equal(w.cells[n],1,'all lattice sites reached');}
 for(const route of w.guaranteedLoops){let n=route.start,x=0,y=0;for(const d of route.directions){const e=w.edges.get(`${n}:${d}`);assert(e&&e.kind==='normal');assert.equal(S.groundSheet(w,e.to),route.sheet);n=e.to;x+=S.directions[d][0];y+=S.directions[d][1];}assert.equal(n,route.start);assert(x===route.vector[0]&&y===route.vector[1]);}
 const q=[st.id],parents=new Map([[st.id,null]]);for(const n of q)for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[n,d]);q.push(e.to);}}
 assert.equal(q.length,w.cells.reduce((a,b)=>a+b,0));assert(parents.has(w.exit));assert.equal(S.groundSheet(w,w.exit),1);assert(w.cells.reduce((a,b)=>a+b,0)<w.domain.size-w.holes.size);
 const path=[];for(let n=w.exit;parents.get(n);){const [prev,d]=parents.get(n);path.unshift(d);n=prev;}const book={charts:[],active:-1};
 for(const d of path){S.observeWalkingMap(st,book);assert(S.move(st,st.frame.indexOf(d)));}assert.equal(st.id,w.exit);count++;
}
console.log(`${count} seeded skew-hole mazes: reproducibility, four exact winding cycles, connected floors and real walk to sheet B exit passed.`);

