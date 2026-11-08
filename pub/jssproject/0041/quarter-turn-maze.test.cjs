const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js');
let cases=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const original=S.generate(mode),base=Q.topology(mode,8);for(const [key,e]of original.candidates){a.equal(base.candidates.get(key).to,e.to);a.deepEqual(base.candidates.get(key).transform,e.transform);}
 for(const size of [12,16,20])for(let seed=0;seed<4;seed++){
 const w=Q.generate(mode,size,'test-'+seed);a.deepEqual(w.cells,Q.generate(mode,size,'test-'+seed).cells);a(w.cells.some(v=>!v));for(const sign of [1,-1])for(let rot=0;rot<4;rot++){const frame=[0,1,2,3].map(d=>(sign*d+rot+4)%4);a(Q.seesSelf(w,w.selfEncounter,frame),'visible self witness in all orientations');}a.notEqual(w.start,w.exit);
 const rev=Array.from(w.cells,()=>[]);for(const [key,e]of w.edges)rev[e.to].push(Number(key.split(':')[0]));
 for(const reverse of [false,true]){const seen=new Set([w.exit]),q=[w.exit];for(const id of q){const ns=reverse?rev[id]:[0,1,2,3].map(d=>w.edges.get(id+':'+d)?.to).filter(n=>n!==undefined);for(const n of ns)if(!seen.has(n)){seen.add(n);q.push(n);}}a.equal(seen.size,w.cells.reduce((x,y)=>x+y,0));}
 for(let d=0;d<4;d++)a([...w.edges].some(([k,e])=>k.endsWith(':'+d)&&e.kind!=='normal'));
 // The player sees a permutation of all four directions after every crossing.
 const p=Q.create(mode,size,'test-'+seed);for(let i=0;i<100;i++){const d=[0,1,2,3].find(d=>p.world.edges.has(p.id+':'+p.frame[d]));a(S.move(p,d));a.deepEqual([...p.frame].sort(),[0,1,2,3]);a(p.world.cells[p.id]);}cases++;
 }
}
console.log(cases+' generated mazes: original seam agreement, deterministic walls, all-floor strong connectivity, exit reachable from every floor, four open seams and framed movement passed.');
