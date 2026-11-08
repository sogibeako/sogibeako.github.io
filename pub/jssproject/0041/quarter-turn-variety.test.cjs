const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),S=require('./connection-space.js'),Save=require('./quarter-turn-save.js'),Core=require('./core.js');
let count=0;const modes=['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'];
for(const mode of modes)for(const size of [12,16,20])for(const algorithm of Q.algorithms.slice(1)){
 const options={algorithm,boundaryLinks:count%2===0},seed='variety-'+size,w=Q.generate(mode,size,seed,options),floors=[...w.cells].reduce((a,b)=>a+b,0);
 const reach=reverse=>{const adj=Array.from(w.cells,()=>[]);for(const [key,e]of w.edges){const id=+key.split(':')[0];adj[reverse?e.to:id].push(reverse?id:e.to);}const q=[w.start],seen=new Set(q);for(const id of q)for(const n of adj[id])if(!seen.has(n)){seen.add(n);q.push(n);}return seen;};
 a.equal(reach(false).size,floors);a.equal(reach(true).size,floors);a(w.cells[w.exit]);
 for(const sign of [-1,1])for(let r=0;r<4;r++)a(Q.seesSelf(w,w.selfEncounter,[0,1,2,3].map(d=>(sign*d+r+4)%4)));
 for(let d=0;d<4;d++)a([...w.edges].some(([key,e])=>key.endsWith(':'+d)&&e.kind!=='normal'));
 const source=Core.generate({width:size-1,height:size-1,algorithm,seed,topology:'plane'});
 for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++)if(source.cells[y*(size-1)+x])a(w.cells[y*size+x]);
 a.deepEqual(w.cells,Q.generate(mode,size,seed,options).cells);
 if(size===12){const p=Q.create(mode,size,seed,options),moves=[];for(let i=0;i<12;i++){const d=[0,1,2,3].find(d=>p.world.edges.has(p.id+':'+p.frame[d]));a(S.move(p,d));moves.push(d);}
 const settings={render:'hybrid',truth:false,continuous:false,autoMode:'explore',autoSpeed:'250',completed:0,totalSteps:0};
 const saved=Save.encode({mode,size,seed,terrain:'maze',...options},moves,p,settings),restored=Save.decode(saved);a.equal(restored.options.algorithm,algorithm);a.equal(restored.state.id,p.id);a.deepEqual(restored.state.world.cells,p.world.cells);}
 count++;if(count%9===0)console.log(count+' cases passed');
}
a.throws(()=>Q.generate('doubleTwist',12,'bad',{algorithm:'unknown'}));
console.log(count+' cases: 9 algorithms × 5 seams × 3 sizes; strong connectivity, all seams, self images in 8 frames, source passages, deterministic generation and 45 save round trips passed.');
