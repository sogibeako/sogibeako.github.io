const assert=require('node:assert/strict'),H=require('./return-enclosure.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),Save=require('./return-enclosure-save.js');
(async()=>{let cases=0;
for(const shiftX of [-2,0,2])for(const underpasses of [0,2]){
 const st=H.create('save-test',{shiftX,underpasses}),book={charts:[],active:-1};st.replayMoves=[];st.verticalCrossings=[0,0];st.loopThreshold=3;st.foldLoops=true;S.observeWalkingMap(st,book);
 const step=d=>{const before=S.position(st.world,st.id);R.start(st);assert(S.move(st,d,true));R.observe(st,S.groundSheet(st.world,st.id));st.replayMoves.push(d);const after=S.position(st.world,st.id);if(st.last.kind==='normal'&&before.sheet===after.sheet&&Math.abs(before.y-after.y)===23)st.verticalCrossings[before.sheet]++;S.observeWalkingMap(st,book);};
 const go=target=>{const q=[st.id],parents=new Map([[st.id,null]]);for(const id of q)for(let d=0;d<4;d++){const e=st.world.edges.get(`${id}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,{id,d});q.push(e.to);}}const path=[];for(let at=target;at!==st.id;){const p=parents.get(at);assert(p);path.unshift(p.d);at=p.id;}path.forEach(step);};
 const route=st.world.verticalRoutes[0];go(route.start);for(let i=0;i<3;i++)route.directions.forEach(step);for(const p of st.world.passages||[])go(p.vertical);go(st.world.exit);
 const text=Save.encode(st,7),restored=await Save.decode(text);assert.equal(restored.completed,7);for(const k of ['id','x','y','steps','frame','verticalCrossings','replayMoves'])assert.deepEqual(restored.state[k],st[k]);assert.deepEqual(R.knowledge(restored.state),R.knowledge(st));assert.deepEqual(restored.book,book);assert.equal(Save.encode(restored.state,7),text);
 const bad=JSON.parse(text);bad.stamp='wrong';await assert.rejects(Save.decode(JSON.stringify(bad)),/生成方式/);bad.stamp=JSON.parse(text).stamp;bad.moves=[9];await assert.rejects(Save.decode(JSON.stringify(bad)));cases++;
}
await assert.rejects(Save.decode('{}'));await assert.rejects(Save.decode('x'.repeat(2000001)));console.log(`${cases} save replays match maps, reflected frames, underpasses, learned periods, crossings and counters; corruption/version mismatch rejected.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
