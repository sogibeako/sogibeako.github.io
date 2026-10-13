const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),H=require('./lattice-holes.js'),S=require('./connection-space.js'),Save=require('./lattice-holes-save.js');
const elements=new Map(),listeners={};
function el(id){if(!elements.has(id))elements.set(id,{value:'',checked:true,textContent:'',focus(){},getContext(){return {}},addEventListener(name,fn){this["on"+name]=fn;}});return elements.get(id);}
let randomSeed=247;const randomMath=Object.create(Math);randomMath.random=()=>((randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0)/4294967296);
let fail=false;const context=vm.createContext({URLSearchParams,location:{search:''},ConnectionSpace:S,SkewOptions:require('./lattice-holes-options.js'),SkewSession:require('./lattice-holes-session.js'),SkewLoops:require('./lattice-holes-loops.js'),SkewSave:Save,LatticeHoles:{create:o=>{if(fail)throw Error('test failure');return H.create(o)}},document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(n,f)=>listeners[n]=f},window:{addEventListener(){}},Math:randomMath});
let source=fs.readFileSync(__dirname+'/lattice-holes-ui.js','utf8').replace("window.addEventListener('resize',()=>draw());draw();", "window.addEventListener('resize',draw);").replace('})();', 'draw=()=>{};globalThis.test={get:()=>({state,book,truth,journey}),regenerate,advance,move,nextSeed,save,load,exportFile,importFile,randomOptions};})();');vm.runInContext(source,context);const t=context.test;
el('holeRimWalls').checked=false;el('randomNext').checked=false;el('randomMin').value='16';el('randomMax').value='24';
const event={key:'>',repeat:false,target:{closest:()=>null},preventDefault(){}};
function walk(){const st=t.get().state,w=st.world,q=[st.id],parent=new Map([[st.id,null]]);for(const n of q)for(let d=0;d<4;d++){const e=w.edges.get(`${n}:${d}`);if(e&&!parent.has(e.to)){parent.set(e.to,[n,d]);q.push(e.to);}}assert(parent.has(w.exit));const path=[];for(let n=w.exit;parent.get(n);){const [p,d]=parent.get(n);path.unshift(d);n=p;}for(const d of path)t.move(st.frame.indexOf(d));assert.equal(st.id,w.exit);}
for(const growth of ['walls','dfs','prim','growing'])for(const wallStyle of ['dense','grid']){
 for(const [id,value] of Object.entries({terrain:'maze',seed:'journey-'+growth,sx:'-2',sy:'4',periodSize:'20',underpasses:'2',underpassShape:'mixed',growth,wallStyle}))el(id).value=value;
 el('holeRimWalls').checked=wallStyle==='grid';t.regenerate();const before=t.get().state;listeners.keydown(event);assert.equal(t.get().state,before);
 walk();const steps=before.steps,w=before.world;S.observeWalkingMap(before,t.get().book);
 for(const id of ['periodSize','underpasses','sx','growth'])el(id).value='invalid';
 listeners.keydown({...event,repeat:true});assert.equal(t.get().state,before);listeners.keydown({...event,target:{closest:()=>({})}});assert.equal(t.get().state,before);
 fail=true;t.advance();fail=false;assert.equal(t.get().state,before);assert.equal(t.get().journey.number,1);
 listeners.keydown(event);const after=t.get();assert.notEqual(after.state.world.seed,w.seed);assert.equal(after.state.steps,0);assert.equal(after.state.id,after.state.world.start);assert.equal(after.book.charts.length,0);assert.equal(after.journey.number,2);assert.equal(after.journey.steps,steps);
 for(const key of ['growth','wallStyle','floorUnderpasses','underpassShape','holeRimWalls'])assert.equal(after.state.world[key],w[key]);assert.deepEqual(after.state.world.lattice,w.lattice);
 walk();const more=after.state.steps;el('exitNext').onclick();assert.equal(t.get().journey.number,3);assert.equal(t.get().journey.steps,steps+more);
 // n alone is inert; Shift+N starts a new journey with the form settings.
 const last=t.get().state;listeners.keydown({...event,key:'n'});assert.equal(t.get().state,last);listeners.keydown({...event,key:'N',shiftKey:true});assert.notEqual(t.get().state,last);assert.equal(t.get().journey.number,1);assert.equal(t.get().journey.steps,0);
}
// Random next-stage choices and real connected play through generated worlds.
const base={growth:'dfs',wallStyle:'grid',periodSize:20,shiftX:2,shiftY:-2,underpasses:2,underpassShape:'mixed'};
el('randomNext').checked=true;
for(const id of ['randomGrowth','randomWall','randomSize','randomShift','randomPassages'])el(id).checked=false;
assert.deepEqual({...t.randomOptions(base,()=>0)},base);
for(const id of ['randomGrowth','randomWall','randomSize','randomShift','randomPassages'])el(id).checked=true;
el('randomMin').value='20';el('randomMax').value='24';
assert.equal(t.randomOptions(base,()=>0).periodSize,20);assert.equal(t.randomOptions(base,()=>.999).periodSize,24);
assert.equal(t.randomOptions(base,()=>0).shiftX,-4);assert.equal(t.randomOptions(base,()=>.999).shiftY,4);
walk();el('randomMin').value='24';el('randomMax').value='12';const retained=t.get();t.advance();assert.equal(t.get().state,retained.state);assert.equal(t.get().journey,retained.journey);
el('randomMin').value='16';el('randomMax').value='24';
for(let i=0;i<8;i++){t.advance();const st=t.get().state,w=st.world;assert([16,20,24].includes(w.lattice.width));assert.equal(el('growth').value,w.growth);assert.equal(w.guaranteedLoops.length,4);walk();}
el('randomNext').checked=false;
console.log('Skew random: disabled fields preserved, range endpoints, invalid range keeps journey, eight randomized worlds walked to exits passed.');
el('terrain').value='open';t.regenerate();const open=t.get().state;t.advance();assert.equal(t.get().state,open);
console.log('Skew journey: eight settings, two real exit walks each, applied-condition retention, counters, fresh maps, input/repeat guards, failed generation and manual restart passed.');

