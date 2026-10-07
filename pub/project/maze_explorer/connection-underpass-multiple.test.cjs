const assert=require('node:assert/strict'),S=require('./connection-space.js');
function reachable(w,blocked=-1){const seen=new Set([w.start]),q=[w.start];for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&e.to!==blocked&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}return seen;}
let count=0,extras=0;
for(const growth of ['dfs','frontier','growing','hunt','prim'])for(const route of ['required','loop'])for(let seed=0;seed<6;seed++){
 const opts={growth,route,seed,count:6,width:31,height:27},s=S.create('underpassMaze',opts),w=s.world;
 const again=S.generate('underpassMaze',opts);assert.deepEqual(w.cells,again.cells);assert.deepEqual([...w.edges],[...again.edges]);
 assert(w.passages.length>=1&&w.passages.length<=6);extras+=w.passages.length-1;assert.equal(reachable(w).size,w.cells.reduce((a,b)=>a+b,0));assert(reachable(w).has(w.exit));
 if(route==='required')for(const id of [w.horizontal,w.vertical])assert(!reachable(w,id).has(w.exit));
 for(const p of w.passages){for(const [id,dirs] of [[p.horizontal,[1,3]],[p.vertical,[0,2]]])for(let d=0;d<4;d++)assert.equal(w.edges.has(`${id}:${d}`),dirs.includes(d));
 for(const [dx,dy,expected] of [[0,-1,'#.#\n#.#\n#.#'],[-1,0,'###\n...\n###']]){s.id=(p.cy+dy)*opts.width+p.cx+dx;const view=S.nearestView(s,6),rows=[];for(let y=-1;y<=1;y++){let row='';for(let x=-1;x<=1;x++){const t=view.find(t=>t.x===x-dx&&t.y===y-dy);assert(t);row+=t.wall?'#':'.';}rows.push(row);}assert.equal(rows.join('\n'),expected);}}
 for(let id=0;id<w.cells.length;id++)if(w.cells[id]){s.id=id;const view=S.nearestView(s);for(let d=0;d<4;d++){const [x,y]=S.directions[d],t=view.find(t=>t.x===x&&t.y===y),e=w.edges.get(`${id}:${d}`);assert.equal(t.wall,!e);if(e){assert.equal(t.id,e.to);assert.equal(w.edges.get(`${e.to}:${(d+2)%4}`).to,id);}}}
 count++;
}
assert(extras>30);
for(const options of [{count:0},{count:7},{count:1.5},{growth:'invalid'}])assert.throws(()=>S.generate('underpassMaze',options));
console.log(`${count} multi-underpass worlds, ${extras} additional crossings: 5 methods, both routes, deterministic graph, reachability, mandatory crossing, local views and all-floor movement checked`);
