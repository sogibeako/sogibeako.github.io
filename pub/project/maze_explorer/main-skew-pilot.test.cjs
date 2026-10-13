const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const elements=new Map();let sourceWrites=0,focused='';
function el(id){if(!elements.has(id))elements.set(id,{hidden:false,attrs:{},events:{},addEventListener(n,fn){this.events[n]=fn;},setAttribute(n,v){this.attrs[n]=v;if(n==='src')sourceWrites++;},getAttribute(n){return this.attrs[n]??null;},focus(){focused=id;}});return elements.get(id);}
const aside=el('aside'),layout={querySelector:()=>aside,classList:{toggle(){}}},listeners={};
el('skewPilotFrame').contentDocument={getElementById:()=>el('childMap')};
const hostWindow={addEventListener(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/main-skew-pilot.js','utf8'),{ExplorationGeneration:require('./exploration-generation.js'),ExplorationCourse:require('./exploration-course.js'),window:hostWindow,document:{getElementById:el,querySelector:()=>layout,addEventListener(n,fn,capture){assert.equal(capture,true);listeners[n]=fn;}}});
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

(async()=>{
 const progress={main:{token:{},steps:12,exit:false},skew:{token:{},steps:99,exit:true}};let fail=false,lastRandomGeneration,lastSizes,lastTopologies,lastShifts;
 function adapter(mode){return {progress:()=>progress[mode],snapshot:()=>mode,prepare:async()=>({...progress[mode]}),fresh:(seed,randomGeneration,generators,sizes,topologies,shifts)=>{lastShifts=shifts;lastTopologies=topologies;lastSizes=sizes;lastRandomGeneration=randomGeneration;if(fail)throw Error('generation failed');return {token:{},steps:0,exit:false};},enter:next=>{progress[mode]=next;},apply:previous=>{progress[mode]=previous;}};}
 hostWindow.MainExplorationAdapter=adapter('main');el('skewPilotFrame').contentWindow={SkewExplorationAdapter:adapter('skew')};
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
 console.log('Three-space host: cycle entry/exit, total steps and enclosure-only random destination passed.');
 console.log('Alternating host: exit guard, generation failure, duplicate input, both directions, totals and manual-switch stop passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

// A modal keeps keyboard events available to its own controls.
el('explorationSettingsDialog').open=true;let modalBlocked=false;listeners.keydown({stopPropagation(){modalBlocked=true;}});assert.equal(modalBlocked,false);el('explorationSettingsDialog').open=false;

assert.equal(el('skewPilotFrame').getAttribute('src'),'lattice-holes.html?embedded=1&v=300');assert.equal(el('enclosureFrame').getAttribute('src'),'return-enclosure.html?embedded=1&v=300');
