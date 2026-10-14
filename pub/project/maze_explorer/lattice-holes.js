/* Two punctured translation tori, independent of the rectangular maze generator. */
(function(root){
'use strict';
const L=typeof module==='object'?require('./lattice.js'):root.TorusLattice;
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
const D=[[0,-1],[1,0],[0,1],[-1,0]],I=[0,1,2,3];
function reachable(world,blocked=new Set(),onlyA=false){
 const seen=new Set([world.start]),q=[world.start];
 for(const id of q)for(let d=0;d<4;d++){const e=world.edges.get(`${id}:${d}`);if(e&&world.cells[e.to]&&!blocked.has(e.to)&&(!onlyA||S.groundSheet(world,e.to)===0)&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 return seen;
}
function verifyReturnPocket(world){
 return S.groundSheet(world,world.exit)===0&&world.start!==world.exit&&!reachable(world,new Set(),true).has(world.exit)&&reachable(world).size===world.cells.reduce((a,b)=>a+b,0);
}
function placeReturnPocket(world){
 const keep=new Set([world.start]);
 for(const r of world.guaranteedLoops){let at=r.start;keep.add(at);for(const d of r.directions){at=world.edges.get(`${at}:${d}`).to;keep.add(at);}}
 for(const exit of world.rimCells){
  if(S.groundSheet(world,exit)!==0||!world.cells[exit]||keep.has(exit))continue;
  const walls=new Set();let throat=false;
  for(let d=0;d<4;d++){const e=world.edges.get(`${exit}:${d}`);if(e){if(e.kind==='throat')throat=true;else walls.add(e.to);}}
  if(!throat||[...walls].some(n=>keep.has(n)))continue;
  const all=reachable(world,walls);if(!all.has(exit)||all.size!==world.cells.reduce((a,b)=>a+b,0)-walls.size||reachable(world,walls,true).has(exit))continue;
  for(const n of walls)world.cells[n]=0;
  for(const [key,e]of world.edges)if(walls.has(Number(key.split(':')[0]))||walls.has(e.to))world.edges.delete(key);
  world.exit=exit;world.returnPocket=true;world.returnPocketWalls=[...walls];return;
 }
 throw Error('この条件では周回路を保つ出口ポケットを配置できませんでした。別のシードを試すか「A→B→Aの配置例」でお試しください。');
}
function create({shiftX=2,shiftY=2,walls=true,maze=false,seed='skew-first',growth='walls',wallStyle='dense',periodSize=12,periodWidth=periodSize,periodHeight=periodSize,underpasses=0,underpassShape='straight',holeRimWalls=false,returnPocket=false,features={}}={}){
 if(returnPocket&&!maze)throw Error('出口ポケットは生成迷路で指定してください。');
 if(!['walls','dfs','prim','growing'].includes(growth))throw Error('未対応の生成方式です。');
 if(!['straight','mixed','corners'].includes(underpassShape))throw Error('未対応のアンダーパス形状です。');
 if(!['dense','grid'].includes(wallStyle))throw Error('未対応の壁配置です。');
 const lattice=L.create({width:periodWidth,height:periodHeight,shiftX,shiftY}),points=L.cells(lattice);
 const minX=Math.min(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),width=Math.max(...points.map(p=>p.x))-minX+1,height=Math.max(...points.map(p=>p.y))-minY+1,area=width*height;
 const layouts=[{width,height,offset:0},{width,height,offset:area}],cells=new Uint8Array(2*area),domain=new Set(),holes=new Set(),edges=new Map(),candidates=new Map(),portals=[];
 const id=(s,x,y)=>s*area+(y-minY)*width+x-minX,canonical=(s,x,y)=>{const p=L.canonical(lattice,x,y);return id(s,p.x,p.y);};
 for(let s=0;s<2;s++)for(const p of points){const n=id(s,p.x,p.y);domain.add(n);cells[n]=1;}
 const centers=points.filter(p=>{for(let y=-1;y<=2;y++)for(let x=-1;x<=2;x++){const c=L.canonical(lattice,p.x+x,p.y+y);if(c.x!==p.x+x||c.y!==p.y+y)return false;}return true;});
 if(!centers.length)throw Error('このずれでは穴の余白が足りません。');
 const cx=(lattice.a[0]+lattice.b[0])/2-1,cy=(lattice.a[1]+lattice.b[1])/2-1;
 centers.sort((a,b)=>(a.x-cx)**2+(a.y-cy)**2-(b.x-cx)**2-(b.y-cy)**2);
 const h=centers[0];
 for(let s=0;s<2;s++){portals.push({sheet:s,x:h.x-minX,y:h.y-minY,size:2,target:1-s});for(let y=0;y<2;y++)for(let x=0;x<2;x++){const n=id(s,h.x+x,h.y+y);holes.add(n);cells[n]=0;}}
 for(let s=0;s<2;s++)for(const p of points){const from=id(s,p.x,p.y);if(!cells[from])continue;for(let d=0;d<4;d++){const to=canonical(s,p.x+D[d][0],p.y+D[d][1]);if(cells[to])edges.set(`${from}:${d}`,{to,transform:[...I],kind:'normal'});}}
 for(let s=0;s<2;s++)for(let k=0;k<2;k++)for(let side=0;side<4;side++){const [x,y]=[[h.x+k,h.y-1],[h.x+2,h.y+k],[h.x+k,h.y+2],[h.x-1,h.y+k]][side];edges.set(`${id(s,x,y)}:${(side+2)%4}`,{to:id(1-s,x,y),transform:side%2?[0,3,2,1]:[2,1,0,3],kind:'throat'});}
 for(const [k,e] of edges)candidates.set(k,e);
 const start=id(0,h.x,h.y+2);
 const rimCells=new Set();for(let sheet=0;sheet<2;sheet++)for(let y=-1;y<=2;y++)for(let x=-1;x<=2;x++)if(x===-1||x===2||y===-1||y===2)rimCells.add(id(sheet,h.x+x,h.y+y));
 if(maze&&wallStyle==='grid'){
  // Parity belongs to the lattice coordinates, not the bounding-box offset.
  // Even period vectors preserve it across both skew seams.
  for(let sheet=0;sheet<2;sheet++)for(const p of points){const n=id(sheet,p.x,p.y);if(p.x%2===0&&p.y%2===0&&!rimCells.has(n))cells[n]=0;}
  for(const [k,e] of edges)if(!cells[Number(k.split(':')[0])]||!cells[e.to])edges.delete(k);
 }
 const connected=()=>{const q=[start],seen=new Set(q);for(const n of q)for(let d=0;d<4;d++){const e=edges.get(`${n}:${d}`);if(e&&cells[e.to]&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}return seen.size===cells.reduce((a,b)=>a+b,0);};
 const guaranteedLoops=[];
 if(maze){
  let rv=2166136261;for(const c of String(seed))rv=Math.imul(rv^c.charCodeAt(0),16777619);
  const random=()=>{rv=(Math.imul(rv,1664525)+1013904223)>>>0;return rv/4294967296;};
  const protectedCells=new Set([start]);
  for(let sheet=0;sheet<2;sheet++){
   for(let y=-1;y<=2;y++)for(let x=-1;x<=2;x++)if(x===-1||x===2||y===-1||y===2)protectedCells.add(id(sheet,h.x+x,h.y+y));
   for(const [axis,vector] of [['a',lattice.a],['b',lattice.b]]){
    // Search the unfolded sheet: the endpoint is exactly one lattice period away.
    const origin=[h.x,h.y+2],goal=origin.map((v,i)=>v+vector[i]),key=(x,y)=>`${x},${y}`;
    const detour=canonical(sheet,origin[0]+Math.round(vector[0]/2),origin[1]+Math.round(vector[1]/2));
    const first=key(...origin),target=key(...goal),q=[origin],parents=new Map([[first,null]]),order=[0,1,2,3];
    for(let i=3;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    for(let i=0;i<q.length&&!parents.has(target);i++){const [x,y]=q[i],from=canonical(sheet,x,y);
     for(const d of order){const nx=x+D[d][0],ny=y+D[d][1],k=key(nx,ny);if(Math.abs(nx-origin[0])>periodWidth*2+4||Math.abs(ny-origin[1])>periodHeight*2+4||parents.has(k))continue;
      const e=edges.get(`${from}:${d}`);if(!e||e.kind!=='normal'||e.to!==canonical(sheet,nx,ny)||e.to===detour)continue;
      parents.set(k,{previous:key(x,y),d});q.push([nx,ny]);
     }
    }
    if(!parents.has(target))throw Error('ずれた周期の周回路を確保できません。');
    const directions=[];for(let k=target;k!==first;){const p=parents.get(k);directions.unshift(p.d);k=p.previous;}
    const route={sheet,axis,vector:[...vector],start:canonical(sheet,...origin),directions};let n=route.start;protectedCells.add(n);
    for(const d of directions){n=edges.get(`${n}:${d}`).to;protectedCells.add(n);}if(n!==route.start)throw Error('周回路が閉じていません。');guaranteedLoops.push(route);
   }
  }
  if(growth==='walls'){
   const pool=[...domain].filter(n=>cells[n]&&!protectedCells.has(n));
   for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
   for(const n of pool){cells[n]=0;if(!connected())cells[n]=1;}
  }else{
   // The hole rims and four winding paths form the connected seed skeleton.
   // Add one-cell branches only when they have exactly one carved neighbour.
   const live=new Set(protectedCells),neighbors=n=>[...new Set(D.map((_,d)=>edges.get(`${n}:${d}`)?.to).filter(v=>v!==undefined))];
   const eligible=n=>!live.has(n)&&neighbors(n).filter(v=>live.has(v)).length===1;
   const active=[...live];for(let i=active.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[active[i],active[j]]=[active[j],active[i]];}
   if(wallStyle==='grid'){
    const extensions=n=>{const result=[];for(let d=0;d<4;d++){let at=n;const path=[];for(let step=0;step<2;step++){
     const e=edges.get(`${at}:${d}`);if(!e||e.kind!=='normal')break;at=e.to;path.push(at);
     const x=(at%area)%width+minX,y=Math.floor((at%area)/width)+minY;
     if(Math.abs(x%2)===1&&Math.abs(y%2)===1){if(!live.has(at))result.push(path);break;}
    }}return result;};
    const carve=path=>{for(const n of path)live.add(n);};
    if(growth==='prim'){
     const frontier=active.flatMap(extensions);while(frontier.length){const i=Math.floor(random()*frontier.length),path=frontier[i];frontier[i]=frontier.at(-1);frontier.pop();if(live.has(path.at(-1)))continue;carve(path);frontier.push(...extensions(path.at(-1)));}
    }else while(active.length){const i=growth==='dfs'||random()<.7?active.length-1:Math.floor(random()*active.length),choices=extensions(active[i]);if(!choices.length){active.splice(i,1);continue;}const path=choices[Math.floor(random()*choices.length)];carve(path);active.push(path.at(-1));}
   }else if(growth==='prim'){
    const frontier=active.flatMap(neighbors);
    while(frontier.length){const i=Math.floor(random()*frontier.length),n=frontier[i];frontier[i]=frontier.at(-1);frontier.pop();if(!eligible(n))continue;live.add(n);frontier.push(...neighbors(n));}
   }else while(active.length){
    const i=growth==='dfs'||random()<.7?active.length-1:Math.floor(random()*active.length),choices=neighbors(active[i]).filter(eligible);
    if(!choices.length){active.splice(i,1);continue;}const n=choices[Math.floor(random()*choices.length)];live.add(n);active.push(n);
   }
   for(const n of domain)cells[n]=live.has(n)?1:0;
  }
 }else if(walls)for(let s=0;s<2;s++)for(const p of points){if((p.x*7+p.y*11+s*5)%17!==0||Math.abs(p.x-h.x)<=3&&Math.abs(p.y-h.y)<=3)continue;const n=id(s,p.x,p.y);if(n===start||!cells[n])continue;cells[n]=0;if(!connected())cells[n]=1;}
 // Thin the already generated rim without breaking the guaranteed winding paths.
 let holeRimWallCount=0;
 if(maze&&holeRimWalls){
  const keep=new Set([start]);for(const route of guaranteedLoops){let n=route.start;keep.add(n);for(const d of route.directions){n=edges.get(`${n}:${d}`).to;keep.add(n);}}
  const pool=[...rimCells].filter(n=>cells[n]&&!keep.has(n));let rv=2166136261;
  for(const c of String(seed)+'-skew-rim')rv=Math.imul(rv^c.charCodeAt(0),16777619);
  const random=()=>{rv=(Math.imul(rv,1664525)+1013904223)>>>0;return rv/4294967296;};
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const target=Math.ceil(pool.length*.45);
  for(const n of pool){if(holeRimWallCount>=target)break;cells[n]=0;if(!connected()){cells[n]=1;continue;}holeRimWallCount++;}
 }
 for(const [k,e] of edges)if(!cells[Number(k.split(':')[0])]||!cells[e.to])edges.delete(k);
 const world={mode:'double',size:12,sheets:2,layouts,cells,holes,portals,edges,candidates,start,lattice,minX,minY,domain,maze,growth,wallStyle,underpassShape,rimCells,seed:String(seed),guaranteedLoops,holeRimWalls:Boolean(maze&&holeRimWalls),holeRimWallCount,directed:false};
 if(maze){const q=[start],seen=new Set(q);for(const n of q)for(let d=0;d<4;d++){const e=edges.get(`${n}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}world.exit=q.filter(n=>n>=area).at(-1);if(world.exit===undefined||!connected())throw Error('出口へ到達できません。');}
 if(returnPocket)placeReturnPocket(world);
 if(maze&&underpasses){
  world.underpassReach=2;
  // Keep local rewiring away from holes and the jagged representative boundary.
  const loopCells=new Set();for(const route of guaranteedLoops){let n=route.start;loopCells.add(n);for(const d of route.directions){n=edges.get(`${n}:${d}`).to;loopCells.add(n);}}
  world.underpassProtected=[...loopCells,...(world.returnPocketWalls||[]),...holes,...rimCells,...Array.from({length:cells.length},(_,n)=>n).filter(n=>!domain.has(n))];
  S.addFloorUnderpasses(world,underpasses);
  if(underpassShape!=='straight')S.bendUnderpasses(world,underpassShape);
 }
 for(const route of guaranteedLoops){let n=route.start;for(const d of route.directions){const e=world.edges.get(`${n}:${d}`);if(!e||e.kind==='throat')throw Error('周回路の接続が失われました。');n=e.to;}if(n!==route.start)throw Error('周回路が閉じていません。');}
 if(returnPocket&&!verifyReturnPocket(world))throw Error('アンダーパス追加後の出口ポケット検証に失敗しました。');
 return (typeof module==='object'?require('./sheet-features.js'):root.SheetFeatures).install({world,id:start,frame:[...I],x:0,y:0,steps:0,history:[],last:null},features);
}
const api={create,verifyReturnPocket};if(typeof module==='object')module.exports=api;else root.LatticeHoles=api;
})(globalThis);
