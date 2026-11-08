/* Shared journey accounting and destination selection. */
(function(root){
'use strict';
const G=typeof module==='object'?require('./exploration-generation.js'):root.ExplorationGeneration;
function validate(c){
 if(!c||typeof c.enabled!=='boolean'||!Number.isSafeInteger(c.completed)||c.completed<0||!Number.isSafeInteger(c.steps)||c.steps<0)throw Error('共通コースの記録が不正です。');
 const order=c.order??'alternate',pool=c.pool??['main','skew'];
 if(!['alternate','cycle','random','sequence'].includes(order)||!Array.isArray(pool)||!pool.length||pool.length>13||new Set(pool).size!==pool.length||pool.some(m=>!['main','plane','torus','skew','enclosure','klein','biaxial','crossing','triple','branch','doubleTwist','quarter','quarterTwist'].includes(m)))throw Error('次の空間を1種類以上選んでください。');
 if(c.randomGeneration!==undefined&&typeof c.randomGeneration!=='boolean')throw Error('生成方式の抽選設定が不正です。');
 const extra=c.generators===undefined?{}:{generators:G.validatePools(c.generators)};
 if(c.randomPocket!==undefined){if(typeof c.randomPocket!=='boolean')throw Error('出口ポケットの抽選設定が不正です。');extra.randomPocket=c.randomPocket;}
 if(c.randomRimWalls!==undefined){if(typeof c.randomRimWalls!=='boolean')throw Error('穴の縁の抽選設定が不正です。');extra.randomRimWalls=c.randomRimWalls;}
 for(const key of ['randomTripleHole','randomTripleUnderpasses','randomTripleRoute','forceTripleReturn'])if(c[key]!==undefined){if(typeof c[key]!=='boolean')throw Error('3トーラスの抽選設定が不正です。');extra[key]=c[key];}
 if(c.randomQuarterUnderpasses!==undefined){if(typeof c.randomQuarterUnderpasses!=='boolean')throw Error('回転・反転のアンダーパス抽選設定が不正です。');extra.randomQuarterUnderpasses=c.randomQuarterUnderpasses;}
 if(c.styles!==undefined)extra.styles=G.validateStyles(c.styles);
 if(c.rules!==undefined)extra.rules=G.validateRules(c.rules);
 if(c.shifts!==undefined)extra.shifts=G.validateShifts(c.shifts);
 if(c.topologies!==undefined)extra.topologies=G.validateTopologies(c.topologies);
 if(c.enclosureSizes!==undefined)extra.enclosureSizes=G.validateEnclosureSizes(c.enclosureSizes);
 if(c.sizes!==undefined)extra.sizes=G.validateSizes(c.sizes);
 return {...extra,randomGeneration:c.randomGeneration??false,enabled:c.enabled,completed:c.completed,steps:c.steps,order,pool:[...pool]};
}
function advance(c,mode,progress,rng=Math.random,skip=false){
 const normalized=validate(c);if(!c.enabled||(!skip&&!progress.exit))throw Error('出口の上で次の空間へ進めます。');
 if(!Number.isSafeInteger(progress.steps)||progress.steps<0||!['main','skew','enclosure','klein','biaxial','crossing','triple','branch','doubleTwist','quarter','quarterTwist'].includes(mode))throw Error('探索の進行が不正です。');
 let destination=mode==='main'?'skew':'main';
 if(normalized.order==='cycle')destination={main:'skew',skew:'enclosure',enclosure:'main',klein:'main',biaxial:'main',crossing:'main',triple:'main',branch:'main',doubleTwist:'main',quarter:'main',quarterTwist:'main'}[mode];
 if(normalized.order==='sequence'){const current=mode==='main'?(progress.topology||'plane'):mode;const index=normalized.pool.indexOf(current);destination=normalized.pool[(index+1)%normalized.pool.length];}
 if(normalized.order==='random'){const value=rng();if(!Number.isFinite(value)||value<0||value>=1)throw Error('抽選値が不正です。');destination=normalized.pool[Math.floor(value*normalized.pool.length)];}
 return {...(['plane','torus'].includes(destination)?{mode:'main',topology:destination}:{mode:destination}),course:validate({...normalized,completed:c.completed+(skip?0:1),steps:c.steps+progress.steps})};
}
function allOptions(c){
 return validate({...c,
 pool:['plane','torus','skew','enclosure','klein','biaxial','crossing','triple','branch','doubleTwist','quarter','quarterTwist'],
 randomGeneration:true,generators:Object.fromEntries(['main','skew','enclosure','klein','biaxial','crossing','triple','branch','quarter'].map(mode=>[mode,G.candidates(mode,{})])),
 randomPocket:true,randomRimWalls:true,randomTripleRoute:true,randomTripleHole:true,randomTripleUnderpasses:true,forceTripleReturn:true,randomQuarterUnderpasses:true,
 sizes:{...G.validateSizes(c.sizes),enabled:true},enclosureSizes:{...G.validateEnclosureSizes(c.enclosureSizes),enabled:true},
 topologies:{enabled:true,pool:['plane','torus']},styles:{enabled:true,pool:['dense','grid']},rules:{enabled:true,pool:['plain','keys','warp','birds']},shifts:{enabled:true,pool:['none','x','y','both']}});
}
async function prepareNext(c,mode,progress,prepare,rng=Math.random,skip=false){
 validate(c);let last;
 for(let attempt=0;attempt<24;attempt++){
  const next=advance(c,mode,progress,rng,skip);
  try{return {next,fresh:await prepare(next),attempts:attempt+1};}catch(error){last=error;}
 }
 throw Error('24回再抽選しましたが、現在の候補では生成できませんでした。'+(last?.message||''));
}
const api={validate,advance,prepareNext,allOptions};if(typeof module==='object')module.exports=api;else root.ExplorationCourse=api;
})(globalThis);
