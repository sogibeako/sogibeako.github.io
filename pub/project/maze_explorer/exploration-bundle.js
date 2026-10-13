/* A versioned container for native saves. Both are validated before either is applied. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./exploration-course.js'):root.ExplorationCourse;
function validatePreferences(p){
 if(!p||!['tiles','ascii','hybrid'].includes(p.render)||![0,3,5].includes(p.threshold)||typeof p.folding!=='boolean'||!['bounded','continuous'].includes(p.foldDisplay))throw Error('共通の表示・方向感覚設定が不正です。');
 return {render:p.render,threshold:p.threshold,folding:p.folding,foldDisplay:p.foldDisplay};
}
function unpack(text){
 if(typeof text!=='string'||text.length>50000000)throw Error('共通セーブは50MB以内にしてください。');
 const d=JSON.parse(text);
 if(d?.format!=='maze-exploration-bundle'||![1,2].includes(d.version)||!(d.version===2?['main','skew','enclosure']:['main','skew']).includes(d.active)||typeof d.main!=='string'||typeof d.skew!=='string')throw Error('対応する共通セーブではありません。');
 if(d.version===2&&typeof d.enclosure!=='string')throw Error('作例3の保存がありません。');
 if(d.preferences!==undefined)d.preferences=validatePreferences(d.preferences);
 d.course=C.validate(d.course??{enabled:false,completed:0,steps:0});return d;
}
function encode(main,skew,active,course={enabled:false,completed:0,steps:0},enclosure,preferences){const text=JSON.stringify({format:'maze-exploration-bundle',version:enclosure===undefined?1:2,active,main,skew,course,enclosure,preferences});unpack(text);return text;}
async function prepare(text,adapters){const d=unpack(text);const main=await adapters.main.prepare(d.main);const skew=await adapters.skew.prepare(d.skew);const result={active:d.active,main,skew,course:d.course};if(d.version===2)result.enclosure=await adapters.enclosure.prepare(d.enclosure);if(d.preferences!==undefined){if(!adapters.preferences)throw Error('表示設定の復元に対応していません。');result.preferences=d.preferences;}return result;}
function apply(prepared,adapters,backup){
 const keys=['main','skew',...('enclosure' in prepared?['enclosure']:[]),...('preferences' in prepared?['preferences']:[])];
 try{for(const key of keys)adapters[key].apply(prepared[key]);}
 catch(error){
  const failures=[];for(const key of keys)try{adapters[key].apply(backup[key]);}catch(e){failures.push(e.message);}
  throw Error(error.message+(failures.length?' 復元前の状態への戻しに失敗しました：'+failures.join(' / '):' 元の探索へ戻しました。'));
 }
 return prepared.active;
}
const api={validatePreferences,encode,unpack,prepare,apply};if(typeof module==='object')module.exports=api;else root.ExplorationBundle=api;
})(globalThis);
