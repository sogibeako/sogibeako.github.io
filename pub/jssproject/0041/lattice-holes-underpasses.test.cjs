const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js');let count=0,passages=0,corners=0;
for(const underpassShape of ['straight','mixed','corners'])for(const wallStyle of ['dense','grid'])for(const growth of ['walls','dfs','prim','growing'])for(const periodSize of [12,20,24])for(let seed=0;seed<2;seed++){
 const shiftX=seed?4:-2,shiftY=seed?-2:2;const st=H.create({maze:true,shiftX,shiftY,seed,growth,wallStyle,periodSize,underpasses:2,underpassShape}),w=st.world;assert.deepEqual(w.cells,H.create({maze:true,shiftX,shiftY,seed,growth,wallStyle,periodSize,underpasses:2,underpassShape}).world.cells);assert.equal(w.guaranteedLoops.length,4);
 for(const route of w.guaranteedLoops){let n=route.start,x=0,y=0;for(const d of route.directions){const e=w.edges.get(`${n}:${d}`);assert(e);assert.equal(S.groundSheet(w,e.to),route.sheet);n=e.to;x+=S.directions[d][0];y+=S.directions[d][1];}assert.equal(n,route.start);assert(x===route.vector[0]&&y===route.vector[1]);}
 const q=[st.id],parents=new Map([[st.id,null]]);for(const n of q)for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[n,d]);q.push(e.to);}}
 assert.equal(q.length,w.cells.reduce((a,b)=>a+b,0));assert(parents.has(w.exit));assert.equal(S.groundSheet(w,w.exit),1);assert(w.cells.reduce((a,b)=>a+b,0)<w.domain.size-w.holes.size);
 const path=[];for(let n=w.exit;parents.get(n);){const [prev,d]=parents.get(n);path.unshift(d);n=prev;}const book={charts:[],active:-1};
 for(const d of path){S.observeWalkingMap(st,book);assert(S.move(st,st.frame.indexOf(d)));}assert.equal(st.id,w.exit);
 for(const p of w.passages||[]){passages++;if(p.arms)corners++;
  for(const [n,axis] of [[p.horizontal,1],[p.vertical,0]]){assert.equal(S.groundSheet(w,n),p.baseSheet);for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);assert.equal(Boolean(e),p.arms?(n===p.horizontal?p.arms.includes(d):!p.arms.includes(d)):d%2===axis);if(e)assert.equal(w.edges.get(`${e.to}:${(d+2)%4}`)?.to,n);}
   for(const frame of [[0,1,2,3],[2,3,0,1],[1,2,3,0]]){st.id=n;st.frame=frame;const glyph=S.underpassSymbol(w,n,frame);const arms=[0,1,2,3].filter(d=>w.edges.has(`${n}:${frame[d]}`)).join('');assert.equal(glyph,{'02':'｜','13':'ー','01':'└','12':'┌','23':'┐','03':'┘'}[arms]);const v=S.nearestView(st);assert(v.some(t=>t.x===0&&t.y===0&&t.id===n));}
  }
 }
 assert((w.passages||[]).every(p=>w.domain.has(p.horizontal)&&w.domain.has(w.layouts[p.baseSheet].offset+p.cy*w.layouts[p.baseSheet].width+p.cx)));
 count++;
}
assert(passages>0);assert(corners>0);console.log(`${passages} underpasses (${corners} corners) / ${count} seeded skew-hole mazes: reproducibility, four exact winding cycles, connected floors and real walk to sheet B exit passed.`);

