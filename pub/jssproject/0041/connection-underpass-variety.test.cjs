const assert=require('node:assert/strict'),S=require('./connection-space.js');
let deadends=0,cycles=0,chained=0;
const degree=(w,id)=>S.directions.filter((_,d)=>w.edges.has(`${id}:${d}`)).length;
function visit(w,start,blocked=-1){const q=[start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&e.to!==blocked&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}return seen;}
for(const growth of ['dfs','frontier','growing','hunt','prim'])for(let seed=0;seed<30;seed++){
 const opts={width:31,height:31,growth,seed,count:6,variety:'mixed'},w=S.generate('underpassMaze',opts);
 assert.deepEqual([...w.edges],[...S.generate('underpassMaze',opts).edges]);
 const n=w.cells.reduce((a,b)=>a+b,0);assert.equal(visit(w,w.start).size,n);assert(!visit(w,w.start,w.horizontal).has(w.exit));assert(!visit(w,w.start,w.vertical).has(w.exit));
 const links=w.passages.filter(p=>p.role==='link');assert.equal(w.edges.size/2-n+1,links.length);if(links.length)cycles++;
 for(const p of w.passages.filter(p=>p.role==='deadend')){const exits=[0,1,2,3].map(d=>w.edges.get(`${p.tunnel}:${d}`)).filter(Boolean);assert.equal(exits.length,2);assert(exits.some(e=>degree(w,e.to)===1));deadends++;}
 // Paths between additional tunnels remain possible without crossing the base's
 // horizontal passage: these are connected in the same exploration region.
 const extras=w.passages.slice(1);if(extras.length>1&&extras.slice(1).some(p=>visit(w,extras[0].tunnel,w.horizontal).has(p.tunnel)))chained++;
 const old=S.generate('underpassMaze',{...opts,variety:'links'});assert(old.passages.slice(1).every(p=>p.role==='link'));
}
assert(deadends>10);assert(cycles>10);assert(chained>5);
assert.throws(()=>S.generate('underpassMaze',{variety:'invalid'}));
console.log(`150 mixed worlds: ${deadends} dead-end tunnels, ${cycles} cyclic worlds, ${chained} worlds with connected additional tunnels; connectivity, mandatory passage, determinism and links-only mode passed`);
