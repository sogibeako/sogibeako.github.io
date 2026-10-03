const assert=require('node:assert/strict'),M=require('./core.js');let cases=0;
for(const style of ['pair','oneway','cycle3','cycle4'])for(const count of [1,4])for(const algorithm of ['dfs','prim','rooms','division'])for(const size of [9,25]){
 const options={width:size,height:size,algorithm,seed:'warp-options',warpMode:true,warpStyle:style,warpCount:count};
 const w=M.generate(options),hidden=M.generate({...options,warpInvisible:true});
 assert.deepEqual([...w.warps],[...hidden.warps]);assert.ok(w.warpCount>=1&&w.warpCount<=count);
 const length=style==='cycle3'?3:style==='cycle4'?4:2;
 assert.equal(w.warpGroups.length,w.warpCount);assert.equal(w.warps.size,w.warpCount*(style==='oneway'?1:length));
 const g=M.createGame(w),h=M.createGame(hidden);
 for(const pads of w.warpGroups){assert.equal(pads.length,length);pads.forEach((id,i)=>{
  if(style==='oneway'&&i===1){assert.ok(!w.warps.has(id));return;}
  assert.equal(w.warps.get(id),pads[(i+1)%length]);assert.equal(M.featureAt(g,id),'O');assert.equal(M.featureAt(h,id),null);
 });}
 assert.ok(!M.exportTrueMap(h).includes('O'));
 // Independently explore resting positions and tiles entered before automatic teleport.
 const paths=new Map([[w.start,[]]]),queue=[w.start],touched=new Set(queue),reverse=new Map();
 for(const id of queue)for(const [d,[dx,dy]] of Object.entries(M.DIRS)){
  const x=id%w.width+dx,y=Math.floor(id/w.width)+dy;if(x<0||y<0||x>=w.width||y>=w.height)continue;
  const entered=y*w.width+x;if(!w.cells[entered])continue;
  const to=w.warps.get(entered)??entered;touched.add(entered);touched.add(to);
  if(!reverse.has(to))reverse.set(to,[]);reverse.get(to).push(id);
  if(!paths.has(to)){paths.set(to,[...paths.get(id),d]);queue.push(to);}
 }
 assert.equal(touched.size,w.validation.floors);
 const back=[w.exit],escaped=new Set(back);for(const to of back)for(const from of reverse.get(to)||[])if(!escaped.has(from)){escaped.add(from);back.push(from);}
 assert.equal(escaped.size,paths.size);
 paths.get(w.exit).forEach(d=>M.move(g,d));assert.ok(g.won);
 const landing=w.warpGroups[0][1],walk=M.createGame(hidden);paths.get(landing).forEach(d=>M.move(walk,d));
 const position=walk.player.world_position;M.waitTurn(walk);assert.equal(walk.player.world_position,position);
 // Re-enter each arrival pad through a real adjacent step; chains advance exactly once.
 const cycle=M.createGame(hidden);let at=w.warpGroups[0][1];
 cycle.player.world_position=at;cycle.player.perceived_x=at%w.width;cycle.player.perceived_y=Math.floor(at/w.width);
 for(let hop=0;hop<length;hop++){
  const direction=Object.keys(M.DIRS).find(d=>{const e=M.transition(w,cycle.player,d);return e&&e.to!==w.exit;});
  const reverseDirection={up:'down',down:'up',left:'right',right:'left'}[direction];
  M.move(cycle,direction);M.move(cycle,reverseDirection);
  at=w.warps.get(at)??at;assert.equal(cycle.player.world_position,at);
  assert.ok([...cycle.cognition.memory_nodes.values()].every(n=>n.feature!=='O'));
 }
 cases++;
}
for(const extra of [{warpCount:0},{warpCount:5},{warpCount:1.5},{warpStyle:'invalid'}])assert.throws(()=>M.generate({warpMode:true,...extra}),/不正/);
console.log(`PASS: ${cases} warp configurations; cycles/direction, multiple groups, invisible text, unchanged hidden placement, independent reachability/escape, actual wins, no wait retrigger, invalid options.`);
