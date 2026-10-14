/* Exit assistance using full geometry. Planning never mutates exploration. */
(function(root){'use strict';
function search(start,isExit,neighbors,optional=false,collect){
 const key=s=>s.id+':'+(s.mask||0)+':'+(s.via??''),q=[start],parents=new Map([[key(start),null]]);let finish=null;
 for(let i=0;i<q.length;i++){const at=q[i];if(collect){collect.add(at.id);if(at.via!==undefined)collect.add(at.via);}if(!collect&&isExit(at)){finish=key(at);break;}for(const [direction,next]of neighbors(at)){const k=key(next);if(parents.has(k))continue;parents.set(k,[key(at),direction]);q.push(next);}}
 if(finish===null&&optional)return null;
 if(finish===null)throw Error('現在地から出口への道が見つかりません。');
 const path=[];for(let p=parents.get(finish);p;p=parents.get(p[0]))path.push(p[1]);return path.reverse();
}
// Explore the region from which the present location remains reachable first.
// Keys may increase on a return journey; matching the physical location is sufficient.
function exploreSearch(start,visited,neighbors,exit){
 const key=s=>s.id+':'+(s.mask||0)+':'+(s.via??''),nodes=[start],parents=[null],edges=[[]],reverse=[[]],ids=new Map([[key(start),0]]);
 for(let i=0;i<nodes.length;i++)for(const [direction,next] of neighbors(nodes[i])){
  const k=key(next);let j=ids.get(k);if(j===undefined){j=nodes.length;ids.set(k,j);nodes.push(next);parents.push([i,direction]);edges.push([]);reverse.push([]);}edges[i].push(j);reverse[j].push(i);
 }
 const goal=s=>!visited.has(s.id)||(s.via!==undefined&&!visited.has(s.via));
 if(!nodes.some(goal))return null;
 const safe=new Set(),q=[];nodes.forEach((s,i)=>{if(s.id===start.id){safe.add(i);q.push(i);}});
 for(const i of q)for(const j of reverse[i])if(!safe.has(j)){safe.add(j);q.push(j);}
 let target=nodes.findIndex((s,i)=>safe.has(i)&&goal(s));
 if(target<0){
  // No reversible work remains. Prefer an onward region with an exit, then
  // the most remaining floor targets. Ties retain breadth-first ordering.
  let bestExit=-1,bestCount=-1;
  for(let i=1;i<nodes.length;i++){
   if(safe.has(i)||!safe.has(parents[i][0]))continue;
   const reachable=new Set([i]),queue=[i],remaining=new Set();let hasExit=0;
   for(const j of queue){const s=nodes[j];if(s.id===exit)hasExit=1;for(const id of [s.id,s.via])if(id!==undefined&&!visited.has(id))remaining.add(id);for(const k of edges[j])if(!reachable.has(k)){reachable.add(k);queue.push(k);}}
   if(hasExit>bestExit||(hasExit===bestExit&&remaining.size>bestCount)){target=i;bestExit=hasExit;bestCount=remaining.size;}
  }
 }
 if(target<0)return null;
 const path=[];for(let p=parents[target];p;p=parents[p[0]])path.push(p[1]);return path.reverse();
}
function route(start,visited,collect,exit,neighbors){return visited&&!collect?exploreSearch(start,visited,neighbors,exit):search(start,s=>s.id===exit,neighbors,!!collect,collect);}
function connected(state,visited,collect){const w=state.world,f=state.features;if(!Number.isInteger(w.exit))throw Error('出口のある生成迷路で使えます。');return route({id:state.id,mask:f?.hasKey?1:0},visited,collect,w.exit,s=>{const list=[];for(let d=0;d<4;d++){const e=w.edges.get(s.id+':'+d);if(e&&w.cells[e.to]&&(!f||e.to!==f.door||s.mask)){const to=f?.warps.get(e.to)??e.to;list.push([d,{id:to,mask:s.mask||(e.to===f?.key?1:0),...(visited||collect?{via:e.to}:{})}]);}}return list;});}

function main(game,core,visited,collect,avoidBirds=true){const w=game.world;if(!Number.isInteger(w.exit))throw Error('出口のある生成迷路で使えます。');
 const locks=w.puzzle?.locks||[],mask=locks.reduce((m,l,i)=>game.player.keys.includes(l.keyId)?m|1<<i:m,0);
 const danger=new Set();if(avoidBirds&&!collect)for(const b of game.birds||[]){danger.add(b.position);if(b.cooldown<=0&&(game.turns+1)%2===0)for(const d of Object.keys(core.DIRS)){const e=core.transition(w,{world_position:b.position},d);if(e)danger.add(e.to);}}
 const calculate=()=>route({id:game.player.world_position,mask},visited,collect,w.exit,s=>{const list=[],keys=locks.filter((l,i)=>s.mask&(1<<i)).map(l=>l.keyId);for(const d of Object.keys(core.DIRS)){const e=core.ruleTransition(w,{...game.player,world_position:s.id,keys},d);if(!e)continue;if(s.id===game.player.world_position&&s.mask===mask&&danger.has(e.to))continue;const i=locks.findIndex(l=>l.key===e.to);list.push([d,{id:w.warps?.get(e.to)??e.to,...(visited||collect?{via:e.to}:{}),mask:i<0?s.mask:s.mask|1<<i}]);}return list;});
 if(!danger.size)return calculate();
 try{const path=calculate();if(path?.length||(!visited&&path))return path;}catch(error){/* The bird may block the only route: allow contact and replan after transfer. */}
 return main(game,core,visited,collect,false);
}
// Short-cycle escape keeps a distant waypoint instead of chasing a new shortest
// route every turn. This controller never mutates the game or its random stream.
const birdEscapes=new WeakMap();
function birdDetour(game,core){
 if(!game.birds?.length)return null;
 let r=birdEscapes.get(game);if(!r){r={history:[],last:-1,target:null,until:0,cooldown:0,teleports:game.teleports};birdEscapes.set(game,r);}
 if(r.last===game.turns)return r.result??null;r.last=game.turns;
 if(r.teleports!==game.teleports){r.history=[];r.target=null;r.teleports=game.teleports;}
 const position=game.player.world_position;
 const signature=[position,game.turns%2,game.player.keys.join(','),...game.birds.map(b=>b.position+':'+b.cooldown)].join('|');
 r.history.push({signature,id:position});if(r.history.length>32)r.history.shift();
 const danger=new Set(game.birds.map(b=>b.position));for(const b of game.birds)if(b.cooldown<=0&&(game.turns+1)%2===0)for(const d of Object.keys(core.DIRS)){const e=core.transition(game.world,{world_position:b.position},d);if(e)danger.add(e.to);}
 const neighbors=id=>Object.keys(core.DIRS).flatMap(d=>{const e=core.ruleTransition(game.world,{...game.player,world_position:id},d);return e&&!game.birds.some(b=>b.position===e.to)&&!(id===position&&danger.has(e.to))?[[d,e.to]]:[];});
 function paths(){const q=[position],parents=new Map([[position,null]]),depth=new Map([[position,0]]);for(const id of q){if(depth.get(id)>=16)continue;for(const [d,to]of neighbors(id))if(!parents.has(to)){parents.set(to,[id,d]);depth.set(to,depth.get(id)+1);q.push(to);}}return {q,parents,depth};}
 const route=(parents,target)=>{const result=[];for(let p=parents.get(target);p;p=parents.get(p[0]))result.push(p[1]);return result.reverse();};
 if(r.target!==null&&(position===r.target||game.turns>=r.until)){r.target=null;r.history=[];r.cooldown=game.turns+8;}
 let graph=null;
 if(r.target===null&&game.turns>=r.cooldown&&r.history.filter(h=>h.signature===signature).length>=3){
  graph=paths();const recent=new Set(r.history.map(h=>h.id));let best=-Infinity;
  for(const id of graph.q){const distance=graph.depth.get(id);if(distance<6||recent.has(id))continue;
   const score=Math.min(distance,12)+(neighbors(id).length>=2?4:0);if(score>best){best=score;r.target=id;}
  }
  if(r.target!==null){r.until=game.turns+24;r.history=[];}else r.cooldown=game.turns+8;
 }
 r.result=null;
 if(r.target!==null){graph??=paths();if(graph.parents.has(r.target))r.result=route(graph.parents,r.target);else{r.target=null;r.cooldown=game.turns+4;}}
 return r.result;
}
// Lift a local walk into the plane: closing at one period proves a genuine lap.
function liftedLoop(start,vector,neighbors){
 const key=(id,x,y)=>id+':'+x+':'+y,q=[{id:start,x:0,y:0}],parents=new Map([[key(start,0,0),null]]),bound=3*(Math.abs(vector[0])+Math.abs(vector[1])+8);let finish=null;
 for(let i=0;i<q.length&&q.length<250000;i++){const at=q[i],k=key(at.id,at.x,at.y);if(at.id===start&&at.x===vector[0]&&at.y===vector[1]){finish=k;break;}
  for(const [d,id,dx,dy]of neighbors(at.id)){const x=at.x+dx,y=at.y+dy,n=key(id,x,y);if(Math.abs(x)>bound||Math.abs(y)>bound||parents.has(n))continue;parents.set(n,[k,d]);q.push({id,x,y});}
 }
 if(!finish)return null;const path=[];for(let p=parents.get(finish);p;p=parents.get(p[0]))path.push(p[1]);return path.reverse();
}
function mainLoop(game,core){
 const w=game.world;if(w.topology!=='torus')return null;
 if(!w.loopLearning)throw Error('ループ理解を行うには、方向感覚を「3周で理解」または「5周で理解」にしてください。');
 const axis=['x','y'].find(a=>!game.cognition.known_loops.has(a));if(!axis)return null;
 const path=liftedLoop(game.player.world_position,core.deckVector(w,axis==='x'?1:0,axis==='y'?1:0),id=>Object.entries(core.DIRS).flatMap(([d,[dx,dy]])=>{const e=core.ruleTransition(w,{...game.player,world_position:id},d);return e&&!w.warps?.has(e.to)?[[d,e.to,dx,dy]]:[];}));
 if(!path)throw Error('この位置から'+(axis==='x'?'横':'縦')+'周回を計画できません。ワープや通路の接続を確認してください。');return path;
}
const loopCache=new WeakMap();
function connectedLoop(state,space,loops){
 const w=state.world;if(!w.lattice)return null;if(state.loopThreshold===0)throw Error('ループ理解を行うには方向感覚をONにしてください。');
 const knowledge=loops.knowledge(state),directions=[[0,-1],[1,0],[0,1],[-1,0]];
 const neighbors=id=>directions.flatMap(([dx,dy],d)=>{const e=w.edges.get(id+':'+d);return e&&!state.features?.warps.has(e.to)&&(!state.features||e.to!==state.features.door||state.features.hasKey)&&e.kind!=='throat'&&!e.changed&&space.groundSheet(w,e.to)===space.groundSheet(w,id)?[[d,e.to,dx,dy]]:[];});
 let cache=loopCache.get(w);if(!cache){cache=new Map();loopCache.set(w,cache);}
 for(let sheet=0;sheet<(w.sheets||2);sheet++)for(const axis of ['a','b']){
  if(knowledge.some(p=>p.sheet===sheet&&p.learned&&p.a===(axis==='a'?1:0)&&p.b===(axis==='b'?1:0)))continue;
  const k=sheet+axis;let route=cache.get(k);
  if(!route){const seen=new Set();for(let id=0;id<w.cells.length;id++)if(w.cells[id]&&!state.features?.warps.has(id)&&space.groundSheet(w,id)===sheet&&!seen.has(id)){
   const q=[id];seen.add(id);for(const n of q)for(const [,to]of neighbors(n))if(!seen.has(to)){seen.add(to);q.push(to);}
   const path=liftedLoop(id,w.lattice[axis],neighbors);if(path){route={start:id,path};cache.set(k,route);break;}
  }}
  if(!route)throw Error('シート'+(sheet+1)+'の'+(axis==='a'?'横':'縦')+'周回路が見つかりません。次へ進まず停止しました。');
  const approach=search({id:state.id},s=>s.id===route.start,s=>directions.flatMap((_,d)=>{const e=w.edges.get(s.id+':'+d);return e&&(!state.features||e.to!==state.features.door||state.features.hasKey)?[[d,{id:state.features?.warps.get(e.to)??e.to}]]:[];}));return [...approach,...route.path];
 }
 return null;
}
const mapVisits=new WeakMap();
function mainMapPlan(game,core){
 if(!game.world.warps?.size||!game.world.separateMaps)return null;
 const reasons=core.inspectRecordedMatching(game).reasons,pending=reasons.map((r,i)=>r==='matched'?-1:i).filter(i=>i>=0);if(!pending.length)return null;
 let tried=mapVisits.get(game);if(!tried){tried=new Set();mapVisits.set(game,tried);}tried.add(game.player.world_position);
 const targets=new Set(pending.flatMap(i=>[...game.cognition.archives[i].nodes.values()].filter(n=>n.terrain&&!tried.has(n.world_id)&&!game.world.warps.has(n.world_id)).map(n=>n.world_id)));
 if(!targets.size)return null;
 const visited=new Set([...game.world.cells.keys()].filter(id=>!targets.has(id)));return main(game,core,visited);
}
function warpNotes(game,core,act){
 if(!game.world.warps?.size)return false;let changed=false;const e=game.lastTransition;
 if(e?.kind==='warp'){
  const arrow=game.warpArrows?.find(a=>a.from===e.from&&a.to===e.to);
  if(!arrow||arrow.status!=='confirmed'||(game.world.warpInvisible&&[e.from,e.to].some(id=>!game.zeroMarks?.has(id)&&!game.markers.has(id)&&id!==game.world.start&&id!==game.world.exit)))changed=!!act(game,'warpRecord');
 }
 if(core.matchRecordedMaps(game).length){act(game,'recorded');changed=true;}
 return changed;
}
function birdNotes(game,core,act){
 if((!game.world.birdMode&&!game.world.warps?.size)||game.won)return false;let changed=false;
 const id=game.player.world_position,w=game.world;
 if(game.markers.size<9&&!game.markers.has(id)&&id!==w.start&&id!==w.exit&&!(w.puzzle?.locks||[]).some(l=>l.key===id||l.door===id)){
  const distance=core.reachable(w,id).distances;
  if([...game.markers.keys()].every(m=>distance[m]<0||distance[m]>=8))changed=act(game,'mark').status==='placed';
 }
 // Use the same evidence checks as the player's map matching commands.
 if(game.cognition.archives.length){
  if(core.matchLandmarkMaps(game).length){act(game,'landmark');changed=true;}
  if(core.matchRecordedMaps(game).length){act(game,'recorded');changed=true;}
 }
 return changed;
}
function screenDirection(game,direction,truth,bridge,core){const result=Object.keys(core.DIRS).find(d=>bridge.input(game,d,truth)===direction);if(!result)throw Error('移動方向を変換できません。');return result;}
function connectedTargets(state){const targets=new Set();connected(state,undefined,targets);return targets;}
function mainTargets(game,core){const targets=new Set();main(game,core,undefined,targets);return targets;}
const api={birdDetour,mainMapPlan,warpNotes,mainLoop,connectedLoop,liftedLoop,birdNotes,connected,main,screenDirection,connectedTargets,mainTargets};if(typeof module==='object')module.exports=api;else root.ExplorationSolver=api;
})(globalThis);
