const a=require('node:assert/strict'),B=require('./branch-maze.js'),P=require('./crossing-autowalk.js');let count=0;
for(const size of [12,16,20])for(const sheets of [2,3])for(const pillar of ['small','grown'])for(const route of ['normal','return'])for(const direction of ['left','right','both']){
 const s=B.create({size,sheets,pillar,route,direction,seed:'directions-'+size}),w=s.world,turns=new Map([[w.start,0]]),queue=[w.start];let cycle=false;
 for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(!e)continue;const n=turns.get(id)+(e.kind==='branch'?(d===2?-1:1):0);if(turns.has(e.to)){if(turns.get(e.to)!==n)cycle=true;}else{turns.set(e.to,n);queue.push(e.to);}}
 a.equal(turns.size,w.branchStats.floors);a(P.route(s,id=>id===w.exit));if(direction==='both')a(cycle);else{a(!cycle);a(direction==='left'?turns.get(w.exit)<0:turns.get(w.exit)>0);}count++;
}
console.log(count+' combinations: reachable floors and exits; one-sided winding cannot be reversed by repeated loops; both-sided cycle preserved.');
