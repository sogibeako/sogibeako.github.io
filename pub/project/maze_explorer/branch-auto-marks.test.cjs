const a=require('node:assert/strict'),B=require('./branch-maze.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),Save=require('./branch-save.js');
let total=0;
for(const sheets of [2,3])for(const direction of ['left','right','both']){
 const options={size:20,sheets,route:'return',pillar:'grown',direction,algorithm:'prim',wallStyle:'grid',underpasses:2,underpassShape:'mixed',density:.45,seed:'auto-marks-'+sheets+direction,ruleMode:'warpKeys'},s=B.create(options),seen=new Set([s.id]),moves=[];
 let path;while(true){B.autoMark(s);path=P.explore(s,seen);if(path===null)break;a(path.length);const d=path[0];a(S.move(s,d));moves.push(d);seen.add(s.id);B.afterMove(s,seen);a(moves.length<20000);}
 a.equal(seen.size,P.targets(s).size);a.equal(P.warpPending(s).length,0);a(s.features.marks.size>=sheets);a(s.features.marks.size<=9);
 const counts=Array(sheets).fill(0);for(const id of s.features.marks.keys()){counts[Math.floor(id/400)%sheets]++;a(!s.features.warps.has(id));a(![s.world.start,s.world.exit,s.features.key].includes(id));a(!s.world.passages.some(p=>[p.vertical,p.horizontal].includes(id)));}a(counts.every(n=>n>0));a(counts.every(n=>n<=(sheets===3?3:5)));
 const loaded=Save.restore(Save.pack(options,moves,s,{truth:false,render:'hybrid',speed:10,policy:'explore'},{completed:0,totalSteps:moves.length,stageCleared:false})).state;a.deepEqual(loaded.features.marks,s.features.marks);a.equal(B.autoMark(loaded),B.autoMark(s));total+=s.features.marks.size;
}
const plain=B.create({size:12,sheets:2,seed:'plain'});a.equal(B.autoMark(plain),false);
console.log(`6 complete explorations: ${total} automatic marks, per-sheet reserves, item exclusions, save/continue and plain-mode exclusion passed.`);
