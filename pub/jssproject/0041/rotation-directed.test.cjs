const assert=require('node:assert/strict'),M=require('./core.js'),O=require('./orientation.js'),R=require('./rotation-bridge.js');
function routeToPad(w,start,pad){const q=[[start,[]]],seen=new Set([start]);for(const [id,path] of q)for(const d of Object.keys(M.DIRS)){const e=M.transition(w,{world_position:id},d);if(!e)continue;if(e.to===pad)return [...path,d];const to=w.warps.get(e.to)??e.to;if(!seen.has(to)){seen.add(to);q.push([to,[...path,d]]);}}throw Error('unreachable pad');}
let moves=0,transfers=0;
for(const warpStyle of ['oneway','cycle3','cycle4'])for(const mode of ['right','mirror','mixed'])for(const warpInvisible of [false,true])for(const seed of ['blend-a','blend-b']){
 const s=O.create(mode,{layout:'rooms',warpStyle,warpCount:2,seed,warpInvisible});s.game.world.exit=-1;
 const g=M.createGame({...s.game.world,separateMaps:true});R.enable(g,mode);
 for(const pad of g.world.warps.keys())for(const d of routeToPad(g.world,g.player.world_position,pad)){
  const screen=O.direction(R.project(g.viewFrame,...M.DIRS[d]));
  assert(M.move(g,R.input(g,screen,false)));assert(O.move(s,screen));moves++;
  assert.equal(g.player.world_position,s.game.player.world_position);assert.deepEqual(g.viewFrame,s.frame);assert.equal(g.player.direction,s.game.player.direction);
  if(g.lastEvent==='warp'){const pos=g.player.world_position,frame=[...g.viewFrame],count=g.cognition.archives.length;M.waitTurn(g);assert.equal(g.player.world_position,pos);assert.deepEqual(g.viewFrame,frame);assert.equal(g.cognition.archives.length,count);transfers++;assert.deepEqual(g.cognition.archives.at(-1).viewFrame,s.archives.at(-1).frame);}
  for(const direction of Object.keys(M.DIRS))assert.equal(R.input(g,direction,true),direction);
 }
 if(warpInvisible)for(const a of g.cognition.archives)assert([...a.nodes.values()].every(n=>n.feature!=='O'));
 const reset=M.createGame(g.world);R.enable(reset,g.world.rotatingWarp);assert.deepEqual(reset.viewFrame,O.identity());assert.equal(reset.cognition.archives.length,0);
 assert.equal(reset.world.rotatingWarp,mode);
}
console.log(`PASS: 36 directed worlds, ${moves} moves and ${transfers} transfers agree with lab; original frames, hidden pads, truth controls and restart.`);
