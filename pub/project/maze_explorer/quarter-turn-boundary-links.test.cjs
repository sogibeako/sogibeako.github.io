const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js');let opened=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])for(const size of [12,16,20]){
 const base=Q.generate(mode,size,'links'),w=Q.generate(mode,size,'links',{boundaryLinks:true});
 a.deepEqual(w.cells,Q.generate(mode,size,'links',{boundaryLinks:true}).cells);
 const added=[...w.cells.keys()].filter(id=>w.cells[id]&&!base.cells[id]);a.equal(added.length,w.boundaryLinksOpened);a(added.length<=Math.ceil(size/4));a([...base.cells.keys()].every(id=>!base.cells[id]||w.cells[id]));opened+=added.length;
 for(const sign of [1,-1])for(let rot=0;rot<4;rot++)a(Q.seesSelf(w,w.selfEncounter,[0,1,2,3].map(d=>(sign*d+rot+4)%4)));
 const rev=Array.from(w.cells,()=>[]);for(const [key,e]of w.edges)rev[e.to].push(Number(key.split(':')[0]));
 for(const reverse of [false,true]){const q=[w.exit],seen=new Set(q);for(const id of q)for(const n of reverse?rev[id]:[0,1,2,3].map(d=>w.edges.get(id+':'+d)?.to).filter(n=>n!==undefined))if(!seen.has(n)){seen.add(n);q.push(n);}a.equal(seen.size,w.cells.reduce((x,y)=>x+y,0));}
}
a(opened>0);console.log('15 mazes: '+opened+' added openings, deterministic, original floors retained, exit reachability and self images preserved.');
