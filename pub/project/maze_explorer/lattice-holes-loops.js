/* Observed, loop-erased walks within one sheet. Period evidence, not full homotopy. */
(function(root){
'use strict';
function start(state){
 if(!state.loopExperience)state.loopExperience={counts:new Map(),path:[],lastStep:state.steps};
 const r=state.loopExperience;
 if(!r.path.length||r.lastStep!==state.steps){r.path=[{id:state.id,frame:state.frame.join(','),x:0,y:0}];r.lastStep=state.steps;}
 return r;
}
function observe(state,sheet){
 const r=state.loopExperience;if(!r){start(state);return null;}
 if(r.lastStep===state.steps)return null;
 const e=state.last;
 if(state.steps!==r.lastStep+1||!e||e.kind==='throat'||e.changed||r.path.at(-1)?.id!==e.from){r.path=[];start(state);return null;}
 const prev=r.path.at(-1),directions=[[0,-1],[1,0],[0,1],[-1,0]],[dx,dy]=directions[e.worldDirection];
 const point={id:state.id,frame:state.frame.join(','),x:prev.x+dx,y:prev.y+dy};
 const index=r.path.findIndex(p=>p.id===point.id&&p.frame===point.frame);r.lastStep=state.steps;
 if(index<0){r.path.push(point);return null;}
 const origin=r.path[index],x=point.x-origin.x,y=point.y-origin.y,l=state.world.lattice;
 let a=(l.height*x+l.shiftX*y)/l.determinant,b=(l.shiftY*x+l.width*y)/l.determinant;
 // Remove the closed subwalk, including ordinary backtracking, before counting another lap.
 r.path=r.path.slice(0,index+1);
 if(!Number.isInteger(a)||!Number.isInteger(b)||(!a&&!b))return null;
 if(a<0||(a===0&&b<0)){a=-a;b=-b;}a=a||0;b=b||0;
 const key=`${sheet}:${a}:${b}`,count=(r.counts.get(key)||0)+1;r.counts.set(key,count);
 return {sheet,a,b,count};
}
function setThreshold(state,value){
 if(![0,3,5].includes(value))throw Error('方向感覚はOFF・3周・5周から選んでください。');
 state.loopThreshold=value;
}
function knowledge(state){
 const threshold=state.loopThreshold??3;
 return [...(state.loopExperience?.counts||[])].map(([key,count])=>{
  const [sheet,a,b]=key.split(':').map(Number);
  return {key,sheet,a,b,count,learned:threshold>0&&count>=threshold,remaining:threshold>0?Math.max(0,threshold-count):null};
 });
}
const api={start,observe,setThreshold,knowledge};if(typeof module==='object')module.exports=api;else root.SkewLoops=api;
})(globalThis);
