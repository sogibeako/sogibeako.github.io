/* Two experiments: an affine drawing of a Klein bottle, and independent seam shifts. */
(function(root){'use strict';
const D=[[0,-1],[1,0],[0,1],[-1,0]],I=[0,1,2,3],R=[2,1,0,3],mod=(a,n)=>(a%n+n)%n;
function create(mode='consistent',sx=3,sy=2,options={}){if(!['consistent','free'].includes(mode)||![sx,sy].every(n=>Number.isInteger(n)&&Math.abs(n)<=5))throw Error('Invalid experiment');const width=options.width??12,height=options.height??10;if(![width,height].every(n=>Number.isInteger(n)&&n>=10&&n<=36))throw Error('Invalid size');const edges=new Map(),id=(x,y)=>y*width+x;
 const pair=(a,d,b,t=I)=>{edges.set(a+':'+d,{to:b,t});edges.set(b+':'+t[(d+2)%4],{to:a,t});};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){if(x+1<width)pair(id(x,y),1,id(x+1,y));if(y+1<height)pair(id(x,y),2,id(x,y+1));}
 for(let y=0;y<height;y++)pair(id(width-1,y),1,id(0,mod((mode==='free'?sy:0)-y,height)),R);
 for(let x=0;x<width;x++)pair(id(x,height-1),2,id(mod(x+(mode==='free'?sx:0),width),0));
 return {mode,sx,sy,width,height,edges};}
function baseId(w,id){return w.positions?.get(id)??id%(w.width*w.height);}
function step(w,p,d){const e=w.edges.get(p.id+':'+p.frame[d]);return {id:e.to,frame:p.frame.map(v=>e.t[v])};}
function project(w,x,y){if(w.mode==='free')return [x,y];const u=x+w.sx*y/w.height;return [u,y+w.sy*u/w.width];}
function unproject(w,u,v){if(w.mode==='free')return [u,v];const y=v-w.sy*u/w.width;return [u-w.sx*y/w.height,y];}
function maze(w,algorithm='dfs',seed='free-maze'){
 const atelier=algorithm.startsWith('atelier-'),base=atelier?algorithm.slice(8):algorithm;
 if(!(atelier?['dfs','prim','growing','kruskal','hunt','wilson','rooms','division','eller']:['dfs','prim','growing']).includes(base))throw Error('Invalid algorithm');let value=2166136261;for(const c of seed)value=Math.imul(value^c.charCodeAt(0),16777619);const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
 let start=w.width+1;const cells=new Uint8Array(w.width*w.height),frontier=[start],seen=new Set();
 const neighbors=id=>[0,1,2,3].map(d=>w.edges.get(id+':'+d).to);
 if(atelier){
 const M=typeof module==='object'?require('./core.js'):root.MazeCore;
 const width=w.width%2?w.width:w.width-1,height=w.height%2?w.height:w.height-1;
 const source=M.generate({width,height,algorithm:base,seed,topology:'plane'});
 start=Math.floor(source.start/width)*w.width+source.start%width;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)cells[y*w.width+x]=source.cells[y*width+x];
 }else while(frontier.length){const i=(algorithm==='dfs'||algorithm==='growing'&&random()<.7)?frontier.length-1:Math.floor(random()*frontier.length),id=frontier.splice(i,1)[0];if(seen.has(id))continue;seen.add(id);if(id!==start&&neighbors(id).filter(n=>cells[n]).length!==1)continue;cells[id]=1;const next=neighbors(id);for(let j=next.length-1;j>0;j--){const k=Math.floor(random()*(j+1));[next[j],next[k]]=[next[k],next[j]];}frontier.push(...next.filter(n=>!seen.has(n)));}
 // Atelier interiors connect at several spread-out seams. Both ends lead back
 // into the original interior, so crossings form routes rather than dead ends.
 if(atelier){
  const interior=cells.slice();
  function joinInterior(id,inward){
   const first=w.edges.get(id+':'+inward).to,queue=[first],parents=new Map([[first,null]]);let at=first;
   for(let i=0;i<queue.length;i++){at=queue[i];if(interior[at])break;const x=at%w.width,y=Math.floor(at/w.width);
    for(const [dx,dy]of D){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w.width||ny>=w.height)continue;const n=ny*w.width+nx;if(n===id||parents.has(n))continue;parents.set(n,at);queue.push(n);}}
   if(!interior[at])throw Error('Cannot connect seam to interior');
   cells[id]=1;for(let n=at;n!==null;n=parents.get(n))cells[n]=1;
  }
  for(const axis of ['x','y']){
   const length=axis==='x'?w.height:w.width,count=Math.max(2,Math.floor(length/4));
   for(let i=0;i<count;i++){
    const low=1+Math.floor(i*(length-2)/count),high=1+Math.floor((i+1)*(length-2)/count),pos=low+Math.floor(random()*(high-low));
    const id=axis==='x'?pos*w.width+w.width-1:(w.height-1)*w.width+pos,d=axis==='x'?1:2,target=w.edges.get(id+':'+d).to;
    joinInterior(id,(d+2)%4);joinInterior(target,d);
   }
  }
 }else{
 // Keep both kinds of seam walkable. Connect each chosen seam to the existing
 // floor component through the original graph, including its reflection.
 for(const [id,d]of [[Math.floor(random()*w.height)*w.width+w.width-1,1],[(w.height-1)*w.width+Math.floor(random()*w.width),2]]){
  const target=w.edges.get(id+':'+d).to,q=[id],parents=new Map([[id,null]]);let at=id;for(let i=0;i<q.length;i++){at=q[i];if(cells[at])break;for(const n of neighbors(at))if(!parents.has(n)){parents.set(n,at);q.push(n);}}for(let n=at;n!==null;n=parents.get(n))cells[n]=1;cells[target]=1;
 }
 }
 const q=[start],distance=new Map([[start,0]]);for(const id of q)for(const n of neighbors(id))if(cells[n]&&!distance.has(n)){distance.set(n,distance.get(id)+1);q.push(n);}
 if(q.length!==cells.reduce((a,b)=>a+b,0))throw Error('Disconnected maze');return {...w,cells,start,exit:q.at(-1),seed,algorithm};
}
function solve(w,p){const key=q=>q.id+':'+q.frame.join(','),queue=[p],parents=new Map([[key(p),null]]);let found=null;for(let i=0;i<queue.length;i++){const q=queue[i];if(q.id===w.exit){found=key(q);break;}for(let d=0;d<4;d++){const next=step(w,q,d),k=key(next);if(w.cells[next.id]&&!parents.has(k)){parents.set(k,[key(q),d]);queue.push(next);}}}if(found===null)throw Error('出口へ到達できません');const route=[];while(parents.get(found)){const [previous,d]=parents.get(found);route.push(d);found=previous;}return route.reverse();}
// Topowalk-style shortest local projection. Equal-distance walls win.
function nearby(w,p,isWall,radius=6){const cells=new Map(),queue=[{...p,x:0,y:0,dist:0,wall:false}];for(let i=0;i<queue.length;i++){const a=queue[i];if(a.dist>radius)continue;const key=a.x+','+a.y,old=cells.get(key);if(old&&(old.dist<a.dist||old.dist===a.dist&&(old.wall||!a.wall)))continue;cells.set(key,a);if(a.wall||a.dist===radius)continue;for(let d=0;d<4;d++){const q=step(w,a,d);queue.push({...q,x:a.x+D[d][0],y:a.y+D[d][1],dist:a.dist+1,wall:isWall(q.id)});}}return cells;}
function remember(memory,view,x,y){for(const tile of view.values()){const key=(tile.x+x)+','+(tile.y+y),old=memory.get(key),changed=old&&(old.id!==tile.id||old.wall!==tile.wall||old.frame.join()!==tile.frame.join());memory.set(key,{...tile,x:tile.x+x,y:tile.y+y,changed:!!(changed||old?.changed)});}return memory;}
const api={baseId,nearby,remember,maze,solve,create,step,project,unproject,D};if(typeof module==='object')module.exports=api;else root.KleinBiaxial=api;
})(globalThis);
