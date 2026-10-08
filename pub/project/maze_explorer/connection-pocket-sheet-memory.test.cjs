const assert=require('node:assert/strict'),S=require('./connection-space.js');let returns=0;
for(let seed=0;seed<12;seed++){
 const st=S.create('doubleMaze',{seed,growth:'prim',wallStyle:'grid',dimensions:[[20,20],[24,18]],holeSize:3,holeRimWalls:true,floorUnderpasses:3,underpassShape:'mixed'}),w=st.world,book={charts:[],active:-1};S.observeWalkingMap(st,book);
 const main=new Set([w.start]),q=[w.start];for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&e.kind!=='throat'&&!main.has(e.to)){main.add(e.to);q.push(e.to);}}
 const target=[...w.cells.keys()].find(id=>w.cells[id]&&S.groundSheet(w,id)===0&&!main.has(id));if(target===undefined)continue;
 const queue=[w.start],parents=new Map([[w.start,null]]);for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[id,d]);queue.push(e.to);}}
 const path=[];for(let id=target;parents.get(id);){const [from,d]=parents.get(id);path.unshift(d);id=from;}
 let saved,oldIds;
 for(const d of path){if(w.edges.get(`${st.id}:${d}`).kind==='throat'&&S.groundSheet(w,st.id)===0){saved=book.charts[book.active];oldIds=new Set([...saved.cells.values()].filter(p=>!p.wall).map(p=>p.id));}
 assert(S.move(st,st.frame.indexOf(d)));const result=S.observeWalkingMap(st,book);
 if(st.last.kind==='throat'&&S.groundSheet(w,st.id)===0){assert.equal(result.chart===saved,true,`seed ${seed}: A pocket joins A chart`);for(const id of oldIds)assert([...result.chart.cells.values()].some(p=>!p.wall&&p.id===id));returns++;}
 }
 assert.equal(book.charts[book.active].cells.get(`${st.x},${st.y}`).id,target);
}
assert(returns>0);console.log(`${returns} returns into disconnected A pockets reuse the original A chart and retain remembered floors.`);
