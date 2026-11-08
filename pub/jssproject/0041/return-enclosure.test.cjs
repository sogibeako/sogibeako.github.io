const assert=require('node:assert/strict'),R=require('./return-enclosure.js'),S=require('./connection-space.js');
let checked=0;
for(const verticalLoops of [0,1,3])for(const shiftX of [-2,0,2])for(const underpasses of [0,2])for(let i=0;i<5;i++){
 const st=R.create('vertical-'+i,{verticalLoops,shiftX,underpasses}),w=st.world;assert.equal(w.verticalRoutes.length,verticalLoops*2);assert.equal(w.portals.length,2);assert.equal(w.holes.size,32);
 for(const r of w.verticalRoutes){const s={...st,id:r.start,frame:[0,1,2,3],history:[]};let dy=0;for(const d of r.directions){assert(S.move(s,d));dy++;assert.equal(S.groundSheet(w,s.id),r.sheet);}assert.equal(s.id,r.start);assert(dy>24);assert(new Set(r.directions).size>=3);assert.equal(s.y,24);assert.equal(s.x,-shiftX||0);}
 const walk=(local)=>{const q=[w.start],parents=new Map([[w.start,null]]);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&(!local||S.groundSheet(w,e.to)===0)&&!parents.has(e.to)){parents.set(e.to,{id,d});q.push(e.to);}}return parents;};
 assert(!walk(true).has(w.exit));const parents=walk(false);assert.equal(parents.size,w.cells.reduce((a,b)=>a+b,0));const path=[];for(let at=w.exit;at!==w.start;){const p=parents.get(at);assert(p);path.unshift(p.d);at=p.id;}
 let transitions=0,sheet=0;const book={charts:[],active:-1};for(const d of path){assert(S.move(st,st.frame.indexOf(d)));const next=S.groundSheet(w,st.id);if(next!==sheet){transitions++;sheet=next;}S.observeWalkingMap(st,book);}assert.equal(st.id,w.exit);assert.equal(transitions,2);checked++;
}
assert.throws(()=>R.create('bad',{verticalLoops:2}));console.log(`${checked} configurations: certified vertical winding walks, all-floor connectivity, A-only exclusion and frame-relative A-B-A exit walks passed.`);
