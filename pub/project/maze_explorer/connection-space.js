(function(root){
'use strict';
const directions=[[0,-1],[1,0],[0,1],[-1,0]],names={underpassMaze:'アンダーパスの生成迷路',underpass:'極小の立体交差（アンダーパス）',crossingMaze:'立体交差の生成迷路',crossing:'立体交差（橋と地下通路）',triple:'中央の穴でつながる3トーラス',branch3:'柱の四方で風景が変わる3シート',doubleTwist:'double-twist',cwTwist:'quarter-clockwise-twist',ccwTwist:'quarter-counterclockwise-twist',plane:'平面',cylinder:'円筒',mobius:'メビウス帯',torus:'トーラス',klein:'クラインの壺',sheets:'2シートのトーラス',rotate:'90度回転する境界',chaos:'全辺90度回転（ちょっとひどい）',double:'中央の穴でつながる2トーラス',branch:'柱を周回する2シート',branch4:'柱の四方で風景が変わる2シート'};
const identity=[0,1,2,3],flip=[2,1,0,3],cw=[1,2,3,0];
function generate(mode,options={}){
 if(!Object.hasOwn(names,mode))throw Error('Unknown space');
 if(mode==='crossingMaze'){const style=options.wallStyle??'dense';if(!['dense','grid'].includes(style))throw Error('未対応の壁の配置です。');return style==='grid'?gridCrossing(options):crossingMaze(options.seed??'bridge-1',options.width??8,options.height??8,options.growth??'frontier',options.newestBias??70);}
 if(mode==='underpassMaze')return underpassWorld(options);
 if(mode==='underpass')return underpassWorld();
 if(mode==='crossing')return crossingWorld();
 if(mode==='triple'||mode==='double'&&(options.dimensions||options.holeSize!==undefined))return holeWorld(mode,options);
 const size=8,sheets=mode==='branch3'?3:['sheets','double','branch','branch4'].includes(mode)?2:1,edges=new Map(),id=(x,y,s)=>s*64+y*8+x;
 const cells=new Uint8Array(sheets*64).fill(1);
 if(['chaos','cwTwist','ccwTwist','doubleTwist'].includes(mode))for(const cell of [11,27,28,35,40])cells[cell]=0;
 if(mode==='double')for(let sheet=0;sheet<2;sheet++)for(const y of [3,4])for(const x of [3,4])cells[id(x,y,sheet)]=0;
 if(['branch','branch4','branch3'].includes(mode)){
  for(let sheet=0;sheet<2;sheet++)cells[id(3,3,sheet)]=0;
  cells[id(1,6,0)]=0;cells[id(6,1,1)]=0;if(sheets===3)cells[id(6,6,2)]=0;
 }
 const pair=(from,d,to,transform=identity,kind='normal')=>{
  const reverse=(transform[d]+2)%4,inverse=identity.map(n=>transform.indexOf(n));
  if(edges.has(`${from}:${d}`)||edges.has(`${to}:${reverse}`))throw Error('Overlapping edge');
  edges.set(`${from}:${d}`,{to,transform:[...transform],kind});edges.set(`${to}:${reverse}`,{to:from,transform:inverse,kind});
 };
 for(let s=0;s<sheets;s++)for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  if(!cells[id(x,y,s)])continue;
  if(x<7&&cells[id(x+1,y,s)])pair(id(x,y,s),1,id(x+1,y,s));if(y<7&&cells[id(x,y+1,s)]){
   const cut=y===3&&((mode==='branch'&&x>=4)||(['branch4','branch3'].includes(mode)&&x<=3));pair(id(x,y,s),2,id(x,y+1,cut?(s+sheets-1)%sheets:s),identity,cut?'branch':'normal');
  }
 }
 const candidates=new Map();
 if(['chaos','cwTwist','ccwTwist','doubleTwist'].includes(mode)){
  edges.clear();
  for(let from=0;from<64;from++)if(cells[from])for(let d=0;d<4;d++){
   const x=from%8,y=Math.floor(from/8),[dx,dy]=directions[d];let nx=x+dx,ny=y+dy,transform=identity,kind='normal';
   if(nx<0||nx>7||ny<0||ny>7){
    if(mode==='chaos'){[nx,ny]=[[0,x],[7-y,0],[7,x],[7-y,7]][d];transform=cw;}
    else if(mode==='doubleTwist'){
     if(d%2){nx=(nx+8)%8;ny=7-y;transform=flip;}else{ny=(ny+8)%8;nx=7-x;transform=[0,3,2,1];}
    }else{
     const t=7-[x,y,7-x,7-y][d],clockwise=mode==='cwTwist',toEdge=(d+(clockwise?1:3))%4;
     [nx,ny]=[[t,0],[7,t],[7-t,7],[0,7-t]][toEdge];transform=clockwise?[3,0,1,2]:cw;
    }
    kind=mode==='chaos'?'clockwise':'twisted-boundary';
   }
   const edge={to:ny*8+nx,transform:[...transform],kind};candidates.set(`${from}:${d}`,edge);if(cells[edge.to])edges.set(`${from}:${d}`,edge);
  }
 }else if(mode==='rotate')for(let i=0;i<8;i++){
  pair(id(7,i,0),1,id(7-i,0,0),cw);pair(id(0,i,0),3,id(7-i,7,0),cw);
 }else{
  if(!['plane','branch','branch4','branch3'].includes(mode))for(let s=0;s<sheets;s++)for(let y=0;y<8;y++){
   const reflected=mode==='mobius'||mode==='klein';pair(id(7,y,s),1,id(0,reflected?7-y:y,mode==='sheets'?1-s:s),reflected?flip:identity);
  }
  if(['torus','klein','sheets','double'].includes(mode))for(let s=0;s<sheets;s++)for(let x=0;x<8;x++)pair(id(x,7,s),2,id(x,0,s));
 }
 if(mode==='double')for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(cells[id(x,y,0)])for(let d=0;d<4;d++){
  const [dx,dy]=directions[d],nx=x+dx,ny=y+dy;
  if(nx>=0&&nx<8&&ny>=0&&ny<8&&!cells[id(nx,ny,0)])pair(id(x,y,0),d,id(x,y,1),d%2===0?flip:[0,3,2,1],'throat');
 }
 // Add obstacles after constructing the seams, retaining their blocked destinations for the chart.
 const holes=new Set();if(mode==='double')for(let i=0;i<cells.length;i++)if(!cells[i])holes.add(i);
 if(options.walls&&!['branch','branch4','branch3','chaos','doubleTwist','cwTwist','ccwTwist'].includes(mode)){
  for(const [key,edge] of edges)candidates.set(key,edge);
  for(let sheet=0;sheet<sheets;sheet++)for(const cell of [18,21,46])cells[sheet*64+cell]=0;
  for(const [key,edge] of edges)if(!cells[Number(key.split(':')[0])]||!cells[edge.to])edges.delete(key);
 }
 return {mode,size,sheets,edges,cells,candidates,holes,directed:['chaos','cwTwist','ccwTwist'].includes(mode),start:['branch4','branch3'].includes(mode)?id(4,2,0):mode==='branch'?id(2,2,0):id(1,1,0)};
}
// Only the centre has two independent passage cells; all other floor is shared.
function underpassWorld(options=null){
 const width=options?.width??(options?21:9),height=options?.height??(options?21:9);
 if(options&&![width,height].every(n=>Number.isInteger(n)&&n>=15&&n<=40))throw Error('アンダーパス迷路の幅・高さは15〜40にしてください。');
 const seed=String(options?.seed??'underpass-1');let value=2166136261;for(const c of seed)value=Math.imul(value^c.charCodeAt(0),16777619);
 const rng=()=>{value+=0x6D2B79F5;let t=Math.imul(value^value>>>15,1|value);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 const cx=options?4+Math.floor(rng()*(width-8)):4,cy=options?4+Math.floor(rng()*(height-8)):4,area=width*height,cells=new Uint8Array(area*2),edges=new Map(),candidates=new Map(),horizontal=cy*width+cx,vertical=area+horizontal;
 const growth=options?.growth??'dfs',requested=options?.count??3;
 if(!['dfs','frontier','growing','hunt','prim'].includes(growth))throw Error('未対応の枝道生成方式です。');
 if(!Number.isInteger(requested)||requested<1||requested>6)throw Error('交差数は1〜6にしてください。');
 const route=options?.route??'required';if(options&&!['required','loop'].includes(route))throw Error('未対応の交差経路です。');
 const required=Boolean(options)&&route==='required',radius=options?2:3;
 if(required){
  const rx=2+Math.floor(rng()*Math.min(cx-3,7)),ry=2+Math.floor(rng()*Math.min(height-cy-4,7));
  for(let y=cy-2;y<=cy+ry;y++)cells[y*width+cx]=1;
  for(let x=cx-rx;x<=cx;x++)cells[(cy+ry)*width+x]=1;
  for(let y=cy;y<=cy+ry;y++)cells[y*width+cx-rx]=1;
  for(let x=cx-rx;x<=cx+2;x++)cells[cy*width+x]=1;
 }else for(let y=cy-radius;y<=cy+radius;y++)for(let x=cx-radius;x<=cx+radius;x++)if(Math.abs(x-cx)===radius||Math.abs(y-cy)===radius||x===cx||y===cy)cells[y*width+x]=1;
 cells[vertical]=1;
 if(options){
  const neighbors=id=>directions.map(([dx,dy])=>[id%width+dx,Math.floor(id/width)+dy]).filter(([x,y])=>x>0&&x<width-1&&y>0&&y<height-1).map(([x,y])=>y*width+x);
  const eligible=id=>!cells[id]&&!(Math.abs(id%width-cx)===1&&Math.abs(Math.floor(id/width)-cy)===1)&&neighbors(id).filter(n=>cells[n]).length===1;
  const roots=[];for(let id=0;id<area;id++)if(cells[id])roots.push(id);
  for(let i=roots.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[roots[i],roots[j]]=[roots[j],roots[i]];}
  if(growth==='dfs')for(const root of roots){const stack=[root];while(stack.length){const choices=neighbors(stack[stack.length-1]).filter(eligible);if(!choices.length){stack.pop();continue;}const next=choices[Math.floor(rng()*choices.length)];cells[next]=1;stack.push(next);}}
  else if(growth==='growing'){const active=[...roots];while(active.length){const i=rng()<.7?active.length-1:Math.floor(rng()*active.length),choices=neighbors(active[i]).filter(eligible);if(!choices.length){active.splice(i,1);continue;}const n=choices[Math.floor(rng()*choices.length)];cells[n]=1;active.push(n);}}
  else if(growth==='hunt'){let current=roots[0];while(true){const choices=neighbors(current).filter(eligible);let n=choices.length?choices[Math.floor(rng()*choices.length)]:-1;if(n<0)for(let id=0;id<area;id++)if(id%width>0&&id%width<width-1&&Math.floor(id/width)>0&&Math.floor(id/width)<height-1&&eligible(id)){n=id;break;}if(n<0)break;cells[n]=1;current=n;}}
  else {const pending=new Map(),expose=id=>{for(const n of neighbors(id))if(eligible(n)&&!pending.has(n))pending.set(n,rng());};roots.forEach(expose);while(pending.size){const ids=[...pending.keys()];let n=ids[Math.floor(rng()*ids.length)];if(growth==='prim')n=ids.reduce((a,b)=>pending.get(a)<pending.get(b)?a:b);pending.delete(n);if(!eligible(n))continue;cells[n]=1;expose(n);}}

 }
 for(let from=0;from<area;from++)if(cells[from])for(let d=0;d<4;d++){
  const [dx,dy]=directions[d],to=from+dy*width+dx;
  if(from===horizontal&&d%2===0)continue;
  const target=to===horizontal&&d%2===0?vertical:to,e={to:target,transform:[...identity],kind:target===vertical?'underpass':'normal'};
  candidates.set(`${from}:${d}`,e);if(cells[target])edges.set(`${from}:${d}`,e);
 }
 for(const [d,to] of [[0,horizontal-width],[2,horizontal+width]]){const e={to,transform:[...identity],kind:'underpass'};edges.set(`${vertical}:${d}`,e);candidates.set(`${vertical}:${d}`,e);}
 const search=(start,blocked=-1)=>{const queue=[start],seen=new Set(queue);for(const id of queue)for(let d=0;d<4;d++){const e=edges.get(`${id}:${d}`);if(e&&e.to!==blocked&&!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}return {seen,last:queue[queue.length-1]};};
 if(search(horizontal).seen.size!==cells.reduce((a,b)=>a+b,0))throw Error('Disconnected underpass');
 const start=options?(required?search(horizontal-width,vertical).last:search(horizontal).last):22;
 const exit=options?(required?search(horizontal+1,horizontal).last:search(start).last):67;
 // Both distinct centre cells must be unavoidable on every entrance-to-exit route.
 if(required&&(search(start,vertical).seen.has(exit)||search(start,horizontal).seen.has(exit)))throw Error('Underpass can be bypassed');

 const passages=[{cx,cy,horizontal,vertical}];
 if(options&&requested>1){
  const possible=[];for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++)possible.push({x,y});
  for(let i=possible.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[possible[i],possible[j]]=[possible[j],possible[i]];}
  for(const {x,y} of possible){if(passages.length>=requested)break;
   if(passages.some(p=>Math.max(Math.abs(p.cx-x),Math.abs(p.cy-y))<4))continue;
   const h=y*width+x,v=area+h;
   // Tunnel under a straight corridor, joining existing floors two cells away.
   const horizontalRoad=cells[h]&&cells[h-1]&&cells[h+1]&&!cells[h-width]&&!cells[h+width]&&cells[h-2*width]&&cells[h+2*width];
   const verticalRoad=cells[h]&&cells[h-width]&&cells[h+width]&&!cells[h-1]&&!cells[h+1]&&cells[h-2]&&cells[h+2];
   if(!horizontalRoad&&!verticalRoad)continue;
   if([-width-1,-width+1,width-1,width+1].some(d=>cells[h+d]))continue;
   const added=horizontalRoad?[h-width,h+width]:[h-1,h+1];
   const savedEdges=new Map(edges),savedCandidates=new Map(candidates);
   for(const id of [...added,v])cells[id]=1;
   const local=[h,v,...added,...[h-width,h+width,h-1,h+1,h-2*width,h+2*width,h-2,h+2]];
   for(const id of new Set(local))if(cells[id])for(let d=0;d<4;d++){
    edges.delete(`${id}:${d}`);candidates.delete(`${id}:${d}`);
    if(id===h&&d%2===0||id===v&&d%2===1)continue;
    const base=id===v?h:id,[dx,dy]=directions[d],to=base+dy*width+dx,target=to===h&&d%2===0?v:to;
    const e={to:target,transform:[...identity],kind:id===v||target===v?'underpass':'normal'};
    candidates.set(`${id}:${d}`,e);if(cells[target])edges.set(`${id}:${d}`,e);
   }
   if(search(start).seen.size!==cells.reduce((a,b)=>a+b,0)||required&&(search(start,vertical).seen.has(exit)||search(start,horizontal).seen.has(exit))){
    for(const id of [...added,v])cells[id]=0;edges.clear();candidates.clear();for(const [k,e] of savedEdges)edges.set(k,e);for(const [k,e] of savedCandidates)candidates.set(k,e);continue;
   }
   passages.push({cx:x,cy:y,horizontal:h,vertical:v});
  }
 }

 return {mode:options?'underpassMaze':'underpass',seed,growth,requestedCount:options?requested:1,passages,route:required?'required':'loop',size:width,sheets:2,layouts:[{width,height,offset:0},{width,height,offset:area}],cells,edges,candidates,holes:new Set(),crossings:new Set(passages.flatMap(p=>[p.horizontal,p.vertical])),stairs:new Set(),directed:false,start,exit,horizontal,vertical,cx,cy};
}
function underpassAxis(state,passage=null){
 if(passage)state={...state,world:{...state.world,...passage}};
 if(state.id===state.world.vertical)return 'vertical';if(state.id===state.world.horizontal)return 'horizontal';
 const p=position(state.world,state.id);
 // Compare distance to the N/S and E/W entrances; horizontal wins exact ties.
 return Math.abs(p.y-state.world.cy)>Math.abs(p.x-state.world.cx)?'vertical':'horizontal';
}
function underpassHidden(world,id,axis){
 const p=position(world,id);if(Math.abs(p.x-world.cx)>1||Math.abs(p.y-world.cy)>1)return false;
 return axis==='vertical'?p.x!==world.cx||id===world.horizontal:p.y!==world.cy||id===world.vertical;
}
function crossingWorld(width=8,height=8){
 if(![width,height].every(n=>Number.isInteger(n)&&n>=8&&n<=40))throw Error('立体交差迷路の幅・高さは8〜40の整数にしてください。');
 const area=width*height,cx=Math.floor((width-1)/2),cy=Math.floor((height-1)/2),id=(sheet,x,y)=>sheet*area+y*width+x;
 const layouts=[{width,height,offset:0},{width,height,offset:area}];
 const cells=new Uint8Array(area*2),edges=new Map(),candidates=new Map(),stairs=new Set([id(0,1,2),id(1,1,1),id(0,width-2,height-3),id(1,width-2,height-2)]);
 const floor=(sheet,x,y)=>{cells[id(sheet,x,y)]=1;};
 for(let x=1;x<=width-2;x++)floor(0,x,cy);
 for(let y=2;y<cy;y++)floor(0,1,y);for(let y=cy+1;y<=height-3;y++)floor(0,width-2,y);
 for(let y=1;y<=height-2;y++)floor(1,cx,y);
 for(let x=1;x<=cx;x++)floor(1,x,1);
 for(let x=cx;x<=width-2;x++)floor(1,x,height-2);
 for(let from=0;from<area*2;from++)if(cells[from])for(let d=0;d<4;d++){
  const {sheet,x,y}=position({layouts},from),[dx,dy]=directions[d],nx=x+dx,ny=y+dy;
  if(nx<0||nx>=width||ny<0||ny>=height)continue;
  const e={to:id(sheet,nx,ny),transform:[...identity],kind:'normal'};candidates.set(`${from}:${d}`,e);if(cells[e.to])edges.set(`${from}:${d}`,e);
 }
 for(const [from,d,to] of [[id(0,1,2),0,id(1,1,1)],[id(0,width-2,height-3),2,id(1,width-2,height-2)]])for(const [a,dir,b] of [[from,d,to],[to,(d+2)%4,from]]){
  const e={to:b,transform:[...identity],kind:'stairs'};edges.set(`${a}:${dir}`,e);candidates.set(`${a}:${dir}`,e);
 }
 return {mode:'crossing',size:width,sheets:2,layouts,cells,edges,candidates,holes:new Set(),stairs,crossings:new Set([id(0,cx,cy),id(1,cx,cy)]),directed:false,start:id(0,cx-1,cy)};
}
// Grow dead-end branches around a protected crossing circuit.
function crossingMaze(seed,width=8,height=8,growth='frontier',newestBias=70){
 if(!['frontier','dfs','growing','hunt','prim','kruskal'].includes(growth))throw Error('未対応の枝道の生成方式です。');
 if(growth==='growing'&&(!Number.isFinite(newestBias)||newestBias<0||newestBias>100))throw Error('長い道を伸ばす割合は0〜100%にしてください。');
 const world=crossingWorld(width,height),area=width*height,cx=Math.floor((width-1)/2),cy=Math.floor((height-1)/2),cellId=(sheet,x,y)=>sheet*area+y*width+x;world.mode='crossingMaze';world.seed=String(seed);world.growth=growth;if(growth==='growing')world.newestBias=newestBias;
 let value=2166136261;for(const c of world.seed)value=Math.imul(value^c.charCodeAt(0),16777619);
 const rng=()=>{value+=0x6D2B79F5;let t=Math.imul(value^value>>>15,1|value);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 const forbidden=new Set([cellId(0,cx,cy-1),cellId(0,cx,cy+1),cellId(1,cx-1,cy),cellId(1,cx+1,cy),cellId(0,1,1),cellId(0,width-2,height-2),cellId(1,1,2),cellId(1,width-2,height-3)]);
 // Protect both crossing directions and the absent same-level stair landings.
 const neighbors=id=>{const {sheet,x,y}=position(world,id);return directions.map(([dx,dy])=>[x+dx,y+dy]).filter(([nx,ny])=>nx>=1&&nx<=width-2&&ny>=1&&ny<=height-2).map(([nx,ny])=>cellId(sheet,nx,ny));};
 const frontier=new Set();const eligible=id=>!world.cells[id]&&!forbidden.has(id)&&neighbors(id).filter(n=>world.cells[n]).length===1;
 if(growth==='kruskal'){
  // Cell-based Kruskal variant: join distinct floor components without new cycles.
  // The protected circuit, including its stairs, starts as one component.
  const parent=Int32Array.from({length:world.cells.length},(_,i)=>i);
  const root=id=>{while(parent[id]!==id){parent[id]=parent[parent[id]];id=parent[id];}return id;};
  const join=(a,b)=>{parent[root(a)]=root(b);};
  for(const [key,e] of world.edges)join(Number(key.split(':')[0]),e.to);
  const choices=[];
  for(let id=0;id<world.cells.length;id++){const {x,y}=position(world,id);if(x>=1&&x<=width-2&&y>=1&&y<=height-2&&!world.cells[id]&&!forbidden.has(id))choices.push(id);}
  for(let i=choices.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  for(const id of choices){const adjacent=neighbors(id).filter(n=>world.cells[n]),roots=adjacent.map(root);
   if(new Set(roots).size!==roots.length)continue;
   world.cells[id]=1;for(const n of adjacent)join(id,n);
  }
  // Isolated fragments cannot be explored; keep only the entrance component.
  const connected=root(world.start);
  for(let id=0;id<world.cells.length;id++)if(world.cells[id]&&root(id)!==connected)world.cells[id]=0;
 }else if(growth==='prim'){
  // Random-weight boundary edges. The protected circuit is the initial component.
  const boundary=[];let order=0;
  const expose=from=>{for(const to of neighbors(from))if(eligible(to))boundary.push({from,to,weight:rng(),order:order++});};
  for(let id=0;id<world.cells.length;id++)if(world.cells[id])expose(id);
  while(boundary.length){let best=0;for(let i=1;i<boundary.length;i++)if(boundary[i].weight<boundary[best].weight||(boundary[i].weight===boundary[best].weight&&boundary[i].order<boundary[best].order))best=i;
   const edge=boundary[best];boundary[best]=boundary[boundary.length-1];boundary.pop();
   if(!eligible(edge.to))continue;world.cells[edge.to]=1;expose(edge.to);
  }
 }else if(growth==='growing'){
  const active=[];for(let id=0;id<world.cells.length;id++)if(world.cells[id])active.push(id);
  while(active.length){const index=rng()*100<newestBias?active.length-1:Math.floor(rng()*active.length),choices=neighbors(active[index]).filter(eligible);
   if(!choices.length){active.splice(index,1);continue;}const next=choices[Math.floor(rng()*choices.length)];world.cells[next]=1;active.push(next);
  }
 }else if(growth==='hunt'){
  let current=world.start;
  while(true){const choices=neighbors(current).filter(eligible);
   if(choices.length){current=choices[Math.floor(rng()*choices.length)];world.cells[current]=1;continue;}
   // Scan for an uncarved interior cell with exactly one existing connection.
   let found=-1;for(let n=0;n<world.cells.length;n++){const {x,y}=position(world,n);if(x>=1&&x<=width-2&&y>=1&&y<=height-2&&eligible(n)){found=n;break;}}
   if(found<0)break;world.cells[found]=1;current=found;
  }
 }else if(growth==='dfs'){
  const roots=[];for(let id=0;id<world.cells.length;id++)if(world.cells[id])roots.push(id);
  for(let i=roots.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[roots[i],roots[j]]=[roots[j],roots[i]];}
  for(const root of roots){const stack=[root];while(stack.length){const choices=neighbors(stack[stack.length-1]).filter(eligible);if(!choices.length){stack.pop();continue;}const next=choices[Math.floor(rng()*choices.length)];world.cells[next]=1;stack.push(next);}}
 }else{
 for(let id=0;id<world.cells.length;id++)if(world.cells[id])for(const n of neighbors(id))if(eligible(n))frontier.add(n);
 while(frontier.size){const choices=[...frontier].sort((a,b)=>a-b);if(!choices.length)break;const chosen=choices[Math.floor(rng()*choices.length)];frontier.delete(chosen);world.cells[chosen]=1;for(const n of neighbors(chosen)){if(eligible(n))frontier.add(n);else frontier.delete(n);}}
 }

 const stairs=[...world.edges].filter(([,e])=>e.kind==='stairs');world.edges.clear();world.candidates.clear();
 for(let id=0;id<area*2;id++)if(world.cells[id])for(let d=0;d<4;d++){const {sheet,x,y}=position(world,id),[dx,dy]=directions[d],to=cellId(sheet,x+dx,y+dy),e={to,transform:[...identity],kind:'normal'};world.candidates.set(`${id}:${d}`,e);if(world.cells[to])world.edges.set(`${id}:${d}`,e);}
 for(const [key,e] of stairs){world.edges.set(key,e);world.candidates.set(key,e);}
 const seen=new Set([world.start]),queue=[world.start];for(const id of queue)for(let d=0;d<4;d++){const e=world.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
 if(seen.size!==world.cells.reduce((a,b)=>a+b,0))throw Error('Disconnected crossing maze');
 world.exit=queue[queue.length-1];return world;
}
// Lift the coarse graph onto odd grid sites; connectors occupy one intervening cell.
// This matches the atelier's wall lattice, while retaining the crossing generator.
function gridCrossing(options){
 const width=options.width??15,height=options.height??15;
 if(![width,height].every(n=>Number.isInteger(n)&&n>=15&&n<=40))throw Error('格子状の壁では幅・高さを15〜40の整数にしてください。');
 const source=crossingMaze(options.seed??'bridge-1',Math.floor((width+1)/2),Math.floor((height+1)/2),options.growth??'frontier',options.newestBias??70),area=width*height;
 const layouts=[{width,height,offset:0},{width,height,offset:area}],cells=new Uint8Array(area*2),edges=new Map(),candidates=new Map();
 const id=(sheet,x,y)=>sheet*area+y*width+x,translate=n=>{const p=position(source,n);return id(p.sheet,2*p.x-1,2*p.y-1);};
 const pair=(a,d,b,kind)=>{edges.set(`${a}:${d}`,{to:b,transform:[...identity],kind});edges.set(`${b}:${(d+2)%4}`,{to:a,transform:[...identity],kind});};
 for(let n=0;n<source.cells.length;n++)if(source.cells[n])cells[translate(n)]=1;
 const stairs=new Set();
 for(const [key,e] of source.edges){const [from,d]=key.split(':').map(Number);if(from>e.to)continue;
  const a=translate(from),b=translate(e.to),p=position({layouts},a),[dx,dy]=directions[d],mid=id(p.sheet,p.x+dx,p.y+dy);cells[mid]=1;
  pair(a,d,mid,'normal');pair(mid,d,b,e.kind);
  if(e.kind==='stairs'){stairs.add(mid);stairs.add(b);}
 }
 for(let n=0;n<cells.length;n++)if(cells[n])for(let d=0;d<4;d++){
  const e=edges.get(`${n}:${d}`);if(e){candidates.set(`${n}:${d}`,e);continue;}
  const p=position({layouts},n),[dx,dy]=directions[d],to=id(p.sheet,p.x+dx,p.y+dy);candidates.set(`${n}:${d}`,{to,transform:[...identity],kind:'normal'});
 }
 const start=translate(source.start),seen=new Set([start]),queue=[start];for(const n of queue)for(let d=0;d<4;d++){const e=edges.get(`${n}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
 if(seen.size!==cells.reduce((a,b)=>a+b,0))throw Error('Disconnected grid maze');
 return {mode:'crossingMaze',wallStyle:'grid',growth:source.growth,...(source.growth==='growing'?{newestBias:source.newestBias}:{}),seed:source.seed,size:width,sheets:2,layouts,cells,edges,candidates,holes:new Set(),stairs,crossings:new Set([...source.crossings].map(translate)),directed:false,start,exit:queue[queue.length-1]};
}
function holeLimit(mode,dimensions){
 return Math.min(...dimensions.map(([w,h],i)=>Math.min(h-4,mode==='triple'&&i===1?Math.floor((w-6)/2):w-4)));
}
// Rectangular tori joined in a chain by equally sized square holes.
function holeWorld(mode,options){
 const sheets=mode==='triple'?3:2,dimensions=options.dimensions||(sheets===3?[[8,8],[14,8],[8,8]]:[[8,8],[8,8]]);
 if(!Array.isArray(dimensions)||dimensions.length!==sheets||dimensions.some(v=>!Array.isArray(v)||v.length!==2||v.some(n=>!Number.isInteger(n)||n<8||n>24))||sheets===3&&(dimensions[1][0]<12||dimensions[1][0]<=dimensions[1][1]))throw Error('各辺は8〜24、3トーラスの中央は幅12以上かつ横長にしてください。');
 const limit=holeLimit(mode,dimensions),holeSize=options.holeSize==='auto'?Math.min(limit,Math.max(1,Math.floor(Math.min(...dimensions.flat())/4))):(options.holeSize??2);
 if(!Number.isInteger(holeSize)||holeSize<1||holeSize>limit)throw Error(`このマップでは穴の一辺を1〜${limit}マスにしてください。`);
 let count=0;const layouts=dimensions.map(([width,height])=>{const l={width,height,offset:count};count+=width*height;return l;}),cells=new Uint8Array(count).fill(1),holes=new Set(),portals=[],edges=new Map(),candidates=new Map();
 const id=(sheet,x,y)=>layouts[sheet].offset+y*layouts[sheet].width+x;
 const hole=(sheet,side)=>{const l=layouts[sheet];return {sheet,x:sheet===1&&sheets===3?(side===0?2:l.width-2-holeSize):Math.floor((l.width-holeSize)/2),y:Math.floor((l.height-holeSize)/2),size:holeSize};};
 const links=[];for(let i=0;i<sheets-1;i++){const a=hole(i,1),b=hole(i+1,0);links.push([a,b]);portals.push({...a,target:i+1},{...b,target:i});for(const h of [a,b])for(let y=h.y;y<h.y+holeSize;y++)for(let x=h.x;x<h.x+holeSize;x++){const n=id(h.sheet,x,y);cells[n]=0;holes.add(n);}}
 for(let sheet=0;sheet<sheets;sheet++){const l=layouts[sheet];for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++){const from=id(sheet,x,y);if(!cells[from])continue;for(let d=0;d<4;d++){const [dx,dy]=directions[d],to=id(sheet,(x+dx+l.width)%l.width,(y+dy+l.height)%l.height);if(cells[to])edges.set(`${from}:${d}`,{to,transform:[...identity],kind:'normal'});}}}
 for(const [a,b] of links)for(const [src,dst] of [[a,b],[b,a]])for(let k=0;k<holeSize;k++)for(let d=0;d<4;d++){
  const rim=(h)=>[[h.x+k,h.y-1],[h.x+holeSize,h.y+k],[h.x+k,h.y+holeSize],[h.x-1,h.y+k]][d],u=rim(src),v=rim(dst),wd=(d+2)%4;
  edges.set(`${id(src.sheet,...u)}:${wd}`,{to:id(dst.sheet,...v),transform:d%2===0?[...flip]:[0,3,2,1],kind:'throat'});
 }
 for(const [key,e] of edges)candidates.set(key,e);
 if(options.walls){for(let sheet=0;sheet<sheets;sheet++){const l=layouts[sheet];for(const [x,y] of [[2,2],[l.width-3,2],[l.width-2,l.height-3],[Math.floor(l.width/2),l.height-2]]){const n=id(sheet,x,y);if(!holes.has(n)&&!portals.some(h=>h.sheet===sheet&&x>=h.x-1&&x<=h.x+holeSize&&y>=h.y-1&&y<=h.y+holeSize))cells[n]=0;}}for(const [key,e] of edges)if(!cells[Number(key.split(':')[0])]||!cells[e.to])edges.delete(key);}
 return {mode,size:8,sheets,layouts,portals,holeSize,cells,holes,edges,candidates,directed:false,start:id(0,1,1)};
}
function position(world,id){
 if(world.layouts){const sheet=world.layouts.findIndex(l=>id>=l.offset&&id<l.offset+l.width*l.height),l=world.layouts[sheet];return l?{sheet,x:(id-l.offset)%l.width,y:Math.floor((id-l.offset)/l.width)}:{sheet:-1,x:0,y:0};}
 return {sheet:Math.floor(id/64),x:id%8,y:Math.floor(id%64/8)};
}
function create(mode,options={}){const world=generate(mode,options);return {world,id:world.start,frame:[...identity],x:0,y:0,steps:0,history:[{x:0,y:0,id:world.start}],last:null};}
function move(state,direction,truth=false){
 if(!Number.isInteger(direction)||direction<0||direction>3)return false;
 const wd=truth?direction:state.frame[direction],edge=state.world.edges.get(`${state.id}:${wd}`);if(!edge)return false;
 const local=state.frame.indexOf(wd),[dx,dy]=directions[local],from=state.id;
 state.id=edge.to;state.x+=dx;state.y+=dy;state.frame=state.frame.map(d=>edge.transform[d]);state.steps++;
 state.last={from,to:edge.to,worldDirection:wd,localDirection:local,kind:edge.kind,changed:edge.transform.some((d,i)=>d!==i)};
 state.history.push({x:state.x,y:state.y,id:state.id});if(state.history.length>1000)state.history.shift();return true;
}
function quadrant(x,y){return y<=3?(x<=3?0:1):(x<=3?3:2);}
function quadrantSheets(state){
 const phase=quadrant(state.id%8,Math.floor(state.id%64/8))+4*Math.floor(state.id/64),low=phase-1;
 return [0,1,2,3].map(q=>{const lifted=low+((q-low)%4+4)%4;return ((Math.floor(lifted/4)%state.world.sheets)+state.world.sheets)%state.world.sheets;});
}
function branchView(state,occlusion=true){
 const sheets=quadrantSheets(state),px=state.id%8,py=Math.floor(state.id%64/8);
 const at=(x,y)=>{const id=sheets[quadrant(x,y)]*64+y*8+x;return {x,y,id,wall:!state.world.cells[id]};};
 const clear=(tx,ty)=>{
  let x=px,y=py,ix=0,iy=0;const nx=Math.abs(tx-px),ny=Math.abs(ty-py),sx=Math.sign(tx-px),sy=Math.sign(ty-py);
  while(x!==tx||y!==ty){const diff=(1+2*ix)*ny-(1+2*iy)*nx;
   if(diff===0){if(at(x+sx,y).wall||at(x,y+sy).wall)return false;x+=sx;y+=sy;ix++;iy++;}
   else if(diff<0){x+=sx;ix++;}else{y+=sy;iy++;}
   if(x===tx&&y===ty)return true;if(at(x,y).wall)return false;
  }return true;
 };
 const result=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(!occlusion||clear(x,y))result.push(at(x,y));return result;
}
// Trace each cell-centre ray through the branch cut, carrying its sheet.
// At exact corners both routes must be open and agree; no peeking through pillars.
function branchRayView(state){
 const px=state.id%8,py=Math.floor(state.id%64/8),result=[];
 const step=(id,d)=>{
  const edge=state.world.edges.get(`${id}:${d}`);if(edge)return edge.to;
  const x=id%8,y=Math.floor(id%64/8),[dx,dy]=directions[d],nx=x+dx,ny=y+dy;if(nx<0||nx>=8||ny<0||ny>=8)return -1;
  let sheet=Math.floor(id/64);
  if(x<=3&&d===2&&y===3)sheet=(sheet+state.world.sheets-1)%state.world.sheets;
  if(x<=3&&d===0&&y===4)sheet=(sheet+1)%state.world.sheets;
  return sheet*64+ny*8+nx;
 };
 for(let ty=0;ty<8;ty++)for(let tx=0;tx<8;tx++){
  let x=px,y=py,id=state.id,ix=0,iy=0,blocked=false;
  const nx=Math.abs(tx-px),ny=Math.abs(ty-py),sx=Math.sign(tx-px),sy=Math.sign(ty-py),xd=sx>0?1:3,yd=sy>0?2:0;
  while(x!==tx||y!==ty){
   const diff=(1+2*ix)*ny-(1+2*iy)*nx;
   if(diff===0){const a=step(id,xd),b=step(id,yd);if(!state.world.cells[a]||!state.world.cells[b]){blocked=true;break;}
    const ab=step(a,yd),ba=step(b,xd);if(ab!==ba){blocked=true;break;}id=ab;x+=sx;y+=sy;ix++;iy++;
   }else if(diff<0){id=step(id,xd);x+=sx;ix++;}else{id=step(id,yd);y+=sy;iy++;}
   if(!state.world.cells[id]){blocked=x!==tx||y!==ty;break;}
  }
  if(!blocked&&id>=0)result.push({x:tx,y:ty,id,wall:!state.world.cells[id]});
 }
 return result;
}
// Include short detours and reversals: directed seams make even backtracking ambiguous.
function candidateView(state,radius=4,metrics=null){
 if(!Number.isInteger(radius)||radius<0||radius>6)throw Error('Invalid preview radius');
 const queue=[{x:0,y:0,id:state.id,frame:state.frame,depth:0}],seen=new Set(),tiles=new Map();
 for(const p of queue){
  const key=`${p.x},${p.y}`,signature=`${key}:${p.id}:${p.frame}:${p.depth}`;if(seen.has(signature))continue;seen.add(signature);
  const wall=!state.world.cells[p.id],old=tiles.get(key);
  if(!old)tiles.set(key,{x:p.x,y:p.y,id:p.id,wall,floorCandidate:!wall,wallCandidate:wall,selfCandidate:!wall&&p.id===state.id});
  else{old.selfCandidate||=!wall&&p.id===state.id;old.floorCandidate||=!wall;old.wallCandidate||=wall;if(wall){old.wall=true;old.id=p.id;}}
  if(wall||p.depth>=radius)continue;
  for(let d=0;d<4;d++){
   const [dx,dy]=directions[d],x=p.x+dx,y=p.y+dy;
   const edge=(state.world.candidates.size?state.world.candidates:state.world.edges).get(`${p.id}:${p.frame[d]}`);if(!edge)continue;
   queue.push({x,y,id:edge.to,frame:p.frame.map(n=>edge.transform[n]),depth:p.depth+1});
  }
 }
 if(metrics)Object.assign(metrics,{queued:queue.length,states:seen.size,tiles:tiles.size,radius});
 return [...tiles.values()];
}
// Hole previews prefer the observer's sheet even when its route is longer.
// Explore candidates independently: a foreign floor must not prune a local route.
function holeView(state,radius,metrics){
 const current=position(state.world,state.id).sheet,queue=[{x:0,y:0,id:state.id,frame:state.frame,depth:0,sheet:current}],seen=new Set(),tiles=new Map();
 for(const p of queue){
  const key=`${p.x},${p.y}`,signature=`${key}:${p.id}:${p.frame}:${p.sheet}`;if(seen.has(signature))continue;seen.add(signature);
  const wall=!state.world.cells[p.id],local=p.sheet===current,prev=tiles.get(key);
  // A foreign wall still stops propagation, but never covers the local scene.
  if(wall&&!local)continue;
  if(!prev||(local&&!prev.local)||(local===prev.local&&(p.depth<prev.distance||(p.depth===prev.distance&&wall&&!prev.wall))))
   tiles.set(key,{x:p.x,y:p.y,id:p.id,wall,local,distance:p.depth,wallCandidate:wall,floorCandidate:!wall,selfCandidate:!wall&&p.id===state.id});
  if(wall||p.depth>=radius)continue;
  for(let wd=0;wd<4;wd++){
   const d=p.frame.indexOf(wd),[dx,dy]=directions[d],edge=(state.world.candidates.size?state.world.candidates:state.world.edges).get(`${p.id}:${wd}`);
   queue.push({x:p.x+dx,y:p.y+dy,id:edge?edge.to:-1,frame:edge?p.frame.map(n=>edge.transform[n]):p.frame,depth:p.depth+1,sheet:edge?position(state.world,edge.to).sheet:p.sheet});
  }
 }
 if(metrics)Object.assign(metrics,{queued:queue.length,states:seen.size,tiles:tiles.size,radius});return [...tiles.values()];
}
// Topowalk-style local chart: nearest floor wins; walls win ties, only chosen floor expands.
function nearestView(state,radius=4,metrics=null){
 if(!Number.isInteger(radius)||radius<0||radius>6)throw Error('Invalid preview radius');
 if(['double','triple'].includes(state.world.mode))return holeView(state,radius,metrics);
 const queue=[{x:0,y:0,id:state.id,frame:state.frame,depth:0}],tiles=new Map(),seen=new Set();
 const underpass=['underpass','underpassMaze'].includes(state.world.mode),passages=underpass?(state.world.passages||[state.world]):[];
 for(const p of queue){
  if(underpass&&p.id>=0&&passages.some(c=>underpassHidden({...state.world,...c},p.id,underpassAxis(state,c))))p.id=-1;
  const key=`${p.x},${p.y}`,signature=`${key}:${p.id}:${p.frame}`;if(seen.has(signature))continue;seen.add(signature);
  const wall=!state.world.cells[p.id],prev=tiles.get(key);
  if(prev&&(prev.distance<p.depth||(prev.distance===p.depth&&(prev.wall||!wall))))continue;
  tiles.set(key,{x:p.x,y:p.y,id:p.id,wall,distance:p.depth,wallCandidate:wall,floorCandidate:!wall,selfCandidate:!wall&&p.id===state.id});
  if(wall||p.depth>=radius)continue;
  // Match the original's true-world N,E,S,W tie order.
  for(let wd=0;wd<4;wd++){
   const d=p.frame.indexOf(wd),[dx,dy]=directions[d],edge=(state.world.candidates.size?state.world.candidates:state.world.edges).get(`${p.id}:${wd}`);
   queue.push({x:p.x+dx,y:p.y+dy,id:edge?edge.to:-1,frame:edge?p.frame.map(n=>edge.transform[n]):p.frame,depth:p.depth+1});
  }
 }
 if(metrics)Object.assign(metrics,{queued:queue.length,states:seen.size,tiles:tiles.size,radius});return [...tiles.values()];
}
// Exploration memory is keyed by real cell id, including the layer offset.
// Only the subjective chart is observed; revealing the true map does not fill memory.
function observeAtlas(state,memory=new Set()){
 if(!['crossing','crossingMaze'].includes(state.world.mode))return {memory,visible:new Set()};
 const visible=new Set(nearestView(state).filter(p=>p.id>=0).map(p=>p.id));
 for(const id of visible)memory.add(id);return {memory,visible};
}
// Keep charts consistent with observed appearances, without erasing conflicting memories.
function observeWalkingMap(state,book={charts:[],active:-1},view=nearestView(state)){
 const sheet=position(state.world,state.id).sheet,underpass=['underpass','underpassMaze'].includes(state.world.mode);
 // Across-stair glimpses stay in the live view; archive the layer being explored.
 const here=position(state.world,state.id);
 const observations=view.filter(p=>underpass||p.id<0||position(state.world,p.id).sheet===sheet).map(p=>{
  const record={...p,x:p.x+state.x,y:p.y+state.y,signature:p.wall?'wall':`floor:${underpass?0:position(state.world,p.id).sheet}`};
  if(underpass){const right=directions[state.frame[1]],down=directions[state.frame[2]];
   record.groundX=here.x+p.x*right[0]+p.y*down[0];record.groundY=here.y+p.x*right[1]+p.y*down[1];
   record.underpassProjection=state.world.passages.some(c=>Math.abs(record.groundX-c.cx)<=1&&Math.abs(record.groundY-c.cy)<=1);
  }return record;
 });
 // Only certified local underpass appearances may disagree. Different coordinate
 // registrations (e.g. a displaced chart) are never merged by this exception.
 const compatible=(a,b)=>{
  if(!underpass)return a.signature===b.signature;
  if(a.groundX!==b.groundX||a.groundY!==b.groundY)return false;
  return a.signature===b.signature||Boolean(a.underpassProjection&&b.underpassProjection);
 };
 const fits=chart=>observations.every(p=>{const old=chart.cells.get(`${p.x},${p.y}`);return !old||compatible(old,p);});
 let chart=book.charts[book.active],switched=false;
 if(!chart||!fits(chart)){
  const alternatives=book.charts.filter(fits).map(c=>({c,overlap:observations.filter(p=>!p.wall&&c.cells.has(`${p.x},${p.y}`)).length})).filter(v=>v.overlap>0).sort((a,b)=>b.overlap-a.overlap);
  chart=alternatives[0]?.c;
  if(!chart){chart={number:Math.max(0,...book.charts.map(c=>c.number))+1,cells:new Map()};book.charts.push(chart);}
  book.active=book.charts.indexOf(chart);switched=true;
 }
 for(const p of observations)chart.cells.set(`${p.x},${p.y}`,p);
 if(underpass){
  // Reconcile compatible fragments without discarding their unexplored-in-this-chart areas.
  let merged=true;while(merged){merged=false;for(const other of [...book.charts]){
   if(other===chart)continue;let sharedFloor=false,conflict=false;
   for(const [key,p] of other.cells){const current=chart.cells.get(key);if(!current)continue;
    if(!compatible(current,p)){conflict=true;break;}if(!current.wall&&!p.wall)sharedFloor=true;
   }
   if(conflict||!sharedFloor)continue;
   for(const [key,p] of other.cells)if(!chart.cells.has(key))chart.cells.set(key,p);
   book.charts.splice(book.charts.indexOf(other),1);merged=true;
  }}
  book.active=book.charts.indexOf(chart);
 }

 return {book,chart,switched,visible:new Set(observations.map(p=>`${p.x},${p.y}`))};
}
// Structural statistics for the reciprocal crossing graphs, including stairs.
function crossingStats(world){
 if(!['crossing','crossingMaze'].includes(world.mode))throw Error('立体交差の迷路だけを集計できます。');
 let floors=0,deadEnds=0,junctions=0;
 for(let id=0;id<world.cells.length;id++)if(world.cells[id]){
  floors++;let degree=0;for(let d=0;d<4;d++)if(world.edges.has(`${id}:${d}`))degree++;
  if(degree===1)deadEnds++;if(degree>=3)junctions++;
 }
 const distances=new Map([[world.start,0]]),queue=[world.start];
 for(const id of queue)for(let d=0;d<4;d++){const edge=world.edges.get(`${id}:${d}`);if(edge&&!distances.has(edge.to)){distances.set(edge.to,distances.get(id)+1);queue.push(edge.to);}}
 return {floors,deadEnds,junctions,reachable:distances.size,exitSteps:distances.get(world.exit)??null};
}
const api={underpassAxis,crossingStats,observeWalkingMap,observeAtlas,holeLimit,position,names,directions,generate,create,move,quadrantSheets,branchView,branchRayView,candidateView,nearestView};if(typeof module==='object')module.exports=api;else root.ConnectionSpace=api;
})(typeof globalThis==='object'?globalThis:this);
