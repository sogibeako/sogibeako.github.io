/* Main-game journey: generate a replacement before changing the active exploration. */
(function(root){
'use strict';
const M=typeof module==='object'?require('./core.js'):root.MazeCore;
const R=typeof module==='object'?require('./rotation-bridge.js'):root.MazeRotationBridge;
function start(options,rotation='none') {
  const game=M.createGame(M.generate({...options}));
  if(game.world.warpMode&&game.world.topology!=='torus')R.enable(game,rotation);
  game.generationOptions={...options};
  game.journey={completed:0,steps:0};
  return game;
}
function canAdvance(game) {
  return !!game.generationOptions && Number.isInteger(game.world.exit)
    && game.player.world_position===game.world.exit && (game.won||game.exploringAfterExit);
}
function courseOptions(game,seed,course) {
  if(course==='same')return {options:{...game.generationOptions,seed},rotation:game.world.rotatingWarp||'none'};
  if(!['plain','variety','torus','keys','birds'].includes(course))throw Error('未対応のコースです。');
  const rng=M.random(seed+'|'+course),pick=items=>items[Math.floor(rng()*items.length)];
  const torus=course==='torus'&&game.world.topology!=='torus';
  const [width,height]=pick(torus?[[20,16],[24,18],[30,22]]:[[21,17],[25,19],[31,23]]);
  const [shiftX,shiftY]=torus?pick([[0,0],[2,0],[0,2],[2,2],[-2,2],[2,-2]]):[0,0];
  const warpMode=course==='variety'&&!game.world.warpMode;
  const options={seed,width,height,topology:torus?'torus':'plane',algorithm:pick((torus?['dfs','prim','rooms']:['dfs','prim','division','rooms']).filter(a=>a!==game.world.algorithm)),
    loops:0,roomCount:6,roomPlacement:pick(['bsp','scatter','grid']),connectionStyle:pick(['tree','chain','ring','hub']),
    warpMode,warpStyle:pick(['pair','oneway','cycle3','cycle4']),warpCount:pick([1,2]),warpInvisible:false,
    keyDoor:course==='keys'&&!game.world.puzzle,birdMode:course==='birds'&&!game.world.birdMode,birdCount:1,teleportPolicy:'far',separateMaps:true,shiftX,shiftY,loopLearning:torus,learningLaps:3,selfVision:false};
  if(course==='keys')options.keyCount=options.keyDoor?pick([1,2,3]):1;
  return {options,rotation:warpMode?pick(['none','right','left','half','mirror','mixed']):'none'};
}
function begin(game,seed,course='same') {
  if(typeof seed!=='string'||!seed.trim())throw Error('シードを指定してください。');
  if(course==='same'&&!game.generationOptions)throw Error('通常の迷路から旅を始めてください。');
  // A fresh course starts gently and does not depend on the previous exploration.
  const choice=courseOptions(course==='same'?game:{world:{warpMode:true,topology:'torus',puzzle:true,birdMode:true}},seed,course);
  if(course!=='same'){choice.options.width=21;choice.options.height=17;}
  return start(choice.options,choice.rotation);
}
function next(game,seed,course='same') {
  if(!canAdvance(game))throw Error('出口の上から次の迷路へ進めます。');
  if(typeof seed!=='string'||!seed.trim()||seed===game.generationOptions.seed)throw Error('別のシードを指定してください。');
  const choice=courseOptions(game,seed,course);
  const result=start(choice.options,choice.rotation);
  result.journey={completed:game.journey.completed+1,steps:game.journey.steps+game.steps};
  return result;
}
function restart(game) {
  const result=M.createGame(game.world);
  if(game.world.rotatingWarp)R.enable(result,game.world.rotatingWarp);
  if(game.generationOptions)result.generationOptions={...game.generationOptions};
  if(game.journey)result.journey={...game.journey};
  return result;
}
const api={start,begin,canAdvance,next,restart};
if(typeof module==='object')module.exports=api;else root.MazeMainJourney=api;
})(typeof globalThis==='object'?globalThis:this);
