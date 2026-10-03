/* Full exploration replay, for ordinary, key/door and toroidal exploration. */
(function(root){
'use strict';
const M=typeof module==='object'?require('./core.js'):root.MazeCore;
const C=typeof module==='object'?require('./main-checkpoint.js'):root.MazeCheckpoint;
const histories=new WeakMap(),limit=20000;
function supported(g){return !!g.generationOptions&&!g.world.warpMode&&!g.world.birdMode;}
function attach(g){if(supported(g)&&!histories.has(g))histories.set(g,{actions:[],overflow:false});return g;}
function act(g,kind,...args){
 const fn={move:M.move,wait:M.waitTurn,mark:M.placeMarker,name:M.nameMarker,continue:M.continueExploring}[kind];
 if(!fn)throw Error('未対応の操作です。');
 const result=fn(g,...args),h=histories.get(g);
 if(h){if(h.actions.length<limit)h.actions.push([kind,...args]);else h.overflow=true;}
 return result;
}
function fingerprint(g){
 const {world,generationOptions,...state}=g;
 const text=JSON.stringify(state,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
 let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);
 return (h>>>0).toString(16);
}
function encode(g,course){
 if(!supported(g))throw Error('途中セーブは現在、通常探索・鍵と扉・トーラスに対応しています。');
 const h=histories.get(g);if(!h||h.overflow)throw Error('操作履歴が不足しているか、保存上限（20,000操作）を超えています。');
 return JSON.stringify({format:'maze-planar-session',version:1,entrance:JSON.parse(C.encode(g,course)),actions:h.actions,check:fingerprint(g)},null,2);
}
function decode(text){
 if(typeof text!=='string'||text.length>2000000)throw Error('保存データが大きすぎます。');
 let d;try{d=JSON.parse(text);}catch{throw Error('JSON形式の保存データではありません。');}
 if(d?.format!=='maze-planar-session'||d.version!==1||!Array.isArray(d.actions)||d.actions.length>limit||typeof d.check!=='string')throw Error('対応する途中セーブではありません。');
 for(const a of d.actions){
  if(!Array.isArray(a)||!((a.length===2&&a[0]==='move'&&Object.hasOwn(M.DIRS,a[1]))||(a.length===1&&['wait','mark','continue'].includes(a[0]))||(a.length===3&&a[0]==='name'&&typeof a[1]==='string'&&a[1].length<=2&&typeof a[2]==='string'&&a[2].length<=100)))throw Error('操作履歴が不正です。');
 }
 const restored=C.decode(JSON.stringify(d.entrance)),g=restored.game;
 if(!supported(g))throw Error('この空間・ルールの途中再開はまだ未対応です。');
 attach(g);for(const [kind,...args]of d.actions)act(g,kind,...args);
 if(fingerprint(g)!==d.check)throw Error('保存時の探索状態を再現できません。');
 return restored;
}
const api={supported,attach,act,encode,decode};if(typeof module==='object')module.exports=api;else root.MazeSession=api;
})(typeof globalThis==='object'?globalThis:this);
