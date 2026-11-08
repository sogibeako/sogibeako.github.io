/* Frame-aware routes for the two independent floors and their underpasses. */
(function(root){'use strict';
function route(state,accept,viaTarget=null,avoidBird=true){const danger=new Set();const f=state.features;if(avoidBird&&f?.bird!=null){danger.add(f.bird);if(f.cooldown<=0&&(state.steps+1)%2===0)for(let d=0;d<4;d++){const e=state.world.edges.get(f.bird+':'+d);if(e&&(f.options.birdAcross||e.kind!=='throat')&&e.to!==f.door&&!f.warps.has(e.to))danger.add(e.to);}}const key=p=>p.id+':'+p.frame.join()+':'+p.hasKey+(viaTarget===null?'':':'+p.via),queue=[{id:state.id,frame:state.frame,hasKey:!!state.features?.hasKey}],parents=new Map([[key(queue[0]),null]]);let end=null;
 for(const p of queue){if(viaTarget===null?(accept(p.id)||(p.via!==undefined&&accept(p.via))):p.via===viaTarget){end=key(p);break;}for(let d=0;d<4;d++){const e=state.world.edges.get(p.id+':'+p.frame[d]);if(!e||!state.world.cells[e.to]||(e.to===state.features?.door&&!p.hasKey))continue;if(p===queue[0]&&danger.has(e.to))continue;const q={id:state.features?.warps.get(e.to)??e.to,via:e.to,frame:p.frame.map(v=>e.transform[v]),hasKey:p.hasKey||e.to===state.features?.key},k=key(q);if(parents.has(k))continue;parents.set(k,[key(p),d]);queue.push(q);}}
 if(end===null)return danger.size?route(state,accept,viaTarget,false):null;const result=[];while(parents.get(end)){const [from,d]=parents.get(end);result.push(d);end=from;}return result.reverse();
}
function targets(state){return new Set(Array.from(state.world.cells.keys()).filter(id=>state.world.cells[id]));}
function warpPending(state){return [...(state.features?.warps.keys()||[])].filter(id=>!state.features.warpTraversed?.includes(id));}
function explore(state,known){return route(state,id=>!known.has(id))??(warpPending(state).length?route(state,()=>false,warpPending(state)[0]):null);}
const api={route,targets,warpPending,explore};if(typeof module==='object')module.exports=api;else root.CrossingAutowalk=api;
})(globalThis);
