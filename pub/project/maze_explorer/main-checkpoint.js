/* Entrance checkpoints intentionally exclude in-maze exploration state. */
(function(root){
'use strict';
const J=typeof module==='object'?require('./main-journey.js'):root.MazeMainJourney;
const Random=typeof module==='object'?require('./random-journey.js'):root.MazeRandomJourney;
const defaults={width:31,height:23,algorithm:'dfs',seed:'first-walk',loops:0,newestBias:70,roomCount:8,roomPlacement:'bsp',connectionStyle:'tree',warpMode:false,warpStyle:'pair',warpCount:1,warpInvisible:false,keyDoor:false,keyCount:1,birdMode:false,birdCount:1,teleportPolicy:'far',separateMaps:false,topology:'plane',loopLearning:false,learningLaps:5,selfVision:false,shiftX:0,shiftY:0};
const courses=['same','plain','variety','torus','keys','birds','random'];
function options(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('生成条件が不正です。');
 const out={...defaults};
 for(const k of Object.keys(input)){
  if(!Object.hasOwn(defaults,k)||typeof input[k]!==typeof defaults[k])throw Error('生成条件の項目・型が不正です。');
  if(typeof input[k]==='number'&&!Number.isFinite(input[k]))throw Error('数値が不正です。');
  out[k]=input[k];
 }
 if(!out.seed.length||out.seed.length>100||![3,5].includes(out.learningLaps))throw Error('シード・学習条件が不正です。');
 return out;
}
function check(world){
 const text=JSON.stringify(world,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:ArrayBuffer.isView(v)?Array.from(v):v);
 let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);
 return (h>>>0).toString(16);
}
function encode(game,course){
 if(!game.generationOptions||!game.journey)throw Error('実験用の部屋は記録できません。');
 if(!courses.includes(course))throw Error('コースが不正です。');
 return JSON.stringify({format:'maze-entrance-checkpoint',version:1,options:options(game.generationOptions),rotation:game.world.rotatingWarp||'none',course,journey:{...game.journey},check:check(game.world)},null,2);
}
function decode(text){
 if(typeof text!=='string'||text.length>20000)throw Error('記録は20,000文字以内にしてください。');
 let data;try{data=JSON.parse(text);}catch{throw Error('JSON形式の記録ではありません。');}
 if(data?.format!=='maze-entrance-checkpoint'||data.version!==1)throw Error('対応する入口再開用の記録ではありません。');
 const j=data.journey;
 if(!courses.includes(data.course)||!['none','right','left','half','mirror','mixed'].includes(data.rotation)||!j||![j.completed,j.steps].every(n=>Number.isSafeInteger(n)&&n>=0)||typeof data.check!=='string')throw Error('コース・累計・向きの記録が不正です。');
 if(j.size!==undefined&&!['small','standard','large'].includes(j.size))throw Error('迷路の規模が不正です。');
 if(j.layout!==undefined&&!['all','corridors','rooms'].includes(j.layout))throw Error('地形の選択が不正です。');
 const random=j.random===undefined?undefined:Random.validate(j.random);
 let history;
 if(j.history!==undefined){
  if(!Array.isArray(j.history)||j.history.length>20)throw Error('踏破履歴が不正です。');
  history=j.history.map((h,i)=>{
   if(!h||typeof h.seed!=='string'||!h.seed.length||h.seed.length>100||!['dfs','prim','division','rooms','wilson','kruskal','hunt','growing','eller'].includes(h.algorithm)||!['plane','torus'].includes(h.topology)||!['plain','warp','keys','birds','bird-keys'].includes(h.rule)||![h.number,h.width,h.height,h.steps,h.clearSteps].every(n=>Number.isSafeInteger(n)&&n>=0)||h.number<1||h.number>j.completed||(i&&h.number<=j.history[i-1].number)||h.clearSteps>h.steps||h.width<8||h.height<8||h.width>101||h.height>101)throw Error('踏破履歴が不正です。');
   return {number:h.number,seed:h.seed,algorithm:h.algorithm,topology:h.topology,width:h.width,height:h.height,steps:h.steps,clearSteps:h.clearSteps,rule:h.rule};
  });
 }
 const o=options(data.options);
 if(data.rotation!=='none'&&(!o.warpMode||o.topology==='torus'))throw Error('向きの設定と生成条件が一致しません。');
 const game=J.start(o,data.rotation);
 if(check(game.world)!==data.check)throw Error('同じ迷路を再現できません。この版と互換性のある記録が必要です。');
 game.journey={completed:j.completed,steps:j.steps};
 if(j.size!==undefined)game.journey.size=j.size;
 if(j.layout!==undefined)game.journey.layout=j.layout;
 if(history!==undefined)game.journey.history=history;
 if(random!==undefined)game.journey.random=random;
 // Preserve the order used by the replay fingerprint, including preferences added mid-journey.
 const validated=game.journey;
 game.journey=Object.fromEntries(Object.keys(j).filter(k=>Object.hasOwn(validated,k)).map(k=>[k,validated[k]]));
 return {game,course:data.course};
}
const api={encode,decode};if(typeof module==='object')module.exports=api;else root.MazeCheckpoint=api;
})(typeof globalThis==='object'?globalThis:this);
