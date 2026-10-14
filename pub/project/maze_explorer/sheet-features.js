/* Optional rules for the two-sheet explorers. Geometry remains immutable. */
(function(root){'use strict';
function component(w,start,blocked=-1){const seen=new Set([start]),q=[start];for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.kind!=='throat'&&e.to!==blocked&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}return q;}
function install(state,options={}){
 const o={keys:!!options.keys,warp:!!options.warp,birds:!!options.birds};if(!Object.values(o).some(Boolean))return state;
 const w=state.world;let seed=2166136261;for(const c of w.seed)seed=Math.imul(seed^c.charCodeAt(0),16777619);
 const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const crossing=new Set((w.passages||[]).flatMap(p=>[p.vertical,p.horizontal]));const all=[...w.cells.keys()].filter(id=>w.cells[id]&&w.domain.has(id)&&!crossing.has(id)),special=new Set([w.start,w.exit]);
 const reachable=new Set([w.start]),queue=[w.start];for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.to!==w.exit&&!reachable.has(e.to)){reachable.add(e.to);queue.push(e.to);}}
 const key=o.keys?queue.filter(id=>id!==w.start&&all.includes(id)).at(-1):null;if(o.keys&&key===undefined)throw Error('鍵を出口の手前に配置できません。');if(key!==null)special.add(key);
 const loopCells=new Set();for(const r of [...(w.guaranteedLoops||[]),...(w.verticalRoutes||[]),...(w.horizontalRoutes||[])]){let id=r.start;loopCells.add(id);for(const d of r.directions){id=w.edges.get(id+':'+d).to;loopCells.add(id);}}
 const warps=new Map();if(o.warp){const seen=new Set();for(const id of all){if(id===w.exit||seen.has(id))continue;const group=component(w,id,w.exit);for(const n of group)seen.add(n);const pool=group.filter(n=>all.includes(n)&&!special.has(n)&&!loopCells.has(n));if(pool.length<2)continue;const from=pool[Math.floor(rng()*pool.length)],to=pool.filter(n=>n!==from).at(-1);warps.set(from,to);warps.set(to,from);special.add(from);special.add(to);if(warps.size>=4)break;}if(!warps.size)throw Error('ワープ床を配置できる通路がありません。');}
 const bird=o.birds?all.filter(id=>!special.has(id)).at(-1):null;
 state.features={options:o,key,door:o.keys?w.exit:null,hasKey:false,warps,bird,cooldown:0,marks:new Map(),last:null};return state;
}
function allowed(state,to){const f=state.features;return !f||to!==f.door||f.hasKey;}
function afterMove(state){const f=state.features;if(!f)return;const w=state.world;f.last=null;if(state.id===f.key)f.hasKey=true;
 const transfer=(to,kind)=>{const from=state.id;state.id=to;state.last={...state.last,from,to,kind,changed:true};f.last={from,to,kind};};
 if(f.warps.has(state.id))transfer(f.warps.get(state.id),'warp');
 if(f.bird===null||state.id===w.exit)return;
 if(f.cooldown>0)f.cooldown--;
 else if(state.steps%2===0&&f.bird!==state.id){
  const path=new Map([[state.id,0]]),q=[state.id];for(const id of q){if(path.get(id)>=6)continue;for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&e.kind!=='throat'&&allowed(state,e.to)&&!path.has(e.to)){path.set(e.to,path.get(id)+1);q.push(e.to);}}}
  const choices=[];for(let d=0;d<4;d++){const e=w.edges.get(f.bird+':'+d);if(e&&e.kind!=='throat'&&allowed(state,e.to)&&!f.warps.has(e.to)&&e.to!==w.exit)choices.push(e.to);}
  const next=choices.find(id=>path.has(f.bird)&&path.get(id)===path.get(f.bird)-1);if(next!==undefined)f.bird=next;else if(choices.length)f.bird=choices[(state.steps+f.bird)%choices.length];
 }
 if(f.bird===state.id){const choices=component(w,state.id,f.hasKey?-1:f.door).filter(id=>id!==state.id&&id!==w.exit&&id!==f.key&&!f.warps.has(id));if(choices.length)transfer(choices[(state.steps*17+state.id)%choices.length],'teleport');f.cooldown=4;}
}
function mark(state){const f=state.features;if(!f)state.features={options:{keys:false,warp:false,birds:false},key:null,door:null,hasKey:false,warps:new Map(),bird:null,cooldown:0,marks:new Map(),last:null};const marks=state.features.marks;if(marks.has(state.id)||marks.size>=9)return false;marks.set(state.id,String(marks.size+1));return true;}
function glyph(state,id,bright=true){const f=state.features;if(!f)return null;if(bright&&id===f.bird)return 'V';if(id===f.door&&!f.hasKey)return '+';if(id===f.key&&!f.hasKey)return 'a';return f.marks.get(id)||(f.warps.has(id)?'O':null);}
function validate(state){const f=state.features;if(!f)return;const floor=n=>Number.isSafeInteger(n)&&n>=0&&!!state.world.cells[n];if(!f.options||['keys','warp','birds'].some(k=>typeof f.options[k]!=='boolean')||![f.key,f.door,f.bird].every(n=>n===null||floor(n))||typeof f.hasKey!=='boolean'||!Number.isInteger(f.cooldown)||f.cooldown<0||f.cooldown>4||!(f.warps instanceof Map)||!(f.marks instanceof Map)||f.marks.size>9||[...f.warps].some(([a,b])=>!floor(a)||!floor(b)||a===b||f.warps.get(b)!==a)||[...f.marks].some(([id,n])=>!floor(id)||! /^[1-9]$/.test(n)))throw Error('仕掛けの保存データが不正です。');}
function status(state){const f=state.features;if(!f)return '';return ` ／ 目印 ${f.marks.size}/9${f.options.keys?(f.hasKey?' ／ 鍵取得済み':' ／ 鍵を探してください'):''}${f.last?.kind==='warp'?' ／ ワープしました':f.last?.kind==='teleport'?' ／ 鳥人間に運ばれました':''}`;}
const api={install,allowed,afterMove,mark,glyph,validate,status};if(typeof module==='object')module.exports=api;else root.SheetFeatures=api;
})(globalThis);
