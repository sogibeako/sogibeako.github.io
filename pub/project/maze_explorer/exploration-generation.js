/* Select compatible shared-course conditions before creating a new exploration. */
(function(root){
'use strict';
function candidates(mode,options){
 if(mode==='skew')return ['walls','dfs','prim','growing'];
 if(mode!=='main')throw Error('未対応の空間です。');
 const all=['dfs','prim','wilson','kruskal','hunt','growing','rooms','division','eller'];
 return options.topology==='torus'?all.filter(a=>!['division','eller'].includes(a)):all;
}
function validatePools(value){
 const pools=value??{main:candidates('main',{}),skew:candidates('skew',{})};
 if(!pools||typeof pools!=='object')throw Error('生成方式の候補が不正です。');
 for(const mode of ['main','skew']){const list=pools[mode],allowed=candidates(mode,{});if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!allowed.includes(a)))throw Error('各空間の生成方式を1つ以上選んでください。');}
 return {main:[...pools.main],skew:[...pools.skew]};
}
function validateSizes(value){
 const v=value??{enabled:false,widthMin:15,widthMax:31,heightMin:11,heightMax:23,periodMin:16,periodMax:24};
 if(!v||typeof v.enabled!=='boolean')throw Error('サイズの抽選設定が不正です。');
 for(const axis of ['width','height','period']){const lo=v[axis+'Min'],hi=v[axis+'Max'],period=axis==='period';if(!Number.isInteger(lo)||!Number.isInteger(hi)||lo>hi||lo<(period?12:8)||hi>(period?24:101)||(period&&(![12,16,20,24].includes(lo)||![12,16,20,24].includes(hi))))throw Error('サイズ範囲は最小≦最大にしてください。通常迷路は8〜101、中央穴は12・16・20・24です。');}
 return Object.fromEntries(['enabled','widthMin','widthMax','heightMin','heightMax','periodMin','periodMax'].map(k=>[k,v[k]]));
}
function pick(values,seed,salt){let h=2166136261;for(const ch of String(seed)+salt)h=Math.imul(h^ch.charCodeAt(0),16777619);if(!values.length)throw Error('指定範囲に対応サイズがありません。平面は奇数、トーラスは偶数で、境界のずれより大きい範囲を指定してください。');return values[(h>>>0)%values.length];}
function resize(mode,options,seed,sizes){
 const v=validateSizes(sizes),result={...options};if(!v.enabled)return result;
 if(mode==='skew'){result.periodSize=pick([12,16,20,24].filter(n=>n>=v.periodMin&&n<=v.periodMax),seed,'|shared-period-v1');result.periodWidth=result.periodSize;result.periodHeight=result.periodSize;return result;}
 if(mode!=='main')throw Error('未対応の空間です。');
 const torus=options.topology==='torus';
 for(const [axis,shift]of [['width','shiftX'],['height','shiftY']]){const values=[];for(let n=v[axis+'Min'];n<=v[axis+'Max'];n++)if(n%2===(torus?0:1)&&(!torus||n>Math.abs(options[shift]||0)))values.push(n);result[axis]=pick(values,seed,'|shared-'+axis+'-v1');}
 return result;
}
function validateTopologies(value){
 const v=value??{enabled:false,pool:['plane','torus']};
 if(!v||typeof v.enabled!=='boolean'||!Array.isArray(v.pool)||!v.pool.length||new Set(v.pool).size!==v.pool.length||v.pool.some(t=>!['plane','torus'].includes(t)))throw Error('通常迷路の空間を1種類以上選んでください。');
 return {enabled:v.enabled,pool:[...v.pool]};
}
function chooseTopology(options,enabled,seed,pools,sizes,setting,rotation){
 const size=validateSizes(sizes),selected=enabled?validatePools(pools).main:[options.algorithm||'dfs'];
 const choices=[];
 for(const topology of setting.pool){
  if(topology==='torus'&&(options.keyDoor||(options.warpMode&&rotation!=='none')))continue;
  if(!candidates('main',{topology}).some(a=>selected.includes(a)))continue;
  let result={...options,topology};
  if(!size.enabled){for(const axis of ['width','height']){const n=options[axis]??(axis==='width'?31:23);result[axis]=topology==='torus'?n-n%2:n+(n%2===0?1:0);}}
  try{result=resize('main',result,seed,size);}catch(error){continue;}
  if(topology==='torus'&&['shiftX','shiftY'].some((key,i)=>{const shift=result[key]||0;return !Number.isInteger(shift)||shift%2!==0||Math.abs(shift)>=result[i?'height':'width'];}))continue;
  choices.push(result);
 }
 if(!choices.length)throw Error('選択した空間に対応する組合せがありません。生成方式・サイズ範囲・ずれを確認してください。鍵と扉、向きが変わるワープは平面を候補に含めてください。');
 return pick(choices,seed,'|shared-topology-v1');
}
function validateShifts(value){
 const v=value??{enabled:false,pool:['none','x','y','both']};
 if(!v||typeof v.enabled!=='boolean'||!Array.isArray(v.pool)||!v.pool.length||new Set(v.pool).size!==v.pool.length||v.pool.some(t=>!['none','x','y','both'].includes(t)))throw Error('境界のずれを1種類以上選んでください。');
 return {enabled:v.enabled,pool:[...v.pool]};
}
function shiftOptions(mode,options,seed,setting){
 if(!setting.enabled)return options;
 if(mode==='main'&&options.topology!=='torus')return {...options,shiftX:0,shiftY:0};
 const width=mode==='skew'?(options.periodWidth??options.periodSize):options.width,height=mode==='skew'?(options.periodHeight??options.periodSize):options.height;
 const xs=[-4,-2,2,4].filter(n=>Math.abs(n)<width),ys=[-4,-2,2,4].filter(n=>Math.abs(n)<height);
 const groups={none:[[0,0]],x:xs.map(x=>[x,0]),y:ys.map(y=>[0,y]),both:xs.flatMap(x=>ys.map(y=>[x,y]))};
 const types=setting.pool.filter(t=>groups[t].length);if(!types.length)throw Error('このサイズに対応する境界のずれがありません。');
 // Mix all hash bits so a selected type does not constrain the pair's low bits.
 const draw=(values,salt)=>{let h=2166136261;for(const c of String(seed)+salt)h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);h^=h>>>16;return values[(h>>>0)%values.length];};
 const type=draw(types,'|shared-shift-type-v1'),[shiftX,shiftY]=draw(groups[type],'|shared-shift-pair-v1');
 return {...options,shiftX,shiftY};
}
function chooseBase(mode,options,enabled,seed,pools,sizes,topologies,rotation='none',shifts){
 const shiftSetting=validateShifts(shifts);if(shiftSetting.enabled)options={...options,shiftX:0,shiftY:0};
 const setting=validateTopologies(topologies);if(mode==='main'&&setting.enabled)options=chooseTopology(options,enabled,seed,pools,sizes,setting,rotation);
 const result={...shiftOptions(mode,resize(mode,options,seed,sizes),seed,shiftSetting),seed};if(!enabled)return result;
 const selected=validatePools(pools)[mode],choices=candidates(mode,options).filter(a=>selected.includes(a));if(!choices.length)throw Error('この空間に対応する生成方式が候補にありません。トーラスでは領域分割・Eller以外を選んでください。');let h=2166136261;for(const ch of String(seed)+'|shared-generator-v1')h=Math.imul(h^ch.charCodeAt(0),16777619);
 result[mode==='main'?'algorithm':'growth']=choices[(h>>>0)%choices.length];return result;
}
function validateRules(value){const v=value??{enabled:false,pool:['plain','keys','warp','birds']};if(!v||typeof v.enabled!=='boolean'||!Array.isArray(v.pool)||!v.pool.length||new Set(v.pool).size!==v.pool.length||v.pool.some(x=>!['plain','keys','warp','birds'].includes(x)))throw Error('仕掛けの候補を1つ以上選んでください。');return {enabled:v.enabled,pool:[...v.pool]};}
function choose(mode,options,enabled,seed,pools,sizes,topologies,rotation='none',shifts,rules){
 const setting=validateRules(rules);if(mode!=='main'||!setting.enabled)return chooseBase(mode,options,enabled,seed,pools,sizes,topologies,rotation,shifts);
 // Evaluate compatible topology/rule pairs before drawing; never silently discard a keys-only pool.
 const ts=validateTopologies(topologies),possible=[];
 for(const rule of setting.pool){
  const base={...options,keyDoor:rule==='keys',warpMode:rule==='warp',birdMode:rule==='birds',keyCount:options.keyCount||1,birdCount:1,warpCount:options.warpCount||2,warpStyle:options.warpStyle||'pair',separateMaps:true};
  if(base.birdMode)base.loops=Math.max(8,base.loops||0);
  const spaces=ts.enabled?ts.pool:[options.topology||'plane'];
  for(const topology of spaces){if(topology==='torus'&&rule==='keys')continue;
   try{possible.push(chooseBase(mode,{...base,topology},enabled,seed,pools,sizes,ts.enabled?{enabled:true,pool:[topology]}:ts,'none',shifts));}catch(error){/* Another supported pair may still be available. */}
  }
 }
 if(!possible.length)throw Error('仕掛け・空間・サイズ・生成方式の候補に対応する組合せがありません。鍵と扉は平面で使えます。');
 return pick(possible,seed,'|shared-rules-v1');
}
function chooseEnclosure(options,seed,shifts){return {...shiftOptions('enclosure',options,seed,validateShifts(shifts)),seed};}
const api={validateRules,chooseEnclosure,candidates,choose,validatePools,validateSizes,resize,validateTopologies,validateShifts};if(typeof module==='object')module.exports=api;else root.ExplorationGeneration=api;
})(globalThis);
