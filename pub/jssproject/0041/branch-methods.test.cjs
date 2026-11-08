const a=require('node:assert/strict'),B=require('./branch-maze.js'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js'),M=require('./branch-memory.js');let count=0;const signatures=new Set();
for(const algorithm of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const direction of ['left','right','both'])for(const route of ['normal','return']){
 const s=B.create({size:12,sheets:3,algorithm,wallStyle,direction,route,pillar:'random',seed:'methods'}),w=s.world,seen=new Set([s.id]),memory=new Map();
 a.equal(P.targets(s).size,w.branchStats.floors);a.equal(w.algorithm,algorithm);a.equal(w.wallStyle,wallStyle);signatures.add([...w.cells].join(''));
 for(let n=0;n<3000;n++){M.observe(s,memory);const path=P.explore(s,seen);if(!path)break;a(S.move(s,path[0]));seen.add(s.id);}a.equal(seen.size,w.branchStats.floors);for(const d of P.route(s,id=>id===w.exit))a(S.move(s,d));M.observe(s,memory);a(memory.complete);a.equal(s.id,w.exit);
 if(route==='return'){const reached=new Set([w.start]),q=[w.start];for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.to<144&&!reached.has(e.to)){reached.add(e.to);q.push(e.to);}}a(!reached.has(w.exit));}
 a.equal(w.branchWinding.cycle,direction==='both');count++;
}
a(signatures.size>30);console.log(count+' generation/style/direction/goal combinations: distinct terrain, all floors, memory completion, exit, winding and A isolation.');
