/* Per-sheet carving patterns. BranchMaze preserves topology while applying walls. */
(function(root){'use strict';
function create(size,algorithm,style,random){
 const cells=new Uint8Array(size*size),dirs=[[0,-1],[1,0],[0,1],[-1,0]],grid=style==='grid';
 cells[size+1]=1;const active=[size+1];
 function choices(id){const x=id%size,y=Math.floor(id/size),out=[];for(const [dx,dy]of dirs){const distance=grid?2:1,nx=x+dx*distance,ny=y+dy*distance;if(nx<1||ny<1||nx>=size-1||ny>=size-1)continue;const to=ny*size+nx;if(cells[to])continue;
 if(!grid){let adjacent=0;for(const [ax,ay]of dirs)if(cells[(ny+ay)*size+nx+ax])adjacent++;if(adjacent!==1)continue;}
 out.push(grid?[ (y+dy)*size+x+dx,to ]:[to]);}return out;}
 if(algorithm==='prim'){
  const frontier=choices(active[0]).map(path=>({from:active[0],path}));
  while(frontier.length){const i=Math.floor(random()*frontier.length),edge=frontier[i];frontier[i]=frontier.at(-1);frontier.pop();const path=choices(edge.from).find(p=>p.at(-1)===edge.path.at(-1));if(!path)continue;for(const id of path)cells[id]=1;for(const next of choices(path.at(-1)))frontier.push({from:path.at(-1),path:next});}
  return cells;
 }
 while(active.length){const index=algorithm==='dfs'?active.length-1:algorithm==='growing'&&random()<.7?active.length-1:Math.floor(random()*active.length),paths=choices(active[index]);if(!paths.length){active.splice(index,1);continue;}const path=paths[Math.floor(random()*paths.length)];for(const id of path)cells[id]=1;active.push(path.at(-1));}
 return cells;
}
const api={create};if(typeof module==='object')module.exports=api;else root.BranchPatterns=api;
})(globalThis);
