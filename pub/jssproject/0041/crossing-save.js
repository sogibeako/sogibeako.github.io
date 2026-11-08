/* Versioned replay of the two-floor experiment; prepare never mutates live play. */
(function(root){'use strict';
 const O=typeof module==='object'?require('./graph-oob.js'):root.GraphOob;
 const S=typeof module==='object'?require('./connection-space.js'):root.ConnectionSpace,G=typeof module==='object'?require('./graph-wands.js'):root.GraphWands,W=typeof module==='object'?require('./maze-wildlife.js'):root.MazeWildlife,records=new WeakMap(),move=S.move;
 function record(s,action){let r=records.get(s);if(!r){r=[];records.set(s,r);}r.push(action);}
 function enableWands(s){if(s.wands)return;G.init(s);if(s.wands)record(s,'wands');}
 function recordCast(s,spell,d){record(s,{spell,d});}
 S.move=function(s,d,truth=false){G.flush(s);if(s.world.mode==='crossingMaze'&&s.wands?.oob){const ok=O.move(s,d);if(ok)record(s,d);return ok;}const action=s.wands?.frozen||d===4?4:truth?s.frame.indexOf(d):d;const ok=move(s,d,truth);if(ok&&s.world.mode==='crossingMaze')record(s,action);return ok;};
 function returnOob(s){if(!G.returnOob(s))return false;record(s,'oob-return');return true;}
 function options(w){return {...(w.ruleMode?{ruleMode:w.ruleMode}:{}),seed:w.seed,width:w.layouts[0].width,height:w.layouts[0].height,growth:w.growth,newestBias:w.newestBias??70,wallStyle:w.wallStyle??'dense',stairPlacement:w.stairPlacement??'diagonal',floorUnderpasses:w.floorUnderpasses??0,underpassShape:w.underpassShape};}
 function snapshot(s,journey,display){G.flush(s);const moves=records.get(s)||[];if(moves.filter(d=>d!=='wands').length!==s.steps||moves.length>100001)throw Error('移動記録を保存できません。');return JSON.stringify({format:'crossing-player',version:moves.some(d=>d==='wands'||typeof d==='object'||d===4)?2:1,options:options(s.world),moves,journey,display});}
 function prepare(text){
  const fail=()=>{throw Error('立体交差の保存データが不正です。');};
  if(typeof text!=='string'||text.length>2000000)fail();const data=JSON.parse(text),o=data.options,j=data.journey,v=data.display;
  if(data.format!=='crossing-player'||![1,2].includes(data.version)||!o||typeof o.seed!=='string'||o.seed.length>200||!['dfs','prim','growing','hunt','kruskal','frontier'].includes(o.growth)||!['dense','grid'].includes(o.wallStyle)||!['diagonal','random'].includes(o.stairPlacement)||!['straight','mixed','corners'].includes(o.underpassShape))fail();
  if(!['plain','birds'].includes(o.ruleMode??'plain'))fail();
  if(![o.width,o.height].every(n=>Number.isInteger(n)&&n>=(o.wallStyle==='grid'?15:8)&&n<=40)||!Number.isFinite(o.newestBias)||o.newestBias<0||o.newestBias>100||!Number.isInteger(o.floorUnderpasses)||o.floorUnderpasses<0||o.floorUnderpasses>6)fail();
  if(!Array.isArray(data.moves)||data.moves.length>100001||!data.moves.every(d=>Number.isInteger(d)&&d>=0&&d<(data.version===2?5:4)||data.version===2&&(d==='wands'||d==='oob-return'||d&&G.spells.includes(d.spell)&&Number.isInteger(d.d)&&d.d>=0&&d.d<4))||!j||!Number.isSafeInteger(j.number)||j.number<1||!Number.isSafeInteger(j.steps)||j.steps<0||!v||typeof v.truth!=='boolean'||!['tiles','ascii','hybrid'].includes(v.render))fail();
  const state=S.create('crossingMaze',o),atlasMemory=new Set(),walkingBook={charts:[],active:-1},visited=new Set([state.id]);
  function observe(){if(state.wands?.oob)return;visited.add(state.id);S.observeAtlas(state,atlasMemory);S.observeWalkingMap(state,walkingBook,S.nearestView(state,4,{}));}
  if(data.version===2)G.setAnimator(state,(path,commit)=>{observe();commit();});
  observe();for(const d of data.moves){if(d==='wands'){if(state.wands)fail();enableWands(state);if(!state.wands)fail();continue;}if(d==='oob-return'){if(!returnOob(state))fail();observe();continue;}if(state.wands?.oob){if(!S.move(state,d))fail();continue;}if(typeof d==='object'){if(!state.wands||!G.cast(state,d.spell,d.d))fail();recordCast(state,d.spell,d.d);if(!state.wands?.oob)W.graphTick(state);}else if(!S.move(state,d,false))fail();visited.add(state.id);observe();}
  G.setAnimator(state,null);O.validate(state);
  return {state,atlasMemory,walkingBook,visited,journey:{number:j.number,steps:j.steps},display:{truth:v.truth,render:v.render}};
 }
 const api={returnOob,snapshot,prepare,options,enableWands,recordCast};if(typeof module==='object')module.exports=api;else root.CrossingSave=api;
})(typeof globalThis==='object'?globalThis:this);
