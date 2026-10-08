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
for(const style of ['dense','grid']){
 element('spaceMode').value='crossingMaze';
 run(`state=S.create('crossingMaze',{width:23,height:25,seed:'exit-check',growth:'growing',newestBias:35,wallStyle:'${style}',stairPlacement:'random',floorUnderpasses:2,underpassShape:'mixed'})`);
 const original=run('state.world');
 run('advanceGeneratedMaze()');assert.equal(run('state.world'),original,'off-exit must not regenerate');
 for(const id of ['crossingWidth','crossingHeight','crossingBias','floorUnderpassesCount'])element(id).value='99';
 element('crossingGrowth').value='dfs';element('crossingWallStyle').value='grid';element('crossingStairs').value='diagonal';element('floorUnderpassesEnabled').checked=false;
 run('state.id=state.world.exit;truth=true;atlasShown=true;advanceGeneratedMaze()');
 const world=run('state.world');assert.notEqual(world.seed,original.seed);
 for(const key of ['growth','newestBias','stairPlacement','floorUnderpasses','underpassShape'])assert.equal(world[key],original[key],key);
 assert.equal(world.wallStyle??'dense',style);assert.equal(world.layouts[0].width,23);assert.equal(world.layouts[0].height,25);
 assert.equal(run('state.steps'),0);assert.equal(run('state.id'),world.start);assert.equal(run('truth||atlasShown'),false);
 assert.equal(run('walkingBook.charts.length'),0);
 // Repeat and text-entry guards must not advance even at the exit.
 run('state.id=state.world.exit');
 const event={key:'>',repeat:true,target:{closest:()=>null},preventDefault(){}};
 listeners.keydown(event);assert.equal(run('state.world'),world);
 listeners.keydown({...event,repeat:false,target:{closest:()=>({})}});assert.equal(run('state.world'),world);
 listeners.keydown({...event,repeat:false});assert.notEqual(run('state.world'),world);
}
element('spaceMode').value='underpassMaze';
run("state=S.create('underpassMaze',{width:21,height:23,seed:'exit-check',growth:'dfs',count:3,variety:'mixed',route:'required'});state.id=state.world.exit;advanceGeneratedMaze()");
assert.equal(run('state.world.mode'),'underpassMaze');assert.equal(run('state.steps'),0);assert.equal(run('state.world.layouts[0].height'),23);
console.log('Generated maze exit: settings retained, off-exit/input/repeat guards, fresh exploration and underpass regression passed.');

// Journey totals count successful exit transitions only, including extra exploration.
element('spaceMode').value='crossingMaze';
run("state=S.create('crossingMaze',{seed:'journey-test'});journey={number:1,steps:0};state.steps=17;advanceGeneratedMaze()");
assert.equal(run('journey.number'),1);assert.equal(run('journey.steps'),0);
run('state.id=state.world.exit;advanceGeneratedMaze()');
assert.equal(run('journey.number'),2);assert.equal(run('journey.steps'),17);
run('state.steps=23;state.id=state.world.exit;advanceGeneratedMaze()');
assert.equal(run('journey.number'),3);assert.equal(run('journey.steps'),40);
const beforeFailure=run('state');
element('crossingWidth').value='999';run('reset(true)');
assert.equal(run('state'),beforeFailure);assert.equal(run('journey.number'),3);assert.equal(run('journey.steps'),40);
element('crossingWidth').value='8';
// Click handlers receive Event objects, which must not be mistaken for continuation.
run('nextCrossing({type:"click"})');
assert.equal(run('journey.number'),1);assert.equal(run('journey.steps'),0);
run('journey={number:4,steps:55};reset()');
assert.equal(run('journey.number'),1);assert.equal(run('journey.steps'),0);
console.log('Journey counters: two exits, blocked/failed generation, manual restart and button event reset passed.');

element('spaceMode').value='doubleMaze';
for(const [id,value] of Object.entries({doubleWallStyle:'grid',doubleUnderpasses:'3',doubleMazeSeed:'size-ui',doubleMazeGrowth:'dfs',doubleLoopStyle:'meander',doubleAWidth:'12',doubleAHeight:'12',doubleBWidth:'16',doubleBHeight:'12',doubleHoleSize:'3',holeSize:'2'}))element(id).value=value;
run('reset()');assert.equal(run('state.world.holeSize'),3);assert.equal(run('state.world.layouts[1].width'),16);
console.log('Double maze UI keeps its own hole-size setting.');

assert.equal(run('state.world.wallStyle'),'grid');assert.equal(run('state.world.floorUnderpasses'),3);

element("doubleRimWalls").checked=true;run("reset()");assert.equal(run("state.world.holeRimWalls"),true);

