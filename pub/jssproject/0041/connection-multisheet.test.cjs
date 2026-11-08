const assert=require('node:assert/strict'),S=require('./connection-space.js');
for(const [mode,dimensions] of [['double',[[8,10],[12,8]]],['triple',[[8,8],[14,8],[10,12]]],['triple',[[24,24],[24,23],[8,9]]]])for(const walls of [false,true]){
 const w=S.generate(mode,{dimensions,walls}),visited=new Set([w.start]),queue=[w.start];
 assert.equal(w.holes.size,mode==='double'?8:16);
 for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(!e)continue;assert(w.cells[e.to]);const back=w.edges.get(`${e.to}:${(e.transform[d]+2)%4}`);assert.equal(back.to,id);assert.deepEqual(e.transform.map(n=>back.transform[n]),[0,1,2,3]);if(!visited.has(e.to)){visited.add(e.to);queue.push(e.to);}}
 assert.equal(visited.size,w.cells.reduce((a,b)=>a+b,0));
 for(let id=0;id<w.cells.length;id++)if(w.cells[id]){const p=S.position(w,id);for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&e.kind!=='throat')assert.equal(S.position(w,e.to).sheet,p.sheet);if(!walls)assert(e,'hole rims and wrapped boundaries have no missing ports');}}
 const st=S.create(mode,{dimensions,walls});for(const id of visited){st.id=id;const tiles=S.nearestView(st);for(let d=0;d<4;d++){const [x,y]=S.directions[d],t=tiles.find(t=>t.x===x&&t.y===y);assert.equal(t.wall,!w.edges.has(`${id}:${d}`));}}
}
for(const dims of [[[8,8],[10,8],[8,8]],[[8,8],[12,12],[8,8]],[[7,8],[14,8],[8,8]],[[8,8],[14,8]]])assert.throws(()=>S.generate('triple',{dimensions:dims}));
const lap=[2,2,3,3,0,0,1,1],reverse=[3,3,2,2,1,1,0,0];
for(const route of [lap,reverse]){const st=S.create('branch3');for(let i=1;i<=3;i++){for(const d of route)assert(S.move(st,d));assert.equal(Math.floor(st.id/64),route===lap?i%3:(3-i)%3);assert.deepEqual(S.quadrantSheets(st),Array(4).fill(Math.floor(st.id/64)));}assert.equal(st.id,20);}
const st=S.create('branch3');for(let id=0;id<st.world.cells.length;id++)if(st.world.cells[id]){st.id=id;const tiles=S.branchView(st,false);for(let d=0;d<4;d++){const e=st.world.edges.get(`${id}:${d}`);if(!e)continue;const p=S.position(st.world,id),[dx,dy]=S.directions[d];assert.equal(tiles.find(t=>t.x===p.x+dx&&t.y===p.y+dy).id,e.to);}}
console.log('Variable tori: reciprocal rims, connected floors, equal holes, local previews and validation passed; 3-sheet winding and quadrant/movement agreement passed');
