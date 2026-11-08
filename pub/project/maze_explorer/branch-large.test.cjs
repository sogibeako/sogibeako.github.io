const a=require('node:assert/strict'),B=require('./branch-maze.js'),M=require('./branch-memory.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');let count=0;
for(const size of [12,16,20])for(const sheets of [2,3])for(const route of ['normal','return']){
 const s=B.create({size,sheets,route,seed:'large-'+size+'-'+sheets,density:.45}),w=s.world,area=size*size,seen=new Set([s.id]),memory=new Map();a.equal(w.branchStats.floors,P.targets(s).size);
 for(let sheet=0;sheet<sheets;sheet++)for(let i=0;i<size;i++){const o=sheet*area;a.equal(w.cells[o+i],0);a.equal(w.cells[o+(size-1)*size+i],0);a.equal(w.cells[o+i*size],0);a.equal(w.cells[o+i*size+size-1],0);}
 for(let sheet=0;sheet<sheets;sheet++)a.equal(w.cells[sheet*area+(w.branchCenter.y-1)*size+w.branchCenter.x],0);
 for(let sheet=0;sheet<sheets;sheet++){
  const start=sheet*area+w.branchCenter.y*size+w.branchCenter.x,attached=new Set([start]),queue=[start];
  for(const id of queue){const x=id%size,y=Math.floor(id%area/size);for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const nx=x+dx,ny=y+dy;if(nx<0||nx>=size||ny<0||ny>=size)continue;const next=sheet*area+ny*size+nx;if(!w.cells[next]&&!attached.has(next)){attached.add(next);queue.push(next);}}}
  a(w.pillarGrowth[sheet].length>0);for(const id of w.pillarGrowth[sheet])a(attached.has(id));
 }
 a(new Set(w.pillarGrowth.map(ids=>ids.map(id=>id%area).sort((a,b)=>a-b).join(','))).size>1);
 if(route==='return'){a(new Set(w.branchBoundary).size>1);a.equal(Math.floor(w.exit/area),0);const reached=new Set([w.start]),queue=[w.start];for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&Math.floor(e.to/area)===0&&!reached.has(e.to)){reached.add(e.to);queue.push(e.to);}}a(!reached.has(w.exit));}
 for(let n=0;n<5000;n++){M.observe(s,memory);const path=P.explore(s,seen);if(!path)break;a(S.move(s,path[0]));seen.add(s.id);}a.equal(seen.size,P.targets(s).size);for(const d of P.route(s,id=>id===w.exit))a(S.move(s,d));a.equal(s.id,w.exit);a.equal([...memory.values()].filter(p=>!p.wall).length,w.branchStats.floors);
 M.observe(s,memory);a.equal(memory.complete,true);a.equal(memory.size,w.cells.length);
 for(const d of P.route(s,id=>id===w.start))a(S.move(s,d));for(let lap=1;lap<=sheets;lap++){for(const d of s.world.branchLoops[Math.floor(s.id/(s.world.size*s.world.size))])a(S.move(s,d));a.equal(s.id===w.start,lap===sheets);}M.observe(s,memory);a.equal(memory.complete,true);a.equal(memory.size,w.cells.length);count++;
}console.log(count+' large branch layouts: all floors/memory/exit, mandatory foreign-sheet return, full sheet-cycle ring.');
