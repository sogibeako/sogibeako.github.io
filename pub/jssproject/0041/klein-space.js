/* Small graph experiment: horizontal seam reverses Y, vertical seam preserves X. */
(function(root){
'use strict';
const M=typeof module==='object'?require('./core.js'):root.MazeCore;
const dirs={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]},opposite={N:'S',S:'N',E:'W',W:'E'};
function adjacent(world,id,direction){
 const [dx,dy]=dirs[direction],x=id%world.width,y=Math.floor(id/world.width);
 let nx=x+dx,ny=y+dy,flip=false,seam='';
 if(nx<0||nx>=world.width){nx=(nx+world.width)%world.width;ny=world.raster?(world.height-ny)%world.height:world.height-1-ny;flip=true;seam='horizontal';}
 if(ny<0||ny>=world.height){ny=(ny+world.height)%world.height;seam='vertical';}
 return {from:id,to:ny*world.width+nx,direction,flip,seam};
}
function generate(seed='klein-first',mode='open',width=12,height=10){
 if(!['open','dfs'].includes(mode)||!Number.isInteger(width)||!Number.isInteger(height)||width<4||height<4||width>40||height>40)throw Error('実験の生成条件が不正です。');
 const world={seed:String(seed),mode,width,height,passages:new Set(),start:0,exit:0};
 const connect=(id,d)=>{const e=adjacent(world,id,d);world.passages.add(`${id}:${d}`);world.passages.add(`${e.to}:${opposite[d]}`);};
 const random=M.random(String(seed)+'|klein-v1'),names=Object.keys(dirs);
 if(mode==='open')for(let id=0;id<width*height;id++)for(const d of names)connect(id,d);
 else{
  const seen=new Set([0]),stack=[0];
  while(stack.length){const id=stack.at(-1),choices=names.filter(d=>!seen.has(adjacent(world,id,d).to));
   if(!choices.length){stack.pop();continue;}
   const d=choices[Math.floor(random()*choices.length)],next=adjacent(world,id,d).to;connect(id,d);seen.add(next);stack.push(next);
  }
  // Extra passages permit loops; seam edges are candidates from the beginning.
  for(let id=0;id<width*height;id++)for(const d of ['E','S'])if(!world.passages.has(`${id}:${d}`)&&random()<.15)connect(id,d);
 }
 const queue=[0],seen=new Set(queue);
 for(let i=0;i<queue.length;i++)for(const d of names)if(world.passages.has(`${queue[i]}:${d}`)){const to=adjacent(world,queue[i],d).to;if(!seen.has(to)){seen.add(to);queue.push(to);}}
 if(seen.size!==width*height)throw Error('接続の検証に失敗しました。');
 world.exit=queue.at(-1);return world;
}
function rasterize(graph){
 const world={...graph,width:graph.width*2,height:graph.height*2,raster:true,passages:new Set()};
 const center=id=>(2*Math.floor(id/graph.width)+1)*world.width+2*(id%graph.width)+1;
 world.start=center(graph.start);world.exit=center(graph.exit);world.cells=new Uint8Array(world.width*world.height);
 if(graph.mode==='open')world.cells.fill(1);
 else for(let id=0;id<graph.width*graph.height;id++){
  const at=center(id);world.cells[at]=1;
  for(const d of Object.keys(dirs))if(graph.passages.has(`${id}:${d}`))world.cells[adjacent(world,at,d).to]=1;
 }
 for(let id=0;id<world.cells.length;id++)if(world.cells[id])for(const d of Object.keys(dirs))if(world.cells[adjacent(world,id,d).to])world.passages.add(`${id}:${d}`);
 const queue=[world.start],seen=new Set(queue);
 for(const id of queue)for(const d of Object.keys(dirs))if(world.passages.has(`${id}:${d}`)){const to=adjacent(world,id,d).to;if(!seen.has(to)){seen.add(to);queue.push(to);}}
 if(seen.size!==world.cells.reduce((sum,n)=>sum+n,0)||!seen.has(world.exit))throw Error('壁・床への変換後の接続検証に失敗しました。');
 return world;
}
function worldDirection(direction,flipped){return flipped&&direction==='N'?'S':flipped&&direction==='S'?'N':direction;}
function create(world){const state={world,id:world.start,flipped:false,x:0,y:0,steps:0,crossings:0,memory:new Map(),visible:new Set(),last:null};setReference(state);observe(state);return state;}
function move(state,direction,truth=false){
 if(!dirs[direction])return false;
 const d=truth?direction:worldDirection(direction,state.flipped);
 if(!state.world.passages.has(`${state.id}:${d}`))return false;
 const local=worldDirection(d,state.flipped),[dx,dy]=dirs[local],edge=adjacent(state.world,state.id,d);
 state.id=edge.to;state.x+=dx;state.y+=dy;if(edge.flip)state.flipped=!state.flipped;
 state.steps++;if(edge.seam)state.crossings++;state.last=edge;recordCrossing(state,edge);recordReturn(state);observe(state);return true;
}
// This is a diagnostic reference, not learned knowledge of place identity.
function setReference(state){
 state.reference={id:state.id,flipped:state.flipped,x:state.x,y:state.y,steps:state.steps};
 state.previousArrival={...state.reference};state.returnIntervals=[];
 state.crossingPath={recent:[],total:0,reduced:[]};
 state.returns=[];state.returnCounts={same:0,reversed:0};state.lastReturn=null;
}
function recordCrossing(state,edge){
 if(!edge.seam)return;
 const token={E:'a',W:'A',S:'b',N:'B'}[edge.direction],path=state.crossingPath;
 path.total++;path.recent.push(token);if(path.recent.length>40)path.recent.shift();
 const inverse={a:'A',A:'a',b:'B',B:'b'};
 if(path.reduced.at(-1)===inverse[token])path.reduced.pop();else path.reduced.push(token);
}
function pathSummary(state){
 const p=state.crossingPath,format=items=>items.map(t=>({a:'a',A:'a⁻¹',b:'b',B:'b⁻¹'})[t]).join(' → ')||'なし';
 return {total:p.total,recent:(p.total>40?'… → ':'')+format(p.recent),reduced:(p.reduced.length>40?'… → ':'')+format(p.reduced.slice(-40)),length:p.reduced.length};
}
// Group retained observations by lifted destination, not by presumed loop identity.
function returnGroups(state){
 const groups=new Map();
 for(const event of state.returns){
  const key=`${event.dx},${event.dy}:${event.kind}`;
  if(!groups.has(key))groups.set(key,{dx:event.dx,dy:event.dy,kind:event.kind,count:0,firstStep:event.step,lastStep:event.step});
  const group=groups.get(key);group.count++;group.lastStep=event.step;
 }
 return [...groups.values()].sort((a,b)=>b.lastStep-a.lastStep);
}
// Compare endpoint transformations in a common starting frame; this is not path identity.
function intervalTransform(interval){
 return {dx:interval.dx,dy:interval.fromFlipped?-interval.dy:interval.dy,flipped:interval.flipped};
}
function inverseTransform(t){return {dx:-t.dx,dy:t.flipped?t.dy:-t.dy,flipped:t.flipped};}
function intervalGroups(state){
 const groups=new Map();
 for(const e of state.returnIntervals){
  const t=intervalTransform(e);
  if(t.dx===0&&t.dy===0&&!t.flipped)continue;
  const reversed=t.dx<0||(t.dx===0&&t.dy<0),canonical=reversed?inverseTransform(t):t;
  const key=`${canonical.dx},${canonical.dy}:${canonical.flipped}`;
  if(!groups.has(key))groups.set(key,{...canonical,forward:0,reverse:0,lastStep:e.toStep});
  const group=groups.get(key);group[reversed?'reverse':'forward']++;group.lastStep=e.toStep;
 }
 return [...groups.values()].sort((a,b)=>b.lastStep-a.lastStep);
}
function recordReturn(state){
 state.lastReturn=null;
 const a=state.reference;if(state.id!==a.id)return;
 const previous=state.previousArrival,interval={fromStep:previous.steps,toStep:state.steps,steps:state.steps-previous.steps,fromFlipped:previous.flipped,dx:state.x-previous.x,dy:state.y-previous.y,flipped:state.flipped!==previous.flipped};
 interval.type=interval.dx===0&&interval.dy===0&&!interval.flipped?'revisit':'shifted';
 state.returnIntervals.push(interval);if(state.returnIntervals.length>20)state.returnIntervals.shift();
 state.previousArrival={id:state.id,x:state.x,y:state.y,flipped:state.flipped,steps:state.steps};
 const dx=state.x-a.x,dy=state.y-a.y;
 // Ordinary backtracking in the same lifted chart is not a topological circuit.
 if(dx===0&&dy===0&&state.flipped===a.flipped)return;
 const kind=state.flipped===a.flipped?'same':'reversed';
 const event={step:state.steps,elapsed:state.steps-a.steps,dx,dy,kind,path:pathSummary(state)};
 state.returnCounts[kind]++;state.returns.push(event);if(state.returns.length>20)state.returns.shift();state.lastReturn=event;
}
// Lift a local offset into the actual world, carrying the reflected frame.
function project(world,id,flipped,x,y){
 for(const [direction,count] of [[x<0?'W':'E',Math.abs(x)],[y<0?'N':'S',Math.abs(y)]])for(let i=0;i<count;i++){
  const e=adjacent(world,id,worldDirection(direction,flipped));id=e.to;flipped=flipped!==e.flip;
 }
 return {id,flipped,x,y,terrain:world.cells[id]};
}
function visibleCells(world,id,flipped,radius=6){
 const cache=new Map(),at=(x,y)=>{const key=`${x},${y}`;if(!cache.has(key))cache.set(key,project(world,id,flipped,x,y));return cache.get(key);};
 const clear=(tx,ty)=>{
  let x=0,y=0,ix=0,iy=0;const nx=Math.abs(tx),ny=Math.abs(ty),sx=Math.sign(tx),sy=Math.sign(ty);
  while(x!==tx||y!==ty){
   const comparison=(1+2*ix)*ny-(1+2*iy)*nx;
   // A ray exactly through a corner cannot pass either adjoining wall.
   if(comparison===0){if(!at(x+sx,y).terrain||!at(x,y+sy).terrain)return false;x+=sx;y+=sy;ix++;iy++;}
   else if(comparison<0){x+=sx;ix++;}else{y+=sy;iy++;}
   if(x===tx&&y===ty)return true; // The first wall itself remains visible.
   if(!at(x,y).terrain)return false;
  }
  return true;
 };
 const result=[];
 for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++)if(x*x+y*y<=radius*radius&&clear(x,y))result.push(at(x,y));
 return result;
}
function observe(state){
 if(state.world.raster){
  state.visible=new Set();
  for(const cell of visibleCells(state.world,state.id,state.flipped)){
   const p={...cell,x:state.x+cell.x,y:state.y+cell.y},key=`${p.x},${p.y}`,exits={};
   if(p.terrain)for(const d of Object.keys(dirs))exits[d]=state.world.passages.has(`${p.id}:${worldDirection(d,p.flipped)}`);
   state.visible.add(key);state.memory.set(key,{...p,exits});
  }
  return;
 }
 const queue=[{id:state.id,x:state.x,y:state.y,flipped:state.flipped,depth:0}],seen=new Set();state.visible=new Set();
 for(let i=0;i<queue.length;i++){
  const p=queue[i],key=`${p.x},${p.y}`;if(seen.has(key))continue;seen.add(key);
  const terrain=state.world.cells?state.world.cells[p.id]:1;
  const exits={};if(terrain)for(const [d,[dx,dy]] of Object.entries(dirs)){
   const wd=worldDirection(d,p.flipped),open=state.world.passages.has(`${p.id}:${wd}`);exits[d]=open;
   if((open||state.world.raster)&&p.depth<4){const e=adjacent(state.world,p.id,wd);queue.push({id:e.to,x:p.x+dx,y:p.y+dy,flipped:p.flipped!==e.flip,depth:p.depth+1});}
  }
  state.visible.add(key);state.memory.set(key,{...p,exits,terrain});
 }
}
const api={dirs,opposite,adjacent,generate,rasterize,create,move,worldDirection,project,visibleCells,setReference,pathSummary,returnGroups,intervalTransform,inverseTransform,intervalGroups};
if(typeof module==='object')module.exports=api;else root.MazeKlein=api;
})(typeof globalThis==='object'?globalThis:this);
