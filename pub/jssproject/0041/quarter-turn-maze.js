/* Directed seam maze: every remaining floor can reach every other floor. */
(function(root){'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
const frames=[1,-1].flatMap(sign=>[0,1,2,3].map(rot=>[0,1,2,3].map(d=>(sign*d+rot+4)%4)));
function seesSelf(w,id,frame){return !!w.cells[id]&&S.nearestView({world:w,id,frame},6).some(t=>!t.wall&&t.id===id&&(t.x!==0||t.y!==0));}
const modes=['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist'],D=[[0,-1],[1,0],[0,1],[-1,0]],I=[0,1,2,3];
function topology(mode,size){
 if(!modes.includes(mode)||!Number.isInteger(size)||size<8||size>24)throw Error('Invalid quarter-turn world');
 const candidates=new Map(),cells=new Uint8Array(size*size).fill(1),n=size-1;
 for(let id=0;id<cells.length;id++)for(let d=0;d<4;d++){
 const x=id%size,y=Math.floor(id/size);let nx=x+D[d][0],ny=y+D[d][1],transform=I,kind='normal';
 if(nx<0||nx>=size||ny<0||ny>=size){kind='twisted-boundary';if(mode==='doubleTwist'){if(d%2){nx=(nx+size)%size;ny=n-y;transform=[2,1,0,3];}else{ny=(ny+size)%size;nx=n-x;transform=[0,3,2,1];}}
 else{const t0=[x,y,n-x,n-y][d],t=mode.endsWith('Twist')?n-t0:t0,cw=mode==='quarterCW'||mode==='cwTwist',edge=(d+(cw?1:3))%4;[nx,ny]=[[t,0],[n,t],[n-t,n],[0,n-t]][edge];transform=cw?[3,0,1,2]:[1,2,3,0];}}
 candidates.set(id+':'+d,{to:ny*size+nx,transform:[...transform],kind});
 }
 return {mode,size,sheets:1,cells,candidates,edges:new Map(candidates),start:size+1,holes:new Set(),directed:mode!=='doubleTwist'};
}
const algorithms=['legacy','dfs','prim','growing','kruskal','hunt','wilson','rooms','division','eller'];
function generate(mode,size=16,seed='quarter-1',options={}){
 const algorithm=options.algorithm||'legacy';if(!algorithms.includes(algorithm))throw Error('Invalid maze algorithm');
 const w=topology(mode,size),count=size*size,adj=Array.from({length:count},()=>[]),rev=Array.from({length:count},()=>[]);
 for(const [key,e]of w.candidates){const id=Number(key.split(':')[0]);adj[id].push(e.to);rev[e.to].push(id);}
 function reach(graph){const q=[w.start],seen=new Set(q);for(const id of q)for(const n of graph[id])if(w.cells[n]&&!seen.has(n)){seen.add(n);q.push(n);}return q;}
 function seams(){return [0,1,2,3].every(d=>{for(let id=0;id<count;id++){const e=w.candidates.get(id+':'+d);if(w.cells[id]&&w.cells[e.to]&&e.kind!=='normal')return true;}return false;});}
 let hash=2166136261;for(const c of String(seed))hash=Math.imul(hash^c.charCodeAt(0),16777619);const random=()=>((hash=(Math.imul(hash,1664525)+1013904223)>>>0)/4294967296);
 const order=Array.from({length:count},(_,i)=>i);for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 // Preserve an actual visible self image in every possible orientation.
 // Short loops alone are insufficient: nearest-view walls can hide the image.
 const witness=order.find(id=>frames.every(frame=>seesSelf(w,id,frame)));
 if(witness===undefined)throw Error('自己像が見える地点を確保できませんでした。');
 let preferred=null;
 if(algorithm!=='legacy'){
  const core=typeof module==='object'?require('./core.js'):root.MazeCore,n=size-1;
  const source=core.generate({width:n,height:n,algorithm,seed:String(seed),topology:'plane'});
  preferred=new Uint8Array(count);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)preferred[y*size+x]=source.cells[y*n+x];
 }
 // Keep the chosen generator's passages. Reject only walls that would break
 // directed reachability, seam access, or the guaranteed visible self image.
 let floors=count;for(const id of order){if(id===w.start||id===witness||preferred?.[id])continue;w.cells[id]=0;if(reach(adj).length!==floors-1||reach(rev).length!==floors-1||!seams()||!frames.every(frame=>seesSelf(w,witness,frame)))w.cells[id]=1;else floors--;}
 // Extend a boundary passage into the destination interior, until it meets
 // a passage that existed before this extension (not another new extension).
 const routeCount=options.seamRoutes??0;
 if(![0,1,2].includes(routeCount))throw Error('Invalid seam route count');
 w.seamRoutes=[];
 if(routeCount){
  const original=w.cells.slice(),interior=id=>{const x=id%size,y=Math.floor(id/size);return x>0&&y>0&&x<size-1&&y<size-1;};
  const choices=[];
  for(const id of order)if(original[id])for(let d=0;d<4;d++){const e=w.candidates.get(id+':'+d);if(e.kind!=='normal')choices.push({id,d,e});}
  // Prefer an unopened landing; existing connections remain valid fallbacks.
  choices.sort((a,b)=>original[a.e.to]-original[b.e.to]);
  for(const {id,d,e}of choices){
   if(w.seamRoutes.length>=routeCount)break;
   if(w.seamRoutes.some(r=>r.from===id||r.to===e.to))continue;
   const inward=e.transform[d],first=w.candidates.get(e.to+':'+inward);
   if(first.kind!=='normal')continue;
   const queue=[first.to],parents=new Map([[first.to,null]]);let end=null;
   for(const at of queue){if(interior(at)&&original[at]){end=at;break;}
    for(const dir of [inward,(inward+1)%4,(inward+3)%4,(inward+2)%4]){
     const next=w.candidates.get(at+':'+dir);if(next.kind!=='normal'||next.to===e.to||parents.has(next.to))continue;
     parents.set(next.to,at);queue.push(next.to);
    }
   }
   if(end===null)continue;
   const tail=[];for(let at=end;at!==null;at=parents.get(at))tail.push(at);
   const path=[e.to,...tail.reverse()],added=[...new Set(path.filter(at=>!w.cells[at]))];
   for(const at of added)w.cells[at]=1;
   if(reach(adj).length!==floors+added.length||reach(rev).length!==floors+added.length||!frames.every(frame=>seesSelf(w,witness,frame))){for(const at of added)w.cells[at]=0;continue;}
   floors+=added.length;w.seamRoutes.push({from:id,direction:d,to:e.to,path,added});
  }
  if(w.seamRoutes.length<routeCount)throw Error('境界から既存通路への接続を確保できませんでした。');
 }
 // Join nearby boundary corridors through a single intervening wall.
 w.boundaryLinksOpened=0;
 if(options.boundaryLinks){
  const distance=new Map(),queue=[];
  for(let id=0;id<count;id++)if(w.cells[id]&&[0,1,2,3].some(d=>{const e=w.candidates.get(id+':'+d);return e.kind!=='normal'&&w.cells[e.to];})){distance.set(id,0);queue.push(id);}
  for(const id of queue){const depth=distance.get(id);if(depth>=3)continue;for(let d=0;d<4;d++){const e=w.candidates.get(id+':'+d);if(e.kind==='normal'&&w.cells[e.to]&&!distance.has(e.to)){distance.set(e.to,depth+1);queue.push(e.to);}}}
  for(const id of order){if(w.cells[id]||w.boundaryLinksOpened>=Math.ceil(size/4))continue;
   const joins=[0,1].some(d=>{const a=w.candidates.get(id+':'+d),b=w.candidates.get(id+':'+(d+2));return a.kind==='normal'&&b.kind==='normal'&&distance.has(a.to)&&distance.has(b.to);});
   if(!joins)continue;w.cells[id]=1;
   if(reach(adj).length!==floors+1||reach(rev).length!==floors+1||!frames.every(frame=>seesSelf(w,witness,frame))){w.cells[id]=0;continue;}
   floors++;w.boundaryLinksOpened++;
  }
 }
 // Work backwards along the ordinary route from the chosen exit. A cut is
 // accepted only when a seam becomes necessary and every remaining floor can
 // still reach every other floor in the directed graph.
 w.exit=reach(adj).at(-1);w.seamDetour={requested:!!options.seamDetour,blocked:null,required:false};
 function ordinaryRoute(){const queue=[w.start],parent=new Map([[w.start,null]]);
  for(const id of queue){if(id===w.exit){const path=[];for(let at=id;at!==null;at=parent.get(at))path.push(at);return path;}
   for(let d=0;d<4;d++){const e=w.candidates.get(id+':'+d);if(e.kind==='normal'&&w.cells[e.to]&&!parent.has(e.to)){parent.set(e.to,id);queue.push(e.to);}}
  }return null;
 }
 if(options.seamDetour){
  const route=ordinaryRoute(),protectedCells=new Set([w.start,w.exit,witness,...w.seamRoutes.flatMap(r=>[r.from,...r.path])]);
  if(route)for(const id of route){if(protectedCells.has(id))continue;w.cells[id]=0;
   if(!ordinaryRoute()&&reach(adj).length===floors-1&&reach(rev).length===floors-1&&seams()&&frames.every(frame=>seesSelf(w,witness,frame))){floors--;w.seamDetour.blocked=id;break;}
   w.cells[id]=1;
  }
  w.seamDetour.required=!ordinaryRoute();
 }
 w.edges=new Map([...w.candidates].filter(([key,e])=>w.cells[Number(key.split(':')[0])]&&w.cells[e.to]));w.seed=String(seed);w.selfEncounter=witness;w.algorithm=algorithm;return addUnderpasses(w,options.floorUnderpasses??0,options.underpassShape??'mixed');
}
// Trial the established two-lane generator, then validate both directions of
// the directed graph. A reachable exit alone is insufficient on these seams.
function addUnderpasses(w,count,shape){
 if(!Number.isInteger(count)||count<0||count>6||!['straight','corners','mixed'].includes(shape))throw Error('Invalid underpass settings');
 w.floorUnderpasses=count;w.underpassShape=shape;if(!count)return w;
 const trial={...w,cells:w.cells.slice(),edges:new Map(w.edges),candidates:new Map(w.candidates),layouts:[{width:w.size,height:w.size,offset:0}],underpassProtected:[w.selfEncounter,...w.seamRoutes.flatMap(r=>[r.from,...r.path])],underpassReach:2};
 S.addFloorUnderpasses(trial,count);if(shape!=='straight')S.bendUnderpasses(trial,shape);
 const reverse=new Map();for(const [key,e]of trial.edges){if(!reverse.has(e.to))reverse.set(e.to,[]);reverse.get(e.to).push(Number(key.split(':')[0]));}
 function reach(back=false,normal=false){const q=[trial.start],seen=new Set(q);for(const id of q){const next=back?(reverse.get(id)||[]):D.flatMap((_,d)=>{const e=trial.edges.get(id+':'+d);return e&&(!normal||e.kind==='normal'||e.kind==='underpass')?[e.to]:[];});for(const n of next)if(!seen.has(n)){seen.add(n);q.push(n);}}return seen;}
 const floors=trial.cells.reduce((a,b)=>a+b,0);
 if(reach().size!==floors||reach(true).size!==floors||w.seamDetour.required&&reach(false,true).has(w.exit)||!frames.every(frame=>seesSelf(trial,w.selfEncounter,frame)))return w;
 // Complete optical adjacency only; movement still uses the two independent lanes.
 const area=w.size*w.size;for(let id=0;id<trial.cells.length;id++)for(let d=0;d<4;d++)if(!trial.candidates.has(id+':'+d))trial.candidates.set(id+':'+d,w.candidates.get(id%area+':'+d));
 return trial;
}
function projectTile(state,t){
 const w=state.world;if(!w.passages?.length||t.id<0)return t;
 const at=S.position(w,t.id),frame=t.frame||I,right=D[frame[1]],down=D[frame[2]];let id=t.id,wall=t.wall;
 for(const c of w.passages){
  const axis=state.id===c.horizontal?'horizontal':state.id===c.vertical?'vertical':S.passageApproach(c,at.x-c.cx-t.x*right[0]-t.y*down[0],at.y-c.cy-t.x*right[1]-t.y*down[1]);
  if(id===c.horizontal||id===c.vertical)id=axis==='vertical'?c.vertical:c.horizontal;
  if(S.underpassHidden({...w,...c},id,axis))wall=true;
 }
 return {...t,id,wall:wall||!w.cells[id]};
}
function installRules(state,ruleMode='plain'){
 if(!['plain','birds'].includes(ruleMode))throw Error('未対応の探索ルールです。');if(ruleMode==='plain')return state;state.world.ruleMode=ruleMode;
 if(ruleMode==='birds'){const F=typeof module==='object'?require('./sheet-features.js'):root.SheetFeatures;state.world.seed??='quarter-fixed';state.world.quarterBirds=true;state.world.domain=new Set(Array.from(state.world.cells.keys()).filter(id=>state.world.cells[id]));F.install(state,{birds:true,birdAcross:true,birdWander:true,birdLeap:true});}return state;
}
function create(mode,size,seed,options){const world=generate(mode,size,seed,options);return installRules({world,id:world.start,frame:[...I],x:0,y:0,steps:0,history:[{x:0,y:0,id:world.start}],last:null},options?.ruleMode??'plain');}
const ghostTopologies=new WeakMap();
function wallEdge(world,id,wd){
 const edge=world.candidates.get(id+':'+wd);if(edge)return edge;
 if(!ghostTopologies.has(world))ghostTopologies.set(world,topology(world.mode,world.size));
 return ghostTopologies.get(world).candidates.get(id+':'+wd);
}
function toggleWallPass(state){
 if(state.wallPass&&!state.world.cells[state.id])return false;
 state.wallPass=!state.wallPass;return true;
}
function move(state,direction,truth=false){
 if(state.wands?.frozen)return S.move(state,4);
 if(direction===4||!state.wallPass)return S.move(state,direction,truth);
 if(!Number.isInteger(direction)||direction<0||direction>3)return false;
 const wd=truth?direction:state.frame[direction],edge=wallEdge(state.world,state.id,wd);if(!edge)return false;
 const wildlife=typeof module==='object'?require('./maze-wildlife.js'):root.MazeWildlife;wildlife?.ensure(state,wildlife.graph(state));
 const local=state.frame.indexOf(wd),[dx,dy]=D[local],from=state.id;
 state.id=edge.to;state.x+=dx;state.y+=dy;state.frame=state.frame.map(d=>edge.transform[d]);state.steps++;
 state.last={from,to:edge.to,worldDirection:wd,localDirection:local,kind:edge.kind,changed:edge.transform.some((d,i)=>d!==i)};
 wildlife?.graphTick(state);
 state.history.push({x:state.x,y:state.y,id:state.id});if(state.history.length>1000)state.history.shift();return true;
}
function nextOptions(options,lottery={},random=Math.random){
 const pick=values=>values[Math.floor(random()*values.length)],next={...options,seed:'turn-'+Math.floor(random()*0x100000000).toString(36)};
 if(options.terrain!=='maze')return next;
 if(lottery.space){const family=pick(['doubleTwist','quarter','quarterTwist']);next.mode=family==='doubleTwist'?family:pick(family==='quarter'?['quarterCW','quarterCCW']:['cwTwist','ccwTwist']);}
 if(lottery.algorithm)next.algorithm=pick(algorithms);
 if(lottery.size)next.size=pick([12,16,20]);
 return next;
}
const api={installRules,projectTile,nextOptions,wallEdge,move,toggleWallPass,algorithms,topology,generate,create,seesSelf};if(typeof module==='object')module.exports=api;else root.QuarterTurnMaze=api;
})(globalThis);
