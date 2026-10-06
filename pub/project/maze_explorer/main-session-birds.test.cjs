const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
const snap=({generationOptions,...g})=>JSON.stringify(g,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
let replays=0,teleports=0,archives=0;const states=new Set(),counts=new Set();
function restore(g){const text=S.encode(g,'birds'),r=S.decode(text).game;assert.equal(snap(r),snap(g));assert.equal(S.encode(r,'birds'),text);assert.equal(r.bird,r.birds[0]);replays++;return r;}
function towardBird(g){const q=[[g.player.world_position,[]]],seen=new Set();for(const [id,path]of q){if(seen.has(id))continue;seen.add(id);if(id===g.bird.position)return path[0];for(const d of Object.keys(M.DIRS)){const e=M.ruleTransition(g.world,{...g.player,world_position:id},d);if(e)q.push([e.to,[...path,d]]);}}}
for(const type of ['plane','keys','torus'])for(const birdCount of [1,2])for(const teleportPolicy of ['far','unseen','known'])for(const separateMaps of [false,true]){
 const options={width:type==='torus'?20:25,height:type==='torus'?16:19,algorithm:'rooms',seed:'bird-save-'+type,birdMode:true,birdCount,teleportPolicy,separateMaps,keyDoor:type==='keys',keyCount:2,topology:type==='torus'?'torus':'plane',shiftX:type==='torus'?2:0,shiftY:type==='torus'?-2:0,loopLearning:type==='torus',learningLaps:3};
 const g=S.attach(J.start(options));counts.add(g.birds.length);assert(g.birds.length<=birdCount);let r=restore(g);const rng=M.random('bird-walk');
 // Compare the uninterrupted game with repeated restores, including future random choices.
 for(let i=0;i<240;i++){
  const actions=[];if(g.won)actions.push(['continue']);
  const dirs=Object.keys(M.DIRS).filter(d=>M.ruleTransition(g.world,g.player,d));
  const d=i<100?towardBird(g):dirs[Math.floor(rng()*dirs.length)];
  actions.push(d&&i%5!==0?['move',d]:['wait']);
  if(i%23===0)actions.push(['mark'],['landmark'],['recorded']);
  for(const a of actions){S.act(g,...a);S.act(r,...a);}
  if(g.cognition.archives.length&&i%23===0){const a=['note',g.cognition.archives.length-1,'鳥人間との遭遇記録'];S.act(g,...a);S.act(r,...a);}
  assert.equal(snap(r),snap(g));for(const b of g.birds){states.add(b.state);if(b.cooldown)states.add('COOLDOWN');}
  if(i%60===59)r=restore(r);
 }
 teleports+=g.teleports;archives+=g.cognition.archives.length;
}
assert(counts.has(2));assert(teleports>0);assert(archives>0);for(const state of ['WANDER','CHASE','SEARCH','COOLDOWN'])assert(states.has(state),state);
console.log(`PASS: 36 bird conditions / ${replays} replays; ${teleports} contacts and ${archives} archived charts; all AI states and identical future movement after restoring.`);

