const assert=require('node:assert/strict'),T=require('./maze-stroll.js'),W=require('./maze-wildlife.js'),S=require('./connection-space.js'),Q=require('./quarter-turn-maze.js'),Save=require('./quarter-turn-save.js');
for(const mode of ['doubleTwist','quarterCW','quarterCCW','cwTwist','ccwTwist']){
 const s=Q.create(mode,12,'walk-test'),visited=new Set([s.id]);let crosses=0;
 for(let n=0;n<2000;n++){const path=T.route(s,W.graph(s),null,s.world.exit,()=>.2);assert.ok(path?.length);const from=s.id,e=s.world.edges.get(from+':'+path[0]);assert.ok(e);if(e.kind!=='normal')crosses++;assert.ok(S.move(s,path[0],true));T.advance(s);visited.add(s.id);}
 assert.equal(T.record(s).steps,2000);assert.equal(T.route(s,W.graph(s),null,s.world.exit),null);assert.ok(crosses>0);assert.ok(visited.size>10);
}
{const s=Q.create('doubleTwist',12,'wait-test'),before=[s.id,[...s.frame],s.x,s.y];for(let i=0;i<12;i++)assert.ok(Q.move(s,4,true));assert.deepEqual([s.id,s.frame,s.x,s.y],before);assert.equal(s.steps,12);assert.equal(s.wildlife.turn,12);assert.equal(s.wildlife.food.length,1);
 const options={mode:'doubleTwist',size:12,seed:'wait-test',terrain:'maze',boundaryLinks:false},settings={render:'hybrid',truth:true,continuous:false,autoMode:'stroll',autoSpeed:'10',completed:0,totalSteps:0};const restored=Save.decode(Save.encode(options,Array(12).fill(4),s,settings));assert.equal(restored.state.steps,12);assert.deepEqual(restored.state.wildlife,s.wildlife);assert.equal(restored.crossings,0);}
{const s=S.create('torusMaze',{seed:'wait-warp'});s.features={options:{},warps:new Map([[s.id, [...s.world.cells.keys()].find(i=>s.world.cells[i]&&i!==s.id)]]),marks:new Map(),bird:null,key:null,door:null};const id=s.id;S.move(s,4);assert.equal(s.id,id);}
console.log('PASS: 5 topologies × 2000 stroll steps, boundary routes, exact end budget, wait without movement/warp, wildlife clock and wait replay.');
