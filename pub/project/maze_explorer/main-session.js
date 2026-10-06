/* Full exploration replay. Seeded bird randomness is reconstructed by replaying every action. */
(function(root){
'use strict';
const M=typeof module==='object'?require('./core.js'):root.MazeCore;
const C=typeof module==='object'?require('./main-checkpoint.js'):root.MazeCheckpoint;
const histories=new WeakMap(),arrowHistories=new WeakMap(),limit=20000;
function supported(g){return !!g.generationOptions;}
function attach(g){if(supported(g)&&!histories.has(g))histories.set(g,{actions:[],overflow:false});return g;}
function info(g,course){
 const h=histories.get(g);
 return {supported:supported(g),tracked:!!h,revision:h?.revision||0,count:h?.actions.length||0,limit,remaining:h?limit-h.actions.length:0,overflow:!!h?.overflow,
  current:!!h&&!h.overflow&&h.exportedCount===h.actions.length&&h.exportedCourse===course&&h.exportedSize===(g.journey?.size||'standard')&&h.exportedLayout===(g.journey?.layout||'all')&&h.exportedRandom===JSON.stringify(g.journey?.random),exported:!!h&&h.exportedCount!==undefined};
}
function markExport(g,course){const h=histories.get(g);if(h&&!h.overflow){h.exportedCount=h.actions.length;h.exportedCourse=course;h.exportedSize=g.journey?.size||'standard';h.exportedLayout=g.journey?.layout||'all';h.exportedRandom=JSON.stringify(g.journey?.random);}}
function arrowHistory(g){
 if(!arrowHistories.has(g))arrowHistories.set(g,{undo:[],redo:[]});
 return arrowHistories.get(g);
}
function arrowHistoryInfo(g){const h=arrowHistories.get(g);return {undo:h?.undo.length||0,redo:h?.redo.length||0};}
function replayArrowEdit(g,redo){
 const h=arrowHistory(g),source=redo?h.redo:h.undo,destination=redo?h.undo:h.redo,edit=source.at(-1);if(!edit)return false;
 const desired=redo?edit.after:edit.before,index=g.warpArrows?.findIndex(a=>a.from===edit.from&&a.to===edit.to)??-1;
 if(edit.kind==='curveArrow'||edit.kind==='resetArrowCurve'){
  if(index<0)return false;
  const current=g.warpArrows[index];
  if(Object.hasOwn(desired,'curve'))current.curve=desired.curve;else delete current.curve;
 }else if(desired){
  if(index>=0||g.warpArrows?.length>=100)return false;
  if(!g.warpArrows)g.warpArrows=[];
  g.warpArrows.splice(Math.min(edit.index,g.warpArrows.length),0,{...desired});
 }else{
  if(index<0)return false;
  // Keep observations acquired after the edit when restoring the arrow later.
  if(redo)edit.before={...g.warpArrows[index]};else edit.after={...g.warpArrows[index]};
  g.warpArrows.splice(index,1);
 }
 source.pop();destination.push(edit);return true;
}
function act(g,kind,...args){
 const fn={undoArrow:g=>replayArrowEdit(g,false),redoArrow:g=>replayArrowEdit(g,true),move:M.move,wait:M.waitTurn,mark:M.placeMarker,zero:M.placeZeroMark,zeroAt:M.placeRemoteZeroMark,eraseZeroAt:M.eraseZeroMark,arrow:M.rememberWarpArrow,eraseArrow:M.eraseWarpArrow,curveArrow:M.curveWarpArrow,resetArrowCurve:M.resetWarpArrowCurve,name:M.nameMarker,continue:M.continueExploring,note:M.setArchiveNote,landmark:g=>M.matchLandmarkMaps(g,true),recorded:g=>M.matchRecordedMaps(g,true)}[kind];
 if(!fn)throw Error('未対応の操作です。');
 const editing=['arrow','eraseArrow','curveArrow','resetArrowCurve'].includes(kind);
 const index=editing?(g.warpArrows?.findIndex(a=>a.from===args[0]&&a.to===args[1])??-1):-1;
 const before=index>=0?{...g.warpArrows[index]}:null;
 const result=fn(g,...args),h=histories.get(g);
 if(editing&&result){
  const arrow=g.warpArrows?.find(a=>a.from===args[0]&&a.to===args[1]),after=arrow?{...arrow}:null;
  if(JSON.stringify(before)!==JSON.stringify(after)){
   const history=arrowHistory(g);history.undo.push({kind,from:args[0],to:args[1],before,after,index:index<0?g.warpArrows.length-1:index});history.redo=[];
  }
 }
 if(h){h.revision=(h.revision||0)+1;if(h.actions.length<limit)h.actions.push([kind,...args]);else h.overflow=true;}
 return result;
}
function fingerprint(g){
 const {world,generationOptions,...state}=g;
 const text=JSON.stringify(state,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
 let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);
 return (h>>>0).toString(16);
}
function encode(g,course){
 if(!supported(g))throw Error('この実験用の地形は途中セーブに対応していません。');
 const h=histories.get(g);if(!h||h.overflow)throw Error('操作履歴が不足しているか、保存上限（20,000操作）を超えています。');
 return JSON.stringify({format:'maze-planar-session',version:1,entrance:JSON.parse(C.encode(g,course)),actions:h.actions,check:fingerprint(g)},null,2);
}
function* replay(text){
 if(typeof text!=='string'||text.length>2000000)throw Error('保存データが大きすぎます。');
 let d;try{d=JSON.parse(text);}catch{throw Error('JSON形式の保存データではありません。');}
 if(d?.format!=='maze-planar-session'||d.version!==1||!Array.isArray(d.actions)||d.actions.length>limit||typeof d.check!=='string')throw Error('対応する途中セーブではありません。');
 for(const a of d.actions){
  if(!Array.isArray(a)||!((a.length===4&&a[0]==='curveArrow'&&Number.isInteger(a[1])&&Number.isInteger(a[2])&&Number.isFinite(a[3])&&Math.abs(a[3])<=3)||(a.length===2&&['zeroAt','eraseZeroAt'].includes(a[0])&&Number.isInteger(a[1]))||(a.length===3&&['arrow','eraseArrow','resetArrowCurve'].includes(a[0])&&Number.isInteger(a[1])&&Number.isInteger(a[2]))||(a.length===2&&a[0]==='move'&&Object.hasOwn(M.DIRS,a[1]))||(a.length===1&&['wait','mark','zero','continue','landmark','recorded','undoArrow','redoArrow'].includes(a[0]))||(a.length===3&&a[0]==='name'&&typeof a[1]==='string'&&a[1].length<=2&&typeof a[2]==='string'&&a[2].length<=100)||(a.length===3&&a[0]==='note'&&Number.isInteger(a[1])&&a[1]>=0&&a[1]<limit&&typeof a[2]==='string'&&a[2].length<=200)))throw Error('操作履歴が不正です。');
 }
 const restored=C.decode(JSON.stringify(d.entrance)),g=restored.game;
 if(!supported(g))throw Error('この空間・ルールの途中再開はまだ未対応です。');
 attach(g);yield {done:0,total:d.actions.length};
 for(let i=0;i<d.actions.length;i++){const [kind,...args]=d.actions[i];act(g,kind,...args);if((i+1)%100===0)yield {done:i+1,total:d.actions.length};}
 if(fingerprint(g)!==d.check)throw Error('保存時の探索状態を再現できません。');
 markExport(g,restored.course);return restored;
}
function decode(text){const iterator=replay(text);let step;do{step=iterator.next();}while(!step.done);return step.value;}
async function decodeAsync(text,{onProgress=()=>{},cancelled=()=>false,yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
 const iterator=replay(text);
 try {
  await yieldTask();
  while(true){
   if(cancelled())throw Error('読み込みを中止しました。');
   const step=iterator.next();if(step.done)return step.value;
   onProgress(step.value);await yieldTask();
  }
 }finally{iterator.return();}
}
const api={arrowHistoryInfo,info,markExport,supported,attach,act,encode,decode,decodeAsync};if(typeof module==='object')module.exports=api;else root.MazeSession=api;
})(typeof globalThis==='object'?globalThis:this);
