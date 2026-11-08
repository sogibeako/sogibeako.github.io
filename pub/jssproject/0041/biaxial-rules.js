/* Share key/door placement and pickup with the existing sheet explorers. */
(function(root){'use strict';const K=typeof module==='object'?require('./klein-biaxial.js'):root.KleinBiaxial,E=typeof module==='object'?require('./biaxial-exploration.js'):root.BiaxialExploration;const F=typeof module==='object'?require('./sheet-features.js'):root.SheetFeatures;
function create(w,mode='plain',settings={}){
 const modes={plain:[],keys:['keys'],warp:['warp'],birds:['birds'],keysWarp:['keys','warp'],birdsKeys:['birds','keys'],birdsWarp:['birds','warp'],mixed:['keys','warp','birds']};
 if(!modes[mode])throw Error('Invalid rule');
 const edges=new Map([...w.edges].filter(([k,e])=>w.cells?.[Number(k.split(':')[0])]&&w.cells[e.to]));
 for(const e of edges.values())e.transform=e.t;
 const state={frame:[0,1,2,3],x:0,y:0,history:[],world:{...w,wandTopology:'biaxial',candidates:w.edges,edges,domain:new Set(w.cells?Array.from(w.cells.keys()).filter(id=>w.cells[id]):[])},id:w.start,steps:0,geometry:w};
 if(w.cells&&modes[mode].length){
  const options=Object.fromEntries(modes[mode].map(key=>[key,true]));
  state.world.guaranteedLoops=Object.values(E.cycles(w)).filter(Boolean);
  // Keep permanent numeric landmarks free of new items as well as warps.
  state.world.passages=[...(w.passages||[]),...Array.from(w.cells.keys()).filter(id=>id%13===0).map(id=>({vertical:id,horizontal:id}))];
  try{F.install(state,{...options,distantKey:settings.distantKey===true,avoidWarpTrap:!!options.warp});}catch(e){if(!options.warp||!e.message.includes('ワープ床を配置'))throw e;state.warpUnavailable=true;F.install(state,{...options,distantKey:settings.distantKey===true,warp:false});}
  if(state.features?.options.birds)state.features.mind={previous:null,lastSeen:null,left:0};
 }
 return state;
}
function allowed(s,id){return F.allowed(s,id);}
function afterMove(s,p,steps,waiting=false){s.frame=[...p.frame];const wildlife=typeof module==='object'?require('./maze-wildlife.js'):root.MazeWildlife;wildlife?.ensure(s,wildlife.graph(s));wildlife?.enter(s,wildlife.graph(s),s.id,p.id);s.id=p.id;s.steps=steps;
 // Apply pickup and warp exactly once, then the topology-aware bird turn.
 const f=s.features;if(f?.options.birds){const bird=f.bird;f.bird=null;try{F.afterMove(s,waiting);}finally{f.bird=bird;}birdTurn(s);}else F.afterMove(s,waiting);
 const G=typeof module==='object'?require('./graph-wands.js'):root.GraphWands;G.after(s,()=>wildlife?.graphTick(s));
 return {...p,id:s.id};}
// Use the same local visibility and reflected edges as the player.
function random(s,salt){let h=2166136261;for(const c of s.world.seed+'|'+s.steps+'|'+salt)h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^(h>>>16),0x85ebca6b);return (h^(h>>>13))>>>0;}
function birdTurn(s){const G=typeof module==='object'?require('./graph-wands.js'):root.GraphWands;if(G.bird(s)||s.features.bird==null)return;const wildlife=typeof module==='object'?require('./maze-wildlife.js'):root.MazeWildlife;if(wildlife?.birdThreat(s,wildlife.graph(s),s.features.bird))return;const f=s.features,w=s.geometry,m=f.mind;if(s.id===w.exit)return;
 const choices=id=>Array.from({length:4},(_,d)=>w.edges.get(id+':'+d)?.to).filter(id=>w.cells[id]&&allowed(s,id)&&id!==w.exit&&!f.warps.has(id));
 if(f.cooldown>0)f.cooldown--;
 else if(s.steps%2===0&&f.bird!==s.id){
  const sees=[...K.nearby(w,{id:f.bird,frame:[0,1,2,3]},id=>!w.cells[id]||!allowed(s,id),6).values()].some(t=>!t.wall&&t.id===s.id);
  if(sees){m.lastSeen=s.id;m.left=6;}let next;
  if(m.left>0&&m.lastSeen!==f.bird){const cells=navigation(w,s).cells.slice();for(const id of f.warps.keys())cells[id]=0;cells[w.exit]=0;const path=E.path({...w,cells},{id:f.bird,frame:[0,1,2,3]},q=>q.id===m.lastSeen);if(path?.length)next=K.step(w,{id:f.bird,frame:[0,1,2,3]},path[0]).id;if(!sees)m.left--;}
  if(next===undefined){m.left=0;const all=choices(f.bird),forward=all.filter(id=>id!==m.previous),pool=forward.length?forward:all;next=pool[random(s,'wander')%pool.length];}
  if(next!==undefined){m.previous=f.bird;f.bird=next;}
 }
 if(f.bird===s.id){const pool=[...s.world.domain].filter(id=>id!==s.id&&id!==w.exit&&id!==f.key&&!f.warps.has(id)&&allowed(s,id));if(pool.length){const from=s.id;s.id=pool[random(s,'player-leap')%pool.length];f.last={from,to:s.id,kind:'teleport'};const birds=pool.filter(id=>id!==s.id);if(random(s,'bird-leap')/4294967296<.25&&birds.length)f.bird=birds[random(s,'bird-landing')%birds.length];}f.cooldown=4;f.mind={previous:null,lastSeen:null,left:0};}
}
function navigation(w,s){if(!s.features?.options.keys||s.features.hasKey)return w;const cells=w.cells.slice();cells[s.features.door]=0;return {...w,cells};}
function target(w,s){return s.features?.options.keys&&!s.features.hasKey?s.features.key:w.exit;}
function status(s){const f=s.features,out=[];if(s.warpUnavailable)out.push('数字と周回路を保てるワープ配置なし');if(f){if(f.options.keys)out.push(f.hasKey?'鍵取得済み・扉を解錠':'鍵 a を探して扉 + を開く');if(f.options.warp)out.push('双方向ワープ '+f.warps.size/2+'組');if(f.options.birds)out.push('鳥人間 V：'+(s.wands?.birdOob?'境界の外で休眠中':f.mind.left?'捜索中':'巡回中'));if(f.last&&f.last.kind!=='wand')out.push(f.last.kind==='warp'?'ワープしました':'鳥人間に運ばれました');}return out.length?' ／ '+out.join(' ／ '):'';}
function path(w,s,p,accept){return E.path(navigation(w,s),p,accept,q=>({...q,entered:q.id,id:s.features?.warps.get(q.id)??q.id}));}
function loop(w,s,book,p,threshold){const axis=E.pending(book,threshold)[0];if(!axis)return null;const c=book.cycles[axis],route=path(w,s,p,q=>q.id===c.start);if(!route)return null;let at=p;for(const d of route){at=K.step(w,at,d);at={...at,id:s.features?.warps.get(at.id)??at.id};}for(const dir of c.directions){const d=at.frame.indexOf(dir);route.push(d);at=K.step(w,at,d);}return route;}
// Bounded escape from repeated visible encounters; never change the game state.
function detour(w,s,p,progress=0){
 if(!s.features?.options.birds)return null;
 const m=s.detour??={step:-1,history:[],target:null,until:0,progress,attempts:0};
 if(m.step===s.steps)return m.result;
 m.step=s.steps;m.result=null;
 if(s.features.last||m.progress!==progress){m.history=[];m.target=null;}m.progress=progress;
 const visible=[...K.nearby(w,p,id=>!w.cells[id]||!allowed(s,id),6).values()].some(t=>!t.wall&&t.id===s.features.bird);
 const safe=navigation(w,s),cells=safe.cells.slice();
 if(visible)cells[s.features.bird]=0;
 // An escape route must not send the player through a warp or into a locked door.
 for(const id of s.features.warps.keys())cells[id]=0;
 const graph={...safe,cells},signature=p.id+':'+p.frame.join()+':'+(visible?s.features.bird:'hidden');
 m.history.push({signature,id:p.id});if(m.history.length>32)m.history.shift();
 if(m.target!==null){if(p.id===m.target||s.steps>=m.until)m.target=null;else{const route=E.path(graph,p,q=>q.id===m.target);if(route?.length){m.result=route;return route;}m.target=null;}}
 if(!visible||m.history.filter(t=>t.signature===signature).length<3)return null;
 const recent=new Set(m.history.map(t=>t.id)),queue=[{...p,path:[]}],seen=new Set([p.id+':'+p.frame.join()]);let best=null;
 for(const q of queue){if(q.path.length>=4&&!recent.has(q.id)&&q.id!==w.exit){best=q;if(q.path.length>=8)break;}if(q.path.length>=12)continue;for(let d=0;d<4;d++){const n=K.step(w,q,d),key=n.id+':'+n.frame.join();if(!cells[n.id]||seen.has(key))continue;seen.add(key);queue.push({...n,path:[...q.path,d]});}}
 m.history=[];if(!best)return null;m.target=best.id;m.until=s.steps+24;m.attempts++;m.result=best.path;return m.result;
}
const api={create,allowed,afterMove,navigation,target,status,path,loop,detour,glyph:F.glyph};if(typeof module==='object')module.exports=api;else root.BiaxialRules=api;
})(globalThis);
