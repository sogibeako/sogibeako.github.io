const a=require('node:assert/strict'),B=require('./branch-maze.js'),L=require('./branch-learning.js'),S=require('./connection-space.js'),Save=require('./branch-save.js');
for(const sheets of [2,3])for(const direction of ['left','right','both'])for(const route of ['normal','return']){
const options={sheets,size:12,direction,route,pillar:'grown',algorithm:'prim',wallStyle:'grid',underpasses:2,underpassShape:'mixed',density:.45,seed:'learning-'+sheets+direction+route},state=B.create(options),moves=[];L.init(state);
const move=d=>{const from=state.id,wd=state.frame[d];a(S.move(state,d));L.moved(state,from,wd);moves.push(d);};
let rounds=0;while(L.pending(state)){const path=L.route(state);a(path?.length);for(const d of path)move(d);a(++rounds<=6);}
a.equal(state.branchLearning.laps,3);const saved=Save.pack(options,moves,state,{truth:false,render:'hybrid',speed:250,policy:'explore'},{completed:0,totalSteps:moves.length,stageCleared:false}),restored=Save.restore(saved);a.equal(restored.state.branchLearning.laps,3);a.equal(restored.state.branchLearning.turn,state.branchLearning.turn);
}
// Crossing the cut and immediately returning is not a circuit.
const s=B.create({size:8,sheets:3,seed:'seam',pillar:'small',direction:'both'});const [key,e]=[...s.world.edges].find(([k,e])=>e.kind==='branch');s.id=Number(key.split(':')[0]);L.init(s);const d=Number(key.split(':')[1]),from=s.id;a(S.move(s,d));L.moved(s,from,d);const back=s.id;a(S.move(s,(d+2)%4));L.moved(s,back,(d+2)%4);a.equal(s.branchLearning.laps,0);
console.log('12 sheet/direction/route cases: three circuits, replay restoration, and seam-backtrack exclusion passed.');
