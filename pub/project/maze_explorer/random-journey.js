/* Bounded random journeys: only supported topology/rule combinations. */
(function(root){
'use strict';
const M=typeof module==='object'?require('./core.js'):root.MazeCore;
const catalog={algorithms:['dfs','prim','division','rooms','wilson','kruskal','hunt','growing','eller'],topologies:['plane','torus'],rules:['plain','warp','keys','birds','bird-keys'],warpStyles:['pair','oneway','cycle3','cycle4'],warpRotations:['none','right','left','half','mirror','mixed'],warpVisibility:['visible','invisible']};
const defaults={minWidth:15,maxWidth:31,minHeight:11,maxHeight:23,...catalog,warpVisibility:['visible']};
function candidates(c){return c.topologies.flatMap(topology=>c.algorithms.flatMap(algorithm=>c.rules.filter(rule=>topology!=='torus'||(!['division','eller'].includes(algorithm)&&!['keys','bird-keys'].includes(rule))).map(rule=>({topology,algorithm,rule})))).filter(x=>dimensions(c.minWidth,c.maxWidth,x.topology==='torus').length&&dimensions(c.minHeight,c.maxHeight,x.topology==='torus').length);}
function dimensions(min,max,torus){const result=[];for(let n=min;n<=max;n++)if(n>=(torus?8:9)&&n<=(torus?100:101)&&n%2===(torus?0:1))result.push(n);return result;}
function validate(value,allowNoCombination=false){
 if(!value||typeof value!=='object'||Array.isArray(value)||![7,8,9,10].includes(Object.keys(value).length)||Object.keys(value).some(k=>!Object.hasOwn(defaults,k)))throw Error('ランダム設定の形式が不正です。');
 for(const k of ['minWidth','maxWidth','minHeight','maxHeight'])if(!Number.isInteger(value[k])||value[k]<8||value[k]>101)throw Error('サイズは8〜101の整数で指定してください。');
 if(value.minWidth>value.maxWidth||value.minHeight>value.maxHeight)throw Error('最小サイズは最大サイズ以下にしてください。');
 for(const [k,allowed] of Object.entries(catalog)){
  if(['warpStyles','warpRotations','warpVisibility'].includes(k)&&value[k]===undefined)continue;
  const emptyAllowed=(['warpStyles','warpVisibility'].includes(k)&&!value.rules?.includes('warp'))||(k==='warpRotations'&&(!value.rules?.includes('warp')||!value.topologies?.includes('plane')));
  if(!Array.isArray(value[k])||(!emptyAllowed&&!value[k].length)||value[k].length>allowed.length||new Set(value[k]).size!==value[k].length||value[k].some(x=>!allowed.includes(x)))throw Error(k==='warpVisibility'?'ワープを候補に含める場合は、床の見え方を1つ以上選んでください。':k==='warpRotations'?'平面のワープを候補に含める場合は、向きの変化を1つ以上選んでください。':k==='warpStyles'?'ワープを候補に含める場合は、ワープの接続方式を1つ以上選んでください。':'生成方式・空間・ルールは、それぞれ1つ以上選んでください。');
 }
 if(!allowNoCombination&&!candidates(value).length)throw Error('選択した候補とサイズ範囲に、対応する組合せがありません。');
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,Array.isArray(v)?[...v]:v]));
}
function inspect(value){
 const c=validate(value,true),choices=candidates(c);
 const spaces=c.topologies.map(topology=>{
  const torus=topology==='torus',widths=dimensions(c.minWidth,c.maxWidth,torus),heights=dimensions(c.minHeight,c.maxHeight,torus);
  const count=choices.filter(x=>x.topology===topology).length;
  const reasons=[];
  if(!widths.length||!heights.length)reasons.push(torus?'指定範囲に横幅・高さの両方が偶数となるサイズがありません。':'指定範囲に横幅・高さの両方が奇数となるサイズがありません。');
  if(torus&&c.algorithms.some(a=>['division','eller'].includes(a)))reasons.push('領域分割・Ellerはトーラスの抽選対象外です。');
  if(torus&&c.rules.some(r=>['keys','bird-keys'].includes(r)))reasons.push('鍵と扉・鍵と扉＋鳥人間はトーラスの抽選対象外です。');
  return {topology,count,widths,heights,reasons};
 });
 return {count:choices.length,spaces};
}
function choose(seed,value){
 const c=validate(value),rng=M.random(seed+'|random-journey-v1'),pick=a=>a[Math.floor(rng()*a.length)];
 const {topology,algorithm,rule}=pick(candidates(c)),torus=topology==='torus';
 const shifts=torus?pick([[0,0],[2,0],[0,2]]):[0,0];
 const options={seed,width:pick(dimensions(c.minWidth,c.maxWidth,torus)),height:pick(dimensions(c.minHeight,c.maxHeight,torus)),algorithm,topology:torus?'torus':'plane',shiftX:shifts[0],shiftY:shifts[1],
 loops:0,newestBias:pick([30,70,100]),roomCount:6,roomPlacement:pick(['bsp','scatter','grid']),connectionStyle:pick(['tree','chain','ring','hub']),
 warpMode:rule==='warp',warpStyle:pick(c.warpStyles?.length?c.warpStyles:catalog.warpStyles),warpCount:pick([1,2,3,4]),warpInvisible:false,
 keyDoor:['keys','bird-keys'].includes(rule),keyCount:pick([1,2,3]),birdMode:['birds','bird-keys'].includes(rule),birdCount:1,teleportPolicy:pick(['far','known','unseen']),separateMaps:true,
 loopLearning:torus,learningLaps:3,selfVision:false};
 const rotation=options.warpMode&&!torus?pick(c.warpRotations||catalog.warpRotations):'none';
 if(options.warpMode){const visibility=c.warpVisibility||defaults.warpVisibility;options.warpInvisible=(visibility.length===1?visibility[0]:pick(visibility))==='invisible';}
 return {options,rotation};
}
function exportSettings(value){return JSON.stringify({format:'maze-random-settings',version:1,settings:validate(value)},null,2);}
function importSettings(text){
 if(typeof text!=='string'||text.length>10000)throw Error('設定のテキストは10,000文字以内にしてください。');
 let data;try{data=JSON.parse(text.replace(/^\uFEFF/,''));}catch{throw Error('設定のテキストがJSON形式ではありません。');}
 if(!data||data.format!=='maze-random-settings'||data.version!==1||Object.keys(data).length!==3)throw Error('対応するランダム設定の記録ではありません。');
 return validate(data.settings);
}
const api={exportSettings,importSettings,defaults,catalog,validate,inspect,choose};if(typeof module==='object')module.exports=api;else root.MazeRandomJourney=api;
})(typeof globalThis==='object'?globalThis:this);
