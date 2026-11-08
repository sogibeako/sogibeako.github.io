const a=require('node:assert/strict'),Q=require('./quarter-turn-maze.js'),Save=require('./quarter-turn-save.js');
let n=0,opened=0;
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'])for(const algorithm of Q.algorithms){
 const size=[12,16,20][n%3],seed='routes-'+n,options={algorithm,seamRoutes:n%2+1,boundaryLinks:false};
 const original=Q.generate(mode,size,seed,{algorithm}),p=Q.create(mode,size,seed,options),w=p.world;
 a.equal(w.seamRoutes.length,options.seamRoutes);
 for(const r of w.seamRoutes){a(original.cells[r.from]);const e=w.edges.get(r.from+':'+r.direction);a.equal(e.kind,'twisted-boundary');a.equal(e.to,r.to);a.equal(r.path[0],r.to);
 a.equal(w.candidates.get(r.to+':'+e.transform[r.direction]).to,r.path[1]);
 for(let i=0;i<r.path.length;i++){a(w.cells[r.path[i]]);if(i)a([0,1,2,3].some(d=>{const e=w.edges.get(r.path[i-1]+':'+d);return e?.kind==='normal'&&e.to===r.path[i];}));}
 const end=r.path.at(-1);a(original.cells[end]);a(end%size>0&&end%size<size-1&&Math.floor(end/size)>0&&Math.floor(end/size)<size-1);opened+=r.added.length;}
 const floorCount=w.cells.reduce((a,b)=>a+b,0);
 for(const reverse of [false,true]){const adj=Array.from(w.cells,()=>[]);for(const [key,e]of w.edges){const id=+key.split(':')[0];adj[reverse?e.to:id].push(reverse?id:e.to);}const queue=[w.start],seen=new Set(queue);for(const id of queue)for(const to of adj[id])if(!seen.has(to)){seen.add(to);queue.push(to);}a.equal(seen.size,floorCount);}
 for(const sign of [-1,1])for(let rot=0;rot<4;rot++)a(Q.seesSelf(w,w.selfEncounter,[0,1,2,3].map(d=>(sign*d+rot+4)%4)));
 const settings={render:'hybrid',truth:false,continuous:false,autoMode:'explore',autoSpeed:'250',completed:0,totalSteps:0},data=Save.encode({mode,size,seed,terrain:'maze',...options},[],p,settings),restored=Save.decode(data);a.deepEqual(restored.state.world.cells,w.cells);a.equal(restored.options.seamRoutes,options.seamRoutes);n++;
}
a(opened>0);console.log(n+' seam route cases passed: inward entry, original interior destination, whole-path traversal, strong connectivity, self images and save replay; opened '+opened+' cells.');
