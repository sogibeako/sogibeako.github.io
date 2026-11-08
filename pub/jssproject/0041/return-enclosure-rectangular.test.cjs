const assert=require('node:assert/strict'),H=require('./return-enclosure.js'),S=require('./connection-space.js'),Save=require('./return-enclosure-save.js');
(async()=>{let count=0;const variants=new Set();
for(const [width,height] of [[24,40],[40,24],[28,34],[34,28]])for(const layout of ['original','mirrorX','mirrorY','half','random'])for(const shiftX of [-2,0,2]){
 const state=H.create('variety-'+count,{width,height,layout,shiftX,underpasses:2}),w=state.world;variants.add(w.layoutVariant);assert.equal(w.layouts[0].width,width);assert.equal(w.layouts[0].height,height);
 const walk=(local)=>{const q=[w.start],parents=new Map([[w.start,null]]);for(const n of q)for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&(!local||S.groundSheet(w,e.to)===0)&&!parents.has(e.to)){parents.set(e.to,[n,d]);q.push(e.to);}}return parents;};
 const all=walk(false);assert.equal(all.size,w.cells.reduce((a,b)=>a+b,0));assert(!walk(true).has(w.exit));
 for(const route of w.verticalRoutes){let n=route.start;for(const d of route.directions){const e=w.edges.get(`${n}:${d}`);assert(e);n=e.to;}assert.equal(n,route.start);}
 const path=[];for(let n=w.exit;all.get(n);){const [from,d]=all.get(n);path.unshift(d);n=from;}
 state.replayMoves=[];const sheets=[0];for(const d of path){assert(S.move(state,d,true));state.replayMoves.push(d);const sheet=S.groundSheet(w,state.id);if(sheets.at(-1)!==sheet)sheets.push(sheet);}assert.deepEqual(sheets,[0,1,0]);
 const saved=await Save.decode(Save.encode(state,2));assert.equal(saved.state.id,w.exit);assert.deepEqual(saved.state.world.cells,w.cells);assert.deepEqual(saved.state.world.edges,w.edges);count++;
}
assert.equal(variants.size,4);assert.throws(()=>H.create('bad',{width:25,height:30}));assert.throws(()=>H.create('bad',{width:30,height:42}));assert.throws(()=>H.create('bad',{size:25}));console.log(count+' rectangular/orientation/shift cases: full reachability, required A-B-A, preserved loops, actual exit walks and saved replay passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
