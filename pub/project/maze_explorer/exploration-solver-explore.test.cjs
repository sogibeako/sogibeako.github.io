const a=require('node:assert/strict'),P=require('./exploration-solver.js'),C=require('./core.js'),H=require('./return-enclosure.js'),L=require('./lattice-holes.js'),S=require('./connection-space.js');
function graphReach(st){const seen=new Set([st.id]),q=[st.id];for(const id of q)for(let d=0;d<4;d++){const e=st.world.edges.get(id+':'+d);if(e&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}return seen;}
let total=0;
for(let i=0;i<3;i++){
 for(const opts of [{width:15,height:13},{width:16,height:18,topology:'torus',shiftX:2,shiftY:4},{width:15,height:13,keyDoor:true,keyCount:2}]){
  const g=C.createGame(C.generate({...opts,seed:'explore-'+i})),seen=new Set([g.player.world_position]);let n=0;
  while(true){const path=P.main(g,C,seen);if(path===null)break;a(path.length);for(const d of path){if(g.won)C.continueExploring(g);a(C.move(g,d));seen.add(g.player.world_position);a(++n<30000);}}
  // Independently traverse the unlocked geometry after collecting all keys.
  const all=new Set([g.world.start]),q=[g.world.start];for(const id of q)for(const d of Object.keys(C.DIRS)){const e=C.ruleTransition(g.world,{...g.player,world_position:id},d);if(e&&!all.has(e.to)){all.add(e.to);q.push(e.to);}}
  a.deepEqual(seen,all);if(g.won)C.continueExploring(g);for(const d of P.main(g,C))a(C.move(g,d));a.equal(g.player.world_position,g.world.exit);total++;
 }
 for(const st of [H.create('explore-'+i,{shiftX:2,shiftY:-4,layout:'random',underpasses:3}),L.create({maze:true,seed:'explore-'+i,periodSize:16,shiftX:2,shiftY:4,underpasses:3,holeRimWalls:true})]){
  const all=graphReach(st),seen=new Set([st.id]);let n=0;while(true){const path=P.connected(st,seen);if(path===null)break;a(path.length);for(const d of path){a(S.move(st,st.frame.indexOf(d)));seen.add(st.id);a(++n<30000);}}
  a.deepEqual(seen,all);for(const d of P.connected(st))a(S.move(st,st.frame.indexOf(d)));a.equal(st.id,st.world.exit);total++;
 }
}
console.log(total+' mazes: every reachable floor visited, then exit; keys, dual shifts, sheets, pockets and underpasses.');

// Two distinct warp entrances share a visited landing: the second entrance remains a target.
const mock={world:{exit:2,warps:new Map([[1,2],[3,2]])},player:{world_position:0,keys:[]}};
const rules={DIRS:{right:1,left:1},ruleTransition:(w,p,d)=>{const to=({0:{right:1},2:{left:3}})[p.world_position]?.[d];return to===undefined?null:{to};}};
a.deepEqual(P.mainTargets(mock,rules),new Set([0,1,2,3]));mock.player.world_position=2;
a.deepEqual(P.main(mock,rules,new Set([0,1,2])),['left']);
a.equal(P.main(mock,rules,new Set([0,1,2,3])),null);
const directed={id:0,world:{exit:2,cells:[{},{},{}],edges:new Map([['0:0',{to:1}],['0:1',{to:2}]])}};
a.deepEqual(P.connectedTargets(directed),new Set([0,1,2]));directed.id=2;
a.equal(P.connected(directed,new Set([0,2])),null);
console.log('Warp source coverage, shared landing targets and directed unreachable remainder passed.');

// The nearest target is an irreversible exit. Visit the reversible branch first.
const branch={id:0,world:{exit:1,cells:[{},{},{}],edges:new Map([['0:0',{to:1}],['0:1',{to:2}],['2:3',{to:0}]])}};
a.deepEqual(P.connected(branch,new Set([0])),[1]);branch.id=2;
a.deepEqual(P.connected(branch,new Set([0,2])),[3,0]);
// Two irreversible branches: prefer the one retaining a route to the exit.
const fork={id:0,world:{exit:3,cells:[{},{},{},{}],edges:new Map([['0:0',{to:1}],['0:1',{to:2}],['2:1',{to:3}]])}};
a.deepEqual(P.connected(fork,new Set([0])),[1]);
const J=require('./main-journey.js');
for(const style of ['pair','oneway','cycle3','cycle4']){
 const g=J.start({seed:'ordered-'+style,algorithm:'dfs',width:15,height:13,warpMode:true,warpStyle:style,warpCount:2,warpInvisible:true},'mixed'),seen=new Set([g.player.world_position]),targets=P.mainTargets(g,C);let n=0;
 while(true){const path=P.main(g,C,seen);if(path===null)break;a(path.length);for(const d of path){if(g.won)C.continueExploring(g);a(C.move(g,d));seen.add(g.player.world_position);if(g.lastTransition.kind==='warp')seen.add(g.lastTransition.from);a(++n<20000);}}
 a.deepEqual(seen,targets);if(g.won)C.continueExploring(g);for(const d of P.main(g,C))a(C.move(g,d));a.equal(g.player.world_position,g.world.exit);
}
console.log('Reversible branch priority, exit-preserving fork choice, and four actual warp full-exploration walks passed.');
