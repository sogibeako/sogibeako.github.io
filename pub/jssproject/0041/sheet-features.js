/* Optional rules for the two-sheet explorers. Geometry remains immutable. */
(function(root){'use strict';
const Wands=typeof module==='object'?require('./graph-wands.js'):root.GraphWands;
const Wildlife=typeof module==='object'?require('./maze-wildlife.js'):root.MazeWildlife;
// Worlds are immutable after generation; keep this derived index outside saves.
const incomingByWorld=new WeakMap();
function incomingEdges(w){let incoming=incomingByWorld.get(w);if(incoming)return incoming;incoming=new Map();for(const [key,e]of w.edges){const from=Number(key.split(':')[0]);if(!w.cells[from]||!w.cells[e.to])continue;if(!incoming.has(e.to))incoming.set(e.to,[]);incoming.get(e.to).push(from);}incomingByWorld.set(w,incoming);return incoming;}

function component(w,start,blocked=-1){const seen=new Set([start]),q=[start];for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.kind!=='throat'&&e.to!==blocked&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}return q;}
// Test actual graph exits: reflected seams and underpass lanes count too.
function warpReturnTrap(world,from,to){const exits=new Set();for(let d=0;d<4;d++){const edge=world.edges.get(to+':'+d);if(edge&&world.cells[edge.to])exits.add(edge.to);}return exits.size===1&&exits.has(from);}
function install(state,options={}){
 const o={keys:!!options.keys,warp:!!options.warp,birds:!!options.birds};if(!Object.values(o).some(Boolean))return state;
 if(options.distantKey)o.distantKey=true;
 if(options.avoidWarpTrap)o.avoidWarpTrap=true;
 if(options.warpInvisible)o.warpInvisible=true;
 if(options.birdLeap)o.birdLeap=true;
 if(options.birdAcross)o.birdAcross=true;
 if(options.birdWander)o.birdWander=true;
 const w=state.world;let seed=2166136261;for(const c of w.seed)seed=Math.imul(seed^c.charCodeAt(0),16777619);
 const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const crossing=new Set((w.passages||[]).flatMap(p=>[p.vertical,p.horizontal]));const all=[...w.cells.keys()].filter(id=>w.cells[id]&&w.domain.has(id)&&!crossing.has(id)),special=new Set([w.start,w.exit]);
 const startDistances=new Map([[w.start,0]]),reachable=new Set([w.start]),queue=[w.start];for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.to!==w.exit&&!reachable.has(e.to)){reachable.add(e.to);startDistances.set(e.to,startDistances.get(id)+1);queue.push(e.to);}}
 let key=o.keys?queue.filter(id=>id!==w.start&&all.includes(id)).at(-1):null;
 if(o.keys&&o.distantKey){
  // Reverse graph distance counts seams, holes and underpass lanes as real moves.
  const distances=new Map([[w.exit,0]]),search=[w.exit],incoming=incomingEdges(w);
  for(const id of search)for(const from of incoming.get(id)||[])if(!distances.has(from)){distances.set(from,distances.get(id)+1);search.push(from);}
  const candidates=queue.filter(id=>id!==w.start&&all.includes(id)&&distances.has(id));
  const farthest=Math.max(0,...candidates.map(id=>distances.get(id))),minimum=Math.min(farthest,Math.max(8,Math.ceil(farthest/2)));
  const distant=candidates.filter(id=>distances.get(id)>=minimum);
  // Within the distant region, keep a reason to explore away from the entrance.
  const depth=Math.max(0,...distant.map(id=>startDistances.get(id))),best=distant.filter(id=>startDistances.get(id)===depth);
  key=best.length?best[Math.floor(rng()*best.length)]:undefined;
 }
 if(o.keys&&key===undefined)throw Error('鍵を出口の手前に配置できません。');if(key!==null)special.add(key);
 const loopCells=new Set();for(const r of [...(w.guaranteedLoops||[]).flatMap(r=>r.directions?[r]:[r.horizontal,r.vertical]),...(w.verticalRoutes||[]),...(w.horizontalRoutes||[])]){let id=r.start;loopCells.add(id);for(const d of r.directions){id=w.edges.get(id+':'+d).to;loopCells.add(id);}}
 const warps=new Map();if(o.warp){const seen=new Set();for(const id of all){if(id===w.exit||seen.has(id))continue;const group=component(w,id,w.exit);for(const n of group)seen.add(n);const pool=group.filter(n=>all.includes(n)&&!special.has(n)&&!loopCells.has(n));if(pool.length<2)continue;const first=Math.floor(rng()*pool.length);let from=pool[first],to=pool.filter(n=>n!==from).at(-1);if(o.avoidWarpTrap){to=undefined;for(let i=0;i<pool.length&&to===undefined;i++){from=pool[(first+i)%pool.length];to=pool.findLast(n=>n!==from&&!warpReturnTrap(w,from,n)&&!warpReturnTrap(w,n,from));}if(to===undefined)continue;}warps.set(from,to);warps.set(to,from);special.add(from);special.add(to);if(warps.size>=4)break;}if(!warps.size)throw Error('ワープ床を配置できる通路がありません。');}
 // Warp shortcuts also count: select a reachable key before locking the exit.
 if(o.keys&&o.distantKey&&warps.size){
  const incoming=new Map(),depths=new Map([[w.start,0]]),walk=[w.start];
  const destinations=id=>[0,1,2,3].map(d=>w.edges.get(id+':'+d)).filter(e=>e&&w.cells[e.to]).map(e=>warps.get(e.to)??e.to);
  for(const id of w.domain)if(w.cells[id])for(const to of destinations(id)){if(!incoming.has(to))incoming.set(to,[]);incoming.get(to).push(id);}
  for(const id of walk)for(const to of destinations(id))if(to!==w.exit&&!depths.has(to)){depths.set(to,depths.get(id)+1);walk.push(to);}
  const distances=new Map([[w.exit,0]]),search=[w.exit];for(const id of search)for(const from of incoming.get(id)||[])if(!distances.has(from)){distances.set(from,distances.get(id)+1);search.push(from);}
  const candidates=all.filter(id=>id!==w.start&&id!==w.exit&&!warps.has(id)&&depths.has(id)&&distances.has(id));
  const farthest=Math.max(0,...candidates.map(id=>distances.get(id))),minimum=Math.min(farthest,Math.max(8,Math.ceil(farthest/2)));
  const distant=candidates.filter(id=>distances.get(id)>=minimum),depth=Math.max(0,...distant.map(id=>depths.get(id))),best=distant.filter(id=>depths.get(id)===depth);
  if(best.length){special.delete(key);key=best[Math.floor(rng()*best.length)];special.add(key);}
 }
 const bird=o.birds?all.filter(id=>!special.has(id)).at(-1):null;
 state.features={options:o,key,door:o.keys?w.exit:null,hasKey:false,warps,bird,cooldown:0,marks:new Map(),last:null};return state;
}
function allowed(state,to){const f=state.features;return !f||to!==f.door||f.hasKey;}
// A replay-stable wandering choice, independent of rendering and wall-clock time.
function wanderBird(state,choicesFor){
 const f=state.features,w=state.world,S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
 const mind=f.birdMind??={mode:'WANDER',previous:null,lastSeen:null,searchLeft:0};
 const sees=S.nearestView({...state,id:f.bird,frame:[0,1,2,3]},6).some(p=>!p.wall&&p.id===state.id);
 if(sees){mind.mode='CHASE';mind.lastSeen=state.id;mind.searchLeft=6;}
 else if(mind.mode==='CHASE')mind.mode='SEARCH';
 const choices=choicesFor(f.bird);let next;
 if(mind.mode!=='WANDER'){
  if(f.bird===mind.lastSeen||mind.searchLeft<=0){mind.mode='WANDER';mind.lastSeen=null;}
  else{
   const distances=new Map([[mind.lastSeen,0]]),q=[mind.lastSeen],incoming=incomingEdges(w);
   for(const id of q)for(const from of incoming.get(id)||[]){if(!distances.has(from)&&choicesFor(from).includes(id)){distances.set(from,distances.get(id)+1);q.push(from);}}
   next=choices.find(id=>distances.has(f.bird)&&distances.get(id)===distances.get(f.bird)-1);
   if(mind.mode==='SEARCH')mind.searchLeft--;
  }
 }
 if(next===undefined){const forward=choices.filter(id=>id!==mind.previous),pool=forward.length?forward:choices;
  let h=2166136261;for(const c of w.seed+'|wander|'+state.steps+'|'+f.bird)h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^(h>>>16),0x85ebca6b);h^=h>>>13;
  next=pool[(h>>>0)%pool.length];
 }
 if(next!==undefined){mind.previous=f.bird;f.bird=next;}
}
function afterMove(state,waiting=false){const f=state.features;if(!f)return;const w=state.world;f.last=null;if(state.id===f.key)f.hasKey=true;
 const transfer=(to,kind)=>{const from=state.id;state.id=to;state.last={...state.last,from,to,kind,changed:true};f.last={from,to,kind};};
 if(!waiting&&f.warps.has(state.id))transfer(f.warps.get(state.id),'warp');
 if(f.bird!==null||!f.options.birds)Wildlife?.settleActors(state,Wildlife.graph(state));
 if(Wands?.bird(state))return;
 if(f.bird===null||state.id===w.exit)return;
 if(Wildlife?.birdThreat(state,Wildlife.graph(state),f.bird))return;
 if(f.cooldown>0)f.cooldown--;
 else if(state.steps%2===0&&f.bird!==state.id){
  const choicesFor=id=>{const out=[];for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&(f.options.birdAcross||e.kind!=='throat')&&allowed(state,e.to)&&!f.warps.has(e.to)&&e.to!==w.exit&&w.cells[e.to])out.push(e.to);}return out;};
  if(f.options.birdWander)wanderBird(state,choicesFor);else {
  const path=new Map([[state.id,0]]),q=[state.id];
  if(f.options.birdAcross){
   // Reverse legal bird edges: portal links need not be reciprocal in the same direction.
   const incoming=incomingEdges(w);
   for(const id of q){if(path.get(id)>=6||!allowed(state,id)||f.warps.has(id)||id===w.exit)continue;for(const from of incoming.get(id)||[])if(!path.has(from)){path.set(from,path.get(id)+1);q.push(from);}}
  }else for(const id of q){if(path.get(id)>=6)continue;for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.kind!=='throat'&&allowed(state,e.to)&&!path.has(e.to)){path.set(e.to,path.get(id)+1);q.push(e.to);}}}
  const choices=choicesFor(f.bird);
  const next=choices.find(id=>path.has(f.bird)&&path.get(id)===path.get(f.bird)-1);if(next!==undefined)f.bird=next;else if(choices.length)f.bird=choices[(state.steps+f.bird)%choices.length];
  }
 }
 if(f.bird===state.id){const choices=component(w,state.id,f.hasKey?-1:f.door).filter(id=>id!==state.id&&id!==w.exit&&id!==f.key&&!f.warps.has(id));if(choices.length)transfer(choices[(state.steps*17+state.id)%choices.length],'teleport');if(f.options.birdLeap){let h=2166136261;for(const c of w.seed+'|bird-leap|'+state.steps+'|'+f.bird)h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^(h>>>16),0x85ebca6b);h^=h>>>13;const landing=choices.filter(id=>id!==state.id);if((h>>>0)/4294967296<.25&&landing.length)f.bird=landing[(h>>>8)%landing.length];}f.cooldown=4;if(f.options.birdWander)f.birdMind={mode:'WANDER',previous:null,lastSeen:null,searchLeft:0};}
}
function mark(state){const f=state.features;if(!f)state.features={options:{keys:false,warp:false,birds:false},key:null,door:null,hasKey:false,warps:new Map(),bird:null,cooldown:0,marks:new Map(),last:null};const marks=state.features.marks;if(marks.has(state.id)||marks.size>=9)return false;marks.set(state.id,String(marks.size+1));(state.markEvents||(state.markEvents=[])).push({step:state.steps,id:state.id});return true;}
function autoMark(state){const f=state.features;if(!f||!f.options.warp&&!f.options.birds||f.marks.size>=9||f.warps.has(state.id)||state.id===f.key||state.id===f.door)return false;const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
 const sheet=S.groundSheet(state.world,state.id),counts=Array.from({length:state.world.sheets||2},()=>0);for(const id of f.marks.keys()){const at=S.groundSheet(state.world,id);if(counts[at]!==undefined)counts[at]++;}
 // Four guaranteed slots per physical sheet, with the ninth shared. Count
 // manual marks too; never erase or renumber an existing landmark.
 const quota=Math.floor(9/counts.length),reserved=counts.reduce((sum,n,i)=>sum+(i===sheet?0:Math.max(0,quota-n)),0);
 if(9-f.marks.size<=reserved)return false;
 const last=state.markEvents?.at(-1);if(counts[sheet]>0&&last&&state.steps-last.step<8)return false;return mark(state);}
