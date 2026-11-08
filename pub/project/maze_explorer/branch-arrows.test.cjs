const a=require('node:assert/strict'),B=require('./branch-maze.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),A=require('./branch-arrows.js'),Save=require('./branch-save.js');
const options={sheets:3,size:12,route:'return',pillar:'grown',direction:'left',algorithm:'prim',wallStyle:'grid',underpasses:2,underpassShape:'mixed',density:.45,seed:'branch-arrows',ruleMode:'warpKeys'},s=B.create(options),moves=[],positions=new Map([...s.features.warps.keys()].map((id,i)=>[id,{x:i*24,y:0}]));
a(s.features.warps.size>0);a.equal(A.segments(s,positions).length,0);
const first=s.features.warps.keys().next().value;
for(const d of P.route(s,()=>false,first)){a(S.move(s,d));B.afterMove(s);moves.push(d);}
const seen=A.segments(s,positions);a(seen.some(e=>e.from===first&&e.to===s.features.warps.get(first)));
const hidden=new Map(positions);hidden.delete(s.features.warps.get(first));a(!A.segments(s,hidden).some(e=>e.from===first));
const data=Save.pack(options,moves,s,{truth:false,render:'ascii',speed:10,policy:'explore'},{completed:0,totalSteps:moves.length,stageCleared:false});a.deepEqual(A.segments(Save.restore(data).state,positions),seen);
for(const from of s.features.warps.keys())for(const d of P.route(s,()=>false,from)){a(S.move(s,d));B.afterMove(s);}
a.equal(A.segments(s,positions).length,s.features.warps.size);
let curves=0,heads=0;const ctx=new Proxy({quadraticCurveTo(){curves++;},fill(){heads++;}},{get:(target,key)=>target[key]??(()=>{})});A.draw(ctx,s,positions,24);a.equal(curves,s.features.warps.size);a.equal(heads,curves);
console.log('Observed directions only, hidden endpoints excluded, save replay, bidirectional completion, curved arrows and heads passed.');
