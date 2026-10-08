(function(root){
'use strict';
const directions=[[0,-1],[1,0],[0,1],[-1,0]],names={doubleMaze:'中央の穴でつながる2トーラスのミニ迷路',cornerUnderpass:'曲がるアンダーパス',kleinMaze:'クラインの壺の生成迷路',torusMaze:'トーラスの生成迷路',underpassMaze:'アンダーパスの生成迷路',underpass:'極小の立体交差（アンダーパス）',crossingMaze:'立体交差の生成迷路',crossing:'立体交差（橋と地下通路）',triple:'中央の穴でつながる3トーラス',branch3:'柱の四方で風景が変わる3シート',doubleTwist:'double-twist',cwTwist:'quarter-clockwise-twist',ccwTwist:'quarter-counterclockwise-twist',plane:'平面',cylinder:'円筒',mobius:'メビウス帯',torus:'トーラス',klein:'クラインの壺',sheets:'2シートのトーラス',rotate:'90度回転する境界',chaos:'全辺90度回転（ちょっとひどい）',double:'中央の穴でつながる2トーラス',branch:'柱を周回する2シート',branch4:'柱の四方で風景が変わる2シート'};
const identity=[0,1,2,3],flip=[2,1,0,3],cw=[1,2,3,0];
function generate(mode,options={}){
 const world=generateBase(mode,options);
 const shape=options.underpassShape??(mode==='cornerUnderpass'?'corners':'straight');
 if(!['straight','mixed','corners'].includes(shape))throw Error('未対応のアンダーパス形状です。');
 world.underpassShape=shape;
 if(shape!=='straight')bendUnderpasses(world,shape);
 return world;
}
function generateBase(mode,options={}){
 if(!Object.hasOwn(names,mode))throw Error('Unknown space');
 if(mode==='doubleMaze')return doubleMaze(options);
 if(['kleinMaze','torusMaze'].includes(mode))return periodicMaze(mode,options);
 if(mode==='crossingMaze'){const style=options.wallStyle??'dense';if(!['dense','grid'].includes(style))throw Error('未対応の壁の配置です。');return addFloorUnderpasses(style==='grid'?gridCrossing(options):placeCrossingStairs(crossingMaze(options.seed??'bridge-1',options.width??8,options.height??8,options.growth??'frontier',options.newestBias??70),options.stairPlacement??'diagonal'),options.floorUnderpasses??0);}
 if(mode==='underpassMaze')return underpassWorld(options);
 if(mode==='underpass'||mode==='cornerUnderpass')return {...underpassWorld(),mode};
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
 const growth=options?.growth??'dfs',requested=options?.count??3,variety=options?.variety??'mixed';
 if(!['mixed','links'].includes(variety))throw Error('未対応の交差の行き先です。');
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
   const horizontalRoad=cells[h]&&cells[h-1]&&cells[h+1]&&!cells[h-width]&&!cells[h+width]&&(cells[h-2*width]||cells[h+2*width]);
   const verticalRoad=cells[h]&&cells[h-width]&&cells[h+width]&&!cells[h-1]&&!cells[h+1]&&(cells[h-2]||cells[h+2]);
   if(!horizontalRoad&&!verticalRoad)continue;
   if([-width-1,-width+1,width-1,width+1].some(d=>cells[h+d]))continue;
   const delta=horizontalRoad?width:1,ends=[h-2*delta,h+2*delta];
   let role=ends.every(id=>cells[id])?'link':'deadend',removed=-1;
   // A saturated maze has no empty pocket here. A disposable terminal floor
   // can become the end wall, without disconnecting any remaining floor.
   if(variety==='mixed'&&role==='link'){
    const leaves=ends.filter(id=>id!==start&&id!==exit&&!passages.some(p=>Math.max(Math.abs(p.cx-id%width),Math.abs(p.cy-Math.floor(id/width)))<=1)&&directions.filter((_,d)=>edges.has(`${id}:${d}`)).length===1);
    if(leaves.length&&rng()<.65){removed=leaves[Math.floor(rng()*leaves.length)];role='deadend';}
   }
   if(variety==='links'&&role==='deadend')continue;
   const added=[h-delta,h+delta];
   const savedEdges=new Map(edges),savedCandidates=new Map(candidates);
   if(removed>=0){cells[removed]=0;for(const [key,e] of edges)if(Number(key.split(':')[0])===removed||e.to===removed)edges.delete(key);for(const key of candidates.keys())if(Number(key.split(':')[0])===removed)candidates.delete(key);}
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
    for(const id of [...added,v])cells[id]=0;if(removed>=0)cells[removed]=1;edges.clear();candidates.clear();for(const [k,e] of savedEdges)edges.set(k,e);for(const [k,e] of savedCandidates)candidates.set(k,e);continue;
   }
   passages.push({cx:x,cy:y,horizontal:h,vertical:v,role,tunnel:horizontalRoad?v:h});
  }
 }

 return {mode:options?'underpassMaze':'underpass',seed,growth,variety,requestedCount:options?requested:1,passages,route:required?'required':'loop',size:width,sheets:2,layouts:[{width,height,offset:0},{width,height,offset:area}],cells,edges,candidates,holes:new Set(),crossings:new Set(passages.flatMap(p=>[p.horizontal,p.vertical])),stairs:new Set(),directed:false,start,exit,horizontal,vertical,cx,cy};
}
// Local virtual cells belong to their originating floor, never to the other floor.
function placeCrossingStairs(world,placement){
 if(!['diagonal','random'].includes(placement))throw Error('未対応の階段配置です。');
 world.stairPlacement=placement;if(placement==='diagonal')return world;
 const {width,height}=world.layouts[0],area=width*height,choices=[];
 const protectedCells=new Set([...world.crossings,world.start,world.exit]);
 for(let from=0;from<area;from++)if(world.cells[from]&&!protectedCells.has(from))for(let d=0;d<4;d++){
  const p=position(world,from),[dx,dy]=directions[d],x=p.x+dx,y=p.y+dy;if(x<1||x>=width-1||y<1||y>=height-1)continue;
  const to=area+y*width+x;
  if(!world.cells[to]||protectedCells.has(to)||world.cells[to-area]||world.cells[from+area])continue;
  const a=world.edges.get(`${from}:${d}`),b=world.edges.get(`${to}:${(d+2)%4}`);
  if(a&&a.kind!=='stairs'||b&&b.kind!=='stairs')continue;
  choices.push({from,d,to});
 }
 let value=2166136261;for(const c of world.seed+'-stairs')value=Math.imul(value^c.charCodeAt(0),16777619);
 const rng=()=>{value+=0x6D2B79F5;let t=Math.imul(value^value>>>15,1|value);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 for(let i=choices.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
 const selected=[];for(const c of choices){if(selected.some(a=>a.from===c.from||a.to===c.to))continue;selected.push(c);if(selected.length===2)break;}
 if(selected.length<2){world.stairPlacementFallback=true;return world;}
 for(const [key,e] of [...world.edges])if(e.kind==='stairs'){
  const [from,d]=key.split(':').map(Number),p=position(world,from),[dx,dy]=directions[d];world.edges.delete(key);
  world.candidates.set(key,{to:p.sheet*area+(p.y+dy)*width+p.x+dx,transform:[...identity],kind:'normal'});
 }
 world.stairs.clear();for(const {from,d,to} of selected)for(const [a,dir,b] of [[from,d,to],[to,(d+2)%4,from]]){const e={to:b,transform:[...identity],kind:'stairs'};world.edges.set(`${a}:${dir}`,e);world.candidates.set(`${a}:${dir}`,e);world.stairs.add(a);}
 const q=[world.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=world.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
 if(seen.size!==world.cells.reduce((a,b)=>a+b,0))throw Error('Disconnected stair placement');
 world.exit=q[q.length-1];return world;
}
// Generate on the quotient graph first, so the seam is part of every algorithm.
function periodicMaze(mode,options){
 const width=options.width??30,height=options.height??26,growth=options.growth??'dfs',seed=String(options.seed??'periodic-1');
 if(![width,height].every(n=>Number.isInteger(n)&&n>=16&&n<=60&&n%2===0))throw Error('周期迷路の幅・高さは16〜60の偶数にしてください。');
 if(!['dfs','prim','growing','kruskal'].includes(growth))throw Error('未対応の生成方式です。');
 const klein=mode==='kleinMaze',w=width/2,h=height/2,n=w*h;
 let value=2166136261;for(const c of seed+'-periodic')value=Math.imul(value^c.charCodeAt(0),16777619);
 const random=()=>{value+=0x6D2B79F5;let t=Math.imul(value^value>>>15,1|value);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 const neighbor=(id,d)=>{let x=id%w+directions[d][0],y=Math.floor(id/w)+directions[d][1];if(x<0||x>=w){x=(x+w)%w;if(klein)y=h-1-y;}return ((y+h)%h)*w+x;};
 const links=new Set(),connect=(id,d)=>{links.add(`${id}:${d}`);links.add(`${neighbor(id,d)}:${(d+2)%4}`);};
 if(growth==='kruskal'){
  const parent=Array.from({length:n},(_,i)=>i),find=a=>{while(parent[a]!==a){parent[a]=parent[parent[a]];a=parent[a];}return a;},pool=[];
  for(let id=0;id<n;id++)for(const d of [1,2])pool.push([id,d]);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  for(const [id,d] of pool){const a=find(id),b=find(neighbor(id,d));if(a!==b){parent[a]=b;connect(id,d);}}
 }else if(growth==='prim'){
  const seen=new Set([0]),frontier=[];const add=id=>{for(let d=0;d<4;d++)frontier.push([id,d]);};add(0);
  while(frontier.length){const i=Math.floor(random()*frontier.length),[id,d]=frontier[i];frontier[i]=frontier.at(-1);frontier.pop();const to=neighbor(id,d);if(seen.has(to))continue;connect(id,d);seen.add(to);add(to);}
 }else{
  const seen=new Set([0]),active=[0];while(active.length){const i=growth==='dfs'||random()<.7?active.length-1:Math.floor(random()*active.length),id=active[i],choices=[0,1,2,3].filter(d=>!seen.has(neighbor(id,d)));
   if(!choices.length){active.splice(i,1);continue;}const d=choices[Math.floor(random()*choices.length)];connect(id,d);seen.add(neighbor(id,d));active.push(neighbor(id,d));}
 }
 // Add some alternative routes, including seam openings.
 for(let id=0;id<n;id++)for(const d of [1,2])if(random()<.12)connect(id,d);
 connect((Math.floor(random()*h)+1)*w-1,1);connect((h-1)*w+Math.floor(random()*w),2);
 const area=width*height,cells=new Uint8Array(area),edges=new Map(),candidates=new Map();
 const adjacent=(id,d)=>{let x=id%width+directions[d][0],y=Math.floor(id/width)+directions[d][1],transform=identity,kind='normal';if(x<0||x>=width){x=(x+width)%width;if(klein){y=(height-y)%height;transform=flip;}kind='seam';}if(y<0||y>=height){y=(y+height)%height;kind='seam';}return {to:y*width+x,transform:[...transform],kind};};
 const center=id=>(2*Math.floor(id/w)+1)*width+2*(id%w)+1;
 for(let id=0;id<n;id++){const from=center(id);cells[from]=1;for(let d=0;d<4;d++)if(links.has(`${id}:${d}`))cells[adjacent(from,d).to]=1;}
 for(let id=0;id<area;id++)if(cells[id])for(let d=0;d<4;d++){const e=adjacent(id,d);candidates.set(`${id}:${d}`,e);if(cells[e.to])edges.set(`${id}:${d}`,e);}
 const start=center(0),queue=[start],seen=new Set(queue);for(const id of queue)for(let d=0;d<4;d++){const e=edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
 if(seen.size!==cells.reduce((a,b)=>a+b,0))throw Error('Disconnected periodic maze');
 return addFloorUnderpasses({mode,seed,growth,wallStyle:'grid',underpassReach:2,size:width,sheets:1,layouts:[{width,height,offset:0}],cells,edges,candidates,start,exit:queue.at(-1),holes:new Set(),stairs:new Set(),crossings:new Set(),directed:false},options.floorUnderpasses??3);
}
function groundSheet(world,id){const p=world.passages?.find(p=>p.vertical===id);return p?(p.baseSheet??0):position(world,id).sheet;}
function addFloorUnderpasses(world,count){
 if(!Number.isInteger(count)||count<0||count>6)throw Error('各階のアンダーパス目標数は0〜6にしてください。');
 if(!count)return world;
 const originalLength=world.cells.length,cells=new Uint8Array(originalLength*2);cells.set(world.cells);world.cells=cells;
 for(const l of world.layouts.slice(0,world.sheets))world.layouts.push({...l,offset:originalLength+l.offset});world.floorUnderpasses=count;world.passages=[];
 const {edges,candidates}=world;let value=2166136261;for(const c of world.seed+'-floor-underpasses')value=Math.imul(value^c.charCodeAt(0),16777619);
 const rng=()=>{value+=0x6D2B79F5;let t=Math.imul(value^value>>>15,1|value);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 const reach=world.underpassReach??(world.wallStyle==='grid'?4:2),margin=reach+(world.underpassReach?1:0);
 const protectedCells=[world.start,world.exit,...(world.stairs||[]),...(world.crossings||[]),...(world.underpassProtected||[])];
 for(let sheet=0;sheet<world.sheets;sheet++){
  const {width,height,offset}=world.layouts[sheet];
  const possible=[];for(let y=margin;y<height-margin;y++)for(let x=margin;x<width-margin;x++)possible.push({x,y});
  for(let i=possible.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[possible[i],possible[j]]=[possible[j],possible[i]];}
  let placed=0;for(const {x,y} of possible){if(placed>=count)break;
   if(protectedCells.some(id=>{const p=position(world,id);return p.sheet===sheet&&Math.max(Math.abs(p.x-x),Math.abs(p.y-y))<3;})||world.passages.some(p=>p.baseSheet===sheet&&Math.max(Math.abs(p.cx-x),Math.abs(p.cy-y))<4))continue;
   const h=offset+y*width+x,v=originalLength+h;
   const eastWest=cells[h]&&cells[h-1]&&cells[h+1]&&!cells[h-width]&&!cells[h+width]&&(cells[h-reach*width]||cells[h+reach*width]);
   const northSouth=cells[h]&&cells[h-width]&&cells[h+width]&&!cells[h-1]&&!cells[h+1]&&(cells[h-reach]||cells[h+reach]);
   if(!eastWest&&!northSouth||[-width-1,-width+1,width-1,width+1].some(d=>cells[h+d]))continue;
   const delta=eastWest?width:1,side=eastWest?1:width,ends=[h-reach*delta,h+reach*delta],added=[];
   for(let n=1;n<reach;n++)added.push(h-n*delta,h+n*delta);
   // A longer tunnel must not accidentally join neighbouring branches along its sides.
   if(added.some(id=>cells[id]||cells[id-side]||cells[id+side])||[...added,...ends].some(id=>protectedCells.includes(id)))continue;
   let removed=-1,role=ends.every(id=>cells[id])?'link':'deadend';
   const leaves=ends.filter(id=>!protectedCells.includes(id)&&!world.passages.some(p=>p.baseSheet===sheet&&Math.max(Math.abs(p.cx-position(world,id).x),Math.abs(p.cy-position(world,id).y))<=1)&&directions.filter((_,d)=>edges.has(`${id}:${d}`)).length===1);
   if(role==='link'&&leaves.length&&rng()<.65){removed=leaves[Math.floor(rng()*leaves.length)];role='deadend';}
   const oldEdges=new Map(edges),oldCandidates=new Map(candidates);
   if(removed>=0){cells[removed]=0;for(const [k,e] of edges)if(Number(k.split(':')[0])===removed||e.to===removed)edges.delete(k);for(const k of candidates.keys())if(Number(k.split(':')[0])===removed)candidates.delete(k);}
   for(const id of [...added,v])cells[id]=1;
   for(const id of new Set([h,v,...added,h-width,h+width,h-1,h+1,...ends]))if(cells[id])for(let d=0;d<4;d++){
    edges.delete(`${id}:${d}`);candidates.delete(`${id}:${d}`);if(id===h&&d%2===0||id===v&&d%2===1)continue;
    const [dx,dy]=directions[d],to=(id===v?h:id)+dy*width+dx,target=to===h&&d%2===0?v:to,e={to:target,transform:[...identity],kind:id===v||target===v?'underpass':'normal'};
    candidates.set(`${id}:${d}`,e);if(cells[target])edges.set(`${id}:${d}`,e);
   }
   const q=[world.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
   if(seen.size!==cells.reduce((a,b)=>a+b,0)||!loopsIntact(world)){for(const id of [...added,v])cells[id]=0;if(removed>=0)cells[removed]=1;edges.clear();candidates.clear();for(const [k,e] of oldEdges)edges.set(k,e);for(const [k,e] of oldCandidates)candidates.set(k,e);continue;}
   world.passages.push({cx:x,cy:y,horizontal:h,vertical:v,baseSheet:sheet,role,span:reach});placed++;
  }
 }
 return world;
}
function bendUnderpasses(world,shape='corners'){
 // Seeded selection keeps straight crossings interspersed with corner pairs.
 let value=2166136261;for(const c of String(world.seed??'demo')+'-bends')value=Math.imul(value^c.charCodeAt(0),16777619);
 for(const p of world.passages||[]){
  value=(Math.imul(value,1664525)+1013904223)>>>0;
  if(shape==='mixed'&&value/4294967296>=.5)continue;
  const originalEdges=new Map(world.edges),originalCandidates=new Map(world.candidates);
  const width=world.layouts[p.baseSheet??0].width;
  for(let attempt=0;attempt<2;attempt++){
   world.edges=new Map(originalEdges);world.candidates=new Map(originalCandidates);
   const first=(p.cx+p.cy+attempt)%2?[0,1]:[1,2];
   for(const map of [world.edges,world.candidates])for(const [key,e] of map)if([p.horizontal,p.vertical].includes(Number(key.split(':')[0]))||[p.horizontal,p.vertical].includes(e.to))map.delete(key);
   for(let d=0;d<4;d++){
    const center=first.includes(d)?p.horizontal:p.vertical,[dx,dy]=directions[d],neighbor=p.horizontal+dy*width+dx,reverse=(d+2)%4;
    const out={to:neighbor,transform:[...identity],kind:'underpass'},back={to:center,transform:[...identity],kind:'underpass'};
    world.edges.set(`${center}:${d}`,out);world.candidates.set(`${center}:${d}`,out);
    world.edges.set(`${neighbor}:${reverse}`,back);world.candidates.set(`${neighbor}:${reverse}`,back);
   }
   const queue=[world.start],seen=new Set(queue);for(const id of queue)for(let d=0;d<4;d++){const e=world.edges.get(`${id}:${d}`);if(e&&!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}
   if(seen.size===world.cells.reduce((a,b)=>a+b,0)&&loopsIntact(world)){p.arms=first;break;}
   world.edges=new Map(originalEdges);world.candidates=new Map(originalCandidates);
  }
 }
}
function passageApproach(p,dx,dy){
 if(!p.arms)return Math.abs(dy)>Math.abs(dx)?'vertical':'horizontal';
 const d=Math.abs(dy)>Math.abs(dx)?(dy<0?0:2):(dx<0?3:1);
 return p.arms.includes(d)?'horizontal':'vertical';
}
function underpassAxis(state,passage=null){
 if(passage)state={...state,world:{...state.world,...passage}};
 if(state.id===state.world.vertical)return 'vertical';if(state.id===state.world.horizontal)return 'horizontal';
 const p=position(state.world,state.id);
 // Compare distance to the N/S and E/W entrances; horizontal wins exact ties.
 return passageApproach(state.world,p.x-state.world.cx,p.y-state.world.cy);
}
// The line follows the locally traversable axis: ｜ for up/down, ー for left/right.
function underpassSymbol(world,id,frame=identity){
 const passage=world.passages?.find(p=>p.horizontal===id||p.vertical===id);if(!passage)return '';
 if(passage.arms){const local=[0,1,2,3].filter(d=>world.edges.has(`${id}:${frame[d]}`)).join('');return {'01':'└','12':'┌','23':'┐','03':'┘'}[local]||'';}
 const worldAxis=id===passage.horizontal?1:0;
 return frame[1]%2===worldAxis?'ー':'｜';
}
function underpassHidden(world,id,axis){
 const p=position(world,id);if(world.baseSheet!==undefined&&groundSheet(world,id)!==world.baseSheet)return false;if(Math.abs(p.x-world.cx)>1||Math.abs(p.y-world.cy)>1)return false;
 if(world.arms){const center=axis==='horizontal'?world.horizontal:world.vertical;if(id===center)return false;if(id===world.horizontal||id===world.vertical)return true;const dx=p.x-world.cx,dy=p.y-world.cy,d=dy===-1&&dx===0?0:dx===1&&dy===0?1:dy===1&&dx===0?2:dx===-1&&dy===0?3:-1;return d<0||(axis==='horizontal'?!world.arms.includes(d):world.arms.includes(d));}
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
 const source=placeCrossingStairs(crossingMaze(options.seed??'bridge-1',Math.floor((width+1)/2),Math.floor((height+1)/2),options.growth??'frontier',options.newestBias??70),options.stairPlacement??'diagonal'),area=width*height;
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
 return {mode:'crossingMaze',wallStyle:'grid',stairPlacement:source.stairPlacement,...(source.stairPlacementFallback?{stairPlacementFallback:true}:{}),growth:source.growth,...(source.growth==='growing'?{newestBias:source.newestBias}:{}),seed:source.seed,size:width,sheets:2,layouts,cells,edges,candidates,holes:new Set(),stairs,crossings:new Set([...source.crossings].map(translate)),directed:false,start,exit:queue[queue.length-1]};
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
// A weighted path on a lifted sheet ends one period away, proving its winding.
function windingRoute(world,sheet,start,axis,random){
 const l=world.layouts[sheet],p=position(world,start),tx=p.x+(axis===1?l.width:0),ty=p.y+(axis===2?l.height:0);
 const id=(x,y)=>l.offset+((y%l.height+l.height)%l.height)*l.width+(x%l.width+l.width)%l.width;
 const weights=new Map();for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++)for(const d of [1,2]){const a=id(x,y),b=id(x+directions[d][0],y+directions[d][1]);weights.set([a,b].sort((a,b)=>a-b).join(':'),1+Math.floor(random()*20));}
 const key=(x,y)=>`${x},${y}`,first=key(p.x,p.y),goal=key(tx,ty),best=new Map([[first,0]]),parent=new Map(),queue=[{x:p.x,y:p.y,cost:0}];
 while(queue.length){let i=0;for(let j=1;j<queue.length;j++)if(queue[j].cost<queue[i].cost)i=j;const a=queue[i];queue[i]=queue.at(-1);queue.pop();const k=key(a.x,a.y);if(a.cost!==best.get(k))continue;if(k===goal)break;
  for(let d=0;d<4;d++){const x=a.x+directions[d][0],y=a.y+directions[d][1];if(x<p.x-l.width||x>tx+l.width||y<p.y-l.height||y>ty+l.height||!world.cells[id(x,y)])continue;
   const nk=key(x,y),cost=a.cost+weights.get([id(a.x,a.y),id(x,y)].sort((a,b)=>a-b).join(':'));
   if(cost>=(best.get(nk)??Infinity))continue;best.set(nk,cost);parent.set(nk,{key:k,d});queue.push({x,y,cost});
  }
 }
 if(!best.has(goal))throw Error('周回経路を生成できません。');
 const route=[];for(let k=goal;k!==first;){const a=parent.get(k);route.unshift(a.d);k=a.key;}
 return {start,directions:route};
}
// First small experiment: add walls while preserving all remaining floor connectivity.
function loopsIntact(world){
 return (world.guaranteedLoops||[]).every(({horizontal,vertical})=>[horizontal,vertical].every(path=>{
  let id=path.start;for(const d of path.directions){const e=world.edges.get(`${id}:${d}`);if(!e)return false;id=e.to;}return id===path.start;
 }));
}
function doubleMaze(options){
 const world=holeWorld('double',{dimensions:options.dimensions??[[12,12],[12,12]],holeSize:options.holeSize??2,walls:false});
 world.wallStyle=options.wallStyle??'dense';
 if(!['dense','grid'].includes(world.wallStyle))throw Error('未対応の壁配置です。');
 if(world.wallStyle==='grid'&&world.layouts.some(l=>l.width%2||l.height%2))throw Error('格子状の壁では各辺を偶数にしてください。');
 world.mode='doubleMaze';world.seed=String(options.seed??'double-first');world.growth=options.growth??'walls';world.loopStyle=options.loopStyle??'meander';
 if(!['straight','meander'].includes(world.loopStyle))throw Error('未対応の周回路です。');
 if(!['walls','dfs','prim','growing'].includes(world.growth))throw Error('未対応の2トーラス生成方式です。');
 const protectedCells=new Set([world.start]);
 for(const p of world.portals){const l=world.layouts[p.sheet];for(let y=p.y-1;y<=p.y+p.size;y++)for(let x=p.x-1;x<=p.x+p.size;x++)protectedCells.add(l.offset+y*l.width+x);}
 // Keep lattice pillars intact; the hole rim is a deliberate exception.
 if(world.wallStyle==='grid'){
  for(let id=0;id<world.cells.length;id++){const p=position(world,id);if(p.x%2===0&&p.y%2===0&&!protectedCells.has(id))world.cells[id]=0;}
  for(const [key,e] of world.edges)if(!world.cells[Number(key.split(':')[0])]||!world.cells[e.to])world.edges.delete(key);
 }
 let value=2166136261;for(const c of world.seed+'-double-mini')value=Math.imul(value^c.charCodeAt(0),16777619);
 const random=()=>{value+=0x6D2B79F5;let t=Math.imul(value^value>>>15,1|value);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 // Reserve one full horizontal and vertical circuit on each punctured torus.
 world.guaranteedLoops=world.layouts.map((l,sheet)=>{
  const hole=world.portals.find(p=>p.sheet===sheet),rows=Array.from({length:l.height},(_,i)=>i).filter(y=>(world.wallStyle!=='grid'||y%2===1)&&(y<hole.y-1||y>hole.y+hole.size)),cols=Array.from({length:l.width},(_,i)=>i).filter(x=>(world.wallStyle!=='grid'||x%2===1)&&(x<hole.x-1||x>hole.x+hole.size));
  const row=rows[Math.floor(random()*rows.length)],column=cols[Math.floor(random()*cols.length)];
  const horizontal=world.loopStyle==='straight'?{start:l.offset+row*l.width,directions:Array(l.width).fill(1)}:windingRoute(world,sheet,l.offset+row*l.width,1,random);
  const vertical=world.loopStyle==='straight'?{start:l.offset+column,directions:Array(l.height).fill(2)}:windingRoute(world,sheet,l.offset+column,2,random);
  for(const path of [horizontal,vertical]){let id=path.start;protectedCells.add(id);for(const d of path.directions){id=world.edges.get(`${id}:${d}`).to;protectedCells.add(id);}}
  return {sheet,horizontal,vertical};
 });
 const pool=Array.from(world.cells.keys()).filter(id=>world.cells[id]&&!protectedCells.has(id));
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const reachable=()=>{const q=[world.start],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const e=world.edges.get(`${id}:${d}`);if(e&&world.cells[e.to]&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}return q;};
 let floors=world.cells.reduce((a,b)=>a+b,0),removed=0;const target=Math.floor(floors*.4);
 if(world.growth==='walls')for(const id of pool){if(removed>=target)break;world.cells[id]=0;if(reachable().length!==floors-1){world.cells[id]=1;continue;}floors--;removed++;}
 else{
  const neighbors=id=>[0,1,2,3].map(d=>world.edges.get(`${id}:${d}`)?.to).filter(id=>id!==undefined);
  const live=new Set([...protectedCells].filter(id=>world.cells[id]));
  // Join every reserved circuit and rim to the entrance before growing branches.
  while(true){
   const component=new Set([world.start]),queue=[world.start];
   for(const id of queue)for(const to of neighbors(id))if(live.has(to)&&!component.has(to)){component.add(to);queue.push(to);}
   if(component.size===live.size)break;
   const search=[...component],parent=new Map(search.map(id=>[id,null]));let end;
   for(const id of search){if(live.has(id)&&!component.has(id)){end=id;break;}for(const to of neighbors(id))if(!parent.has(to)){parent.set(to,id);search.push(to);}}
   if(end===undefined)throw Error('周回路を入口に接続できません。');
   for(let id=end;id!==null;id=parent.get(id))live.add(id);
  }
  if(world.wallStyle==='grid'){
   // Grow between odd/odd sites, carving the connector and destination together.
   // Growing a single pixel can strand the connector before reaching its site.
   const extensions=id=>{
    const result=[];
    for(let d=0;d<4;d++){
     let at=id;const path=[];
     for(let n=0;n<2;n++){
      const e=world.edges.get(`${at}:${d}`);if(!e||e.kind==='throat')break;
      at=e.to;path.push(at);const p=position(world,at);
      if(p.x%2===1&&p.y%2===1){if(!live.has(at))result.push(path);break;}
     }
    }
    return result;
   };
   const active=[...live];for(let i=active.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[active[i],active[j]]=[active[j],active[i]];}
   const carve=path=>{for(const id of path)live.add(id);};
   if(world.growth==='prim'){
    const frontier=active.flatMap(extensions);
    while(frontier.length){const i=Math.floor(random()*frontier.length),path=frontier[i];frontier[i]=frontier.at(-1);frontier.pop();
     if(live.has(path.at(-1)))continue;carve(path);frontier.push(...extensions(path.at(-1)));
    }
   }else while(active.length){
    const i=world.growth==='dfs'||random()<.7?active.length-1:Math.floor(random()*active.length),choices=extensions(active[i]);
    if(!choices.length){active.splice(i,1);continue;}const path=choices[Math.floor(random()*choices.length)];carve(path);active.push(path.at(-1));
   }
  }else{
  const eligible=id=>!live.has(id)&&neighbors(id).filter(n=>live.has(n)).length===1;
  const active=[...live];for(let i=active.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[active[i],active[j]]=[active[j],active[i]];}
  if(world.growth==='prim'){
   const frontier=active.flatMap(neighbors);
   while(frontier.length){const i=Math.floor(random()*frontier.length),id=frontier[i];frontier[i]=frontier.at(-1);frontier.pop();if(!eligible(id))continue;live.add(id);frontier.push(...neighbors(id));}
  }else while(active.length){
   const i=world.growth==='dfs'||random()<.7?active.length-1:Math.floor(random()*active.length),choices=neighbors(active[i]).filter(eligible);
   if(!choices.length){active.splice(i,1);continue;}const id=choices[Math.floor(random()*choices.length)];live.add(id);active.push(id);
  }
  }
  world.cells=Uint8Array.from(world.cells,(_,id)=>live.has(id)?1:0);removed=floors-live.size;
 }
 world.holeRimWalls=Boolean(options.holeRimWalls);
 world.holeRimWallCount=0;
 if(world.holeRimWalls){
  // Thin the rim only after generation, keeping every reserved winding circuit.
  const keep=new Set([world.start]);
  for(const loop of world.guaranteedLoops)for(const path of [loop.horizontal,loop.vertical]){let id=path.start;keep.add(id);for(const d of path.directions){id=world.edges.get(`${id}:${d}`).to;keep.add(id);}}
  const rim=[];for(const p of world.portals){const l=world.layouts[p.sheet];for(let y=p.y-1;y<=p.y+p.size;y++)for(let x=p.x-1;x<=p.x+p.size;x++){const id=l.offset+y*l.width+x;if(world.cells[id]&&!keep.has(id))rim.push(id);}}
  for(let i=rim.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[rim[i],rim[j]]=[rim[j],rim[i]];}
  const target=Math.max(1,Math.ceil(rim.length*.45));
  for(const id of rim){if(world.holeRimWallCount>=target)break;world.cells[id]=0;
   if(reachable().length!==world.cells.reduce((a,b)=>a+b,0)){world.cells[id]=1;continue;}world.holeRimWallCount++;
  }
 }
 if(reachable().length!==world.cells.reduce((a,b)=>a+b,0))throw Error('2トーラス迷路に孤立した床があります。');
 for(const [key,e] of world.edges)if(!world.cells[Number(key.split(':')[0])]||!world.cells[e.to])world.edges.delete(key);
 // Verify actual cycles, not merely the presence of an open boundary edge.
 for(const {sheet,horizontal,vertical} of world.guaranteedLoops){const l=world.layouts[sheet];
  for(const [path,expectedX,expectedY] of [[horizontal,l.width,0],[vertical,0,l.height]]){
   let id=path.start,x=0,y=0;for(const d of path.directions){const e=world.edges.get(`${id}:${d}`);if(!e||position(world,e.to).sheet!==sheet)throw Error('上下・左右の周回路を確保できません。');id=e.to;x+=directions[d][0];y+=directions[d][1];}
   if(id!==path.start||x!==expectedX||y!==expectedY)throw Error('指定方向の周回路が閉じていません。');
  }
 }
 // End on the other torus so the central connection is part of the route.
 world.exit=reachable().filter(id=>position(world,id).sheet===1).at(-1);
 world.wallCount=world.cells.filter(n=>!n).length-world.holes.size;
 world.underpassProtected=[...world.holes,...world.portals.flatMap(p=>{const l=world.layouts[p.sheet],ids=[];for(let y=p.y-1;y<=p.y+p.size;y++)for(let x=p.x-1;x<=p.x+p.size;x++)ids.push(l.offset+y*l.width+x);return ids;})];
 world.underpassReach=2;const physicalLength=world.cells.length;addFloorUnderpasses(world,options.floorUnderpasses??0);
 world.wallCount=world.cells.slice(0,physicalLength).filter(n=>!n).length-world.holes.size;return world;
}
function position(world,id){
 if(world.layouts){const sheet=world.layouts.findIndex(l=>id>=l.offset&&id<l.offset+l.width*l.height),l=world.layouts[sheet];return l?{sheet,x:(id-l.offset)%l.width,y:Math.floor((id-l.offset)/l.width)}:{sheet:-1,x:0,y:0};}
 return {sheet:Math.floor(id/64),x:id%8,y:Math.floor(id%64/8)};
}
// Seeded next-maze choices; disabled groups keep the applied world's values.
function randomDoubleOptions(seed,world,groups={}){
 let value=2166136261;for(const c of String(seed)+'-conditions')value=Math.imul(value^c.charCodeAt(0),16777619);
 const pick=values=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return values[Math.floor(value/4294967296*values.length)];};
 const options={seed,growth:world.growth,wallStyle:world.wallStyle,dimensions:world.layouts.slice(0,2).map(l=>[l.width,l.height]),holeSize:world.holeSize,holeRimWalls:world.holeRimWalls,loopStyle:world.loopStyle,floorUnderpasses:world.floorUnderpasses??0,underpassShape:world.underpassShape};
 if(groups.generation){options.growth=pick(['walls','dfs','prim','growing']);options.wallStyle=pick(['dense','grid']);}
 if(groups.size)options.dimensions=Array.from({length:2},()=>[pick([16,18,20,22,24]),pick([16,18,20,22,24])]);
 // An unchanged odd size must not silently change when only generation is random.
 if(options.dimensions.flat().some(n=>n%2))options.wallStyle='dense';
 if(groups.hole){options.holeSize=pick([1,2,3,4].filter(n=>n<=Math.min(...options.dimensions.flat())-4));options.holeRimWalls=pick([false,true]);}
 // Keep an explicitly retained large hole valid when sizes are randomized.
 if(groups.size&&!groups.hole){const min=options.holeSize+4;options.dimensions=options.dimensions.map(pair=>pair.map(n=>Math.max(n,min+(min%2))));}
 if(groups.loop)options.loopStyle=pick(['straight','meander']);
 if(groups.underpasses){options.floorUnderpasses=pick([0,1,2,3,4]);options.underpassShape=pick(['straight','mixed','corners']);}
 return options;
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
 const current=groundSheet(state.world,state.id),queue=[{x:0,y:0,id:state.id,frame:state.frame,depth:0,sheet:current}],seen=new Set(),tiles=new Map();
 for(const p of queue){
  if(p.id>=0&&(state.world.passages||[]).some(c=>{
   const at=position(state.world,p.id),right=directions[p.frame[1]],down=directions[p.frame[2]];
   const axis=state.id===c.horizontal?'horizontal':state.id===c.vertical?'vertical':passageApproach(c,at.x-c.cx-p.x*right[0]-p.y*down[0],at.y-c.cy-p.x*right[1]-p.y*down[1]);
   return underpassHidden({...state.world,...c},p.id,axis);
  }))p.id=-1;
  const key=`${p.x},${p.y}`,signature=`${key}:${p.id}:${p.frame}:${p.sheet}`;if(seen.has(signature))continue;seen.add(signature);
  const wall=!state.world.cells[p.id],local=p.sheet===current||Boolean(p.blockedThroat),prev=tiles.get(key);
  // A foreign wall still stops propagation, but never covers the local scene.
  if(wall&&!local)continue;
  if(!prev||(local&&!prev.local)||(local===prev.local&&(p.depth<prev.distance||(p.depth===prev.distance&&wall&&!prev.wall))))
   tiles.set(key,{x:p.x,y:p.y,id:p.id,frame:[...p.frame],wall,local,distance:p.depth,wallCandidate:wall,floorCandidate:!wall,selfCandidate:!wall&&p.id===state.id});
  if(wall||p.depth>=radius)continue;
  for(let wd=0;wd<4;wd++){
   const d=p.frame.indexOf(wd),[dx,dy]=directions[d],edge=(state.world.candidates.size?state.world.candidates:state.world.edges).get(`${p.id}:${wd}`);
   queue.push({x:p.x+dx,y:p.y+dy,id:edge?edge.to:-1,frame:edge?p.frame.map(n=>edge.transform[n]):p.frame,depth:p.depth+1,sheet:edge?groundSheet(state.world,edge.to):p.sheet,blockedThroat:edge?.kind==='throat'&&!state.world.cells[edge.to]});
  }
 }
 if(metrics)Object.assign(metrics,{queued:queue.length,states:seen.size,tiles:tiles.size,radius});return [...tiles.values()];
}
// Topowalk-style local chart: nearest floor wins; walls win ties, only chosen floor expands.
function nearestView(state,radius=4,metrics=null){
 if(!Number.isInteger(radius)||radius<0||radius>6)throw Error('Invalid preview radius');
 if(['double','triple','doubleMaze'].includes(state.world.mode))return holeView(state,radius,metrics);
 const queue=[{x:0,y:0,id:state.id,frame:state.frame,depth:0}],tiles=new Map(),seen=new Set();
 const underpass=Boolean(state.world.passages?.length),passages=underpass?(state.world.passages||[state.world]):[];
 for(const p of queue){
  if(underpass&&p.id>=0&&passages.some(c=>{
   let axis=underpassAxis(state,c);
   if(['kleinMaze','torusMaze'].includes(state.world.mode)&&state.id!==c.horizontal&&state.id!==c.vertical){
    // Locate the observer in this visible copy of the crossing, not across the
    // discontinuous coordinates of the fundamental rectangle.
    const at=position(state.world,p.id),right=directions[p.frame[1]],down=directions[p.frame[2]];
    const dx=at.x-c.cx-p.x*right[0]-p.y*down[0],dy=at.y-c.cy-p.x*right[1]-p.y*down[1];
    axis=passageApproach(c,dx,dy);
   }
   return underpassHidden({...state.world,...c},p.id,axis);
  }))p.id=-1;
  const key=`${p.x},${p.y}`,signature=`${key}:${p.id}:${p.frame}`;if(seen.has(signature))continue;seen.add(signature);
  const wall=!state.world.cells[p.id],prev=tiles.get(key);
  if(prev&&(prev.distance<p.depth||(prev.distance===p.depth&&(prev.wall||!wall))))continue;
  tiles.set(key,{x:p.x,y:p.y,id:p.id,frame:[...p.frame],wall,distance:p.depth,wallCandidate:wall,floorCandidate:!wall,selfCandidate:!wall&&p.id===state.id});
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
 if(!['crossing','crossingMaze','kleinMaze','torusMaze','doubleMaze'].includes(state.world.mode))return {memory,visible:new Set()};
 const visible=new Set(nearestView(state).filter(p=>p.id>=0).map(p=>p.id));
 for(const id of visible)memory.add(id);return {memory,visible};
}
// Unfold the experience along the walked path, across sheet changes as well.
// This chart uses perceived coordinates, never the fundamental sheet rectangle.
function observeJourneyMap(state,memory={cells:new Map()},view=nearestView(state)){
 const visible=new Set();
 for(const p of view){
  const x=state.x+p.x,y=state.y+p.y,key=`${x},${y}`;visible.add(key);
  // Synthetic occluders have no known terrain identity; do not erase old terrain.
  if(p.id<0)continue;
  memory.cells.set(key,{...p,x,y,frame:p.frame?[...p.frame]:[...state.frame]});
 }
 // The occupied tile is certain even if another optical path shares its position.
 const key=`${state.x},${state.y}`;
 memory.cells.set(key,{id:state.id,x:state.x,y:state.y,wall:false,frame:[...state.frame]});visible.add(key);
 return {chart:memory,visible};
}
// Observed, non-portal connectivity forms stable atlas regions. Never flood unseen floors.
function observeRegions(state,book={records:new Map(),owners:new Map(),nextNumber:1},view=nearestView(state)){
 const world=state.world;
 for(const p of view)if(p.id>=0)book.records.set(p.id,{id:p.id,wall:!world.cells[p.id]});
 const known=new Set([...book.records.values()].filter(p=>!p.wall).map(p=>p.id)),remaining=new Set(known),regions=[];
 while(remaining.size){
  const first=remaining.values().next().value,ids=[first];remaining.delete(first);
  for(const id of ids)for(let d=0;d<4;d++){const e=world.edges.get(`${id}:${d}`);if(e&&e.kind!=='throat'&&remaining.has(e.to)){remaining.delete(e.to);ids.push(e.to);}}
  const old=ids.map(id=>book.owners.get(id)).filter(n=>n!==undefined),number=old.length?Math.min(...old):book.nextNumber++;
  const records=new Map(ids.map(id=>[id,book.records.get(id)])),entrances=[];let complete=true;
  for(const id of ids){book.owners.set(id,number);for(let d=0;d<4;d++){
   const e=world.edges.get(`${id}:${d}`),candidate=world.candidates.get(`${id}:${d}`);
   if(e?.kind==='throat'){entrances.push(id);continue;}
   if(e&&!known.has(e.to))complete=false;
   if(candidate&&candidate.kind!=='throat'&&book.records.get(candidate.to)?.wall)records.set(candidate.to,book.records.get(candidate.to));
  }}
  regions.push({number,sheet:groundSheet(world,first),ids,records,entrances:[...new Set(entrances)],complete});
 }
 regions.sort((a,b)=>a.number-b.number);book.regions=regions;
 return {book,regions,current:regions.find(r=>r.ids.includes(state.id))};
}
// Keep charts consistent with observed appearances, without erasing conflicting memories.
function observeWalkingMap(state,book={charts:[],active:-1},view=nearestView(state)){
 const sheet=groundSheet(state.world,state.id),underpass=Boolean(state.world.passages?.length),standalone=['underpass','underpassMaze','cornerUnderpass'].includes(state.world.mode);
 // Across-stair glimpses stay in the live view; archive the layer being explored.
 const here=position(state.world,state.id);
 const observations=view.filter(p=>standalone||p.id<0||groundSheet(state.world,p.id)===sheet).map(p=>{
  const record={...p,x:p.x+state.x,y:p.y+state.y,signature:p.wall?'wall':`floor:${standalone?0:groundSheet(state.world,p.id)}`};
  if(underpass){const right=directions[state.frame[1]],down=directions[state.frame[2]];
   record.groundX=here.x+p.x*right[0]+p.y*down[0];record.groundY=here.y+p.x*right[1]+p.y*down[1];
   // Compare actual locations modulo the seam, while leaving chart x/y unfolded.
   if(['kleinMaze','torusMaze','doubleMaze'].includes(state.world.mode)){
    const {width,height}=state.world.layouts[sheet],wrap=Math.floor(record.groundX/width);
    record.groundX=((record.groundX%width)+width)%width;
    if(state.world.mode==='kleinMaze'&&Math.abs(wrap)%2)record.groundY=-record.groundY;
    record.groundY=((record.groundY%height)+height)%height;
   }
   record.groundSheet=sheet;record.underpassProjection=state.world.passages.some(c=>(c.baseSheet??0)===sheet&&Math.abs(record.groundX-c.cx)<=1&&Math.abs(record.groundY-c.cy)<=1);
  }return record;
 });
 // Only certified local underpass appearances may disagree. Different coordinate
 // registrations (e.g. a displaced chart) are never merged by this exception.
 const compatible=(a,b)=>{
  if(!underpass)return a.signature===b.signature;
  if(a.groundSheet!==b.groundSheet||a.groundX!==b.groundX||a.groundY!==b.groundY)return false;
  return a.signature===b.signature||Boolean(a.underpassProjection&&b.underpassProjection);
 };
 const fits=chart=>(standalone||![...chart.cells.values()].some(p=>!p.wall&&groundSheet(state.world,p.id)!==sheet))&&observations.every(p=>{const old=chart.cells.get(`${p.x},${p.y}`);return !old||compatible(old,p);});
 // On returning through a known hole, register the saved sheet chart against
 // a visible remembered floor, or the shared sheet frame for disconnected pockets.
 // Keep unseen records as well as the saved chart identity.
 if(state.world.mode==='doubleMaze'&&state.last?.kind==='throat'&&book.lastArrivalStep!==state.steps){
  book.lastArrivalStep=state.steps;
  registration:for(const saved of [...book.charts].reverse()){
   if(![...saved.cells.values()].some(p=>!p.wall&&groundSheet(state.world,p.id)===sheet))continue;
   const floors=[...saved.cells.values()].filter(p=>!p.wall&&p.frame),pairs=[];
   for(const now of observations.filter(p=>!p.wall&&p.frame))for(const old of floors)if(old.id===now.id)pairs.push({old,now});
   // A hole preserves the destination sheet's coordinate system even when walls
   // separate its pockets. Register unseen remembered anchors in that same sheet.
   const rightNow=directions[state.frame[1]],downNow=directions[state.frame[2]];
   const inferred=floors.map(old=>{const at=position(state.world,old.id);
    const dx=at.x-here.x,dy=at.y-here.y;
    return {old,now:{id:old.id,x:state.x+dx*rightNow[0]+dy*rightNow[1],y:state.y+dx*downNow[0]+dy*downNow[1],frame:[...state.frame]},distance:Math.abs(dx)+Math.abs(dy)};
   }).sort((a,b)=>a.distance-b.distance);
   pairs.push(...inferred);
   for(const {old,now} of pairs){
    const change=old.frame.map(d=>now.frame.indexOf(d)),right=directions[change[1]],down=directions[change[2]],aligned=new Map();
    for(const p of saved.cells.values()){
     const dx=p.x-old.x,dy=p.y-old.y,x=now.x+dx*right[0]+dy*down[0],y=now.y+dx*right[1]+dy*down[1];
     const frame=p.frame?identity.map(d=>p.frame[change.indexOf(d)]):undefined;
     aligned.set(`${x},${y}`,{...p,x,y,frame});
    }
    if(!fits({cells:aligned}))continue;
    saved.cells=aligned;book.active=book.charts.indexOf(saved);break registration;
   }
  }
 }
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
// Versioned local snapshot: retain the generated graph, not just its seed.
function encodeSave(snapshot){
 return JSON.stringify({format:'connection-double-save',version:1,savedAt:new Date().toISOString(),snapshot},(_,v)=>v instanceof Map?{saveType:'Map',values:[...v]}:v instanceof Set?{saveType:'Set',values:[...v]}:v instanceof Uint8Array?{saveType:'Cells',values:[...v]}:v);
}
function decodeSave(text){
 if(typeof text!=='string'||text.length>20000000)throw Error('保存データの大きさが不正です。');
 const data=JSON.parse(text,(_,v)=>{
  if(!v||!v.saveType)return v;
  if(!Array.isArray(v.values))throw Error('保存データの形式が不正です。');
  if(v.saveType==='Map')return new Map(v.values);
  if(v.saveType==='Set')return new Set(v.values);
  if(v.saveType==='Cells'){if(v.values.some(n=>n!==0&&n!==1))throw Error('床データが不正です。');return Uint8Array.from(v.values);}
  throw Error('未対応の保存形式です。');
 });
 if(data.format!=='connection-double-save'||data.version!==1)throw Error('未対応の保存バージョンです。');
 const s=data.snapshot,st=s?.state,w=st?.world,validFrame=f=>Array.isArray(f)&&f.length===4&&new Set(f).size===4&&f.every(n=>Number.isInteger(n)&&n>=0&&n<4);
 const fail=()=>{throw Error('保存データの内容が不正です。');};
 if(!w||w.mode!=='doubleMaze'||w.sheets!==2||!(w.cells instanceof Uint8Array)||w.cells.length>10000||!Array.isArray(w.layouts)||w.layouts.length<2||!(w.edges instanceof Map)||!(w.candidates instanceof Map)||!(w.holes instanceof Set)||!Array.isArray(w.portals))fail();
 let length=0;for(const l of w.layouts){if(!Number.isInteger(l.width)||!Number.isInteger(l.height)||l.width<8||l.width>24||l.height<8||l.height>24||l.offset!==length)fail();length+=l.width*l.height;}if(length!==w.cells.length)fail();
 if(!Number.isInteger(st.id)||!w.cells[st.id]||!validFrame(st.frame)||![st.x,st.y,st.steps].every(Number.isSafeInteger)||st.steps<0||!Array.isArray(st.history))fail();
 for(const map of [w.edges,w.candidates])for(const [key,e] of map){const parts=String(key).split(':').map(Number);if(parts.length!==2||!Number.isInteger(parts[0])||parts[0]<0||parts[0]>=length||!Number.isInteger(parts[1])||parts[1]<0||parts[1]>3||!Number.isInteger(e.to)||e.to<0||e.to>=length||!validFrame(e.transform))fail();if(map===w.edges&&(!w.cells[parts[0]]||!w.cells[e.to]))fail();}
 if(!(s.atlasMemory instanceof Set)||!(s.journeyMap?.cells instanceof Map)||!(s.regionBook?.records instanceof Map)||!(s.regionBook?.owners instanceof Map)||!Array.isArray(s.walkingBook?.charts)||!s.walkingBook.charts.every(c=>c.cells instanceof Map)||!Number.isSafeInteger(s.journey?.number)||s.journey.number<1||!Number.isSafeInteger(s.journey.steps)||s.journey.steps<0||!s.controls)fail();
 const cellId=id=>Number.isInteger(id)&&id>=0&&id<length;
 const record=p=>p&&Number.isSafeInteger(p.x)&&Number.isSafeInteger(p.y)&&Number.isInteger(p.id)&&p.id>=-1&&p.id<length&&(!p.frame||validFrame(p.frame));
 if(!cellId(w.start)||!cellId(w.exit)||!w.cells[w.start]||!w.cells[w.exit]||!Number.isInteger(s.walkingBook.active)||s.walkingBook.active< -1||s.walkingBook.active>=s.walkingBook.charts.length||!Number.isSafeInteger(s.regionBook.nextNumber)||s.regionBook.nextNumber<1)fail();
 for(const c of s.walkingBook.charts){if(!Number.isSafeInteger(c.number)||c.number<1)fail();for(const [key,p] of c.cells)if(!record(p)||key!==`${p.x},${p.y}`)fail();}
 for(const [key,p] of s.journeyMap.cells)if(!record(p)||key!==`${p.x},${p.y}`)fail();
 for(const id of s.atlasMemory)if(!cellId(id))fail();
 for(const [id,p] of s.regionBook.records)if(!cellId(id)||p?.id!==id)fail();
 for(const [id,n] of s.regionBook.owners)if(!cellId(id)||!Number.isSafeInteger(n)||n<1)fail();
 for(const c of Object.values(s.controls))if(!c||typeof c.value!=='string'||typeof c.checked!=='boolean')fail();
 for(const p of w.passages||[])if(!cellId(p.horizontal)||!cellId(p.vertical)||![0,1].includes(p.baseSheet)||!Number.isInteger(p.cx)||!Number.isInteger(p.cy))fail();
 return data;
}
const api={encodeSave,decodeSave,randomDoubleOptions,observeJourneyMap,observeRegions,underpassSymbol,groundSheet,underpassAxis,crossingStats,observeWalkingMap,observeAtlas,holeLimit,position,names,directions,generate,create,move,quadrantSheets,branchView,branchRayView,candidateView,nearestView};if(typeof module==='object')module.exports=api;else root.ConnectionSpace=api;
})(typeof globalThis==='object'?globalThis:this);
