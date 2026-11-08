const assert=require('node:assert/strict'),K=require('./klein-biaxial.js'),U=require('./biaxial-underpasses.js'),R=require('./biaxial-rules.js');
let moved=0,leaps=0,birdLeaps=0,seams=0;
for(const algorithm of ['dfs','prim','atelier-prim','atelier-rooms']){
 const w=U.add(K.maze(K.create('free',3,-2,{width:24,height:20}),algorithm,'bird-trial'),3,'mixed'),a=R.create(w,'birds'),b=R.create(w,'birds');let p={id:w.start,frame:[2,1,0,3]};
 for(let step=1;step<=500;step++){
  const old=a.features.bird,next=R.afterMove(a,p,step),copy=R.afterMove(b,p,step);assert.deepEqual(next,copy);assert.deepEqual(a.features,b.features);assert(w.cells[next.id]);assert(w.cells[a.features.bird]);assert.notEqual(a.features.bird,w.exit);
  if(a.features.last){leaps++;assert.equal(a.features.last.kind,'teleport');assert.notEqual(next.id,p.id);assert.equal(a.features.cooldown,4);}
  else if(old!==a.features.bird){moved++;assert([0,1,2,3].some(d=>w.edges.get(old+':'+d)?.to===a.features.bird));const aa=K.baseId(w,old),bb=K.baseId(w,a.features.bird);if(Math.abs(aa%w.width-bb%w.width)>1||Math.abs(Math.floor(aa/w.width)-Math.floor(bb/w.width))>1)seams++;}
  p=next;
 }
 for(let i=0;i<100;i++){const s=R.create(w,'birds'),id=s.features.bird;const q=R.afterMove(s,{id,frame:[2,1,0,3]},i*2+1);assert.notEqual(q.id,id);assert.deepEqual(q.frame,[2,1,0,3]);if(s.features.bird!==id)birdLeaps++;}
}
assert(moved>100);assert(leaps>0);assert(seams>0);assert(birdLeaps>60&&birdLeaps<140);
console.log({moved,leaps,seams,birdLeaps,outOf:400});
