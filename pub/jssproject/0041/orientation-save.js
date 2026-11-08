/* Versioned action replay; files never supply executable code or live objects. */
(function(root){
'use strict';
const O=typeof module==='object'?require('./orientation.js'):root.MazeOrientation;
const limit=20000;
function fingerprint(state){
 const {game,frame,chart,archives,crossings}=state;
 const text=JSON.stringify({cells:Array.from(game.world.cells),warps:[...game.world.warps],player:game.player,markers:game.markers,steps:game.steps,won:game.won,frame,chart,archives,crossings},(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
 let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
 return (hash>>>0).toString(16);
}
function encode(state){
 if(state.history.length>limit)throw Error('保存できる操作数の上限（20,000件）を超えています。');
 return JSON.stringify({format:'maze-orientation-save',version:1,config:state.config,actions:state.history,check:fingerprint(state)},null,2);
}
function decode(text){
 if(typeof text!=='string'||text.length>2000000)throw Error('保存データが大きすぎます。');
 let data;try{data=JSON.parse(text);}catch{throw Error('JSON形式の保存データではありません。');}
 const c=data?.config,actions=data?.actions;
 if(data?.format!=='maze-orientation-save'||data.version!==1)throw Error('対応する向きの実験の保存データではありません。');
 if(!c||(c.course!==undefined&&!['all','visible','plain'].includes(c.course))||(c.size!==undefined&&!['small','standard','large'].includes(c.size))||(c.stage!==undefined&&(!Number.isSafeInteger(c.stage)||c.stage<1))||(c.completedSteps!==undefined&&(!Number.isSafeInteger(c.completedSteps)||c.completedSteps<0))||(c.warpInvisible!==undefined&&typeof c.warpInvisible!=='boolean')||!['right','left','half','mirror','mixed'].includes(c.mode)||!['demo','dfs','prim','division','rooms'].includes(c.layout)||typeof c.seed!=='string'||c.seed.length>80||!['none','pair','oneway','cycle3','cycle4'].includes(c.warpStyle)||!Number.isInteger(c.warpCount)||c.warpCount<1||c.warpCount>4||!Array.isArray(actions)||actions.length>limit||typeof data.check!=='string')throw Error('保存データの設定・操作数が不正です。');
 for(const a of actions){
  if(!Array.isArray(a)||!((a.length===2&&a[0]==='move'&&['up','down','left','right'].includes(a[1]))||(a.length===1&&['mark','continue'].includes(a[0]))||(a.length===2&&a[0]==='match'&&Number.isInteger(a[1])&&a[1]>=0&&a[1]<limit)))throw Error('保存データに不正な操作があります。');
 }
 const state=O.create(c.mode,c);
 for(const a of actions){
  if(a[0]==='move'&&!O.move(state,a[1],true))throw Error('移動履歴を再現できません。');
  if(a[0]==='continue'&&!O.continueExploring(state))throw Error('出口到達後の探索再開を再現できません。');
  if(a[0]==='mark')O.placeMarker(state);
  if(a[0]==='match'&&(O.inspectMatch(state,a[1]).status!=='ready'||O.matchArchive(state,a[1]).status!=='matched'))throw Error('照合履歴を再現できません。');
 }
 if(fingerprint(state)!==data.check)throw Error('復元結果が保存時と一致しません。この版と互換性のあるデータが必要です。');
 return state;
}
const api={encode,decode};if(typeof module==='object')module.exports=api;else root.MazeOrientationSave=api;
})(typeof globalThis!=='undefined'?globalThis:this);
