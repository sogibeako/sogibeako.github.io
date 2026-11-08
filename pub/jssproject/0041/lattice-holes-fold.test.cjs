const assert=require('node:assert/strict'),F=require('./lattice-holes-fold.js'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js');
// Check exact subgroup membership against bounded exhaustive integer combinations.
for(const vectors of [[[4,0]],[[2,2]],[[4,0],[0,4]],[[4,0],[2,2]],[[6,0],[0,6],[2,2]],[[4,0],[0,4],[2,0],[0,2]]]){
 const key=F.quotient(vectors),span=new Set();function enumerate(i,x,y){if(i===vectors.length){span.add(`${x},${y}`);return;}for(let k=-6;k<=6;k++)enumerate(i+1,x+k*vectors[i][0],y+k*vectors[i][1]);}enumerate(0,0,0);
 for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++)assert.equal(key([x,y])===key([0,0]),span.has(`${x},${y}`),`${vectors}: ${x},${y}`);
}
const st=H.create({walls:false}),l=st.world.lattice;R.start(st);
const source={id:st.id,frame:[...st.frame],x:st.x+l.a[0],y:st.y+l.a[1],wall:false};
const chart={cells:new Map([[`${source.x},${source.y}`,source]])},before=JSON.stringify([...chart.cells]);
assert(!F.memory(st,chart).some(p=>p.x===0&&p.y===0));
st.loopExperience.counts.set('0:1:0',3);assert(F.memory(st,chart).some(p=>p.x===0&&p.y===0));
const alongB={cells:new Map([['b',{...source,x:l.b[0],y:l.b[1]}]])};assert(!F.memory(st,alongB).some(p=>p.x===0&&p.y===0));
st.foldLoops=false;assert(!F.memory(st,chart).some(p=>p.x===0&&p.y===0));st.foldLoops=true;
R.setThreshold(st,5);assert(!F.memory(st,chart).some(p=>p.x===0&&p.y===0));R.setThreshold(st,3);
st.loopExperience.counts.set('0:0:1',3);assert(F.memory(st,alongB).some(p=>p.x===0&&p.y===0));
assert.equal(JSON.stringify([...chart.cells]),before);
st.loopExperience.counts=new Map([['1:1:0',3]]);assert(!F.memory(st,chart).some(p=>p.x===0&&p.y===0));
st.loopExperience.counts=new Map([['0:2:0',3],['0:0:2',3]]);assert(!F.memory(st,chart).some(p=>p.x===0&&p.y===0));
st.loopExperience.counts=new Map([['0:1:1',3],['0:1:0',3]]);assert(F.memory(st,alongB).some(p=>p.x===0&&p.y===0));
console.log('Fold: exact rank-one/two/multiple-generator subgroup, unsaturated double periods, partial knowledge, other-sheet isolation, OFF/threshold reversal and non-destructive memory passed.');
