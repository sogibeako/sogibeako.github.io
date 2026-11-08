const assert=require('node:assert/strict'),S=require('./connection-space.js');
let count=0;const shapes=new Set();
for(const [width,height] of [[15,15],[21,27],[40,40]])for(let seed=0;seed<12;seed++){
 const options={width,height,seed},s=S.create('underpassMaze',options),w=s.world;
 assert.deepEqual(w.cells,S.generate('underpassMaze',options).cells);shapes.add(Buffer.from(w.cells).toString('base64'));
 const queue=[w.start],paths=new Map([[w.start,[]]]);
 for(const id of queue)for(let d=0;d<4;d++){const edge=w.edges.get(`${id}:${d}`);if(!edge)continue;assert.equal(w.edges.get(`${edge.to}:${(d+2)%4}`).to,id);if(!paths.has(edge.to)){paths.set(edge.to,[...paths.get(id),d]);queue.push(edge.to);}}
 assert.equal(paths.size,w.cells.reduce((a,b)=>a+b,0));assert(paths.has(w.exit));
 for(const target of [w.horizontal,w.vertical,w.exit]){const walk=S.create('underpassMaze',options);for(const d of paths.get(target)){const [x,y]=S.directions[d],tile=S.nearestView(walk).find(t=>t.x===x&&t.y===y);assert(!tile.wall);assert(S.move(walk,d));assert.equal(walk.id,tile.id);}assert.equal(walk.id,target);}
 for(const [id,axis] of [[w.horizontal,'horizontal'],[w.vertical,'vertical']]){s.id=id;assert.equal(S.underpassAxis(s),axis);for(let d=0;d<4;d++)assert.equal(w.edges.has(`${id}:${d}`),axis==='horizontal'?d%2===1:d%2===0);}
 for(const [dx,dy,expected] of [[0,-2,'#.#\n#.#\n#.#'],[-2,0,'###\n...\n###']]){
 s.id=(w.cy+dy)*width+w.cx+dx;const view=S.nearestView(s,6),rows=[];
 for(let y=-1;y<=1;y++){let row='';for(let x=-1;x<=1;x++){const tile=view.find(p=>p.x===x-dx&&p.y===y-dy);assert(tile);row+=tile.wall?'#':'.';}rows.push(row);}assert.equal(rows.join('\n'),expected);
 }
 count++;
}
assert(shapes.size>30);
for(const options of [{width:14},{height:41},{width:NaN}])assert.throws(()=>S.generate('underpassMaze',options));
console.log(`${count} generated underpasses: determinism, distinct terrain, connected floors, playable crossing/exit routes, inverse edges and 3x3 views passed`);
