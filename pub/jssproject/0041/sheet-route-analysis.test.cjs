const assert=require('node:assert/strict'),A=require('./sheet-route-analysis.js'),S=require('./connection-space.js'),R=require('./return-enclosure.js');
// A first district -> B first district -> C -> B second district -> A enclosed exit.
const cells=new Uint8Array(192),edges=new Map(),ids=[0,64,128,65,1];
ids.forEach(id=>cells[id]=1);
function join(a,b){edges.set(`${a}:1`,{to:b,transform:[0,1,2,3]});edges.set(`${b}:3`,{to:a,transform:[0,1,2,3]});}
for(let i=1;i<ids.length;i++)join(ids[i-1],ids[i]);
const w={sheets:3,layouts:[0,64,128].map(offset=>({offset,width:8,height:8})),cells,edges,start:0,exit:1};
let result=A.analyze(w);
assert(result.allConnected&&result.returnRequired);
assert.deepEqual(result.regionsPerSheet,[2,2,1]);
assert.deepEqual(result.sheetRoute,[0,1,2,1,0]);
assert.deepEqual(result.requiredForExit,[1,2]);
assert.equal(result.tripleReturnCandidates.length,1);
// A shortcut in B invalidates the C requirement even though the three sheets still connect.
edges.set('64:0',{to:65});edges.set('65:2',{to:64});
result=A.analyze(w);assert.deepEqual(result.requiredForExit,[1]);assert.equal(result.tripleReturnCandidates.length,0);
let examples=0;
for(const growth of ['dfs','prim','growing'])for(const shiftX of [0,2]){
 const world=R.create('route-check',{growth,shiftX,underpasses:2,horizontalLoops:true}).world,r=A.analyze(world);
 assert(r.allConnected&&r.exitReachable&&r.returnRequired);
 assert.deepEqual(r.requiredForExit,[1]);assert.deepEqual(r.sheetRoute,[0,1,0]);examples++;
}
let triples=0,pockets=0,deep=0;
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(let seed=0;seed<3;seed++){
 const w=S.create('tripleMaze',{seed:'route-'+seed,growth,wallStyle,holeRimWalls:true,holeApproach:'screened',holePlacement:'offset',holeSize:3,dimensions:[[16,16],[24,16],[16,16]],floorUnderpasses:2,underpassShape:'mixed'}).world,r=A.analyze(w);
 assert(r.allConnected&&r.exitReachable);assert(r.requiredForExit.includes(1));
 pockets+=r.regionsPerSheet.reduce((n,k)=>n+k-1,0);deep+=r.tripleReturnCandidates.length;triples++;
}
console.log(`${examples} example-3 mazes certified A→B→A; ${triples} triple mazes checked, ${pockets} extra sheet districts, ${deep} A districts requiring both B and C. Synthetic A→B→C→B→A and shortcut rejection passed.`);
