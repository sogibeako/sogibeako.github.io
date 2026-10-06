const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
function toWarp(g){const q=[[g.player.world_position,[]]],seen=new Set();for(const [id,p]of q){if(seen.has(id))continue;seen.add(id);for(const d of Object.keys(M.DIRS)){const e=M.transition(g.world,{world_position:id},d);if(!e)continue;if(g.world.warps.has(e.to))return [...p,d];q.push([e.to,[...p,d]]);}}throw Error('no warp');}
let replays=0,archives=0,matched=0;
function restore(g){const text=S.encode(g,'variety'),r=S.decode(text).game;assert.deepEqual(r.player,g.player);assert.deepEqual(r.viewFrame,g.viewFrame);assert.deepEqual(r.cognition,g.cognition);assert.deepEqual(r.archiveNotes,g.archiveNotes);assert.equal(S.encode(r,'variety'),text);replays++;return r;}
for(const warpStyle of ['pair','oneway','cycle3','cycle4'])for(const rotation of ['none','right','mirror','mixed'])for(const invisible of [false,true]){
 let g=S.attach(J.start({width:21,height:17,algorithm:'rooms',seed:'warp-save-'+warpStyle,warpMode:true,warpCount:2,warpStyle,warpInvisible:invisible,separateMaps:true},rotation));g.journey={completed:2,steps:80};
 for(const d of toWarp(g)){if(g.won)S.act(g,'continue');assert(S.act(g,'move',d));}
 assert(g.cognition.archives.length>0);assert(S.act(g,'note',0,'転移前の地図\n向きを調べる'));g=restore(g);
 const rng=M.random('walk-save');
 for(let i=0;i<180;i++){
  if(g.won)S.act(g,'continue');
  const dirs=Object.keys(M.DIRS).filter(d=>M.transition(g.world,g.player,d));S.act(g,'move',dirs[Math.floor(rng()*dirs.length)]);
  if(i%17===0){const m=S.act(g,'mark');if(m.label)S.act(g,'name',m.label,'保存の目印');matched+=S.act(g,'landmark').length+S.act(g,'recorded').length;}
  if(i===60||i===120)g=restore(g);
 }
 g=restore(g);archives+=g.cognition.archives.length;
 const corrupt=JSON.parse(S.encode(g,'variety'));corrupt.actions.push(['note',0,'x'.repeat(201)]);assert.throws(()=>S.decode(JSON.stringify(corrupt)));
}
for(const [shiftX,shiftY]of [[0,0],[2,-2]]){
 let g=S.attach(J.start({width:12,height:10,topology:'torus',shiftX,shiftY,seed:'torus-warps',warpMode:true,warpStyle:'cycle3',warpCount:1,loopLearning:true,learningLaps:3,separateMaps:true}));
 for(const d of toWarp(g)){if(g.won)S.act(g,'continue');S.act(g,'move',d);}assert(g.cognition.archives.length);S.act(g,'note',0,'周期の中で転移');restore(g);
}
assert(matched>0);
console.log(`PASS: 34 warp conditions / ${replays} replays, ${archives} archived charts and ${matched} successful matches; all connections, frames, invisibility, torus, notes and further play.`);
