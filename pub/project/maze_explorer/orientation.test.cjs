const assert=require('node:assert/strict'),O=require('./orientation.js'),M=require('./core.js');
const clean=f=>f.map(x=>x||0);
let rotation=O.identity(),count=0;
for(let i=0;i<4;i++){
 for(const mirror of [false,true]){
  const frame=mirror?O.compose(rotation,O.transforms.mirror):rotation;
  for(const dir of Object.keys(M.DIRS)){
   const state=O.create();state.frame=frame;
   const actual=O.input(state,dir);
   assert.deepEqual(clean(O.apply(O.inverse(frame),...M.DIRS[actual])),M.DIRS[dir]);
   assert.equal(O.input(state,dir,true),dir);count++;
  }
 }
 rotation=O.compose(O.transforms.right,rotation);
}
for(const mode of Object.keys(O.transforms)){
 const s=O.create(mode);
 for(const dir of ['down','down','right','right'])assert.ok(O.move(s,dir));
 assert.equal(s.crossings,1);assert.equal(s.game.player.world_position,64);
 assert.deepEqual(clean(s.frame),O.transforms[mode]);
 // A screen-up move in subjective view projects back to screen-up after crossing.
 const pos=s.game.player.world_position,v=O.apply(s.frame,0,-1);
 O.move(s,'up');assert.equal(s.game.player.world_position,pos+v[1]*17+v[0]);
 assert.equal(s.crossings,1);O.move(s,'down');
 assert.equal(s.crossings,2);assert.equal(s.game.player.world_position,54);
 assert.deepEqual(clean(s.frame),O.identity());
 assert.equal(s.game.steps,6);
 const truth=O.create(mode);for(const d of ['down','down','right','right'])O.move(truth,d,true);
 O.move(truth,'up',true);assert.equal(truth.game.player.world_position,47);
 O.move(truth,'down',true);assert.deepEqual(clean(truth.frame),O.identity());
}
const blocked=O.create();assert.equal(O.move(blocked,'left'),false);assert.equal(blocked.game.steps,0);assert.deepEqual(blocked.frame,O.identity());
console.log(`PASS: ${count} input/projection pairs across 8 frames, fixed truth controls, all four warp transforms and inverse returns, movement after transfer, no arrival bounce, blocked movement.`);

const snapshot=chart=>JSON.stringify({...chart,nodes:[...chart.nodes],visible:[...chart.visible]});
for(const mode of Object.keys(O.transforms)){
 const state=O.create(mode),initial=[...state.chart.nodes.values()];
 assert.ok(initial.every(n=>Math.hypot(n.x,n.y)<=5));
 for(const n of initial)assert.ok(M.lineOfSight(state.game.world,state.game.world.start,n.world_id));
 for(const d of ['down','down','right','right'])O.move(state,d);
 assert.equal(state.archives.length,1);assert.equal(state.archives[0].endedAt,4);
 assert.deepEqual(state.archives[0].frame,O.identity());assert.deepEqual(state.chart.frame,O.transforms[mode]);
 assert.ok([...state.archives[0].nodes.values()].some(n=>n.world_id===54&&n.feature==='O'));
 const saved=snapshot(state.archives[0]);
 O.move(state,'up');O.move(state,'down');
 assert.equal(state.archives.length,2);assert.equal(snapshot(state.archives[0]),saved);
 assert.deepEqual(state.archives[1].frame,O.transforms[mode]);
 assert.deepEqual(clean(state.chart.frame),O.identity());
 for(const chart of [...state.archives,state.chart])for(const n of chart.nodes.values()){
  const [dx,dy]=O.apply(chart.frame,n.x,n.y),origin=chart.origin;
  assert.equal((Math.floor(origin/17)+dy)*17+origin%17+dx,n.world_id);
 }
 const before=snapshot(state.chart);O.input(state,'left',true);assert.equal(snapshot(state.chart),before);
 assert.equal(O.create(mode).archives.length,0);
}
console.log('PASS: observed-only local memory, frame/world correspondence, source-pad observation, frozen historical frames/maps, inverse return, read-only projection, reset.');