function glyph(state,id,bright=true){const animal=Wildlife?.graphGlyph(state,id,bright);if(animal)return animal;const f=state.features;if(!f)return null;if((bright||state.atlasComplete)&&id===f.bird)return 'V';if(id===f.door&&!f.hasKey)return '+';if(id===f.key&&!f.hasKey)return 'a';return f.marks.get(id)||(f.warps.has(id)&&!f.options.warpInvisible?'O':state.wands?.items.some(p=>p.id===id)?'/':null);}
function validate(state){Wands?.validate(state);const f=state.features;if(!f)return;const floor=n=>Number.isSafeInteger(n)&&n>=0&&!!state.world.cells[n];if(f.options?.warpInvisible!==undefined&&typeof f.options.warpInvisible!=='boolean')throw Error('ワープ床の設定が不正です。');if(f.options?.birdWander!==undefined&&typeof f.options.birdWander!=='boolean')throw Error('鳥人間の設定が不正です。');if(f.birdMind&&(!['WANDER','CHASE','SEARCH'].includes(f.birdMind.mode)||![f.birdMind.previous,f.birdMind.lastSeen].every(n=>n===null||floor(n))||!Number.isInteger(f.birdMind.searchLeft)||f.birdMind.searchLeft<0||f.birdMind.searchLeft>6))throw Error('鳥人間の探索記録が不正です。');if(!f.options||['keys','warp','birds'].some(k=>typeof f.options[k]!=='boolean')||![f.key,f.door,f.bird].every(n=>n===null||floor(n))||typeof f.hasKey!=='boolean'||!Number.isInteger(f.cooldown)||f.cooldown<0||f.cooldown>4||!(f.warps instanceof Map)||!(f.marks instanceof Map)||f.marks.size>9||[...f.warps].some(([a,b])=>!floor(a)||!floor(b)||a===b||f.warps.get(b)!==a)||[...f.marks].some(([id,n])=>!floor(id)||! /^[1-9]$/.test(n)))throw Error('仕掛けの保存データが不正です。');}
function status(state){const f=state.features;if(!f)return '';return ` ／ 目印 ${f.marks.size}/9${f.options.keys?(f.hasKey?' ／ 鍵取得済み':' ／ 鍵を探してください'):''}${f.last?.kind==='warp'?' ／ ワープしました':f.last?.kind==='teleport'?' ／ 鳥人間に運ばれました':''}`;}
const api={warpReturnTrap,install,allowed,afterMove,mark,autoMark,glyph,validate,status};if(typeof module==='object')module.exports=api;else root.SheetFeatures=api;
})(globalThis);
