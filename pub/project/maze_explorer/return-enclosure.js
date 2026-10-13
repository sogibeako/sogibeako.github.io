/* Example 3: one puncture per sheet; a rectangular enclosure separates A. */
(function(root){'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
const L=typeof module==='object'?require('./lattice.js'):root.TorusLattice;
const D=[[0,-1],[1,0],[0,1],[-1,0]],I=[0,1,2,3];
function create(seed='return-enclosure-1',{verticalLoops=3,shiftX=2,shiftY=0,underpasses=2,size=24,width=size,height=size,layout='original'}={}){
 if([width,height].some(n=>!Number.isInteger(n)||n<24||n>40||n%2))throw Error('大きさは24〜40の偶数で指定してください。');
 if(!['original','mirrorX','mirrorY','half','random'].includes(layout))throw Error('配置の向きが不正です。');
 if(![0,1,3].includes(verticalLoops))throw Error('上下周回路は0・1・3本から選んでください。');
 if([shiftX,shiftY].some(n=>!Number.isInteger(n)||Math.abs(n)>6||n%2))throw Error('境界のずれは−6〜6の偶数で指定してください。');
 if(!Number.isInteger(underpasses)||underpasses<0||underpasses>6)throw Error('アンダーパスは0〜6で指定してください。');
 const dual=Boolean(shiftX&&shiftY),lattice={width,height,shiftX,shiftY,determinant:width*height-shiftX*shiftY,a:[width,-shiftY],b:[-shiftX,height]};
 const points=dual?L.cells(lattice):null,minX=dual?Math.min(...points.map(p=>p.x)):0,minY=dual?Math.min(...points.map(p=>p.y)):0;
 const N=dual?Math.max(...points.map(p=>p.x))-minX+1:width,H=dual?Math.max(...points.map(p=>p.y))-minY+1:height,A=N*H;
 const hx=8-minX,hy=8-minY,left=hx+2,top=hy+2,right=dual?hx+8:N-4,bottom=dual?hy+8:H-4;
 const domain=new Set(dual?points.map(p=>(p.y-minY)*N+p.x-minX):Array.from({length:A},(_,n)=>n));
 let r=2166136261;for(const c of String(seed))r=Math.imul(r^c.charCodeAt(0),16777619);const random=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
 const mod=(n,m)=>((n%m)+m)%m,point=(x,y)=>{if(dual){const p=L.canonical(lattice,x+minX,y+minY);return {x:p.x-minX,y:p.y-minY};}return {x:mod(x+Math.floor(y/H)*shiftX,N),y:mod(y+Math.floor(x/N)*shiftY,H)};},id=(s,x,y)=>{const p=point(x,y);return s*A+p.y*N+p.x;};
 const cells=new Uint8Array(2*A),holes=new Set(),portals=[],edges=new Map(),candidates=new Map();
 for(let s=0;s<2;s++){portals.push({sheet:s,x:hx,y:hy,size:4,target:1-s});for(let y=hy;y<hy+4;y++)for(let x=hx;x<hx+4;x++)holes.add(id(s,x,y));}
 const inside=(x,y)=>x>left&&x<right&&y>top&&y<bottom;
 const wall=(x,y)=>(x===left||x===right)&&y>=top&&y<=bottom||(y===top||y===bottom)&&x>=left&&x<=right;
 for(const [sheet,part]of [[0,0],[0,1],[1,0]]){
  const valid=(x,y)=>domain.has(y*N+x)&&!holes.has(id(sheet,x,y))&&(sheet===1||!wall(x,y)&&inside(x,y)===Boolean(part));
  const nodes=new Set();for(let y=mod(1-minY,2);y<H;y+=2)for(let x=mod(1-minX,2);x<N;x+=2)if(valid(x,y))nodes.add(id(sheet,x,y));
  const first=nodes.values().next().value,seen=new Set([first]),stack=[first];cells[first]=1;
  while(stack.length){const at=stack.at(-1),x=at%N,y=Math.floor(at%A/N),choices=[];
   for(const [dx,dy]of D){const next=point(x+2*dx,y+2*dy),middle=point(x+dx,y+dy),nx=next.x,ny=next.y,mx=middle.x,my=middle.y,to=id(sheet,nx,ny),mid=id(sheet,mx,my);if(nodes.has(to)&&!seen.has(to)&&valid(mx,my))choices.push([to,mid]);}
   if(!choices.length){stack.pop();continue;}const [to,mid]=choices[Math.floor(random()*choices.length)];cells[mid]=cells[to]=1;seen.add(to);stack.push(to);
  }if(seen.size!==nodes.size)throw Error('区画の生成に失敗しました。');
 }
 // Meandering lifted paths end at (-shiftX, H), one vertical deck period.
 const verticalRoutes=[];
 for(let sheet=0;sheet<2;sheet++){
  const columns=[1,3,5];for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[columns[i],columns[j]]=[columns[j],columns[i]];}
  for(const x of columns.slice(0,verticalLoops)){
   if(dual){
    // Find a lifted path of exactly one vertical period, avoiding the enclosure
    // and puncture in every translated copy. The x displacement forces bends.
    const sx=x-minX,sy=-minY,tx=sx-shiftX,ty=sy+height,key=(x,y)=>x+','+y;
    const q=[[sx,sy]],parents=new Map([[key(sx,sy),null]]);let found=false;
    for(let i=0;i<q.length;i++){const [px,py]=q[i];if(px===tx&&py===ty){found=true;break;}
     for(const d of [2,1,3,0]){const nx=px+D[d][0],ny=py+D[d][1],k=key(nx,ny),p=point(nx,ny);
      if(parents.has(k)||Math.abs(nx-sx)>width*2||Math.abs(ny-sy)>height*2||holes.has(id(sheet,nx,ny))||wall(p.x,p.y)||inside(p.x,p.y))continue;
      parents.set(k,[px,py,d]);q.push([nx,ny]);
     }
    }
    if(!found)throw Error('ずれた周期の周回路を確保できませんでした。');
    const directions=[];for(let px=tx,py=ty;parents.get(key(px,py));){const [x0,y0,d]=parents.get(key(px,py));directions.unshift(d);px=x0;py=y0;}
    let px=sx,py=sy;cells[id(sheet,px,py)]=1;for(const d of directions){px+=D[d][0];py+=D[d][1];cells[id(sheet,px,py)]=1;}
    verticalRoutes.push({sheet,start:id(sheet,sx,sy),directions});continue;
   }
   const turn=3+2*Math.floor(random()*3),back=13+2*Math.floor(random()*3),directions=[];let px=x,py=0;cells[id(sheet,px,py)]=1;
   for(const [tx,ty]of [[x,turn],[x+2,turn],[x+2,back],[x,back],[x,H-3],[x-shiftX,H-3],[x-shiftX,H]])while(px!==tx||py!==ty){const d=px<tx?1:px>tx?3:py<ty?2:0;px+=D[d][0];py+=D[d][1];cells[id(sheet,px,py)]=1;directions.push(d);}
   verticalRoutes.push({sheet,start:id(sheet,x,0),directions});
  }
 }
 // The lower mouth has an extra cell joining its odd-grid room.
 for(let s=0;s<2;s++)cells[id(s,hx+3,hy+4)]=1;
 // Ordinary edges wrap around the torus; solid wall bands separate both A regions.
 for(let s=0;s<2;s++)for(let y=0;y<H;y++)for(let x=0;x<N;x++)for(let d=0;d<4;d++){if(!domain.has(y*N+x))continue;const from=id(s,x,y),to=id(s,x+D[d][0],y+D[d][1]),e={to,transform:[...I],kind:'normal'};candidates.set(`${from}:${d}`,e);if(cells[from]&&cells[to])edges.set(`${from}:${d}`,e);}
 for(const [x,y,d]of [[hx+1,hy-1,2],[hx+3,hy+4,0]])for(let s=0;s<2;s++){const from=id(s,x,y),e={to:id(1-s,x,y),transform:[2,1,0,3],kind:'throat'};edges.set(`${from}:${d}`,e);candidates.set(`${from}:${d}`,e);}
 const walk=(start,local=false)=>{const seen=new Map([[start,0]]),q=[start];for(const from of q)for(let d=0;d<4;d++){const e=edges.get(`${from}:${d}`);if(e&&(!local||Math.floor(e.to/A)===Math.floor(start/A))&&!seen.has(e.to)){seen.set(e.to,seen.get(from)+1);q.push(e.to);}}return {seen,last:q.at(-1)};};
 const start=walk(id(0,hx+1,hy-1),true).last,exit=walk(id(0,hx+3,hy+4),true).last,full=walk(start),front=walk(start,true),back=walk(exit,true),b=walk(id(1,hx+1,hy-1),true);
 if(front.seen.has(exit)||full.seen.size!==cells.reduce((a,b)=>a+b,0)||!full.seen.has(exit))throw Error('A→B→Aの接続検証に失敗しました。');
 for(const route of verticalRoutes){let at=route.start;for(const d of route.directions){const e=edges.get(`${at}:${d}`);if(!e||e.kind!=='normal')throw Error('上下周回路の検証に失敗しました。');at=e.to;}if(at!==route.start)throw Error('上下周回路が閉じていません。');}
 const world={wallStyle:'grid',minX,minY,lattice,verticalLoops,verticalRoutes,example:3,mode:'double',size:N,sheets:2,layouts:[{width:N,height:H,offset:0},{width:N,height:H,offset:A}],cells,holes,portals,edges,candidates,start,exit,seed:String(seed),maze:true,directed:false,domain:new Set([...domain,...[...domain].map(n=>n+A)]),stats:{front:front.seen.size,back:back.seen.size,b:b.seen.size,bSteps:b.seen.get(id(1,hx+3,hy+4)),exitSteps:full.seen.get(exit)}};
 if(underpasses){
  const keep=new Set(holes);for(let sheet=0;sheet<2;sheet++)for(let y=0;y<H;y++)for(let x=0;x<N;x++)if((sheet===0&&wall(x,y))||x===0||y===0||x===N-1||y===H-1||(x>=hx-1&&x<=hx+4&&y>=hy-1&&y<=hy+4))keep.add(id(sheet,x,y));
  if(dual)for(const n of domain){const x=n%N,y=Math.floor(n/N);if(D.some(([dx,dy])=>!domain.has((y+dy)*N+x+dx)))for(let sheet=0;sheet<2;sheet++)keep.add(sheet*A+n);}
  for(const route of verticalRoutes){let at=route.start;keep.add(at);for(const d of route.directions){at=edges.get(`${at}:${d}`).to;keep.add(at);}}
  world.underpassReach=2;world.underpassProtected=[...keep];S.addFloorUnderpasses(world,underpasses);
 }
 // Recheck the final graph, including virtual underpass floors.
 const visit=(origin,local=false)=>{const q=[origin],seen=new Map([[origin,0]]);for(const from of q)for(let d=0;d<4;d++){const e=world.edges.get(`${from}:${d}`);if(e&&(!local||S.groundSheet(world,e.to)===S.groundSheet(world,origin))&&!seen.has(e.to)){seen.set(e.to,seen.get(from)+1);q.push(e.to);}}return seen;};
 const all=visit(start);if(all.size!==world.cells.reduce((a,b)=>a+b,0)||visit(start,true).has(exit))throw Error('最終配置の区画検証に失敗しました。');
 for(const route of verticalRoutes){let at=route.start;for(const d of route.directions){const e=world.edges.get(`${at}:${d}`);if(!e)throw Error('アンダーパスで周回路が壊れました。');at=e.to;}if(at!==route.start)throw Error('周回路が閉じていません。');}
 world.stats={front:visit(start,true).size,back:visit(exit,true).size,b:visit(id(1,hx+1,hy-1),true).size,bSteps:visit(id(1,hx+1,hy-1),true).get(id(1,hx+3,hy+4)),exitSteps:all.get(exit)};
 world.generationOptions={verticalLoops,shiftX,shiftY,underpasses,size,width,height,layout};
 const chosen=layout==='random'?['original','mirrorX','mirrorY','half'][Math.floor(random()*4)]:layout;
 world.layoutVariant=chosen;
 if(chosen!=='original'){
  const flipX=chosen==='mirrorX'||chosen==='half',flipY=chosen==='mirrorY'||chosen==='half';
  const xy=(x,y)=>[flipX?N-1-x:x,flipY?H-1-y:y],dir=d=>flipX&&d%2?4-d:flipY&&d%2===0?2-d:d;
  const remap=n=>{const sheet=Math.floor(n/A),[x,y]=xy(n%N,Math.floor(n%A/N));return sheet*A+y*N+x;};
  const newCells=new Uint8Array(world.cells.length);world.cells.forEach((v,n)=>newCells[remap(n)]=v);world.cells=newCells;
  for(const name of ['holes','domain'])world[name]=new Set([...world[name]].map(remap));
  for(const name of ['edges','candidates'])world[name]=new Map([...world[name]].map(([k,e])=>{const [n,d]=k.split(':').map(Number);const transform=I.map(d=>dir(e.transform[dir(d)]));return [`${remap(n)}:${dir(d)}`,{...e,to:remap(e.to),transform}];}));
  world.portals=world.portals.map(p=>({...p,x:flipX?N-p.x-p.size:p.x,y:flipY?H-p.y-p.size:p.y}));
  world.passages=world.passages?.map(p=>{const [cx,cy]=xy(p.cx,p.cy);return {...p,cx,cy,horizontal:remap(p.horizontal),vertical:remap(p.vertical)};});
  if(world.underpassProtected)world.underpassProtected=world.underpassProtected.map(remap);
  world.verticalRoutes=world.verticalRoutes.map(p=>({...p,start:remap(p.start),directions:p.directions.map(dir)}));
  world.start=remap(start);world.exit=remap(exit);
  if(flipX!==flipY){world.lattice.shiftY=-shiftY;world.lattice.a=[width,shiftY];world.lattice.shiftX=-shiftX;world.lattice.b=[shiftX,height];}
 }
 return {world,id:world.start,frame:[...I],x:0,y:0,steps:0,history:[],last:null};
}
function crossedVertical(w,before,after,d){const l=w.lattice,dx=before.x+D[d][0]-after.x,dy=before.y+D[d][1]-after.y;return Math.abs((l.shiftY*dx+l.width*dy)/l.determinant)>.5;}
const api={create,crossedVertical};if(typeof module==='object')module.exports=api;else root.ReturnEnclosure=api;
})(globalThis);
