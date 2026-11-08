/* Small connected mazes on a two/three-sheet branched cover. */
(function(root){'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
const Underpasses=typeof module==='object'?require('./branch-underpasses.js'):root.BranchUnderpasses;
const Patterns=typeof module==='object'?require('./branch-patterns.js'):root.BranchPatterns;
const Rules=typeof module==='object'?require('./branch-rules.js'):root.BranchRules;
const ring=[0,3,3,2,2,2,1,1,0,0];
function create(options={}){
 const sheets=Number(options.sheets??2);if(![2,3].includes(sheets))throw Error('2または3シートを選んでください。');
 const size=Number(options.size??8);if(![8,12,16,20].includes(size))throw Error('サイズは8・12・16・20から選んでください。');const area=size*size,cx=size/2-1,cy=cx;let returnRoute=options.route==='return';if(returnRoute&&size<12)throw Error('別シート経由の配置は12以上で選べます。');
 const seed=String(options.seed??'branch-first'),density=Number(options.density??.45);if(!Number.isFinite(density)||density<.2||density>.6)throw Error('壁の割合は20〜60%です。');
 let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);const random=()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
 const pillar=options.pillar==='random'?(random()<.5?'small':'grown'):(options.pillar??'grown');if(options.route==='random')returnRoute=size>=12&&random()<.5;const goalSheet=returnRoute?0:options.route==='random'?1+Math.floor(random()*(sheets-1)):sheets-1;
 const direction=options.direction==='random'?['left','right','both'][Math.floor(random()*3)]:(options.direction??'both');
 const algorithm=options.algorithm==='random'?['walls','dfs','prim','growing'][Math.floor(random()*4)]:(options.algorithm??'walls'),wallStyle=options.wallStyle==='random'?(random()<.5?'dense':'grid'):(options.wallStyle??'dense');if(!['walls','dfs','prim','growing'].includes(algorithm)||!['dense','grid'].includes(wallStyle))throw Error('未対応の生成方式・壁配置です。');
 const w={mode:sheets===3?'branch3':'branch4',size,sheets,cells:new Uint8Array(sheets*area).fill(1),edges:new Map(),candidates:new Map(),holes:new Set(),layouts:Array.from({length:sheets},(_,i)=>({width:size,height:size,offset:i*area})),start:(cy-1)*size+cx+1,seed,branchMaze:true,branchCenter:{x:cx,y:cy},branchRoute:returnRoute?'return':'normal',branchPillar:pillar,branchGoalSheet:goalSheet,branchDirection:direction,algorithm,wallStyle};
 const state={world:w,id:w.start,frame:[0,1,2,3],x:0,y:0,steps:0,history:[{x:0,y:0,id:w.start}],last:null};
 for(let sheet=0;sheet<sheets;sheet++){
  const offset=sheet*area;w.cells[offset+cy*size+cx]=0;
  for(let i=0;i<size;i++){w.cells[offset+i]=0;w.cells[offset+(size-1)*size+i]=0;w.cells[offset+i*size]=0;w.cells[offset+i*size+size-1]=0;}
 }
 const divider=cx-2,boundary=Array.from({length:size},(_,y)=>divider-(y>1&&y<size-2&&y!==cy&&y!==cy+1&&random()<.55?1:0));
 if(returnRoute){boundary[1]=divider-1;for(let y=0;y<size;y++){const previous=boundary[Math.max(0,y-1)];for(let x=Math.min(previous,boundary[y]);x<=Math.max(previous,boundary[y]);x++)w.cells[y*size+x]=0;}}
 // Preserve anchor floors, not a fixed corridor: connectivity checks retain detours.
 w.branchBoundary=boundary;
 if(pillar!=='small')for(let sheet=0;sheet<sheets;sheet++)w.cells[sheet*area+(cy-1)*size+cx]=0;
 if(direction!=='both'){const y=direction==='left'?cy+1:cy;for(let x=returnRoute?divider+1:1;x<=cx;x++)w.cells[y*size+x]=0;}
 const base=new Map(),dirs=[[0,-1],[1,0],[0,1],[-1,0]];
 for(let id=0;id<w.cells.length;id++){const x=id%size,y=Math.floor(id%area/size),sheet=Math.floor(id/area);for(let d=0;d<4;d++){const nx=x+dirs[d][0],ny=y+dirs[d][1];if(nx<0||nx>=size||ny<0||ny>=size)continue;let target=sheet;if(x<=cx&&d===2&&y===cy)target=(sheet+sheets-1)%sheets;if(x<=cx&&d===0&&y===cy+1)target=(sheet+1)%sheets;base.set(id+':'+d,{to:target*area+ny*size+nx,transform:[0,1,2,3],kind:target===sheet?'normal':'branch'});}}
 function distances(){const dist=new Map([[w.start,0]]),turns=new Map([[w.start,0]]),queue=[w.start];dist.windingCycle=false;for(const id of queue)for(let d=0;d<4;d++){const e=base.get(id+':'+d);if(!e||!w.cells[e.to])continue;const n=turns.get(id)+(e.kind==='branch'?(d===2?-1:1):0);if(!dist.has(e.to)){dist.set(e.to,dist.get(id)+1);turns.set(e.to,n);queue.push(e.to);}else if(turns.get(e.to)!==n)dist.windingCycle=true;}dist.turns=turns;return dist;}

 const protect=new Set();for(let sheet=0;sheet<sheets;sheet++)protect.add(sheet*area+w.start);if(returnRoute){protect.add(cy*size+1);protect.add((cy+1)*size+1);}
 if(pillar==='small')for(let sheet=0;sheet<sheets;sheet++)for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)if(x!==cx||y!==cy)protect.add(sheet*area+y*size+x);
 let floors=w.cells.reduce((a,b)=>a+b,0),removed=0;const targetWalls=Math.floor(floors*density);
 function close(id){if(!w.cells[id]||protect.has(id))return false;w.cells[id]=0;const check=distances();if(check.size===floors-1&&(direction!=='both'||check.windingCycle)){floors--;removed++;return true;}w.cells[id]=1;return false;}
 w.pillarGrowth=[];
 for(let sheet=0;sheet<sheets;sheet++){
  const attached=new Set([sheet*area+cy*size+cx,sheet*area+(cy-1)*size+cx]),tried=new Set(),target=2+Math.floor(random()*size),added=[];
  while(pillar!=='small'&&added.length<target){const candidates=new Set();for(const id of attached){const x=id%size,y=Math.floor(id%area/size);for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy;if(nx<1||nx>=size-1||ny<1||ny>=size-1)continue;const next=sheet*area+ny*size+nx;if(!attached.has(next)&&!tried.has(next))candidates.add(next);}}
   if(!candidates.size)break;const list=[...candidates],id=list[Math.floor(random()*list.length)];tried.add(id);
   if(!w.cells[id]){attached.add(id);continue;}if(close(id)){attached.add(id);added.push(id);}
  }w.pillarGrowth.push(added);
 }
 const order=Array.from(w.cells.keys()).filter(id=>w.cells[id]&&!protect.has(id));for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 if(algorithm==='walls'&&wallStyle==='dense'){for(const id of order){if(removed>=targetWalls)break;close(id);}}
 else{
  const patterns=Array.from({length:sheets},()=>Patterns.create(size,algorithm==='walls'?'prim':algorithm,wallStyle,random));
  // Keep the carved pattern's floors where possible. Mandatory branch paths and
  // winding cycles may require extra openings in its proposed walls.
  w.patternCorrections=0;for(const id of order)if(!patterns[Math.floor(id/area)][id%area]&&!close(id))w.patternCorrections++;
 }

 for(const [key,e]of base){if(w.cells[Number(key.split(':')[0])])w.candidates.set(key,e);if(w.cells[Number(key.split(':')[0])]&&w.cells[e.to])w.edges.set(key,e);}
 w.branchLoops=[];for(let sheet=0;sheet<sheets;sheet++){
  const from=sheet*area+w.start,to=((sheet+1)%sheets)*area+w.start,prev=new Map([[from,null]]),queue=[from];
  for(const id of queue){if(id===to)break;for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&!prev.has(e.to)){prev.set(e.to,[id,d]);queue.push(e.to);}}}
  if(!prev.has(to))throw Error('柱の周回経路を確保できませんでした。');const path=[];for(let id=to;id!==from;){const [parent,d]=prev.get(id);path.push(d);id=parent;}w.branchLoops.push(path.reverse());
 }
 const dist=distances(),exits=[...dist].filter(([id])=>returnRoute?Math.floor(id/area)===0&&id%size<boundary[Math.floor(id/size)]:Math.floor(id/area)===goalSheet).filter(([id])=>direction==='both'||(direction==='left'?dist.turns.get(id)<0:dist.turns.get(id)>0));exits.sort((a,b)=>b[1]-a[1]||a[0]-b[0]);w.exit=exits[0][0];
 // Lift sheet transitions to integer turns. With a one-sided cut, every route
 // to a cell must have the same winding; no repeated opposite loop can bypass it.
 const turns=new Map([[w.start,0]]),queue=[w.start];let windingCycle=false;
 for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(!e)continue;const n=turns.get(id)+(e.kind==='branch'?(d===2?-1:1):0);if(turns.has(e.to)){if(turns.get(e.to)!==n)windingCycle=true;}else{turns.set(e.to,n);queue.push(e.to);}}
 if(direction!=='both'&&(windingCycle||(direction==='left'?turns.get(w.exit)>=0:turns.get(w.exit)<=0)))throw Error('出口の周回方向を保証できませんでした。');
 if(direction==='both'&&!windingCycle)throw Error('両周回の経路を保証できませんでした。');
 w.branchWinding={cycle:windingCycle,exit:turns.get(w.exit)};w.branchStats={floors,removed,exitSteps:dist.get(w.exit)};state.world=Underpasses.add(w,Number(options.underpasses??0),options.underpassShape??'straight');Rules.install(state,options.ruleMode??'plain');return state;
}
const api={create,ring,afterMove:Rules.afterMove,mark:Rules.mark,autoMark:Rules.autoMark,glyph:Rules.glyph,detour:Rules.detour,explore:Rules.explore};if(typeof module==='object')module.exports=api;else root.BranchMaze=api;
})(globalThis);
