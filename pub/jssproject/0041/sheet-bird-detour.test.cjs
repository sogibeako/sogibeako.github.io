const assert=require('node:assert/strict'),P=require('./exploration-solver.js');
function fixture(){const width=20,height=5,cells=Array(width*height).fill(1),edges=new Map();for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(const [d,dx,dy]of [[0,0,-1],[1,1,0],[2,0,1],[3,-1,0]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<width&&ny>=0&&ny<height)edges.set((y*width+x)+':'+d,{to:ny*width+nx,kind:nx===10||x===10?'throat':'normal'});}return {id:0,steps:0,world:{cells,edges,exit:99},features:{bird:42,cooldown:0,hasKey:false,door:98,warps:new Map([[12,32],[32,12]]),last:null,options:{birdAcross:true}}};}
const s=fixture();let path;
for(let n=0;n<=8;n++){s.id=[0,1,21,20][n%4];s.steps=n;path=P.connectedBirdDetour(s);if(n<8)assert.equal(path,null);}
assert(path?.length>=6,'repeated four-position cycle selects a distant target');
const before=JSON.stringify(s);assert.deepEqual(P.connectedBirdDetour(s),path);assert.equal(JSON.stringify(s),before,'planning is non-mutating');
for(const d of path){const e=s.world.edges.get(s.id+':'+d);assert(e);assert.notEqual(e.to,98);assert.notEqual(e.to,42);s.id=s.features.warps.get(e.to)??e.to;}
s.steps++;assert.equal(P.connectedBirdDetour(s),null,'arrival ends detour');
const r=fixture();for(let n=0;n<=8;n++){r.id=[0,1,21,20][n%4];r.steps=n;P.connectedBirdDetour(r);}r.steps++;r.id=70;r.features.last={kind:'teleport',from:0,to:70};assert.equal(P.connectedBirdDetour(r),null,'relocation clears stale target');
const none=fixture();none.features.bird=null;assert.equal(P.connectedBirdDetour(none),null);
console.log('Sheet bird detour: repeated cycle, distant route, doors/warps, unchanged game state, arrival and relocation reset passed.');
