const a=require('node:assert/strict'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');
const snapshot=state=>({state,journey:{number:1,steps:0},journeyMap:{cells:new Map()},regionBook:{records:new Map(),owners:new Map(),nextNumber:1},atlasMemory:new Set(),walkingBook:{charts:[],active:-1},controls:{}});
let count=0;for(const growth of ['dfs','prim','growing','walls','kruskal','hunt','wilson','rooms'])for(const tripleRoute of ['chain','return'])for(const [shiftX,shiftY]of [[0,0],[2,-2]]){
 let s=S.create('tripleMaze',{ruleMode:shiftX?'warpHiddenKeys':'warpKeys',growth,tripleRoute,returnShape:'irregular',wallStyle:'grid',dimensions:[[20,20],[24,20],[20,20]],holeSize:3,holeRimWalls:true,floorUnderpasses:2,underpassShape:'mixed',shiftX,shiftY,seed:'warp-'+count});
 const initial=S.decodeSave(S.encodeSave(snapshot(s))).snapshot.state;a.equal(initial.features.hasKey,false);a.equal(initial.world.ruleMode,s.world.ruleMode);a.deepEqual(initial.features,s.features);
 const distance=P.route({...s,id:s.features.key,features:{...s.features,hasKey:true}},id=>id===s.world.exit);a(distance.length>=8,'key distance including warps');a.equal(P.route(s,id=>id===s.world.exit)!==null,true);
 const visited=new Set([s.id]),used=new Set(),targets=P.targets(s);let steps=0;const walk=path=>{a(path?.length);for(const d of path){const counts=JSON.stringify(S.tripleLoopProgress(s).counts);a(S.move(s,d));visited.add(s.id);if(s.last.kind==='warp'){visited.add(s.last.from);used.add(s.last.from);a.equal(JSON.stringify(S.tripleLoopProgress(s).counts),counts,'warp must not teach a loop');}a(++steps<20000);}};
 while([...targets].some(id=>!visited.has(id)))walk(P.route(s,id=>!visited.has(id)));
 while(P.warpPending(s).length)walk(P.explore(s,visited));a.equal(used.size,s.features.warps.size);
 for(const pair of s.world.guaranteedLoops)for(const axis of ['horizontal','vertical']){const c=pair[axis],path=P.route(s,id=>id===c.start);if(path.length)walk(path);for(let n=0;n<3;n++)walk(c.directions.map(d=>s.frame.indexOf(d)));}
 a(S.tripleLoopProgress(s).counts.flat().every(n=>n===3));const data=S.encodeSave(snapshot(s)),saved=S.decodeSave(data).snapshot.state;a.deepEqual(saved.features,s.features);a.deepEqual(saved.tripleLearning,s.tripleLearning);s=saved;const exit=P.route(s,id=>id===s.world.exit);if(exit.length)walk(exit);a.equal(s.id,s.world.exit);a(s.features.hasKey);a.equal(visited.size,targets.size);count++;
}
console.log(count+' triple keys + warp worlds: all generators, return/chain, shifts, full floors, transfer learning exclusion, six loops, save/resume and exit.');

const G=require('./exploration-generation.js');for(const ruleMode of ['warpKeys','warpHiddenKeys'])a.equal(G.chooseTriple({ruleMode,dimensions:[[20,20],[24,20],[20,20]],growth:'prim',wallStyle:'grid'},'keep',{rules:{enabled:false,pool:['plain']}}).ruleMode,ruleMode);
