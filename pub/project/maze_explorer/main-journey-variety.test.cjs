const assert=require('node:assert/strict'),M=require('./core.js'),J=require('./main-journey.js'),S=require('./main-session.js');
const plane=['dfs','prim','division','rooms','wilson','kruskal','hunt','growing','eller'],torus=plane.filter(x=>!['division','eller'].includes(x));
let count=0,saves=0;const coverage={};
for(const course of ['plain','variety','torus','keys','birds']){
 let g=J.start({width:15,height:11,seed:'coverage',algorithm:'dfs'});g.journey.size='small';const seen={plane:new Set(),torus:new Set()},saved=new Set();
 for(let i=0;i<160;i++){
  // Isolate next-floor generation; individual puzzle tests verify the actual play route.
  g.player.world_position=g.world.exit;g.won=true;
  const before=g.world.algorithm,seed='diverse-'+course+'-'+i,n=J.next(g,seed,course),again=J.next(g,seed,course);
  assert.notEqual(n.world.algorithm,before);assert.deepEqual(n.generationOptions,again.generationOptions);assert.deepEqual(n.world.cells,again.world.cells);
  const topology=n.world.topology==='torus'?'torus':'plane';seen[topology].add(n.world.algorithm);assert((topology==='torus'?torus:plane).includes(n.world.algorithm));
  if(n.world.puzzle)assert(M.solvePuzzle(n.world).solvable);
  const key=topology+':'+n.world.algorithm+':'+!!n.world.warpMode+':'+!!n.world.puzzle+':'+!!n.world.birdMode;
  if(!saved.has(key)){S.attach(n);S.act(n,'wait');const text=S.encode(n,course);assert.equal(S.encode(S.decode(text).game,course),text);saved.add(key);saves++;}
  g=n;count++;
 }
 for(const a of plane)assert(seen.plane.has(a),course+' plane '+a);
 if(course==='torus')for(const a of torus)assert(seen.torus.has(a),'torus '+a);
 coverage[course]=Object.fromEntries(Object.entries(seen).map(([k,v])=>[k,v.size]));
}
console.log(`PASS: ${count} generations; all 9 planar and 7 toroidal methods, no consecutive repeats, deterministic worlds, solvable keys and ${saves} session round trips. ${JSON.stringify(coverage)}`);
