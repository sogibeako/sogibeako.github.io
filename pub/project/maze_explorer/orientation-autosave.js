/* One local slot. Compare before writing so another tab cannot be silently overwritten. */
(function(root){
'use strict';
const key='maze-orientation-autosave-v1';
function create(storage,codec){
 let expected=storage.getItem(key);
 return {
  read:()=>expected,
  restore:()=>{const text=storage.getItem(key);if(!text)throw Error('自動保存がありません。');const state=codec.decode(text);expected=text;return state;},
  save(state){
   const text=codec.encode(state);
   if(storage.getItem(key)!==expected)throw Error('別のタブで保存が更新されています。自動保存から再開するか、現在の探索をファイル保存してください。');
   storage.setItem(key,text);expected=text;
  }
 };
}
const api={create,key};if(typeof module==='object')module.exports=api;else root.MazeOrientationAutosave=api;
})(typeof globalThis!=='undefined'?globalThis:this);
