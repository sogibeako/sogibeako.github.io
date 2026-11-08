/* Select compatible shared-course conditions before creating a new exploration. */
(function(root){
'use strict';
function candidates(mode,options){
 if(mode==='quarter')return ['legacy','dfs','prim','growing','kruskal','hunt','wilson','rooms','division','eller'];
 if(mode==='branch')return ['walls','dfs','prim','growing'];
 if(mode==='triple')return ['dfs','prim','growing','walls','kruskal','hunt','wilson','rooms'];
 if(mode==='crossing')return ['frontier','dfs','growing','kruskal','prim','hunt'];
 if(mode==='biaxial')return ['dfs', 'prim', 'growing', 'atelier-dfs', 'atelier-prim', 'atelier-growing', 'atelier-kruskal', 'atelier-hunt', 'atelier-wilson', 'atelier-rooms', 'atelier-division', 'atelier-eller'];
 if(mode==='klein')return ['dfs','prim','growing','kruskal'];
 if(mode==='enclosure')return ['dfs','prim','growing','kruskal','wilson','hunt','rooms'];
 if(mode==='skew')return ['walls','dfs','prim','growing','rooms','hunt','wilson','kruskal'].filter(a=>!['wilson','kruskal'].includes(a)||options.wallStyle!=='dense');
 if(mode!=='main')throw Error('未対応の空間です。');
 const all=['dfs','prim','wilson','kruskal','hunt','growing','rooms','division','eller'];
 return options.topology==='torus'?all.filter(a=>!['division','eller'].includes(a)):all;
}
function validatePools(value){
 const pools=value??{main:candidates('main',{}),skew:candidates('skew',{})};
 if(!pools||typeof pools!=='object')throw Error('生成方式の候補が不正です。');
 for(const mode of ['main','skew']){const list=pools[mode],allowed=candidates(mode,{});if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!allowed.includes(a)))throw Error('各空間の生成方式を1つ以上選んでください。');}
 if(pools.enclosure!==undefined){const list=pools.enclosure;if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!candidates('enclosure',{}).includes(a)))throw Error('作例3の生成方式を1つ以上選んでください。');}
 if(pools.klein!==undefined){const list=pools.klein;if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!candidates('klein',{}).includes(a)))throw Error('クラインの生成方式を1つ以上選んでください。');}
 if(pools.biaxial!==undefined){const list=pools.biaxial;if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!candidates('biaxial',{}).includes(a)))throw Error('クラインの壺（自由接続）の生成方式を1つ以上選んでください。');}
 if(pools.crossing!==undefined){const list=pools.crossing;if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!candidates('crossing',{}).includes(a)))throw Error('立体交差の生成方式を1つ以上選んでください。');}
 if(pools.triple!==undefined){const list=pools.triple;if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!candidates('triple',{}).includes(a)))throw Error('3トーラスの生成方式を1つ以上選んでください。');}
 if(pools.branch!==undefined){const list=pools.branch;if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!candidates('branch',{}).includes(a)))throw Error('分枝迷路の生成方式を1つ以上選んでください。');}
 if(pools.quarter!==undefined){const list=pools.quarter;if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length||list.some(a=>!candidates('quarter',{}).includes(a)))throw Error('回転・反転の生成方式を1つ以上選んでください。');}
 return {...(pools.quarter===undefined?{}:{quarter:[...pools.quarter]}),...(pools.branch===undefined?{}:{branch:[...pools.branch]}),...(pools.triple===undefined?{}:{triple:[...pools.triple]}),...(pools.crossing===undefined?{}:{crossing:[...pools.crossing]}),...(pools.biaxial===undefined?{}:{biaxial:[...pools.biaxial]}),...(pools.klein===undefined?{}:{klein:[...pools.klein]}),main:[...pools.main],skew:[...pools.skew],...(pools.enclosure===undefined?{}:{enclosure:[...pools.enclosure]})};
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
  if(topology==='torus'&&(options.warpMode&&rotation!=='none'))continue;
  if(!candidates('main',{topology}).some(a=>selected.includes(a)))continue;
  let result={...options,topology};
  if(!size.enabled){for(const axis of ['width','height']){const n=options[axis]??(axis==='width'?31:23);result[axis]=topology==='torus'?n-n%2:n+(n%2===0?1:0);}}
  try{result=resize('main',result,seed,size);}catch(error){continue;}
  if(topology==='torus'&&['shiftX','shiftY'].some((key,i)=>{const shift=result[key]||0;return !Number.isInteger(shift)||shift%2!==0||Math.abs(shift)>=result[i?'height':'width'];}))continue;
  choices.push(result);
 }
 if(!choices.length)throw Error('選択した空間に対応する組合せがありません。生成方式・サイズ範囲・ずれを確認してください。向きが変わるワープは平面を候補に含めてください。');
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
 const selected=validatePools(pools)[mode],choices=candidates(mode,mode==='skew'?{...options,wallStyle:options.wallStyle??'dense'}:options).filter(a=>selected.includes(a));if(!choices.length)throw Error('この空間に対応する生成方式が候補にありません。トーラスでは領域分割・Eller以外を選んでください。');let h=2166136261;for(const ch of String(seed)+'|shared-generator-v1')h=Math.imul(h^ch.charCodeAt(0),16777619);
 result[mode==='main'?'algorithm':'growth']=choices[(h>>>0)%choices.length];return result;
}
function validateRules(value){const v=value??{enabled:false,pool:['plain','keys','warp','birds']};if(!v||typeof v.enabled!=='boolean'||!Array.isArray(v.pool)||!v.pool.length||new Set(v.pool).size!==v.pool.length||v.pool.some(x=>!['plain','keys','warp','birds'].includes(x)))throw Error('仕掛けの候補を1つ以上選んでください。');return {enabled:v.enabled,pool:[...v.pool]};}
function warpPick(values,seed,salt){let h=2166136261;for(const c of String(seed)+salt)h=Math.imul(h^c.charCodeAt(0),16777619);h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);h^=h>>>16;return values[(h>>>0)%values.length];}
function validateStyles(value){const v=value??{enabled:false,pool:['dense','grid']};if(typeof v.enabled!=='boolean'||!Array.isArray(v.pool)||!v.pool.length||new Set(v.pool).size!==v.pool.length||v.pool.some(x=>!['dense','grid'].includes(x)))throw Error('壁配置を1種類以上選んでください。');return {enabled:v.enabled,pool:[...v.pool]};}
function choose(mode,options,enabled,seed,pools,sizes,topologies,rotation='none',shifts,rules,styles,randomRimWalls=false){
 if(typeof randomRimWalls!=='boolean')throw Error('穴の縁の抽選設定が不正です。');
 if(mode==='skew'&&randomRimWalls)options={...options,holeRimWalls:warpPick([false,true],seed,'|shared-rim-walls-v1')};
 const style=validateStyles(styles);if(mode==='skew'&&style.enabled){const selected=enabled?validatePools(pools).skew:[options.growth||'walls'],valid=style.pool.filter(wallStyle=>candidates('skew',{wallStyle}).some(a=>selected.includes(a)));if(!valid.length)throw Error('Wilson・Kruskal法にはアトリエ形式を候補に含めてください。');options={...options,wallStyle:warpPick(valid,seed,'|wall-style-v1')};}
 const setting=validateRules(rules);if(mode==='skew')options=sheetRules(options,seed,setting);if(mode!=='main'||!setting.enabled)return chooseBase(mode,options,enabled,seed,pools,sizes,topologies,rotation,shifts);
 // Evaluate compatible topology/rule pairs before drawing; never silently discard a keys-only pool.
 const ts=validateTopologies(topologies),possible=[];
 for(const rule of setting.pool){
  const base={...options,distantKey:true,keyDoor:rule==='keys',warpMode:rule==='warp',birdMode:rule==='birds',keyCount:options.keyCount||1,birdCount:1,warpCount:rule==='warp'?warpPick([1,2,3,4],seed,'|shared-warp-count-v2'):(options.warpCount||2),warpStyle:rule==='warp'?warpPick(['pair','oneway','cycle3','cycle4'],seed,'|shared-warp-style-v2'):(options.warpStyle||'pair'),warpInvisible:rule==='warp'?warpPick([false,true],seed,'|shared-warp-visible-v2'):!!options.warpInvisible,separateMaps:true};
  if(base.birdMode)base.loops=Math.max(8,base.loops||0);
  const spaces=ts.enabled?ts.pool:[options.topology||'plane'];
  for(const topology of spaces){
   try{possible.push(chooseBase(mode,{...base,topology},enabled,seed,pools,sizes,ts.enabled?{enabled:true,pool:[topology]}:ts,'none',shifts));}catch(error){/* Another supported pair may still be available. */}
  }
 }
 if(!possible.length)throw Error('仕掛け・空間・サイズ・生成方式の候補に対応する組合せがありません。鍵と扉は平面で使えます。');
 return pick(possible,seed,'|shared-rules-v1');
}
function sheetRules(options,seed,rules){const setting=validateRules(rules);if(!setting.enabled)return options;const rule=pick(setting.pool,seed,'|shared-sheet-rules-v1');return {...options,features:{distantKey:true,avoidWarpTrap:true,keys:rule==='keys',warp:rule==='warp',birds:rule==='birds',...(rule==='birds'?{birdLeap:true,birdAcross:true,birdWander:true}:{})}};}
function validateEnclosureSizes(value){const v=value??{enabled:false,widthMin:24,widthMax:32,heightMin:24,heightMax:32};if(!v||typeof v.enabled!=='boolean')throw Error('作例3のサイズ抽選設定が不正です。');for(const axis of ['width','height']){const lo=v[axis+'Min'],hi=v[axis+'Max'];if(!Number.isInteger(lo)||!Number.isInteger(hi)||lo<24||hi>40||lo>hi||lo%2||hi%2)throw Error('作例3の大きさは24〜40の偶数で、最小≦最大にしてください。');}return Object.fromEntries(['enabled','widthMin','widthMax','heightMin','heightMax'].map(k=>[k,v[k]]));}
function chooseEnclosure(options,seed,shifts,rules,randomGeneration=false,pools,sizes){const size=validateEnclosureSizes(sizes);if(size.enabled){options={...options};for(const axis of ['width','height']){const values=[];for(let n=size[axis+'Min'];n<=size[axis+'Max'];n+=2)values.push(n);options[axis]=warpPick(values,seed,'|enclosure-'+axis+'-v1');}}
if(randomGeneration)options={...options,growth:warpPick(validatePools(pools).enclosure??candidates('enclosure',{}),seed,'|enclosure-growth-v1')};return {...shiftOptions('enclosure',sheetRules(options,seed,rules),seed,validateShifts(shifts)),seed};}
function chooseKlein(options,seed,course={}){
 const result={...options,seed,distantKey:true,avoidWarpTrap:true},sizes=validateSizes(course.sizes),shifts=validateShifts(course.shifts),rules=validateRules(course.rules);
 if(sizes.enabled)for(const axis of ['width','height']){
  const values=[];for(let n=Math.max(16,sizes[axis+'Min']);n<=Math.min(60,sizes[axis+'Max']);n++)if(n%2===0&&(axis!=='height'||shifts.enabled||n>Math.abs(options.shiftY??0)))values.push(n);
  if(!values.length)throw Error('クラインのサイズ候補がありません。16〜60の偶数を含み、保持する縦ずれより大きい範囲にしてください。');
  result[axis]=warpPick(values,seed,'|klein-'+axis+'-v1');
 }
 if(course.randomGeneration)result.growth=warpPick(validatePools(course.generators).klein??candidates('klein',{}),seed,'|klein-growth-v1');
 if(shifts.enabled){const choices=shifts.pool.filter(t=>t==='none'||t==='y');if(!choices.length)throw Error('クラインのずれ抽選は「ずれなし」か「縦方向だけずれる」を候補に含めてください。');const type=warpPick(choices,seed,'|klein-shift-type-v1');result.shiftY=type==='none'?0:warpPick([-4,-2,2,4].filter(n=>Math.abs(n)<result.height),seed,'|klein-shift-v1');}
 if(rules.enabled){const rule=warpPick(rules.pool,seed,'|klein-rule-v1');result.ruleMode=rule==='warp'?warpPick(['warp','warpHidden'],seed,'|klein-warp-visible-v1'):rule;result.birdWander=true;}
 return result;
}
function chooseBiaxial(options,seed,course){
 // Random courses vary free connections even when the global shift lottery is off.
 const freeShifts=course.shifts?.enabled?course.shifts:course.order==='random'?{enabled:true,pool:['none','x','y','both']}:course.shifts;
 const result={...options,mode:'free',seed,distantKey:true},sizes=validateSizes(course.sizes),rules=validateRules(course.rules),shifts=validateShifts(freeShifts),styles=validateStyles(course.styles);
 if(course.randomGeneration||styles.enabled){let choices=course.randomGeneration?(validatePools(course.generators).biaxial??candidates('biaxial',{})):[result.terrain];if(styles.enabled)choices=choices.filter(a=>styles.pool.includes(a.startsWith('atelier-')?'grid':'dense'));if(!choices.length&&styles.enabled&&!course.randomGeneration)choices=(validatePools(course.generators).biaxial??candidates('biaxial',{})).filter(a=>styles.pool.includes(a.startsWith('atelier-')?'grid':'dense'));if(!choices.length)throw Error('クラインの壺（自由接続）の生成方式と壁配置の候補が一致しません。');result.terrain=pick(choices,seed,'|free-generator');}
 if(sizes.enabled){const choices=['12,10','24,20','32,24'].filter(size=>{const [w,h]=size.split(',').map(Number);return w>=sizes.widthMin&&w<=sizes.widthMax&&h>=sizes.heightMin&&h<=sizes.heightMax;});if(!choices.length)throw Error('クラインの壺（自由接続）のサイズ候補（12×10・24×20・32×24）が指定範囲にありません。');result.size=pick(choices,seed,'|free-size');}
 if(shifts.enabled){const type=warpPick(shifts.pool,seed,'|free-shift-v2');result.sx=type==='x'||type==='both'?String(warpPick([-4,-2,2,4],seed,'|free-x-v2')):'0';result.sy=type==='y'||type==='both'?String(warpPick([-4,-2,2,4],seed,'|free-y-v2')):'0';}
 if(rules.enabled)result.ruleMode=pick(rules.pool,seed,'|free-rule');
 return result;
}
function chooseCrossing(options,seed,course){
 const result={...options,seed},sizes=validateSizes(course.sizes),styles=validateStyles(course.styles);
 const rules=validateRules(course.rules);if(rules.enabled)result.ruleMode=pick(rules.pool,seed,'|crossing-rule-v1')==='birds'?'birds':'plain';
 if(course.randomGeneration)result.growth=pick(validatePools(course.generators).crossing??candidates('crossing',{}),seed,'|crossing-growth');
 if(styles.enabled)result.wallStyle=pick(styles.pool,seed,'|crossing-style');
 const min=result.wallStyle==='grid'?15:8;
 for(const axis of ['width','height']){
  if(sizes.enabled){const values=[];for(let n=Math.max(min,sizes[axis+'Min']);n<=Math.min(40,sizes[axis+'Max']);n++)values.push(n);if(!values.length)throw Error('立体交差のサイズ候補がありません。従来形式8〜40、アトリエ形式15〜40の範囲を含めてください。');result[axis]=pick(values,seed,'|crossing-'+axis);}
  else if(result[axis]<min)throw Error('立体交差のアトリエ形式には幅・高さ15以上が必要です。サイズ抽選か生成設定を変更してください。');
 }
 return result;
}
function chooseTriple(options,seed,course){
 if(course.forceTripleReturn){
  // This explicit override takes priority over fixed sizes and random route/hole settings.
  const even=n=>Math.max(16,Math.min(24,Math.ceil(n/2)*2));
  const dimensions=options.dimensions.map(([w,h])=>[even(w),even(h)]);
  dimensions[1][1]=Math.min(22,dimensions[1][1]);
  dimensions[1][0]=Math.max(20,dimensions[1][0],dimensions[1][1]+2);
  const forced={...options,dimensions,tripleRoute:'return',holeSize:Math.max(3,Math.min(4,options.holeSize)),holePlacement:'center',loopStyle:'meander'};
  return chooseTriple(forced,seed,{...course,forceTripleReturn:false,randomTripleRoute:false,randomTripleHole:false,sizes:{...validateSizes(course.sizes),enabled:false}});
 }
 if(course.randomTripleRoute){
  const choices=[];let failure;
  for(const tripleRoute of ['chain','return']){
   try{
    const candidate=chooseTriple({...options,tripleRoute},seed,{...course,randomTripleRoute:false});
    if(tripleRoute==='return'&&(candidate.holePlacement!=='center'||candidate.holeSize<3||candidate.dimensions.some(([w,h])=>w<16||h<16)||candidate.dimensions[1][0]<20))continue;
    choices.push(candidate);
   }catch(error){failure=error;}
  }
  if(!choices.length)throw failure??Error('3トーラスの経路候補がありません。穴・サイズの設定を確認してください。');
  return pick(choices,seed,'|triple-route');
 }
 const result={...options,seed,dimensions:options.dimensions.map(d=>[...d])},sizes=validateSizes(course.sizes),styles=validateStyles(course.styles),shifts=validateShifts(course.shifts);
 const growthChoices=course.randomGeneration?(validatePools(course.generators).triple??candidates('triple',{})):[result.growth];
 const rules=validateRules(course.rules??{enabled:course.order==='random',pool:['plain','keys','warp','birds']});
 if(rules.enabled){const pool=rules.pool;result.ruleMode=pick(pool,seed,'|triple-rule');if(result.ruleMode==='warp')result.ruleMode=warpPick(['warp','warpHidden'],seed,'|triple-warp-visibility');}
 const returning=result.tripleRoute==='return',minHole=course.randomTripleHole?(returning?3:1):result.holeSize,minimum=Math.max(returning?16:8,minHole+4);
 if(sizes.enabled){
  result.dimensions=result.dimensions.map((_,sheet)=>{
   const choices=[];
   for(let w=Math.max(minimum,sizes.widthMin);w<=Math.min(24,sizes.widthMax);w++)for(let h=Math.max(minimum,sizes.heightMin);h<=Math.min(24,sizes.heightMax);h++){
    if(w%2||h%2)continue;
    if(sheet===1&&(w<=h||w<2*minHole+6||w<(returning?20:12)))continue;
    choices.push([w,h]);
   }
   if(!choices.length)throw Error('3トーラスのサイズ候補がありません。各辺8〜24の偶数、中央Bは横長、往復配置は各辺16以上・B幅20以上が必要です。');
   return pick(choices,seed,'|triple-size-'+sheet);
  });
 }
 if(course.randomTripleHole){
  const limit=Math.min(4,...result.dimensions.map(([w,h],i)=>Math.min(h-4,i===1?Math.floor((w-6)/2):w-4)));
  result.holeSize=pick([1,2,3,4].filter(n=>n<=limit&&(!returning||n>=3)),seed,'|triple-hole');
  result.holePlacement=returning?'center':pick(['center','offset'],seed,'|triple-hole-position');
 }
 if(course.randomRimWalls??course.order==='random')result.holeRimWalls=pick([false,true],seed,'|triple-rim');
 if(course.randomTripleUnderpasses){result.floorUnderpasses=pick([0,1,2,3,4],seed,'|triple-underpasses');result.underpassShape=pick(['straight','mixed','corners'],seed,'|triple-underpass-shape');}
 const wallChoices=(styles.enabled?styles.pool:[result.wallStyle]).filter(style=>(style!=='grid'||result.dimensions.every(d=>d.every(n=>n%2===0)))&&growthChoices.some(g=>!['kruskal','wilson'].includes(g)||style==='grid'));
 if(!wallChoices.length)throw Error('3トーラスの生成方式と壁配置が合いません。Kruskal・Wilson法は格子状の壁、格子状の壁には偶数の幅・高さが必要です。');
 if(styles.enabled)result.wallStyle=pick(wallChoices,seed,'|triple-style');
 if(course.randomGeneration)result.growth=pick(growthChoices.filter(g=>!['kruskal','wilson'].includes(g)||result.wallStyle==='grid'),seed,'|triple-growth');
 if(shifts.enabled){const type=pick(shifts.pool,seed,'|triple-shift');result.shiftX=type==='x'||type==='both'?pick([-2,2],seed,'|triple-x'):0;result.shiftY=type==='y'||type==='both'?pick([-2,2],seed,'|triple-y'):0;}
 if(returning||result.shiftX||result.shiftY)result.loopStyle='meander';
 return result;
}
function chooseBranch(options,seed,course){
 const result={...options,seed},sizes=validateSizes(course.sizes),styles=validateStyles(course.styles);
 const rules=validateRules(course.rules??{enabled:course.order==='random',pool:['plain','keys','warp','birds']});
 if(rules.enabled)result.ruleMode=pick(rules.pool,seed,'|branch-rule');
 if(course.randomGeneration)result.algorithm=pick(validatePools(course.generators).branch??candidates('branch',{}),seed,'|branch-generator');
 if(styles.enabled)result.wallStyle=pick(styles.pool,seed,'|branch-style');
 if(sizes.enabled){const choices=[8,12,16,20].filter(n=>n>=sizes.widthMin&&n<=sizes.widthMax&&n>=sizes.heightMin&&n<=sizes.heightMax&&(result.route!=='return'||n>=12));if(!choices.length)throw Error('分枝迷路は幅・高さの両範囲に含まれる8・12・16・20の正方形から選びます。往復配置には12以上が必要です。');result.size=pick(choices,seed,'|branch-size');}
 return result;
}
function chooseQuarter(options,seed,course={}){
 const result={...options,seed},sizes=validateSizes(course.sizes),styles=validateStyles(course.styles);
 if(course.randomGeneration||styles.enabled){
  let choices=course.randomGeneration?(validatePools(course.generators).quarter??candidates('quarter',{})):[options.algorithm||'legacy'];
  if(styles.enabled)choices=choices.filter(a=>styles.pool.includes(a==='legacy'?'dense':'grid'));
  if(!choices.length)throw Error('回転・反転の生成方式と壁配置の候補が一致しません。従来形式には「従来の壁配置」、アトリエ形式にはそれ以外の方式を選んでください。');
  result.algorithm=pick(choices,seed,'|quarter-generator-v1');
 }
 if(sizes.enabled){const values=[12,16,20].filter(n=>n>=sizes.widthMin&&n<=sizes.widthMax&&n>=sizes.heightMin&&n<=sizes.heightMax);if(!values.length)throw Error('回転接続には幅・高さの範囲に12・16・20の正方形を含めてください。');result.size=pick(values,seed,'|quarter-size-v1');}
 const quarterRules=validateRules(course.rules);if(quarterRules.enabled)result.ruleMode=pick(quarterRules.pool,seed,'|quarter-rule-v1')==='birds'?'birds':'plain';
 if(course.randomQuarterUnderpasses){result.floorUnderpasses=pick([0,1,2,3,4],seed,'|quarter-underpasses-v1');result.underpassShape=pick(['straight','corners','mixed'],seed,'|quarter-underpass-shape-v1');}
 return result;
}
const api={chooseQuarter,chooseBranch,chooseTriple,chooseCrossing,chooseBiaxial,chooseKlein,validateEnclosureSizes,validateStyles,validateRules,chooseEnclosure,candidates,choose,validatePools,validateSizes,resize,validateTopologies,validateShifts};if(typeof module==='object')module.exports=api;else root.ExplorationGeneration=api;
})(globalThis);
