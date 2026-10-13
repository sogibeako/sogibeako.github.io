const assert=require('node:assert/strict'),H=require('./return-enclosure.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),F=require('./lattice-holes-fold.js'),vm=require('node:vm'),fs=require('node:fs');
let count=0;
for(const shiftX of [-6,2,6])for(const shiftY of [-6,2,6])for(const layout of ['original','mirrorX','mirrorY','half'])for(const frame of [[0,1,2,3],[2,1,0,3]])for(const sheet of [0,1]){
 const st=H.create('learn',{shiftX,shiftY,layout}),route=st.world.verticalRoutes.find(r=>r.sheet===sheet);st.id=route.start;st.frame=frame.slice();R.start(st);
 for(let lap=1;lap<=3;lap++){for(const d of route.directions){R.start(st);assert(S.move(st,st.frame.indexOf(d)));R.observe(st,sheet);}assert.equal(R.knowledge(st).find(k=>k.sheet===sheet&&k.a===0&&k.b===1).count,lap);assert.equal(R.knowledge(st)[0].learned,lap===3);}
 const down=S.directions[st.frame[2]],right=S.directions[st.frame[1]],b=st.world.lattice.b,dx=b[0]*right[0]+b[1]*right[1],dy=b[0]*down[0]+b[1]*down[1];const record={id:st.id,x:st.x+dx,y:st.y+dy,frame:st.frame.slice(),wall:false},chart={cells:new Map([['record',record]])},before=JSON.stringify([...chart.cells]);assert(F.memory(st,chart,11).some(p=>p.x===0&&p.y===0));st.foldLoops=false;assert(!F.memory(st,chart,11).some(p=>p.x===0&&p.y===0));st.foldLoops=true;R.setThreshold(st,5);assert(!F.memory(st,chart,11).some(p=>p.x===0&&p.y===0));assert.equal(JSON.stringify([...chart.cells]),before);count++;
}
console.log(count+" dual-axis three-lap learning and reversible folding checks passed.");
