(function(root){'use strict';
const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace;
function valid(w){const area=w.size*w.size,physical=area*w.sheets,turns=new Map([[w.start,0]]),q=[w.start];let cycle=false;
 for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(!e)continue;const n=turns.get(id)+(e.kind==='branch'?(d===2?-1:1):0);if(turns.has(e.to)){if(turns.get(e.to)!==n)cycle=true;}else{turns.set(e.to,n);q.push(e.to);}}
 if(turns.size!==w.cells.reduce((a,b)=>a+b,0))return false;
 if(w.branchDirection==='both'?!cycle:cycle||(w.branchDirection==='left'?turns.get(w.exit)>=0:turns.get(w.exit)<=0))return false;
 if(w.branchRoute==='return'){const seen=new Set([w.start]),queue=[w.start];for(const id of queue)for(let d=0;d<4;d++){const e=w.edges.get(id+':'+d);if(e&&Math.floor(e.to%physical/area)===0&&!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}}if(seen.has(w.exit))return false;}
 return true;
}
function add(w,count,shape='straight'){if(!['straight','corners','mixed'].includes(shape))throw Error('未対応のアンダーパス形状です。');if(!Number.isInteger(count)||count<0||count>3)throw Error('アンダーパス数は0〜3です。');if(!count)return w;
 const trial={...w,cells:w.cells.slice(),edges:new Map(w.edges),candidates:new Map(w.candidates),layouts:w.layouts.map(l=>({...l})),underpassReach:2,underpassProtected:[]};
 const area=w.size*w.size,c=w.branchCenter;
 for(let id=0;id<w.sheets*area;id++){const x=id%w.size,y=Math.floor(id%area/w.size),sheet=Math.floor(id/area);if(Math.abs(y-c.y)<=2||Math.max(Math.abs(x-c.x),Math.abs(y-c.y))<=2||(sheet===0&&w.branchRoute==='return'&&Math.abs(x-w.branchBoundary[y])<=1))trial.underpassProtected.push(id);}
 S.addFloorUnderpasses(trial,count);
 if(!valid(trial))return {...w,underpassRequested:count};
 trial.underpassShape=shape;
 if(shape!=='straight')for(let i=0;i<trial.passages.length;i++){
  const original=trial.passages[i];let hash=2166136261;for(const c of w.seed+':'+i)hash=Math.imul(hash^c.charCodeAt(0),16777619);
  if(shape==='mixed'&&(hash>>>0)%2===0)continue;
  const p={...original},proposal={...trial,edges:new Map(trial.edges),candidates:new Map(trial.candidates),passages:[p]};
  S.bendUnderpasses(proposal,'corners');
  if(p.arms&&valid(proposal)){trial.edges=proposal.edges;trial.candidates=proposal.candidates;trial.passages[i]=p;}
 }
 trial.branchLoops=[];for(let sheet=0;sheet<w.sheets;sheet++){
 const from=sheet*area+w.start,to=((sheet+1)%w.sheets)*area+w.start,prev=new Map([[from,null]]),queue=[from];
 for(const id of queue){if(id===to)break;for(let d=0;d<4;d++){const e=trial.edges.get(id+':'+d);if(e&&!prev.has(e.to)){prev.set(e.to,[id,d]);queue.push(e.to);}}}
 const path=[];for(let id=to;id!==from;){const [parent,d]=prev.get(id);path.push(d);id=parent;}trial.branchLoops.push(path.reverse());
 }
 trial.underpassRequested=count;trial.branchStats={...w.branchStats,floors:trial.cells.reduce((a,b)=>a+b,0)};return trial;
}
function appearance(state,id){const w=state.world,physical=w.size*w.size*w.sheets,base=id%physical,area=w.size*w.size;let wall=!w.cells[id];
 for(const p of w.passages||[]){if(Math.floor(base/area)!==p.baseSheet)continue;const x=base%w.size,y=Math.floor(base%area/w.size);if(Math.max(Math.abs(x-p.cx),Math.abs(y-p.cy))>1)continue;
 const player=state.id%physical,dx=player%w.size-p.cx,dy=Math.floor(player%area/w.size)-p.cy,approach=Math.abs(dy)>Math.abs(dx)?(dy<0?0:2):(dx<0?3:1),axis=state.id===p.vertical?'vertical':state.id===p.horizontal?'horizontal':p.arms?(p.arms.includes(approach)?'horizontal':'vertical'):Math.abs(dy)>Math.abs(dx)?'vertical':'horizontal';
 if(base===p.horizontal)id=axis==='vertical'?p.vertical:p.horizontal;
 const local=x===p.cx&&y===p.cy?null:y===p.cy-1&&x===p.cx?0:x===p.cx+1&&y===p.cy?1:y===p.cy+1&&x===p.cx?2:x===p.cx-1&&y===p.cy?3:-1;wall=!w.cells[id]||(p.arms?(local!==null&&(local<0||(axis==='horizontal'?!p.arms.includes(local):p.arms.includes(local)))):(axis==='vertical'?x!==p.cx:y!==p.cy));break;
 }return {id,wall};}
const api={add,valid,appearance};if(typeof module==='object')module.exports=api;else root.BranchUnderpasses=api;
})(globalThis);
