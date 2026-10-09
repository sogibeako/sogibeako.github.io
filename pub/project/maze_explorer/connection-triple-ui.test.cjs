const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const S=require('./connection-space.js');
const elements=new Map(),listeners={};
const element=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:false,textContent:'',focus(){},getContext(){return {};},addEventListener(){},setAttribute(){}});return elements.get(id);};
const context=vm.createContext({ConnectionSpace:S,document:{getElementById:element,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn},window:{addEventListener(){}},Math,Map,Set,Uint8Array});
// Drawing is excluded; exercise the actual UI handlers and reset/generation path.
vm.runInContext(fs.readFileSync(__dirname+'/connections-lab.js','utf8').replace('window.addEventListener(\'resize\',draw);draw();','window.addEventListener(\'resize\',draw);'),context);
vm.runInContext('draw=()=>{}',context);
element('underpassShape').value='straight';
function run(code){return vm.runInContext(code,context);}

element('spaceMode').value='tripleMaze';for(const [id,value] of Object.entries({tripleMazeSeed:'triple-ui',tripleMazeGrowth:'prim',tripleWallStyle:'grid',tripleUnderpasses:'2',tripleLoopStyle:'meander',tripleHoleSize:'3',tripleMazeSize:'medium',holeSize:'1'}))element(id).value=value;
element('tripleRimWalls').checked=true;run('reset()');assert.equal(run('state.world.mode'),'tripleMaze');assert.equal(run('state.world.holeSize'),3);assert.equal(run('state.world.layouts[1].width'),24);assert.equal(run('state.world.sheets'),3);
run('nextTripleMaze()');assert.equal(run('state.world.mode'),'tripleMaze');assert.equal(run('state.world.holeRimWalls'),true);
console.log('Triple maze UI: dimensions, independent hole setting and new-seed controls passed.');

// Walk real graph paths, then continue with applied settings despite pending edits.
function walkToExit(){
 const st=run('state'),w=st.world,q=[st.id],parents=new Map([[st.id,null]]);
 for(const id of q)for(let d=0;d<4;d++){const e=w.edges.get(`${id}:${d}`);if(e&&!parents.has(e.to)){parents.set(e.to,[id,d]);q.push(e.to);}}
 assert(parents.has(w.exit));const path=[];
 for(let id=w.exit;parents.get(id);){const [from,d]=parents.get(id);path.unshift(d);id=from;}
 for(const d of path)run(`move(state.frame.indexOf(${d}))`);
 assert.equal(st.id,w.exit);return path.length;
}
const event={key:'>',repeat:false,target:{closest:()=>null},preventDefault(){}};
for(const size of ['small','medium']){
 element('tripleMazeSize').value=size;run('reset()');const original=run('state.world');
 listeners.keydown(event);assert.equal(run('state.world'),original);
 const walked=walkToExit();assert(walked>0);
 listeners.keydown({...event,repeat:true});assert.equal(run('state.world'),original);
 listeners.keydown({...event,target:{closest:()=>({})}});assert.equal(run('state.world'),original);
 for(const id of ['tripleMazeSize','tripleMazeGrowth','tripleWallStyle','tripleLoopStyle'])element(id).value='pending';
 element('tripleHoleSize').value='99';element('tripleUnderpasses').value='0';element('tripleRimWalls').checked=false;element('underpassShape').value='corners';
 run('truth=true;atlasShown=true;atlasMemory.add(1);walkingBook.charts.push({});journeyMap.cells.set("old",{});regionBook.records.set(1,{})');
 listeners.keydown(event);const next=run('state.world');assert.notEqual(next.seed,original.seed);
 for(const key of ['growth','wallStyle','holeSize','holeRimWalls','floorUnderpasses','underpassShape','loopStyle'])assert.equal(next[key],original[key],key);
 assert.deepEqual(next.layouts,original.layouts);assert.equal(run('journey.number'),2);assert.equal(run('journey.steps'),walked);
 assert.equal(run('state.steps'),0);assert.equal(run('state.id'),next.start);assert.equal(run('truth||atlasShown'),false);
 assert.equal(run('atlasMemory.size+walkingBook.charts.length+journeyMap.cells.size+regionBook.records.size'),0);
 const more=walkToExit();run('advanceGeneratedMaze()');assert.equal(run('journey.number'),3);assert.equal(run('journey.steps'),walked+more);
 run('nextTripleMaze({type:"click"})');assert.equal(run('journey.number'),1);assert.equal(run('journey.steps'),0);
 const manual=run('state.world');listeners.keydown({...event,key:'n',shiftKey:false});assert.equal(run('state.world'),manual);
 listeners.keydown({...event,key:'N',shiftKey:true});assert.notEqual(run('state.world'),manual);assert.equal(run('journey.number'),1);
}
console.log('Triple continuation: two real exit walks per size, applied conditions, keyboard/button guards, fresh maps, totals and manual restart passed.');

// Separate browser slots and file restoration must keep all three sheets and continue the journey.
run('window.localStorage={data:new Map(),setItem(k,v){this.data.set(k,v)},getItem(k){return this.data.get(k)}}');
run('window.localStorage.setItem(doubleSaveKey,"existing-double-save")');
walkToExit();run('journey={number:4,steps:123};saveDoubleExploration()');
const saved=run('doubleSnapshot()'),text=run('window.localStorage.getItem(explorationSaveKey())');
assert(text.includes('connection-triple-save'));assert.equal(run('window.localStorage.getItem(doubleSaveKey)'),'existing-double-save');
run('nextTripleMaze();loadDoubleExploration()');assert.equal(run('state.id'),saved.state.id);assert.equal(run('journey.number'),4);assert.equal(run('state.world.sheets'),3);
assert.equal(element('spaceMode').value,'tripleMaze');assert.equal(element('tripleMazeSize').value,saved.controls.tripleMazeSize.value);
run('advanceGeneratedMaze()');assert.equal(run('journey.number'),5);assert.equal(run('journey.steps'),123+saved.state.steps);
(async()=>{
 await run('importDoubleExploration')({size:text.length,text:async()=>text});
 assert.equal(run('state.world.mode'),'tripleMaze');assert.equal(run('journey.number'),4);assert.equal(run('state.id'),saved.state.id);
 const before=run('state');await run('importDoubleExploration')({size:5,text:async()=>'{bad'});assert.equal(run('state'),before);
 assert.equal(run('window.localStorage.getItem(doubleSaveKey)'),'existing-double-save');
 console.log('Triple saves: independent slot, file resume, controls/counters, exit continuation and broken-file preservation passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
