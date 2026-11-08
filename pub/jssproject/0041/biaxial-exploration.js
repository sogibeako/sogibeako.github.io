/* Experience-based local charts: never identify a global periodic rectangle. */
(function(root){'use strict';
const K=typeof module==='object'?require('./klein-biaxial.js'):root.KleinBiaxial;
const key=p=>p.id+':'+p.frame.join(',')+(p.entered===undefined?'':':'+p.entered);
function path(w,p,accept,transfer=q=>q){const queue=[p],parents=new Map([[key(p),null]]);let end=null;for(const q of queue){if(accept(q)){end=key(q);break;}for(let d=0;d<4;d++){const entry=K.step(w,q,d);if(w.cells&&!w.cells[entry.id])continue;const n=transfer(entry),k=key(n);if((!w.cells||w.cells[n.id])&&!parents.has(k)){parents.set(k,[key(q),d]);queue.push(n);}}}if(end===null)return null;const result=[];while(parents.get(end)){const [prev,d]=parents.get(end);result.push(d);end=prev;}return result.reverse();}
function axis(w,id,d){const base=K.baseId(w,id),x=base%w.width,y=Math.floor(base/w.width);return d===0&&y===0||d===2&&y===w.height-1?'y':d===1&&x===w.width-1||d===3&&x===0?'x':null;}
function cycles(w){const out={x:null,y:null};for(let id=0;id<(w.cells?.length??w.width*w.height);id++){if(w.cells&&!w.cells[id])continue;for(const d of [1,2]){const a=axis(w,id,d);if(!a||out[a])continue;const to=w.edges.get(id+':'+d).to;if(w.cells&&!w.cells[to])continue;const queue=[to],parents=new Map([[to,null]]);for(const at of queue){if(at===id)break;for(let dir=0;dir<4;dir++){const n=w.edges.get(at+':'+dir).to;if(at===to&&n===id||at===id&&n===to||w.cells&&!w.cells[n]||parents.has(n))continue;parents.set(n,[at,dir]);queue.push(n);}}if(!parents.has(id))continue;const tail=[];let at=id;while(parents.get(at)){const [prev,dir]=parents.get(at);tail.push(dir);at=prev;}out[a]={start:id,directions:[d,...tail.reverse()]};}}return out;}
function create(w,p){return {w,counts:{x:0,y:0},cycles:cycles(w),nodes:new Map(),edges:new Map(),seen:new Set(),complete:false,trail:[p.id],trailAxes:[]};}
function moved(book,from,d,to){const a=axis(book.w,from.id,from.frame[d]),i=book.trail.indexOf(to.id);book.trailAxes.push(a);if(i>=0){const closed=book.trailAxes.slice(i);if(closed.length>2)for(const ax of new Set(closed.filter(Boolean)))book.counts[ax]++;book.trail=book.trail.slice(0,i+1);book.trailAxes=book.trailAxes.slice(0,i);}else book.trail.push(to.id);}
function observe(book,view){
 for(const t of view.values())if(!t.wall&&(!book.w.cells||book.w.cells[t.id]))book.seen.add(t.id);
 book.complete=book.w.cells?book.w.cells.every((floor,id)=>!floor||book.seen.has(id)):book.seen.size===book.w.width*book.w.height;
for(const t of view.values())book.nodes.set(t.id,{wall:t.wall});for(const t of view.values()){if(t.wall)continue;for(let d=0;d<4;d++){const [dx,dy]=K.D[d],n=view.get((t.x+dx)+','+(t.y+dy)),q=K.step(book.w,t,d);if(n&&n.id===q.id&&n.frame.join()===q.frame.join())book.edges.set(t.id+':'+t.frame[d],book.w.edges.get(t.id+':'+t.frame[d]));}}}
function pending(book,threshold){return threshold?['x','y'].filter(a=>book.cycles[a]&&book.counts[a]<threshold):[];}
function loop(book,p,threshold){const a=pending(book,threshold)[0];if(!a)return null;const c=book.cycles[a],route=path(book.w,p,q=>q.id===c.start);let at=p;for(const d of route)at=K.step(book.w,at,d);for(const worldDir of c.directions){const d=at.frame.indexOf(worldDir);route.push(d);at=K.step(book.w,at,d);}return route;}
function overlay(book,p,radius,threshold){const result=new Map();if(!threshold||!['x','y'].some(a=>book.counts[a]>=threshold))return result;const queue=[{...p,x:0,y:0,dist:0}];for(const q of queue){const tile=book.nodes.get(q.id),k=q.x+','+q.y;if(!tile||q.dist>radius)continue;const old=result.get(k);if(old&&(old.dist<q.dist||old.dist===q.dist&&(old.wall||!tile.wall)))continue;result.set(k,{...q,...tile});if(tile.wall||q.dist===radius)continue;for(let d=0;d<4;d++){const dir=q.frame[d],a=axis(book.w,q.id,dir);if(a&&book.counts[a]<threshold)continue;const e=book.edges.get(q.id+':'+dir);if(!e)continue;queue.push({id:e.to,frame:q.frame.map(v=>e.t[v]),x:q.x+K.D[d][0],y:q.y+K.D[d][1],dist:q.dist+1});}}return result;}
// A representative chart of the completed topology, in the current frame.
// Retain forbidden-turn wall aliases around underpasses, and overlay live sight last.
function completedView(book,p,radius,isWall,visible){
 const result=new Map(),queue=[{...p,x:0,y:0}];
 for(const q of queue){const key=q.x+','+q.y;if(result.has(key))continue;
  result.set(key,{...q,wall:isWall(q.id),revealed:true});
  for(let d=0;d<4;d++){const x=q.x+K.D[d][0],y=q.y+K.D[d][1];
   if(Math.abs(x)>radius||Math.abs(y)>radius||result.has(x+','+y)||!book.w.edges.has(q.id+':'+q.frame[d]))continue;
   queue.push({...K.step(book.w,q,d),x,y});
  }
 }
 for(const [key,t]of visible)result.set(key,t);
 return result;
}
const api={completedView,path,axis,cycles,create,moved,observe,pending,loop,overlay};if(typeof module==='object')module.exports=api;else root.BiaxialExploration=api;
})(globalThis);