const store=new Map();context.window.localStorage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
el('sx').value='-2';el('sy').value='4';el('terrain').value='maze';el('holeRimWalls').checked=true;t.regenerate();el('loopThreshold').value='5';el('loopThreshold').onchange();assert.equal(t.get().state.loopThreshold,5);el('foldLoops').checked=false;el('foldLoops').onchange();assert.equal(t.get().state.foldLoops,false);walk();S.observeWalkingMap(t.get().state,t.get().book);t.save();assert.equal(store.size,1);
const settingsSaved=JSON.parse([...store.values()][0]);assert.equal(settingsSaved.snapshot.controls.randomNext.checked,false);
const saved=t.get().state,text=[...store.values()][0];t.nextSeed();t.load();assert.equal(t.get().state.id,saved.id);assert.equal(t.get().state.steps,saved.steps);assert.equal(t.get().state.loopThreshold,5);assert.equal(t.get().state.world.holeRimWalls,true);assert.equal(el('holeRimWalls').checked,true);assert.equal(el('loopThreshold').value,'5');assert.equal(el('foldLoops').checked,false);assert.deepEqual(t.get().state.world,saved.world);t.advance();assert.equal(t.get().journey.number,2);assert.equal(t.get().state.loopThreshold,5);assert.equal(t.get().state.loopExperience,undefined);assert.equal(t.get().state.foldLoops,false);
const beforeBad=t.get().state;store.set([...store.keys()][0],'{bad');t.load();assert.equal(t.get().state,beforeBad);store.set([...store.keys()][0],text);
context.window.localStorage.setItem=()=>{throw Error('quota')};t.save();assert(el('saveStatus').textContent.includes('保存できません'));assert.equal([...store.values()][0],text);
console.log('Skew save UI: manual save/resume, continued exit, malformed data preserves exploration, quota failure preserves prior slot passed.');

(async()=>{
 const untouched=[...store.values()][0];
 await t.importFile({size:text.length,text:async()=>text});
 assert.deepEqual(t.get().state.world,saved.world);assert.equal(t.get().state.steps,saved.steps);
 assert.equal([...store.values()][0],untouched);
 const current=t.get().state;
 for(const bad of ['{bad',JSON.stringify({format:'other',version:1})]){await t.importFile({size:bad.length,text:async()=>bad});assert.equal(t.get().state,current);}
 let read=false;await t.importFile({size:20000001,text:async()=>{read=true;return text;}});assert.equal(read,false);assert.equal(t.get().state,current);
 let finish;const pending=t.importFile({size:1,text:()=>new Promise(resolve=>finish=resolve)});t.nextSeed();const newer=t.get().state;finish(text);await pending;assert.equal(t.get().state,newer);
 let first;const older=t.importFile({size:1,text:()=>new Promise(resolve=>first=resolve)});await t.importFile({size:text.length,text:async()=>text});const loaded=t.get().state;first('{bad');await older;assert.equal(t.get().state,loaded);assert(!el('saveStatus').textContent.includes('できません'));
 let blob,clicked=false,removed=false,revoked=false;
 context.Blob=Blob;context.setTimeout=f=>f();context.URL={createObjectURL:b=>{blob=b;return 'blob:test';},revokeObjectURL:u=>{assert.equal(u,'blob:test');revoked=true;}};
 context.document.createElement=()=>({click(){clicked=true;assert(this.download.endsWith('.json'));},remove(){removed=true;}});context.document.body={appendChild(){}};
 t.exportFile();assert(clicked&&removed&&revoked);const exported=Save.decode(await blob.text());assert.deepEqual(exported.snapshot.state.world,saved.world);assert.equal([...store.values()][0],untouched);
 const withRandom=JSON.parse(text);withRandom.snapshot.controls.randomNext.checked=true;withRandom.snapshot.controls.randomMin.value='20';await t.importFile({size:1,text:async()=>JSON.stringify(withRandom)});assert.equal(el('randomNext').checked,true);assert.equal(el('randomMin').value,'20');
 const legacy=JSON.parse(text);delete legacy.snapshot.state.loopThreshold;delete legacy.snapshot.state.foldLoops;delete legacy.snapshot.controls.holeRimWalls;delete legacy.snapshot.state.world.holeRimWalls;delete legacy.snapshot.state.world.holeRimWallCount;for(const id of Object.keys(legacy.snapshot.controls))if(id.startsWith('random'))delete legacy.snapshot.controls[id];await t.importFile({size:1,text:async()=>JSON.stringify(legacy)});assert.equal(el('randomNext').checked,false);assert.equal(el('randomMin').value,'16');assert.equal(el('loopThreshold').value,'3');assert.equal(el('foldLoops').checked,true);assert.equal(el('holeRimWalls').checked,false);
 console.log('Skew files: export round trip, import, malformed/foreign/oversized rejection, asynchronous movement and import races, independent browser slot passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
