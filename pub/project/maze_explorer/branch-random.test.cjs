const a=require('node:assert/strict'),B=require('./branch-maze.js'),P=require('./crossing-autowalk.js');
const variants=new Set();
for(let seed=0;seed<36;seed++){
 const s=B.create({size:12,sheets:3,route:'random',pillar:'random',seed:'mix-'+seed}),w=s.world;
 variants.add(w.branchPillar+':'+w.branchGoalSheet);
 a.equal(P.targets(s).size,w.branchStats.floors);a(P.route(s,id=>id===w.exit));
 if(w.branchPillar==='small')for(let sheet=0;sheet<3;sheet++)for(let y=4;y<=6;y++)for(let x=4;x<=6;x++)if(x!==5||y!==5)a.equal(w.cells[sheet*144+y*12+x],1);
 if(w.branchRoute==='return'){const reached=new Set([w.start]),q=[w.start];for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.to<144&&!reached.has(e.to)){reached.add(e.to);q.push(e.to);}}a(!reached.has(w.exit));}
}
a.equal(variants.size,6);console.log('36 random layouts: both pillar shapes, goals A/B/C, reachable exits and isolated return region.');
