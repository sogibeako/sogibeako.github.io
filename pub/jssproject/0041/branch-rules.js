/* Warp shortcuts stay inside a sheet component; winding routes stay intact. */
(function(root){'use strict';
const F=typeof module==='object'?require('./sheet-features.js'):root.SheetFeatures;
function install(state,mode='plain'){
 if(mode==='random'||mode==='randomPeaceful'){const pool=mode==='randomPeaceful'?['plain','keys','warp','warpKeys']:['plain','keys','warp','warpKeys','birds','birdsKeys','warpBirds','warpAll'];let hash=2166136261;for(const c of state.world.seed+'|branch-rule-choice')hash=Math.imul(hash^c.charCodeAt(0),16777619);hash=Math.imul(hash^(hash>>>16),0x85ebca6b);hash^=hash>>>13;mode=pool[(hash>>>0)%pool.length];}
 state.world.ruleMode=mode;
 if(!['plain','keys','warp','warpKeys','birds','birdsKeys','warpBirds','warpAll'].includes(mode))throw Error('未対応の探索ルールです。');
 if(mode==='plain')return;
 const w=state.world,all=Array.from(w.cells.keys()).filter(id=>w.cells[id]);w.domain=new Set(all);
 // Use the shared distant-key selection even when warps are requested later.
 const keys=['keys','warpKeys','birdsKeys','warpAll'].includes(mode),birds=['birds','birdsKeys','warpBirds','warpAll'].includes(mode);
 if(keys||birds)F.install(state,{keys,distantKey:true,...(birds?{birds:true,birdAcross:true,birdWander:true,birdLeap:true}:{})});
 if(!mode.startsWith('warp'))return;
 if(!state.features){F.mark(state);state.features.marks.clear();state.markEvents=[];}
 const f=state.features;f.options.warp=true;f.warpTraversed=[];
 const protectedCells=new Set([w.start,w.exit,f.key,f.bird,...(w.passages||[]).flatMap(p=>[p.horizontal,p.vertical])]);
 w.branchLoops.forEach((path,sheet)=>{let id=sheet*w.size*w.size+w.start;protectedCells.add(id);for(const d of path){id=w.edges.get(id+':'+d).to;protectedCells.add(id);}});
 const groups=[],seen=new Set();for(const start of all){if(seen.has(start)||start===w.exit)continue;const group=[start];seen.add(start);for(const id of group)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.kind!=='branch'&&e.to!==w.exit&&!seen.has(e.to)){seen.add(e.to);group.push(e.to);}}groups.push(group.filter(id=>!protectedCells.has(id)));}
 let seed=2166136261;for(const c of w.seed+'|branch-warps')seed=Math.imul(seed^c.charCodeAt(0),16777619);const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const group of groups){for(let i=group.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[group[i],group[j]]=[group[j],group[i]];}
  let placed=false;for(let i=0;i<group.length&&!placed;i++)for(let j=i+1;j<group.length&&!placed;j++){
   const a=group[i],b=group[j];if(F.warpReturnTrap(w,a,b)||F.warpReturnTrap(w,b,a))continue;
   f.warps.set(a,b);f.warps.set(b,a);
   const reachable=(start,locked=false)=>{const visited=new Set([start]),q=[start];for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(!e||locked&&e.to===f.door)continue;const to=f.warps.get(e.to)??e.to;if(!visited.has(to)){visited.add(to);q.push(to);}}return visited;};
   if([w.start,a,b].every(id=>reachable(id).size===all.length)&&(!f.options.keys||reachable(w.start,true).has(f.key)))placed=true;
   else {f.warps.delete(a);f.warps.delete(b);}
  }if(f.warps.size>=4)break;
 }
 state.warpUnavailable=f.warps.size===0;
}
function afterMove(state,known,memory){const f=state.features;if(!f)return;const remember=id=>{known?.add(id);memory?.set(id,{id,wall:false});};const entry=state.last?.entered??(state.last?.kind==='warp'?state.last.from:null);if(f.warps.has(entry)){const seen=f.warpTraversed??=[];if(!seen.includes(entry))seen.push(entry);remember(entry);remember(f.warps.get(entry));}if(['warp','teleport'].includes(state.last?.kind))remember(state.last.from);}

function mark(state){return F.mark(state);}
function autoMark(state){
 const f=state.features,w=state.world;if((!f?.options.warp&&!f?.options.birds)||f.marks.size>=9||f.marks.has(state.id)||f.warps.has(state.id)||[w.start,w.exit,f.key,f.door].includes(state.id)||(w.passages||[]).some(p=>p.horizontal===state.id||p.vertical===state.id))return false;
 const sheetOf=id=>Math.floor((id%(w.size*w.size*w.sheets))/(w.size*w.size)),sheet=sheetOf(state.id),counts=Array(w.sheets).fill(0);for(const id of f.marks.keys())counts[sheetOf(id)]++;
 const quota=Math.floor(9/w.sheets),reserved=counts.reduce((sum,n,i)=>sum+(i===sheet?0:Math.max(0,quota-n)),0);if(9-f.marks.size<=reserved)return false;
 // Local graph distance keeps landmarks apart even after loading a saved map.
 const seen=new Set([state.id]),queue=[[state.id,0]];for(const [id,depth] of queue){if(f.marks.has(id))return false;if(depth>=5)continue;for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&!seen.has(e.to)){seen.add(e.to);queue.push([e.to,depth+1]);}}}
 return mark(state);
}
function glyph(state,id,bright=true){return F.glyph(state,id,bright);}
const progress=new WeakMap();
function explore(state,known){const P=typeof module==='object'?require('./crossing-autowalk.js'):root.CrossingAutowalk;let record=progress.get(state);if(!record||record.count!==known.size){record={count:known.size,step:state.steps};progress.set(state,record);}if(state.features?.bird!=null&&state.steps-record.step>=128)return P.route(state,id=>!known.has(id),null,false)??(P.warpPending(state).length?P.route(state,()=>false,P.warpPending(state)[0],false):null);return P.explore(state,known);}
function detour(state){if(state.steps-(progress.get(state)?.step??state.steps)>=128)return null;const P=typeof module==='object'?require('./exploration-solver.js'):root.ExplorationSolver;return P.connectedBirdDetour(state)?.map(d=>state.frame.indexOf(d));}
const api={install,afterMove,mark,autoMark,glyph,detour,explore};if(typeof module==='object')module.exports=api;else root.BranchRules=api;
})(globalThis);
