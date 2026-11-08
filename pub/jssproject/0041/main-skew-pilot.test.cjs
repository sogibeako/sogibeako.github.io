const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const elements=new Map();let sourceWrites=0,focused='';
function el(id){if(!elements.has(id))elements.set(id,{hidden:false,attrs:{},events:{},addEventListener(n,fn){this.events[n]=fn;},setAttribute(n,v){this.attrs[n]=v;if(n==='src')sourceWrites++;},getAttribute(n){return this.attrs[n]??null;},focus(){focused=id;}});return elements.get(id);}
const aside=el('aside'),layout={querySelector:()=>aside,classList:{toggle(){}}},listeners={};
el('skewPilotFrame').contentDocument={getElementById:()=>el('childMap')};
const hostWindow={addEventListener(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/main-skew-pilot.js','utf8'),{ExplorationBundle:require('./exploration-bundle.js'),ExplorationGeneration:require('./exploration-generation.js'),ExplorationCourse:require('./exploration-course.js'),window:hostWindow,document:{getElementById:el,querySelector:()=>layout,addEventListener(n,fn,capture){assert.equal(capture,true);listeners[n]=fn;}}});
for(let i=0;i<3;i++){
 el('skewExploreSelect').events.click();if(!i)el('skewPilotFrame').events.load();assert(el('mainExplorePane').hidden);assert(!el('skewExplorePane').hidden);assert(aside.hidden);assert.equal(focused,'childMap');assert.equal(sourceWrites,1);
 let blocked=false;listeners.keydown({stopPropagation(){blocked=true;}});assert(blocked);
 el('mainExploreSelect').events.click();assert(!el('mainExplorePane').hidden);assert(el('skewExplorePane').hidden);assert(!aside.hidden);assert.equal(focused,'map');assert.equal(el('mainExploreSelect').attrs['aria-pressed'],'true');
 blocked=false;listeners.keydown({stopPropagation(){blocked=true;}});assert(!blocked);
}
console.log('Exploration host: repeated switches retain iframe, toggle panes/settings, restore focus and block inactive main shortcuts.');

el('enclosureFrame').contentDocument={getElementById:()=>el('enclosureMap')};
for(let i=0;i<3;i++){
 el('enclosureExploreSelect').events.click();if(!i)el('enclosureFrame').events.load();assert.equal(sourceWrites,2);assert(!el('enclosureExplorePane').hidden);assert(el('mainExplorePane').hidden);assert(el('skewExplorePane').hidden);assert(!el('sharedCoursePanel').hidden);assert(!el('bundlePanel').hidden);assert.equal(focused,'enclosureMap');
 let blocked=false;listeners.keydown({stopPropagation(){blocked=true;}});assert(blocked);
 el('skewExploreSelect').events.click();assert(el('enclosureExplorePane').hidden);assert(!el('skewExplorePane').hidden);assert(!el('sharedCoursePanel').hidden);assert(!el('bundlePanel').hidden);assert.equal(sourceWrites,2);
 el('mainExploreSelect').events.click();assert(!el('mainExplorePane').hidden);assert(el('enclosureExplorePane').hidden);
}
console.log('Third exploration: iframe loaded once, three-way switching retains sessions, focus and inactive shortcuts isolated, common course/save hidden only in example 3.');

// Fourth runtime is retained across manual switches, with unsupported shared course/save hidden.
el('kleinFrame').contentDocument={getElementById:()=>el('kleinMap')};
hostWindow.ExplorationHost.select('klein');assert.equal(el('kleinFrame').getAttribute('src'),'klein-player.html?embedded=1&v=425');assert(!el('kleinExplorePane').hidden);assert(!el('sharedCoursePanel').hidden);assert(!el('bundlePanel').hidden);
hostWindow.ExplorationHost.select('main');assert(el('kleinExplorePane').hidden);assert(!el('sharedCoursePanel').hidden);
hostWindow.ExplorationHost.select('klein');assert.equal(focused,'kleinMap');hostWindow.ExplorationHost.select('main');

// Free-connection experiment retains its document and pauses when left.
let paused=0;el('biaxialFrame').contentDocument={getElementById:()=>el('biaxialMap')};el('biaxialFrame').contentWindow={addEventListener(){},BiaxialExperiment:{pause(){paused++;}}};
hostWindow.ExplorationHost.select('biaxial');el('biaxialFrame').events.load();assert(!el('biaxialExplorePane').hidden);assert(el('kleinExplorePane').hidden);assert(!el('sharedCoursePanel').hidden);assert(!el('bundlePanel').hidden);assert.equal(focused,'biaxialMap');const loads=sourceWrites;
hostWindow.ExplorationHost.select('main');assert.equal(paused,1);assert(el('biaxialExplorePane').hidden);hostWindow.ExplorationHost.select('biaxial');assert.equal(sourceWrites,loads);hostWindow.ExplorationHost.select('main');

// The master size switch includes enclosure, preserving its independent bounds.
el('sharedEnclosure_widthMin').value='28';el('sharedEnclosure_widthMax').value='38';el('sharedEnclosure_widthMin').events.change();
el('sharedRandomSize').checked=true;el('sharedRandomSize').events.change();assert.equal(el('sharedEnclosureSize').checked,true);assert.equal(el('sharedEnclosure_widthMin').value,'28');assert.equal(el('sharedEnclosure_widthMax').value,'38');
el('sharedRandomSize').checked=false;el('sharedRandomSize').events.change();assert.equal(el('sharedEnclosureSize').checked,false);
el('sharedRandomSize').checked=true;el('sharedRandomSize').events.change();el('sharedEnclosureSize').checked=false;el('sharedEnclosureSize').events.change();assert.equal(el('sharedRandomSize').checked,true);assert.equal(el('sharedEnclosureSize').checked,false);
el('sharedSize_widthMin').events.change();assert.equal(el('sharedEnclosureSize').checked,false);
el('sharedRandomSize').checked=false;el('sharedRandomSize').events.change();
console.log('Master size toggle synchronizes enclosure, preserves ranges and permits independent override.');

(async()=>{
 const progress={main:{token:{},steps:12,exit:false},skew:{token:{},steps:99,exit:true}};let fail=false,lastRandomGeneration,lastSizes,lastTopologies,lastShifts;
 function adapter(mode){return {progress:()=>progress[mode],snapshot:()=>JSON.stringify(mode),prepare:async()=>({...progress[mode]}),fresh:(seed,randomGeneration,generators,sizes,topologies,shifts)=>{lastShifts=shifts;lastTopologies=topologies;lastSizes=sizes;lastRandomGeneration=randomGeneration;if(fail)throw Error('generation failed');return {token:{},steps:0,exit:false};},enter:next=>{progress[mode]=next;},apply:previous=>{progress[mode]=previous;}};}
 hostWindow.MainExplorationAdapter=adapter('main');el('skewPilotFrame').contentWindow={SkewExplorationAdapter:adapter('skew')};
 el('sharedCourseOrder').value='alternate';el('sharedPoolTorus').checked=false;el('sharedPoolEnclosure').checked=false;el('sharedCourseOrder').events.change();
 el('sharedCourseEnabled').checked=true;el('sharedCourseEnabled').events.change();
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 assert(hostWindow.ExplorationHost.advance('main'));await tick();assert.equal(progress.skew.steps,99);assert(el('sharedCourseStatus').textContent.includes('出口'));
 assert(!el('coursePlayBar').hidden);assert(el('coursePlayNext').disabled);progress.main.exit=true;fail=true;hostWindow.ExplorationHost.advance('main');await tick();assert.equal(progress.skew.steps,99);assert(el('sharedCourseStatus').textContent.includes('generation failed'));assert(el('coursePlayError').textContent.includes('generation failed'));assert(!el('coursePlayNext').disabled);
 el('sharedRandomShift').checked=true;el('sharedRandomShift').events.change();for(const t of ['none','x','y']){el('sharedShift_'+t).checked=false;el('sharedShift_'+t).events.change();}el('sharedShift_both').checked=false;el('sharedShift_both').events.change();assert.equal(el('sharedShift_both').checked,true);
 fail=false;hostWindow.ExplorationHost.advance('main');hostWindow.ExplorationHost.advance('main');await tick();assert.equal(progress.skew.steps,0);assert.equal(lastShifts.enabled,true);assert.deepEqual(Array.from(lastShifts.pool),['both']);assert.equal(el('skewExploreSelect').attrs['aria-pressed'],'true');assert(el('sharedCourseStatus').textContent.includes('1枚踏破'));assert(el('sharedCourseStatus').textContent.includes('通算12歩'));
 el('sharedRandomSize').checked=true;el('sharedRandomSize').events.change();el('sharedSize_widthMax').value='35';el('sharedSize_widthMax').events.change();el('sharedSize_widthMin').value='40';el('sharedSize_widthMin').events.change();assert.equal(el('sharedSize_widthMin').value,'15');assert(el('sharedCourseStatus').textContent.includes('最小'));
 el('sharedRandomTopology').checked=true;el('sharedRandomTopology').events.change();el('sharedTopology_plane').checked=false;el('sharedTopology_plane').events.change();el('sharedTopology_torus').checked=false;el('sharedTopology_torus').events.change();assert.equal(el('sharedTopology_torus').checked,true);
 progress.skew.steps=8;progress.skew.exit=true;hostWindow.ExplorationHost.advance('skew');await tick();assert.equal(progress.main.steps,0);assert.equal(lastTopologies.enabled,true);assert.deepEqual(Array.from(lastTopologies.pool),['torus']);assert.equal(lastSizes.enabled,true);assert.equal(lastSizes.widthMax,35);assert(el('sharedCourseStatus').textContent.includes('2枚踏破'));assert(el('sharedCourseStatus').textContent.includes('通算20歩'));
 // A one-space random pool must generate a new maze even in the current runtime.
 el('sharedCourseOrder').value='random';el('sharedPoolMain').checked=true;el('sharedPoolSkew').checked=false;el('sharedCourseOrder').events.change();
 el('sharedRandomGeneration').checked=true;el('sharedRandomGeneration').events.change();
 const oldToken=progress.main.token;progress.main.exit=true;progress.main.steps=4;hostWindow.ExplorationHost.advance('main');await tick();assert.notEqual(progress.main.token,oldToken);assert.equal(lastRandomGeneration,true);assert(el('sharedCourseStatus').textContent.includes('3枚踏破'));assert(el('sharedCourseStatus').textContent.includes('通算24歩'));
 el('sharedPoolMain').checked=false;el('sharedPoolMain').events.change();assert.equal(el('sharedPoolMain').checked,true);
 el('skewExploreSelect').events.click();assert.equal(el('sharedCourseEnabled').checked,false);assert.equal(hostWindow.ExplorationHost.advance('skew'),false);
 progress.enclosure={token:{},steps:40,exit:true};el('enclosureFrame').contentWindow={EnclosureExplorationAdapter:adapter('enclosure')};
 el('sharedCourseOrder').value='cycle';el('sharedCourseOrder').events.change();el('sharedCourseEnabled').checked=true;el('sharedCourseEnabled').events.change();
 progress.skew.exit=true;progress.skew.steps=7;assert(hostWindow.ExplorationHost.advance('skew'));assert(el('embeddedGeneration').inert);await tick();assert(!el('embeddedGeneration').inert);assert.equal(progress.enclosure.steps,0);assert.equal(el('enclosureExploreSelect').attrs['aria-pressed'],'true');
 progress.enclosure.steps=9;progress.enclosure.exit=true;assert(hostWindow.ExplorationHost.advance('enclosure'));await tick();assert.equal(el('mainExploreSelect').attrs['aria-pressed'],'true');assert(el('sharedCourseStatus').textContent.includes('通算16歩'));assert(el('coursePlaySummary').textContent.includes('通算16歩'));assert.equal(el('coursePlayError').textContent,'');
 el('sharedCourseOrder').value='random';el('sharedPoolMain').checked=false;el('sharedPoolSkew').checked=false;el('sharedPoolEnclosure').checked=true;el('sharedCourseOrder').events.change();progress.main.exit=true;assert(hostWindow.ExplorationHost.advance('main'));await tick();assert.equal(el('enclosureExploreSelect').attrs['aria-pressed'],'true');
 // A torus-only sequence uses the main runtime but forces torus generation.
 el('sharedCourseOrder').value='sequence';el('sharedPoolMain').checked=false;el('sharedPoolTorus').checked=true;el('sharedPoolSkew').checked=false;el('sharedPoolEnclosure').checked=false;el('sharedCourseOrder').events.change();progress.enclosure.exit=true;
 assert(hostWindow.ExplorationHost.advance('enclosure'));await tick();assert.equal(hostWindow.ExplorationHost.mode(),'main');assert.deepEqual(Array.from(lastTopologies.pool),['torus']);
 progress.main.exit=true;progress.main.topology='torus';const previousTorus=progress.main.token;assert(hostWindow.ExplorationHost.advance('main'));await tick();assert.notEqual(progress.main.token,previousTorus);assert.deepEqual(Array.from(lastTopologies.pool),['torus']);
 // Shift+N rerolls through the course without requiring an exit or counting a clear.
 for(const mode of ['main','skew','enclosure']){
  hostWindow.ExplorationHost.select(mode);
  el('sharedCourseEnabled').checked=true;el('sharedCourseEnabled').events.change();
  progress[mode].exit=false;progress[mode].steps=6;
  const before=progress.main.token;
  const key={key:'N',shiftKey:true,target:{closest:()=>false},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};
  listeners.keydown({...key,repeat:true});await tick();assert.equal(progress.main.token,before);
  listeners.keydown({...key,target:{closest:()=>true},stopPropagation(){}});await tick();assert.equal(progress.main.token,before);
  listeners.keydown(key);listeners.keydown({...key});await tick();
  assert(key.prevented&&key.stopped);assert.notEqual(progress.main.token,before);
  assert.equal(hostWindow.ExplorationHost.mode(),'main');assert(el('sharedCourseEnabled').checked);
  assert(el('sharedCourseStatus').textContent.includes('0枚踏破'));assert(el('sharedCourseStatus').textContent.includes('通算6歩'));
  assert.deepEqual(Array.from(lastTopologies.pool),['torus']);
 }
 // Klein participates in sequences, random repeats, skip and automatic handoff.
 progress.klein={token:{},steps:35,exit:false};const kleinKeys={};
 const ka=adapter('klein');ka.courseFresh=(seed,settings)=>{assert.equal(settings.randomGeneration,el('sharedRandomGeneration').checked);assert.equal(settings.sizes.enabled,el('sharedRandomSize').checked);assert.equal(settings.rules.enabled,el('sharedRandomRules').checked);return ka.fresh(seed);};ka.courseEnter=ka.enter;
 el('kleinFrame').contentWindow={KleinExplorationAdapter:ka,addEventListener:(name,fn)=>kleinKeys[name]=fn};el('kleinFrame').events.load();
 el('sharedPoolTorus').checked=false;el('sharedPoolMain').checked=true;el('sharedPoolKlein').checked=true;el('sharedCourseOrder').value='sequence';el('sharedCourseOrder').events.change();
 progress.main.topology='plane';progress.main.exit=true;progress.main.steps=7;assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));
 assert.equal(hostWindow.ExplorationHost.mode(),'klein');assert.equal(progress.klein.steps,0);assert(!el('sharedCoursePanel').hidden);assert(!el('bundlePanel').hidden);assert(el('sharedCourseStatus').textContent.includes('クライン'));
 const stay=progress.klein.token;assert.equal(await hostWindow.ExplorationHost.autoAdvance(()=>true),false);assert.equal(progress.klein.token,stay);
 progress.klein.exit=true;progress.klein.steps=13;assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.equal(hostWindow.ExplorationHost.mode(),'main');
 el('sharedPoolMain').checked=false;el('sharedCourseOrder').value='random';el('sharedCourseOrder').events.change();progress.main.exit=true;
 fail=true;const retained=progress.klein.token;assert.equal(await hostWindow.ExplorationHost.autoAdvance(()=>true),false);assert.equal(progress.klein.token,retained);assert.equal(hostWindow.ExplorationHost.mode(),'main');fail=false;
 assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.equal(hostWindow.ExplorationHost.mode(),'klein');
 const prior=progress.klein.token;progress.klein.steps=5;const skip={key:'N',shiftKey:true,target:{closest:()=>false},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};
 kleinKeys.keydown(skip);await tick();assert(skip.prevented&&skip.stopped);assert.notEqual(progress.klein.token,prior);assert.equal(hostWindow.ExplorationHost.mode(),'klein');assert(el('sharedCourseEnabled').checked);
 const beforeButton=progress.klein.token;assert(hostWindow.ExplorationHost.reroll('klein'));await tick();assert.notEqual(progress.klein.token,beforeButton);assert(el('sharedCourseEnabled').checked);
 await el('bundleExport').events.click();const bundle=JSON.parse(el('bundleText').value);assert.equal(bundle.version,3);assert.equal(bundle.active,'klein');assert.equal(bundle.klein,JSON.stringify('klein'));await el('bundleImport').events.click();assert.equal(hostWindow.ExplorationHost.mode(),'klein');assert(el('bundleStatus').textContent.includes('復元しました'));
 let freeState={steps:12};el('biaxialFrame').contentWindow.BiaxialExplorationAdapter={snapshot:()=>JSON.stringify(freeState),prepare:JSON.parse,apply:v=>freeState=v,progress:()=>({token:freeState,steps:freeState.steps,exit:!!freeState.exit}),courseOptions:()=>({terrain:'dfs',size:'24,20',ruleMode:'plain',sx:'3',sy:'2'}),courseFresh:options=>({steps:0,options}),courseEnter:v=>freeState=v};
 hostWindow.ExplorationHost.select('biaxial');await el('bundleExport').events.click();const freeBundle=el('bundleText').value;assert.equal(JSON.parse(freeBundle).version,4);assert.equal(JSON.parse(freeBundle).active,'biaxial');freeState={steps:99};await el('bundleImport').events.click();assert.equal(freeState.steps,12);assert.equal(hostWindow.ExplorationHost.mode(),'biaxial');assert(!el('bundlePanel').hidden);
 el('bundleText').value=JSON.stringify(bundle);await el('bundleImport').events.click();assert.equal(freeState.steps,12);assert.equal(hostWindow.ExplorationHost.mode(),'klein');
 for(const id of ['sharedPoolMain','sharedPoolTorus','sharedPoolSkew','sharedPoolEnclosure','sharedPoolKlein'])el(id).checked=false;el('sharedPoolBiaxial').checked=true;el('sharedCourseOrder').value='sequence';el('sharedRandomGeneration').checked=false;el('sharedPoolBiaxial').events.change();el('sharedCourseEnabled').checked=true;el('sharedCourseEnabled').events.change();progress.klein.exit=true;
 assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.equal(hostWindow.ExplorationHost.mode(),'biaxial');assert.equal(freeState.steps,0);assert.equal(freeState.options.mode,'free');assert(el('sharedCourseStatus').textContent.includes('自由接続'));
 const freeToken=freeState;freeState.steps=7;freeState.exit=true;assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.notEqual(freeState,freeToken);assert.equal(freeState.steps,0);assert.equal(hostWindow.ExplorationHost.mode(),'biaxial');
 const skippedToken=freeState;assert(hostWindow.ExplorationHost.reroll('biaxial'));await tick();assert.notEqual(freeState,skippedToken);
 let crossState={steps:17},crossPaused=0;
 el('crossingFrame').contentWindow={CrossingExplorationAdapter:{snapshot:()=>JSON.stringify(crossState),prepare:JSON.parse,apply:v=>crossState=v,pause:()=>crossPaused++,progress:()=>({token:crossState,steps:crossState.steps,exit:!!crossState.exit}),autoNext:()=>crossState={steps:0}}};
 hostWindow.ExplorationHost.select('crossing');const crossSource=sourceWrites;
 assert.equal(hostWindow.ExplorationHost.mode(),'crossing');assert(!el('crossingExplorePane').hidden);assert(!el('bundlePanel').hidden);assert(!el('sharedCoursePanel').hidden);
 hostWindow.ExplorationHost.select('main');hostWindow.ExplorationHost.select('crossing');assert.equal(sourceWrites,crossSource);assert.equal(crossState.steps,17);assert(crossPaused>0);
 crossState.exit=true;assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.equal(crossState.steps,0);
 crossState.steps=31;await el('bundleExport').events.click();const crossingBundle=JSON.parse(el('bundleText').value);assert.equal(crossingBundle.version,5);assert.equal(crossingBundle.active,'crossing');assert.equal(JSON.parse(crossingBundle.crossing).steps,31);
 crossState.steps=70;await el('bundleImport').events.click();assert.equal(crossState.steps,31);assert.equal(hostWindow.ExplorationHost.mode(),'crossing');assert(el('bundleStatus').textContent.includes('復元しました'));
 el('bundleText').value=freeBundle;await el('bundleImport').events.click();assert.equal(crossState.steps,31);assert.equal(hostWindow.ExplorationHost.mode(),'biaxial');
 const crossingKeys={},ca=el('crossingFrame').contentWindow.CrossingExplorationAdapter;
 ca.courseOptions=()=>({width:16,height:16,growth:'dfs',wallStyle:'dense',floorUnderpasses:2,underpassShape:'mixed',stairPlacement:'random'});ca.courseFresh=o=>({steps:0,options:o});ca.courseEnter=v=>crossState=v;
 el('crossingFrame').contentWindow.addEventListener=(name,fn)=>crossingKeys[name]=fn;el('crossingFrame').events.load();
 for(const id of ['sharedPoolMain','sharedPoolTorus','sharedPoolSkew','sharedPoolEnclosure','sharedPoolKlein','sharedPoolBiaxial'])el(id).checked=false;el('sharedPoolCrossing').checked=true;el('sharedCourseOrder').value='sequence';el('sharedPoolCrossing').events.change();el('sharedRandomSize').checked=false;el('sharedRandomSize').events.change();el('sharedCourseEnabled').checked=true;el('sharedCourseEnabled').events.change();freeState.exit=true;
 assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.equal(hostWindow.ExplorationHost.mode(),'crossing');assert.equal(crossState.options.floorUnderpasses,2);assert.equal(crossState.steps,0);
 let ct=crossState;crossState.exit=true;crossState.steps=6;assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.notEqual(crossState,ct);assert(el('sharedCourseStatus').textContent.includes('立体交差'));
 ct=crossState;const crossSkip={key:'N',shiftKey:true,target:{closest:()=>false},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};crossingKeys.keydown(crossSkip);await tick();assert.notEqual(crossState,ct);assert(crossSkip.prevented&&crossSkip.stopped);
 el('sharedPoolMain').checked=true;el('sharedPoolCrossing').checked=false;el('sharedCourseOrder').value='random';el('sharedPoolCrossing').events.change();crossState.exit=true;assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.equal(hostWindow.ExplorationHost.mode(),'main');
 let tripleState={steps:12,options:{shiftX:2,shiftY:-2,tripleRoute:'return',dimensions:[[20,20],[24,20],[20,20]],holeSize:4,wallStyle:'grid'}},triplePaused=0;
 const ta={snapshot:()=>JSON.stringify(tripleState),prepare:JSON.parse,apply:v=>tripleState=v,pause:()=>triplePaused++,progress:()=>({token:tripleState,steps:tripleState.steps,exit:!!tripleState.exit}),courseOptions:()=>tripleState.options,courseFresh:o=>({steps:0,options:o}),courseEnter:v=>tripleState=v};
 el('tripleFrame').contentWindow={TripleExplorationAdapter:ta,addEventListener(){}};el('tripleFrame').contentDocument={getElementById:()=>el('tripleMap')};
 hostWindow.ExplorationHost.select('triple');const tripleLoads=sourceWrites;
 hostWindow.ExplorationHost.select('main');hostWindow.ExplorationHost.select('triple');assert.equal(sourceWrites,tripleLoads);assert.equal(tripleState.steps,12);assert(triplePaused>0);
 el('sharedForceTripleReturn').checked=true;el('sharedForceTripleReturn').events.change();
 el('sharedRandomTripleRoute').checked=true;el('sharedRandomTripleRoute').events.change();
 el('sharedRandomTripleHole').checked=true;el('sharedRandomTripleHole').events.change();el('sharedRandomTripleUnderpasses').checked=true;el('sharedRandomTripleUnderpasses').events.change();
 await el('bundleExport').events.click();const tripleBundle=el('bundleText').value;assert.equal(JSON.parse(tripleBundle).version,6);assert.equal(JSON.parse(tripleBundle).active,'triple');
 tripleState.steps=99;await el('bundleImport').events.click();assert(el('sharedForceTripleReturn').checked);assert(el('sharedRandomTripleRoute').checked);assert(el('sharedRandomTripleHole').checked);assert(el('sharedRandomTripleUnderpasses').checked);assert.equal(tripleState.steps,12);assert.equal(hostWindow.ExplorationHost.mode(),'triple');
 el('sharedPoolMain').checked=false;el('sharedPoolTriple').checked=true;el('sharedCourseOrder').value='sequence';el('sharedPoolTriple').events.change();el('sharedCourseEnabled').checked=true;el('sharedCourseEnabled').events.change();
 tripleState.exit=true;assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.equal(Math.abs(tripleState.options.shiftX),2);assert.equal(tripleState.options.tripleRoute,'return');assert.equal(tripleState.steps,0);
 el('sharedPoolTriple').checked=false;el('sharedPoolMain').checked=true;el('sharedPoolTriple').events.change();tripleState.exit=true;assert(await hostWindow.ExplorationHost.autoAdvance(()=>true));assert.equal(hostWindow.ExplorationHost.mode(),'main');
 console.log('Triple host: retained frame/state, v6 bundle restoration, same-space course and departure, applied shifts/return layout retained.');
 console.log('Crossing course: arrival, one-space repeat, child Shift+N and random departure passed.');
 console.log('Crossing bundle: v5 export/import and v4 preservation passed.');
 console.log('Crossing host: retained session, single iframe load, unsupported panels hidden and automatic next maze passed.');
 console.log('Free connection course: candidate selection, cross-space arrival, same-space repeat and skip passed.');
 console.log('Free connection common bundle: version 4, selected space, state restoration and legacy preservation passed.');
 console.log('Klein course: sequence and automatic round trip, random-only repeat, child Shift+N, exit guard and failed generation retention passed.');
 console.log('Shift+N: all runtimes use course destination/settings, retain steps, do not count skipped mazes; repeat/input guarded.');
 console.log('Three-space host: cycle entry/exit, total steps and enclosure-only random destination passed.');
 console.log('Alternating host: exit guard, generation failure, duplicate input, both directions, totals and manual-switch stop passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

// A modal keeps keyboard events available to its own controls.
el('explorationSettingsDialog').open=true;let modalBlocked=false;listeners.keydown({stopPropagation(){modalBlocked=true;}});assert.equal(modalBlocked,false);el('explorationSettingsDialog').open=false;

assert.equal(el('skewPilotFrame').getAttribute('src'),'lattice-holes.html?embedded=1&v=425');assert.equal(el('enclosureFrame').getAttribute('src'),'return-enclosure.html?embedded=1&v=425');
