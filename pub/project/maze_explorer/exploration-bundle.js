/* A versioned container for native saves. Both are validated before either is applied. */
(function(root){
'use strict';
const C=typeof module==='object'?require('./exploration-course.js'):root.ExplorationCourse;
function validatePreferences(p){
 if(!p||!['tiles','ascii','hybrid'].includes(p.render)||![0,3,5].includes(p.threshold)||typeof p.folding!=='boolean'||!['bounded','continuous'].includes(p.foldDisplay))throw Error('共通の表示・方向感覚設定が不正です。');
 const extra={};if(p.auto!==undefined){if(!p.auto||!['explore','exit','stroll'].includes(p.auto.mode)||!Number.isInteger(p.auto.speed)||p.auto.speed<1||p.auto.speed>60000)throw Error('共通の自動歩行設定が不正です。');extra.auto={mode:p.auto.mode,speed:p.auto.speed};}
 return {render:p.render,threshold:p.threshold,folding:p.folding,foldDisplay:p.foldDisplay,...extra};
}
function unpack(text){
 if(typeof text!=='string'||text.length>50000000)throw Error('共通セーブは50MB以内にしてください。');
 const d=JSON.parse(text);
 if(d?.format!=='maze-exploration-bundle'||![1,2,3,4,5,6,7,8].includes(d.version)||!(d.version===8?['main','skew','enclosure','klein','biaxial','crossing','triple','branch','doubleTwist','quarter','quarterTwist']:d.version===7?['main','skew','enclosure','klein','biaxial','crossing','triple','branch']:d.version===6?['main','skew','enclosure','klein','biaxial','crossing','triple']:d.version===5?['main','skew','enclosure','klein','biaxial','crossing']:d.version===4?['main','skew','enclosure','klein','biaxial']:d.version===3?['main','skew','enclosure','klein']:d.version===2?['main','skew','enclosure']:['main','skew']).includes(d.active)||typeof d.main!=='string'||typeof d.skew!=='string')throw Error('対応する共通セーブではありません。');
 if(d.version>=2&&typeof d.enclosure!=='string')throw Error('作例3の保存がありません。');
 if(d.version>=3&&typeof d.klein!=='string')throw Error('クラインの保存がありません。');
 if(d.version===4&&typeof d.biaxial!=='string')throw Error('クラインの壺（自由接続）の保存がありません。');
 if(d.version===5&&(typeof d.crossing!=='string'||(d.biaxial!==undefined&&typeof d.biaxial!=='string')||(d.active==='biaxial'&&typeof d.biaxial!=='string')))throw Error('立体交差を含む保存が不正です。');
 if(d.version===6&&(typeof d.triple!=='string'||(d.crossing!==undefined&&typeof d.crossing!=='string')||(d.biaxial!==undefined&&typeof d.biaxial!=='string')||(d.active==='crossing'&&typeof d.crossing!=='string')||(d.active==='biaxial'&&typeof d.biaxial!=='string')))throw Error('3トーラスを含む保存が不正です。');
 if(d.version===7){if(typeof d.branch!=='string')throw Error('分枝迷路の保存がありません。');for(const key of ['triple','crossing','biaxial'])if((d[key]!==undefined&&typeof d[key]!=='string')||(d.active===key&&typeof d[key]!=='string'))throw Error('保存対象の空間の記録が不正です。');}
 if(d.version===8){if(typeof d.quarter!=='string')throw Error('回転接続の保存がありません。');for(const key of ['branch','triple','crossing','biaxial'])if((d[key]!==undefined&&typeof d[key]!=='string')||(d.active===key&&typeof d[key]!=='string'))throw Error('保存対象の記録が不正です。');const q=JSON.parse(d.quarter),family=q.options?.mode==='doubleTwist'?'doubleTwist':['quarterCW','quarterCCW'].includes(q.options?.mode)?'quarter':'quarterTwist';if(['doubleTwist','quarter','quarterTwist'].includes(d.active)&&family!==d.active)throw Error('回転接続の種類が一致しません。');}
 if(d.preferences!==undefined)d.preferences=validatePreferences(d.preferences);
 d.course=C.validate(d.course??{enabled:false,completed:0,steps:0});return d;
}
function encode(main,skew,active,course={enabled:false,completed:0,steps:0},enclosure,preferences,klein,biaxial,crossing,triple,branch,quarter){const text=JSON.stringify({format:'maze-exploration-bundle',version:quarter!==undefined?8:branch!==undefined?7:triple!==undefined?6:crossing!==undefined?5:biaxial!==undefined?4:klein!==undefined?3:enclosure===undefined?1:2,active,main,skew,course,enclosure,preferences,klein,biaxial,crossing,triple,branch,quarter});unpack(text);return text;}
async function prepare(text,adapters){const d=unpack(text);const main=await adapters.main.prepare(d.main);const skew=await adapters.skew.prepare(d.skew);const result={active:d.active,main,skew,course:d.course};if(d.version>=2)result.enclosure=await adapters.enclosure.prepare(d.enclosure);if(d.version>=3)result.klein=await adapters.klein.prepare(d.klein);if(d.version>=4&&d.biaxial!==undefined)result.biaxial=await adapters.biaxial.prepare(d.biaxial);if(d.version>=5&&d.crossing!==undefined)result.crossing=await adapters.crossing.prepare(d.crossing);if(d.version>=6&&d.triple!==undefined)result.triple=await adapters.triple.prepare(d.triple);if(d.version>=7&&d.branch!==undefined)result.branch=await adapters.branch.prepare(d.branch);if(d.version===8)result.quarter=await adapters.quarter.prepare(d.quarter);if(d.preferences!==undefined){if(!adapters.preferences)throw Error('表示設定の復元に対応していません。');result.preferences=d.preferences;}return result;}
function apply(prepared,adapters,backup){
 const keys=['main','skew',...('enclosure' in prepared?['enclosure']:[]),...('klein' in prepared?['klein']:[]),...('biaxial' in prepared?['biaxial']:[]),...('triple' in prepared?['triple']:[]),...('crossing' in prepared?['crossing']:[]),...('branch' in prepared?['branch']:[]),...('quarter' in prepared?['quarter']:[]),...('preferences' in prepared?['preferences']:[])];
 try{for(const key of keys)adapters[key].apply(prepared[key]);}
 catch(error){
  const failures=[];for(const key of keys)try{adapters[key].apply(backup[key]);}catch(e){failures.push(e.message);}
  throw Error(error.message+(failures.length?' 復元前の状態への戻しに失敗しました：'+failures.join(' / '):' 元の探索へ戻しました。'));
 }
 return prepared.active;
}
const api={validatePreferences,encode,unpack,prepare,apply};if(typeof module==='object')module.exports=api;else root.ExplorationBundle=api;
})(globalThis);