// Double torus exit must retain applied settings, not unsubmitted form changes.
run("state=S.create('doubleMaze',{seed:'exit-double',growth:'growing',wallStyle:'grid',dimensions:[[20,20],[24,18]],holeSize:3,holeRimWalls:true,floorUnderpasses:3,underpassShape:'corners',loopStyle:'straight'});journey={number:1,steps:0}");
const doubleOriginal=run('state.world');
run('advanceGeneratedMaze()');assert.equal(run('state.world'),doubleOriginal);
for(const id of ['doubleAWidth','doubleHoleSize','doubleUnderpasses'])element(id).value='99';
element('doubleRimWalls').checked=false;
run('state.id=state.world.exit;state.steps=123;journeyMap.cells.set("old",{});regionBook.records.set(1,{});advanceGeneratedMaze()');
const doubleNext=run('state.world');assert.notEqual(doubleNext.seed,doubleOriginal.seed);
for(const key of ['growth','wallStyle','holeSize','holeRimWalls','floorUnderpasses','underpassShape','loopStyle'])assert.equal(doubleNext[key],doubleOriginal[key]);
assert.deepEqual(doubleNext.layouts,doubleOriginal.layouts);assert.equal(run('journey.number'),2);assert.equal(run('journey.steps'),123);
assert.equal(run('journeyMap.cells.size+regionBook.records.size+walkingBook.charts.length'),0);
const beforeRepeat=run('state.world');listeners.keydown({key:'>',repeat:true,target:{closest:()=>false},preventDefault(){}});assert.equal(run('state.world'),beforeRepeat);
run('state.id=state.world.exit;state.steps=7');listeners.keydown({key:'>',repeat:false,target:{closest:()=>false},preventDefault(){}});assert.equal(run('journey.number'),3);assert.equal(run('journey.steps'),130);
run('nextDoubleMaze({type:"click"})');assert.equal(run('journey.number'),1);assert.equal(run('journey.steps'),0);
console.log('Double torus exit: applied settings, keyboard continuation, counters, fresh maps and manual reset passed.');

element('doubleRandomNext').checked=true;
for(const id of ['randomDoubleGeneration','randomDoubleSize','randomDoubleHole','randomDoubleLoop','randomDoubleUnderpasses'])element(id).checked=true;
const randomSource=run('state.world');run('state.id=state.world.exit;state.steps=11;advanceGeneratedMaze()');const randomWorld=run('state.world');
const expected=S.randomDoubleOptions(randomWorld.seed,randomSource,{generation:true,size:true,hole:true,loop:true,underpasses:true});
for(const key of ['growth','wallStyle','holeSize','holeRimWalls','loopStyle','underpassShape'])assert.equal(randomWorld[key],expected[key]);
assert.equal(randomWorld.floorUnderpasses??0,expected.floorUnderpasses);assert.equal(run('journey.number'),2);assert.equal(run('journey.steps'),11);
for(const [i,l] of randomWorld.layouts.slice(0,2).entries())assert.deepEqual([l.width,l.height],expected.dimensions[i]);
const manualSource=run('state.world');run('nextDoubleMaze()');for(const key of ['growth','wallStyle','holeSize','holeRimWalls','loopStyle','underpassShape'])assert.equal(run('state.world')[key],manualSource[key]);
console.log('Random next-maze UI: exit-only randomization, counters and manual regeneration passed.');

run('window.localStorage={saved:null,setItem(k,v){this.saved=v},getItem(){return this.saved}}');
run('state.steps=42;journey={number:3,steps:90};saveDoubleExploration()');
const savedWorld=run('state.world');assert(run('window.localStorage.saved').includes('connection-double-save'));
run('nextDoubleMaze();loadDoubleExploration()');assert.equal(run('state.steps'),42);assert.equal(run('journey.number'),3);assert.equal(run('journey.steps'),90);assert.deepEqual(JSON.parse(S.encodeSave(run('state.world'))).snapshot,JSON.parse(S.encodeSave(savedWorld)).snapshot);
const beforeBadLoad=run('state');run('window.localStorage.saved="broken";loadDoubleExploration()');assert.equal(run('state'),beforeBadLoad);
run('window.localStorage.setItem=()=>{throw Error("quota")};saveDoubleExploration()');assert(element('doubleSaveStatus').textContent.includes('保存できません'));
console.log('Save UI: restore exploration and counters, malformed-save preserves current play, storage failure reported.');

(async()=>{
 const text=run('S.encodeSave(doubleSnapshot())'),stored=run('window.localStorage.saved');run('state.steps=999');
 context.testFile={size:text.length,text:async()=>text};await run('importDoubleExploration(testFile)');assert.equal(run('state.steps'),42);assert.equal(run('window.localStorage.saved'),stored);
 const before=run('state');context.testFile={size:1,text:async()=>'{broken'};await run('importDoubleExploration(testFile)');assert.equal(run('state'),before);
 context.testFile={size:20000001,text:async()=>{throw Error('must not read')}};await run('importDoubleExploration(testFile)');assert.equal(run('state'),before);assert(element('doubleSaveStatus').textContent.includes('20MB'));
 await run('importDoubleExploration(null)');assert.equal(run('state'),before);
 console.log('File import: successful resume, browser save unchanged, malformed/oversize/cancelled input preserved current play.');
})().catch(e=>{console.error(e);process.exitCode=1});

let exportedBlob,exportedName,revoked=false;
context.Blob=Blob;context.URL={createObjectURL(blob){exportedBlob=blob;return 'blob:test'},revokeObjectURL(){revoked=true}};context.setTimeout=fn=>fn();
context.document.body={appendChild(){}};context.document.createElement=()=>({click(){exportedName=this.download},remove(){}});
run('exportDoubleExploration()');assert(exportedBlob);assert(exportedName.endsWith('.json'));assert(revoked);
exportedBlob.text().then(text=>{assert.equal(S.decodeSave(text).snapshot.state.world.mode,'doubleMaze');console.log('File export: downloadable versioned snapshot and object-URL cleanup passed.');}).catch(e=>{console.error(e);process.exitCode=1});
