const assert=require('node:assert/strict'),M=require('./core.js');let cases=0,warps=0;
for(const algorithm of ['dfs','prim','wilson','kruskal','hunt','growing','rooms'])for(const [shiftX,shiftY] of [[0,0],[2,0],[0,-2],[2,-2]])for(const warpStyle of ['pair','oneway','cycle3','cycle4']){
 const opts={width:16,height:16,topology:'torus',shiftX,shiftY,algorithm,warpMode:true,warpStyle,warpCount:2,loopLearning:true,learningLaps:3,seed:'periodic-warps'};
 const w=M.generate(opts),hidden=M.generate({...opts,warpInvisible:true});assert.deepEqual([...w.warps],[...hidden.warps]);
 const pads=w.warpGroups.flat(),padSet=new Set(pads);assert.equal(padSet.size,pads.length);
 for(const id of pads)for(const d of Object.keys(M.DIRS)){const e=M.transition(w,{world_position:id},d);if(e)assert.ok(!padSet.has(e.to),'no seam-adjacent pads');}
 const queue=[w.start],paths=new Map([[w.start,[]]]),touched=new Set(queue),incoming=new Map();let firstWarp;
 for(const id of queue)for(const [d,[dx,dy]] of Object.entries(M.DIRS)){
  const entered=M.periodicId(w,id%w.width+dx,Math.floor(id/w.width)+dy);if(!w.cells[entered])continue;
  const to=w.warps.get(entered)??entered;touched.add(entered);touched.add(to);
  if(!incoming.has(to))incoming.set(to,[]);incoming.get(to).push(id);
  if(!firstWarp&&w.warps.has(entered))firstWarp=[...paths.get(id),d];
  if(!paths.has(to)){paths.set(to,[...paths.get(id),d]);queue.push(to);}
 }
 assert.equal(touched.size,w.validation.floors);
 const back=[w.exit],escaped=new Set(back);for(const to of back)for(const from of incoming.get(to)||[])if(!escaped.has(from)){escaped.add(from);back.push(from);}
 assert.equal(escaped.size,paths.size);
 const g=M.createGame(w);paths.get(w.exit).forEach(d=>assert.ok(M.move(g,d)));assert.ok(g.won);
 const walk=M.createGame(w);firstWarp.forEach(d=>assert.ok(M.move(walk,d)));assert.equal(walk.lastEvent,'warp');
 assert.equal(walk.cognition.loopVisits.size,1);assert.equal(walk.cognition.lastAward.x,walk.steps);assert.equal(walk.cognition.lastAward.y,walk.steps);
 assert.equal(walk.cognition.archives.length,1);assert.equal(M.periodicId(w,walk.player.perceived_x,walk.player.perceived_y),walk.player.world_position);
 assert.equal(walk.player.orientation,1);const position=walk.player.world_position;M.waitTurn(walk);assert.equal(walk.player.world_position,position);
 warps++;cases++;
}
console.log(`PASS: ${cases} periodic warp worlds, ${warps} real transfers; all supported generators/shift axes/4 styles, seam spacing, invisible reproducibility, independent visit/escape search, actual exits, archive separation and learning reset.`);
