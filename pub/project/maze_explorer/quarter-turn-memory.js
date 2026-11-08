/* Observations in the player's walked coordinates; rendering never learns. */
(function(root){'use strict';
const Q=typeof module==='object'?require('./quarter-turn-maze.js'):root.QuarterTurnMaze;
function create(){return {tiles:new Map(),visited:new Set(),seen:new Set(),complete:false};}
function observe(memory,state,view){
 if(state.world.cells[state.id])memory.visited.add(state.id);
 for(const t of view)if(t.id>=0&&!t.wall&&state.world.cells[t.id])memory.seen.add(t.id);
 memory.complete=state.world.cells.every((floor,id)=>!floor||memory.seen.has(id));
 for(const t of view){if(t.id<0)continue;const x=state.x+t.x,y=state.y+t.y;memory.tiles.set(x+','+y,{...t,frame:[...t.frame],x,y});}
}
function compose(memory,state,view,radius=10){
 const tiles=new Map();
 if(memory.complete)for(const t of completedView(state,radius))tiles.set(t.x+','+t.y,t);
 for(const t of memory.tiles.values()){const x=t.x-state.x,y=t.y-state.y;if(Math.abs(x)<=radius&&Math.abs(y)<=radius){if(!memory.complete)tiles.set(x+','+y,{...t,x,y,remembered:true});}}
 for(const t of view)tiles.set(t.x+','+t.y,{...t,remembered:false});
 return [...tiles.values()];
}
// Trace each displayed cell independently in screen coordinates. Flood-fill
// first-arrival order otherwise makes a world-axis preference spread into whole
// wedges of the chart, and that preference changes when the observer turns.
function traceCompleted(state,x,y){
 const nx=Math.abs(x),ny=Math.abs(y),xd=x>0?1:3,yd=y>0?2:0;
 let p={id:state.id,frame:[...state.frame],seams:0},ix=0,iy=0;
 function step(at,d){if(!at)return null;const e=state.world.candidates.get(at.id+':'+at.frame[d]);return e?{id:e.to,frame:at.frame.map(n=>e.transform[n]),seams:at.seams+(e.kind!=='normal'&&e.kind!=='underpass'?1:0)}:null;}
 // A ray through an exact grid corner has two orders. Use the same physical
 // tie-break under every camera orientation, independent of floor/wall colour.
 function rank(at){return [at.seams,at.id,...[0,1,2,3].map(d=>at.frame[state.frame.indexOf(d)])];}
 function choose(a,b){if(!a)return b;if(!b)return a;const ar=rank(a),br=rank(b);for(let i=0;i<ar.length;i++)if(ar[i]!==br[i])return ar[i]<br[i]?a:b;return a;}
 while(ix<nx||iy<ny){
  const diff=(1+2*ix)*ny-(1+2*iy)*nx;
  if(diff===0){p=choose(step(step(p,xd),yd),step(step(p,yd),xd));ix++;iy++;}
  else if(diff<0){p=step(p,xd);ix++;}else{p=step(p,yd);iy++;}
  if(!p)return null;
 }
 return Q.projectTile(state,{...p,x,y,wall:!state.world.cells[p.id],remembered:true,revealed:true});
}
function completedView(state,radius){
 const result=[];for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){const t=traceCompleted(state,x,y);if(t)result.push(t);}return result;
}
const api={create,observe,compose,traceCompleted};if(typeof module==='object')module.exports=api;else root.QuarterTurnMemory=api;
})(globalThis);
