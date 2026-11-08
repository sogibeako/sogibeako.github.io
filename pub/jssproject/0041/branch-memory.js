/* Remember observations by sheet; project them through the current sight ray. */
(function(root){'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
const U=typeof module==='object'?require('./branch-underpasses.js'):root.BranchUnderpasses;
function trace(state,tx,ty,occlusion=false){
 const size=state.world.size,area=size*size,c=state.world.branchCenter||{x:3,y:3};
 let id=state.id%(size*size*state.world.sheets),x=id%size,y=Math.floor(id%area/size),ix=0,iy=0;
 const nx=Math.abs(tx-x),ny=Math.abs(ty-y),sx=Math.sign(tx-x),sy=Math.sign(ty-y),xd=sx>0?1:3,yd=sy>0?2:0;
 function step(id,d){let x=id%size,y=Math.floor(id%area/size),sheet=Math.floor(id/area);if(x<=c.x&&d===2&&y===c.y)sheet=(sheet+state.world.sheets-1)%state.world.sheets;if(x<=c.x&&d===0&&y===c.y+1)sheet=(sheet+1)%state.world.sheets;x+=[0,1,0,-1][d];y+=[-1,0,1,0][d];return sheet*area+y*size+x;}
 while(x!==tx||y!==ty){const diff=(1+2*ix)*ny-(1+2*iy)*nx;if(diff===0){const a=step(id,xd),b=step(id,yd);if(occlusion&&(U.appearance(state,a).wall||U.appearance(state,b).wall))return null;const ab=step(a,yd),ba=step(b,xd);if(ab!==ba)return null;id=ab;x+=sx;y+=sy;ix++;iy++;}else if(diff<0){id=step(id,xd);x+=sx;ix++;}else{id=step(id,yd);y+=sy;iy++;}if(occlusion&&U.appearance(state,id).wall&&(x!==tx||y!==ty))return null;}
 return U.appearance(state,id).id;
}
function projection(state,x,y){return trace(state,x,y);}
function observe(state,memory){const visible=[],size=state.world.size,px=state.id%size,py=Math.floor(state.id%(size*size)/size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){if(Math.max(Math.abs(x-px),Math.abs(y-py))>9)continue;const id=trace(state,x,y,true);if(id!==null){const p={x,y,id,wall:U.appearance(state,id).wall};visible.push(p);if(!p.wall||!state.world.cells[id])memory.set(id,{id,wall:p.wall});}}if(!memory.complete&&state.world.cells.every((floor,id)=>!floor||memory.has(id)))memory.complete=true;if(memory.complete)for(let id=0;id<state.world.cells.length;id++)memory.set(id,{id,wall:U.appearance(state,id).wall});return visible;}
function compose(state,memory,visible){const now=new Map(visible.map(p=>[p.x+','+p.y,p])),result=[];for(let y=0;y<state.world.size;y++)for(let x=0;x<state.world.size;x++){const p=now.get(x+','+y);if(p){result.push({...p,remembered:false});continue;}const id=projection(state,x,y),saved=id===null?null:memory.get(id);if(saved)result.push({...saved,...U.appearance(state,id),x,y,remembered:true});}return result;}
const api={projection,observe,compose};if(typeof module==='object')module.exports=api;else root.BranchMemory=api;
})(globalThis);
