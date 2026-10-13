const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js');let cases=0,seams=0;
for(const shiftX of [-4,-2,0,2,4])for(const shiftY of [-4,-2,0,2,4])for(const walls of [false,true]){
 const st=H.create({shiftX,shiftY,walls}),w=st.world;assert.equal(w.domain.size,2*(144-shiftX*shiftY));
 const q=[st.id],parents=new Map([[st.id,null]]);
 for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert.equal(w.edges.get(`${e.to}:${e.transform[(d+2)%4]}`)?.to,id);const a=S.position(w,id),b=S.position(w,e.to);if(e.kind==='normal'&&Math.abs(a.x-b.x)+Math.abs(a.y-b.y)>1)seams++;if(!parents.has(e.to)){parents.set(e.to,[id,d]);q.push(e.to);}}
 assert.equal(q.length,w.cells.reduce((a,b)=>a+b,0));
 const book={charts:[],active:-1};S.observeWalkingMap(st,book);const first=book.active,old=new Set(book.charts[first].cells.keys());
 // Enter through the adjacent hole then reverse in screen space; saved A chart is reused.
 const before={id:st.id,frame:[...st.frame]};assert(S.move(st,0));assert.equal(S.groundSheet(w,st.id),1);S.observeWalkingMap(st,book);assert(S.move(st,2));assert.equal(st.id,before.id);assert.deepEqual(st.frame,before.frame);S.observeWalkingMap(st,book);assert.equal(book.active,first);for(const key of old)assert(book.charts[first].cells.has(key));
 // Visit every reachable cell with every display frame to exercise seam and hole views.
 for(const id of q)for(const frame of [[0,1,2,3],[2,1,0,3],[1,2,3,0],[0,3,2,1]]){st.id=id;st.frame=frame;const v=S.nearestView(st,4);assert(v.some(p=>p.x===0&&p.y===0&&p.id===id));for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${frame[d]}`);if(e){const [x,y]=S.directions[d],p=v.find(p=>p.x===x&&p.y===y);assert(p&&!p.wall,'walkable neighbour must be visible');}}}
 cases++;
}
assert(seams>0);console.log(`${cases} skew-hole worlds: quotient size, reciprocal seams/holes, all-floor connectivity, A-B-A memory and four-frame visibility passed.`);
