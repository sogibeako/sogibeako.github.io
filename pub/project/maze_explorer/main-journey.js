/* Main-game journey: generate a replacement before changing the active exploration. */
(function(root){
'use strict';
const M=typeof module==='object'?require('./core.js'):root.MazeCore;
const R=typeof module==='object'?require('./rotation-bridge.js'):root.MazeRotationBridge;
const Random=typeof module==='object'?require('./random-journey.js'):root.MazeRandomJourney;
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
function courseOptions(game,seed,course,size='standard',layout='all') {
  if(!['all','corridors','rooms'].includes(layout))throw Error('地形の選択が不正です。');
  if(!['small','standard','large'].includes(size))throw Error('迷路の規模が不正です。');
  if(course==='same')return {options:{...game.generationOptions,seed},rotation:game.world.rotatingWarp||'none'};
  if(!['plain','variety','torus','keys','birds'].includes(course))throw Error('未対応のコースです。');
  const rng=M.random(seed+'|'+course),pick=items=>items[Math.floor(rng()*items.length)];
  const torus=course==='torus'&&game.world.topology!=='torus';
  const [width,height]=pick(size==='small'?(torus?[[12,10],[14,12],[16,12]]:[[15,11],[17,13],[19,15]]):size==='large'?(torus?[[32,24],[36,28],[40,30]]:[[33,25],[37,29],[41,31]]):torus?[[20,16],[24,18],[30,22]]:[[21,17],[25,19],[31,23]]);
  const [shiftX,shiftY]=torus?pick([[0,0],[2,0],[0,2],[2,2],[-2,2],[2,-2]]):[0,0];
  const candidates=(torus?['dfs','prim','rooms','wilson','kruskal','hunt','growing']:['dfs','prim','division','rooms','wilson','kruskal','hunt','growing','eller']).filter(a=>layout==='all'||(layout==='rooms'?a==='rooms':a!=='rooms'));
  const different=candidates.filter(a=>a!==game.world.algorithm);
  const warpMode=course==='variety'&&!game.world.warpMode;
  const options={seed,width,height,topology:torus?'torus':'plane',algorithm:pick(different.length?different:candidates),
    loops:0,roomCount:6,roomPlacement:pick(['bsp','scatter','grid']),connectionStyle:pick(['tree','chain','ring','hub']),
    warpMode,warpStyle:pick(['pair','oneway','cycle3','cycle4']),warpCount:pick([1,2]),warpInvisible:false,
    keyDoor:course==='keys'&&!game.world.puzzle,birdMode:course==='birds'&&!game.world.birdMode,birdCount:1,teleportPolicy:'far',separateMaps:true,shiftX,shiftY,loopLearning:torus,learningLaps:3,selfVision:false};
  if(course==='keys')options.keyCount=options.keyDoor?pick([1,2,3]):1;
  return {options,rotation:warpMode?pick(['none','right','left','half','mirror','mixed']):'none'};
}
function begin(game,seed,course='same') {
  if(typeof seed!=='string'||!seed.trim())throw Error('シードを指定してください。');
  if(course==='same'&&course!=='random'&&!game.generationOptions)throw Error('通常の迷路から旅を始めてください。');
  // A fresh course starts gently and does not depend on the previous exploration.
  const choice=course==='random'?Random.choose(seed,game.journey?.random||Random.defaults):courseOptions(course==='same'?game:{world:{warpMode:true,topology:'torus',puzzle:true,birdMode:true}},seed,course,game.journey?.size||'standard',game.journey?.layout||'all');
  if(course!=='same'&&course!=='random'){const size=game.journey?.size||'standard';[choice.options.width,choice.options.height]=size==='small'?[15,11]:size==='large'?[33,25]:[21,17];}
  const result=start(choice.options,choice.rotation);if(game.journey?.size)result.journey.size=game.journey.size;if(game.journey?.layout)result.journey.layout=game.journey.layout;if(game.journey?.random)result.journey.random=Random.validate(game.journey.random);return result;
}
function next(game,seed,course='same') {
  if(!canAdvance(game))throw Error('出口の上から次の迷路へ進めます。');
  if(typeof seed!=='string'||!seed.trim()||seed===game.generationOptions.seed)throw Error('別のシードを指定してください。');
  const choice=course==='random'?Random.choose(seed,game.journey?.random||Random.defaults):courseOptions(game,seed,course,game.journey?.size||'standard',game.journey?.layout||'all');
  const result=start(choice.options,choice.rotation);
  result.journey={completed:game.journey.completed+1,steps:game.journey.steps+game.steps};
  if(game.journey.size)result.journey.size=game.journey.size;
  if(game.journey.layout)result.journey.layout=game.journey.layout;
  if(game.journey.random)result.journey.random=Random.validate(game.journey.random);
  const w=game.world,o=game.generationOptions;
  result.journey.history=[...(game.journey.history||[]),{number:result.journey.completed,seed:String(o.seed??w.seed),algorithm:o.algorithm??w.algorithm,topology:o.topology||'plane',width:o.width??w.width,height:o.height??w.height,steps:game.steps,clearSteps:game.firstClearSteps??game.steps,rule:w.warpMode?'warp':w.puzzle?(w.birdMode?'bird-keys':'keys'):w.birdMode?'birds':'plain'}].slice(-20);
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
