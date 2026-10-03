const assert=require('node:assert/strict'),M=require('./core.js'),O=require('./orientation.js'),R=require('./rotation-bridge.js');
for(const mode of ['right','left','half','mirror']){
 const g=M.createGame(M.createWarpDemo()),s=O.create(mode);R.enable(g,mode);
 for(const d of ['down','down','right','right','up','down']){
  assert.equal(M.move(g,R.input(g,d,false)),O.move(s,d));assert.equal(g.player.world_position,s.game.player.world_position);assert.deepEqual(g.viewFrame,s.frame);
 }
 assert.deepEqual(g.viewFrame.map(x=>x||0),O.identity());assert.equal(g.cognition.archives.length,2);assert.deepEqual(g.cognition.archives[0].viewFrame,O.identity());
 for(const d of Object.keys(M.DIRS))assert.equal(R.input(g,d,true),d);
 const c=g.cognition,frame=O.transforms[mode];g.viewFrame=[...frame];
 const nodes=new Map([[1,{x:2,y:2,world_id:36,feature:'1',terrain:1}],[2,{x:3,y:2,world_id:37,feature:'2',terrain:1}],[3,{x:2,y:4,world_id:70,feature:'3',terrain:1}],[4,{x:4,y:4,world_id:72,feature:null,terrain:0}]]);
 c.archives=[{nodes,viewFrame:O.identity(),sources:[]}];c.matchedArchives=new Set();c.memory_nodes=new Map([...nodes.values()].slice(0,3).map(n=>[`C${n.x},${n.y}`,n]));
 const before=JSON.stringify([...c.memory_nodes]);assert.deepEqual(M.matchRecordedMaps(g),[0]);assert.equal(JSON.stringify([...c.memory_nodes]),before);
 assert.deepEqual(M.matchRecordedMaps(g,true),[0]);assert.equal(c.memory_nodes.get('C4,4').terrain,0);assert.equal(c.archives[0].nodes,nodes);
}
const plain=M.createGame(M.createWarpDemo());R.enable(plain,'none');assert.equal(plain.viewFrame,undefined);
assert.throws(()=>R.enable(M.createGame({...M.createWarpDemo(),topology:'torus'}),'right'));
assert.throws(()=>R.enable(M.createGame({...M.createWarpDemo(),warpStyle:'unsupported'}),'right'));
console.log('PASS: main rotation matches lab movement/inverse returns; truth controls, archive frames, observation-based merge, immutable previews, unsupported-mode guards.');

for(const mode of ['right','left','half','mirror'])for(const algorithm of ['dfs','rooms']){
 const w=M.generate({width:31,height:23,algorithm,seed:'bridge-'+mode+algorithm,topology:'plane',warpMode:true,warpStyle:'pair',warpCount:2});const g=M.createGame(w);R.enable(g,mode);
 const target=[...w.warps.keys()][0],q=[[w.start,[]]],seen=new Set([w.start]);let path;
 for(const [id,p] of q){if(id===w.exit){path=p;break;}for(const d of Object.keys(M.DIRS)){const e=M.transition(w,{world_position:id},d);if(!e)continue;const to=w.warps.get(e.to)??e.to;if(!seen.has(to)){seen.add(to);q.push([to,[...p,d]]);}}}
 assert(path);for(const d of path){const v=R.project(g.viewFrame,...M.DIRS[d]),screen=O.direction(v);assert(M.move(g,R.input(g,screen,false)));}assert(g.won);
}
const ambiguous=M.createGame(M.createWarpDemo());R.enable(ambiguous,'right');const one=new Map([['C2,2',{x:2,y:2,world_id:36,terrain:1,feature:'1'}]]);ambiguous.cognition.archives=[{nodes:one,viewFrame:O.identity()}];ambiguous.cognition.memory_nodes=new Map(one);assert.deepEqual(M.matchRecordedMaps(ambiguous,true),[]);
console.log('PASS: eight generated multi-pair exits via subjective controls; insufficient landmark evidence is withheld.');
