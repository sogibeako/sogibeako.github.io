const assert=require('node:assert/strict'),S=require('./connection-space.js');
// Hand-built fork: stairs count as an ordinary step; an isolated floor is counted,
// but it cannot be reached. No generation code supplies the expected values.
const fixture={mode:'crossingMaze',cells:new Uint8Array([1,1,1,1,1,1]),start:0,exit:4,edges:new Map()};
for(const [a,d,b] of [[0,1,1],[1,1,2],[1,2,3],[3,2,4]]){fixture.edges.set(`${a}:${d}`,{to:b,kind:a===3?'stairs':'normal'});fixture.edges.set(`${b}:${(d+2)%4}`,{to:a,kind:a===3?'stairs':'normal'});}
assert.deepEqual(S.crossingStats(fixture),{floors:6,deadEnds:3,junctions:1,reachable:5,exitSteps:3});
fixture.exit=5;assert.equal(S.crossingStats(fixture).exitSteps,null);
assert.throws(()=>S.crossingStats({mode:'torus'}));
const fixed=S.crossingStats(S.generate('crossing'));
assert.equal(fixed.floors,20);assert.equal(fixed.deadEnds,0);assert.equal(fixed.junctions,0);assert.equal(fixed.reachable,20);
let count=0;
for(const growth of ['frontier','dfs','growing','hunt','prim','kruskal'])for(let seed=0;seed<10;seed++){
 const dense=S.generate('crossingMaze',{growth,seed,width:13,height:13}),grid=S.generate('crossingMaze',{growth,seed,width:25,height:25,wallStyle:'grid'});
 const before=[...dense.cells],edgeBefore=JSON.stringify([...dense.edges]),a=S.crossingStats(dense),b=S.crossingStats(grid);
 assert.equal(a.floors,a.reachable);assert.equal(b.floors,b.reachable);
 // Subdivision inserts one degree-two cell per edge, preserving all branches.
 assert.equal(a.deadEnds,b.deadEnds);assert.equal(a.junctions,b.junctions);
 assert.equal(b.floors,a.floors+dense.edges.size/2);
 assert.equal(b.exitSteps,a.exitSteps*2);
 assert.deepEqual([...dense.cells],before);assert.equal(JSON.stringify([...dense.edges]),edgeBefore);
 assert.deepEqual(S.crossingStats(dense),a);count++;
}
console.log(`Crossing statistics: explicit fork, disconnected exit, fixed cycle, ${count} subdivision and purity checks passed`);
