/* Shared journey accounting and destination selection. */
(function(root){
'use strict';
const G=typeof module==='object'?require('./exploration-generation.js'):root.ExplorationGeneration;
function validate(c){
 if(!c||typeof c.enabled!=='boolean'||!Number.isSafeInteger(c.completed)||c.completed<0||!Number.isSafeInteger(c.steps)||c.steps<0)throw Error('共通コースの記録が不正です。');
 const order=c.order??'alternate',pool=c.pool??['main','skew'];
 if(!['alternate','cycle','random'].includes(order)||!Array.isArray(pool)||!pool.length||pool.length>3||new Set(pool).size!==pool.length||pool.some(m=>!['main','skew','enclosure'].includes(m)))throw Error('次の空間を1種類以上選んでください。');
 if(c.randomGeneration!==undefined&&typeof c.randomGeneration!=='boolean')throw Error('生成方式の抽選設定が不正です。');
 const extra=c.generators===undefined?{}:{generators:G.validatePools(c.generators)};
 if(c.shifts!==undefined)extra.shifts=G.validateShifts(c.shifts);
 if(c.topologies!==undefined)extra.topologies=G.validateTopologies(c.topologies);
 if(c.sizes!==undefined)extra.sizes=G.validateSizes(c.sizes);
 return {...extra,randomGeneration:c.randomGeneration??false,enabled:c.enabled,completed:c.completed,steps:c.steps,order,pool:[...pool]};
}
function advance(c,mode,progress,rng=Math.random){
 const normalized=validate(c);if(!c.enabled||!progress.exit)throw Error('出口の上で次の空間へ進めます。');
 if(!Number.isSafeInteger(progress.steps)||progress.steps<0||!['main','skew','enclosure'].includes(mode))throw Error('探索の進行が不正です。');
 let destination=mode==='main'?'skew':'main';
 if(normalized.order==='cycle')destination={main:'skew',skew:'enclosure',enclosure:'main'}[mode];
 if(normalized.order==='random'){const value=rng();if(!Number.isFinite(value)||value<0||value>=1)throw Error('抽選値が不正です。');destination=normalized.pool[Math.floor(value*normalized.pool.length)];}
 return {mode:destination,course:validate({...normalized,completed:c.completed+1,steps:c.steps+progress.steps})};
}
const api={validate,advance};if(typeof module==='object')module.exports=api;else root.ExplorationCourse=api;
})(globalThis);
