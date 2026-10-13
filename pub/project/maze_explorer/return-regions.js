/* A-front -> B -> A-back, with two separate hole mouths per sheet. */
(function(root){'use strict';
const D=[[0,-1],[1,0],[0,1],[-1,0]],I=[0,1,2,3],N=24,A=N*N;
function create(seed='return-regions-1'){
 let r=2166136261;for(const c of String(seed))r=Math.imul(r^c.charCodeAt(0),16777619);const random=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
 const id=(s,x,y)=>s*A+((y+N)%N)*N+(x+N)%N,cells=new Uint8Array(2*A),holes=new Set(),portals=[],edges=new Map(),candidates=new Map();
 for(let s=0;s<2;s++)for(const y of [4,16]){portals.push({sheet:s,x:10,y,size:2,target:1-s});for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)holes.add(id(s,10+dx,y+dy));}
 for(const [sheet,lo,hi]of [[0,1,9],[0,13,21],[1,1,23]]){
  const nodes=new Set();for(let y=lo;y<=hi;y+=2)for(let x=1;x<N;x+=2)if(!holes.has(id(sheet,x,y)))nodes.add(id(sheet,x,y));
  const first=nodes.values().next().value,seen=new Set([first]),stack=[first];cells[first]=1;
  while(stack.length){const at=stack.at(-1),x=at%N,y=Math.floor(at%A/N),choices=[];
   for(const [dx,dy]of D){const ny=y+2*dy;if(ny<lo||ny>hi)continue;const to=id(sheet,x+2*dx,ny),mid=id(sheet,x+dx,y+dy);if(nodes.has(to)&&!seen.has(to)&&!holes.has(mid))choices.push([to,mid]);}
   if(!choices.length){stack.pop();continue;}const [to,mid]=choices[Math.floor(random()*choices.length)];cells[mid]=cells[to]=1;seen.add(to);stack.push(to);
  }if(seen.size!==nodes.size)throw Error('区画の生成に失敗しました。');
 }
 // Ordinary edges wrap around the torus; solid wall bands separate both A regions.
 for(let s=0;s<2;s++)for(let y=0;y<N;y++)for(let x=0;x<N;x++)for(let d=0;d<4;d++){const from=id(s,x,y),to=id(s,x+D[d][0],y+D[d][1]),e={to,transform:[...I],kind:'normal'};candidates.set(`${from}:${d}`,e);if(cells[from]&&cells[to])edges.set(`${from}:${d}`,e);}
 for(const y of [5,17])for(let s=0;s<2;s++){const from=id(s,9,y),e={to:id(1-s,9,y),transform:[0,3,2,1],kind:'throat'};edges.set(`${from}:1`,e);candidates.set(`${from}:1`,e);}
 const walk=(start,local=false)=>{const seen=new Map([[start,0]]),q=[start];for(const from of q)for(let d=0;d<4;d++){const e=edges.get(`${from}:${d}`);if(e&&(!local||Math.floor(e.to/A)===Math.floor(start/A))&&!seen.has(e.to)){seen.set(e.to,seen.get(from)+1);q.push(e.to);}}return {seen,last:q.at(-1)};};
 const start=walk(id(0,9,5),true).last,exit=walk(id(0,9,17),true).last,full=walk(start),front=walk(start,true),back=walk(exit,true),b=walk(id(1,9,5),true);
 if(front.seen.has(exit)||full.seen.size!==cells.reduce((a,b)=>a+b,0)||!full.seen.has(exit))throw Error('A→B→Aの接続検証に失敗しました。');
 const world={mode:'double',size:N,sheets:2,layouts:[{width:N,height:N,offset:0},{width:N,height:N,offset:A}],cells,holes,portals,edges,candidates,start,exit,seed:String(seed),maze:true,directed:false,domain:new Set(Array.from({length:2*A},(_,n)=>n)),stats:{front:front.seen.size,back:back.seen.size,b:b.seen.size,bSteps:b.seen.get(id(1,9,17)),exitSteps:full.seen.get(exit)}};
 return {world,id:start,frame:[...I],x:0,y:0,steps:0,history:[],last:null};
}
const api={create};if(typeof module==='object')module.exports=api;else root.ReturnRegions=api;
})(globalThis);
