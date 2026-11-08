const assert=require('node:assert/strict'),S=require('./connection-space.js'),K=require('./klein-learning.js');
function loop(s,axis){const w=s.world,{width,height}=w.layouts[0],q=[{id:s.id,x:0,y:0,frame:s.frame,path:[]}],seen=new Set();while(q.length){const a=q.shift(),key=[a.id,a.x,a.y,a.frame].join(':');if(seen.has(key))continue;seen.add(key);if(a.id===s.id&&(axis==='x'?Math.abs(a.x)===width&&a.frame[0]!==s.frame[0]:a.x===0&&Math.abs(a.y)===height&&a.frame[0]===s.frame[0]))return a.path;for(let d=0;d<4;d++){const e=w.edges.get(a.id+':'+d);if(!e)continue;const local=a.frame.indexOf(d),[dx,dy]=S.directions[local],x=a.x+dx,y=a.y+dy;if(Math.abs(x)>width||Math.abs(y)>height)continue;q.push({id:e.to,x,y,frame:a.frame.map(v=>e.transform[v]),path:[...a.path,d]});}}throw Error('no lap');}
const s=S.create('klein');s.world.layouts=[{width:8,height:8,offset:0}];s.loopThreshold=3;s.foldLoops=true;K.start(s);
for(const axis of ['x','y'])for(let lap=1;lap<=3;lap++){for(const d of loop(s,axis)){assert(S.move(s,d,true));K.observe(s);}const evidence=K.knowledge(s).filter(p=>p.axis===axis);assert(evidence.some(p=>p.count===lap));assert.equal(evidence.some(p=>p.learned),lap===3);}
const before=JSON.stringify(K.knowledge(s));for(let i=0;i<20;i++){const d=1,e=s.world.edges.get(s.id+':'+d),back=e.transform[(d+2)%4];S.move(s,d,true);K.observe(s);S.move(s,back,true);K.observe(s);}assert.equal(JSON.stringify(K.knowledge(s)),before,'backtracking never adds a lap');
const h=K.knowledge(s).find(p=>p.axis==='x'),chart={cells:new Map([['a',{id:1,x:s.x+8,y:h.offset-s.y,frame:[0,1,2,3],wall:false}]])};
const folded=[K.memory(s,chart).find(p=>p.x===0&&p.y===0)];assert.equal(folded[0].x,0);assert.equal(folded[0].y,0);assert.deepEqual(folded[0].frame,[2,1,0,3]);
s.foldLoops=false;assert.equal(K.memory(s,chart)[0].x,8);s.foldLoops=true;s.loopThreshold=0;assert.equal(K.plan(s),null);assert(!K.knowledge(s).some(p=>p.learned));assert.equal(K.memory(s,chart)[0].x,8);s.loopThreshold=5;assert(!K.knowledge(s).some(p=>p.learned));
console.log('Klein: three actual reflected/vertical laps, no backtracking credit, learned folding and reflected symbols, OFF/5 threshold passed.');

for(const growth of ['dfs','prim','growing','kruskal']){const g=S.create('kleinMaze',{guaranteeLoops:true,width:16,height:16,seed:'learning-'+growth,growth,floorUnderpasses:2,underpassShape:'mixed'});g.loopThreshold=3;K.start(g);for(const axis of ['x','y']){for(let i=0;i<3;i++)for(const d of loop(g,axis)){assert(S.move(g,d,true));K.observe(g);}assert(K.knowledge(g).some(p=>p.axis===axis&&p.learned),growth+' '+axis);} }
console.log('Four generated Klein mazes: reflected and vertical three-lap learning with mixed underpasses passed.');

// Discontinuous displacement must not close the previous observation path or
// reuse its reflection axis in a newly positioned subjective chart.
s.loopThreshold=3;s.steps++;s.features={last:{kind:'teleport'}};K.observe(s);
assert.equal(K.knowledge(s).length,0);assert.equal(s.kleinLearning.path.length,1);
assert.equal(K.memory(s,chart)[0].x,8);
delete s.features;for(const d of loop(s,'y')){assert(S.move(s,d,true));K.observe(s);}
assert.equal(K.knowledge(s).find(p=>p.axis==='y').count,1);

// Fully recorded fundamental rectangle fills every corner of the memory window.
const t={id:0,x:0,y:0,frame:[0,1,2,3],steps:0,loopThreshold:3,world:{layouts:[{width:8,height:6}]}};
K.start(t).counts=new Map([['x:0',{axis:'x',offset:0,count:3}],['y',{axis:'y',offset:0,count:3}]]);
const full={cells:new Map()};for(let y=0;y<6;y++)for(let x=0;x<8;x++)full.cells.set(x+','+y,{x,y,id:y*8+x,wall:x===2,frame:[0,1,2,3]});
const original=JSON.stringify([...full.cells]);
for(const [cx,cy] of [[0,0],[9,-7],[-13,15]]){
 t.x=cx;t.y=cy;const tiles=K.memory(t,full).filter(p=>Math.abs(p.x)<=9&&Math.abs(p.y)<=9);assert.equal(tiles.length,19*19);
 for(const x of [-9,9])for(const y of [-9,9])assert(tiles.some(p=>p.x===x&&p.y===y),'rectangular corners remain filled');
 for(const p of tiles){const x=cx+p.x,y=cy+p.y,a=Math.floor(x/8),px=((x%8)+8)%8,py=(((Math.abs(a)%2?-y:y)%6)+6)%6;assert.equal(p.id,py*8+px);assert.equal(p.frame[0],Math.abs(a)%2?2:0);}
}
assert.equal(JSON.stringify([...full.cells]),original,'rendering never changes remembered cells');
t.x=0;t.y=0;const sparse={cells:new Map([['0,0',full.cells.get('0,0')]])};assert(K.memory(t,sparse).every(p=>p.id===0),'no unseen cells revealed');
K.start(t).counts.delete('y');assert(K.memory(t,sparse).every(p=>p.y===0),'unknown vertical period is not copied');
t.foldLoops=false;assert.equal(K.memory(t,sparse).length,1);
console.log('Klein folded memory: rectangular coverage, reflected cell/frame placement, partial learning, unknown cells and non-mutation passed.');

// Acquiring knowledge expands the existing view without relocating any record.
t.x=0;t.y=0;t.foldLoops=false;
const distant={cells:new Map([['p',{x:30,y:17,id:7,wall:true,frame:[0,1,2,3]}],['q',{x:1,y:0,id:9,wall:false,frame:[2,1,0,3]}]])};
const prior=K.memory(t,distant);t.foldLoops=true;
K.start(t).counts.set('y',{axis:'y',offset:0,count:3});const expanded=K.memory(t,distant);
for(const p of prior){const after=expanded.find(q=>q.x===p.x&&q.y===p.y);assert(after);assert.equal(after.id,p.id);assert.deepEqual(after.frame,p.frame);assert.equal(after.wall,p.wall);}
assert(expanded.length>prior.length);
