const assert=require('node:assert/strict'),M=require('./core.js');let count=0;
for(const algorithm of ['dfs','prim','wilson','kruskal','hunt','growing','eller','division','rooms'])for(const size of [9,25])for(const loops of [0,30])for(const seed of ['warp-a','warp-b']){
 const options={algorithm,width:size,height:size,seed,loops,warpMode:true};
 const w=M.generate(options),again=M.generate(options),plain=M.generate({...options,warpMode:false});
 assert.deepEqual(w.cells,plain.cells);assert.equal(w.start,plain.start);assert.equal(w.exit,plain.exit);
 assert.deepEqual([...w.warps],[...again.warps]);assert.equal(w.warps.size,2);assert.equal(w.separateMaps,true);
 const [a,b]=[...w.warps.keys()];assert.equal(w.warps.get(a),b);assert.equal(w.warps.get(b),a);
 assert.ok(![w.start,w.exit].includes(a)&&![w.start,w.exit].includes(b));
 // Independently walk the post-entry state graph, retaining routes for real-game checks.
 const reverse=new Map(),paths=new Map([[w.start,[]]]),queue=[w.start];
 for(const id of queue)for(const [direction,[dx,dy]] of Object.entries(M.DIRS)){
  const x=id%w.width+dx,y=Math.floor(id/w.width)+dy;
  if(x<0||y<0||x>=w.width||y>=w.height)continue;
  const entered=y*w.width+x;if(!w.cells[entered])continue;
  const to=w.warps.get(entered)??entered;
  if(!reverse.has(to))reverse.set(to,[]);reverse.get(to).push(id);
  if(!paths.has(to)){paths.set(to,[...paths.get(id),direction]);queue.push(to);}
 }
 const back=[w.exit],escapes=new Set(back);for(const id of back)for(const from of reverse.get(id)||[])if(!escapes.has(from)){escapes.add(from);back.push(from);}
 assert.equal(escapes.size,w.validation.floors);assert.equal(w.validation.warp.canExit,w.validation.floors);
 assert.equal(paths.size,w.validation.floors);assert.ok(w.validation.warp.exitReachable);
 const g=M.createGame(w);for(const d of paths.get(w.exit))assert.ok(M.move(g,d));assert.ok(g.won);
 const fresh=M.createGame(w);assert.equal(fresh.cognition.archives.length,0);count++;
}
for(const extra of [{keyDoor:true},{birdMode:true}])assert.throws(()=>M.generate({...extra,warpMode:true}),/ワープ床/);
console.log(`PASS: ${count} generated warp worlds; unchanged terrain, deterministic pair, independent full reachability, real exit runs, reset and combination guards.`);
