const assert=require('node:assert/strict'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),Save=require('./lattice-holes-save.js');
let cases=0;
function move(st,d){R.start(st);const moved=S.move(st,st.frame.indexOf(d));if(moved)R.observe(st,S.groundSheet(st.world,st.id));return moved;}
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid'])for(const [sx,sy] of [[2,2],[-4,2],[0,-2]]){
 const st=H.create({maze:true,periodSize:20,underpasses:3,underpassShape:'mixed',growth,wallStyle,seed:'loops-'+cases,shiftX:sx,shiftY:sy});
 for(const route of st.world.guaranteedLoops){
  // Any initial point and reflected display frame must give the same period evidence.
  st.id=route.start;st.frame=[0,3,2,1];delete st.loopExperience;R.setThreshold(st,3);
  const cut=Math.floor(route.directions.length/3);for(const d of route.directions.slice(0,cut))assert(move(st,d));delete st.loopExperience;
  const rotated=[...route.directions.slice(cut),...route.directions.slice(0,cut)],key=`${route.sheet}:${route.axis==='a'?'1:0':'0:1'}`;
  for(let n=1;n<=3;n++){for(const d of rotated)assert(move(st,d));assert.equal(st.loopExperience.counts.get(key),n);const evidence=R.knowledge(st).find(p=>p.key===key);assert.equal(evidence.learned,n===3);assert.equal(evidence.remaining,3-n);assert(!R.knowledge(st).some(p=>p.sheet!==route.sheet&&p.learned));}
  R.setThreshold(st,5);assert(!R.knowledge(st).find(p=>p.key===key).learned);
  for(const d of [...rotated].reverse().map(d=>(d+2)%4))assert(move(st,d));assert.equal(st.loopExperience.counts.get(key),4);assert(!R.knowledge(st).find(p=>p.key===key).learned);
  for(const d of rotated)assert(move(st,d));assert(R.knowledge(st).find(p=>p.key===key).learned);
  R.setThreshold(st,0);assert(!R.knowledge(st).some(p=>p.learned));R.setThreshold(st,5);assert(R.knowledge(st).find(p=>p.key===key).learned);
  const counts=[...st.loopExperience.counts];const d=rotated[0];assert(move(st,d));assert(move(st,(d+2)%4));assert.deepEqual([...st.loopExperience.counts],counts);
  const blocked=[0,1,2,3].find(d=>!st.world.edges.has(`${st.id}:${d}`));if(blocked!==undefined){const before=JSON.stringify(st.loopExperience.path);assert(!move(st,blocked));assert.equal(JSON.stringify(st.loopExperience.path),before);}
  R.observe(st,route.sheet);assert.deepEqual([...st.loopExperience.counts],counts);
  const snapshot={state:st,book:{charts:[],active:-1},journey:{number:1,steps:0},controls:{}},loaded=Save.decode(Save.encode(snapshot)).snapshot.state;
  assert.deepEqual(loaded.loopExperience,st.loopExperience);assert.deepEqual(R.knowledge(loaded),R.knowledge(st));assert.equal(loaded.loopThreshold,5);assert.throws(()=>Save.decode(Save.encode({...snapshot,state:{...st,loopThreshold:2}})));
  const half=Math.floor(rotated.length/2);for(const d of rotated.slice(0,half))assert(move(st,d));const resumed=Save.decode(Save.encode({...snapshot,state:st})).snapshot.state;
  for(const d of rotated.slice(half)){assert(move(st,d));assert(move(resumed,d));}assert.deepEqual(resumed.loopExperience,st.loopExperience);
 }
 const throat=[...st.world.edges].find(([,e])=>e.kind==='throat');st.id=Number(throat[0].split(':')[0]);delete st.loopExperience;assert(move(st,Number(throat[0].split(':')[1])));assert.equal(st.loopExperience.counts.size,0);assert.equal(st.loopExperience.path.length,1);
 // Entering either layer of a crossing is not returning to the other layer.
 for(const p of st.world.passages||[]){st.id=p.horizontal;delete st.loopExperience;R.start(st);st.id=p.vertical;st.steps++;st.last={from:p.horizontal,worldDirection:1,kind:'underpass',changed:false};R.observe(st,p.baseSheet);assert.equal(st.loopExperience.path.length,2);assert.equal(st.loopExperience.counts.size,0);}
 cases++;
}
console.log(`${cases} worlds / 96 period routes: shifted starting points, three laps, reverse laps, reflected controls, backtracking, blocked moves, hole resets, distinct crossing lanes and mid-loop save/resume passed.`);

const separate=H.create();R.start(separate);separate.loopExperience.counts.set('0:1:1',3);const known=R.knowledge(separate);assert.equal(known.length,1);assert(known[0].learned);assert.equal(known[0].key,'0:1:1');assert.throws(()=>R.setThreshold(separate,2));console.log('3/5-lap thresholds, OFF/re-evaluation, per-sheet and composite-period isolation, threshold validation and saved knowledge passed.');
