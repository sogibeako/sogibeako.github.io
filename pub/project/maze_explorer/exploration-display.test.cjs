const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let active='main';const events={},documents={},frames={};
function documentFor(name){const buttons={},events={};for(const mode of ['tiles','ascii','hybrid','subjective','truth']){const listeners=[];buttons[mode]={paints:0,getAttribute:()=>['truth','subjective'].includes(mode)?(documents[name].world===mode?'true':'false'):(mode===(name==='main'?'tiles':'hybrid')?'true':'false'),addEventListener:(type,fn)=>listeners.push(fn),click(){this.paints++;if(['truth','subjective'].includes(mode))documents[name].world=mode;else documents[name].selected=mode;listeners.forEach(fn=>fn());}};}return {buttons,events,world:'subjective',addEventListener:(type,fn)=>events[type]=fn,selected:name==='main'?'tiles':'hybrid',getElementById:id=>buttons[id]||frames[id],querySelector:s=>buttons[s.match(/"(.*?)"/)[1]]};}
documents.main=documentFor('main');for(const name of ['skew','enclosure','biaxial'])frames[name==='biaxial'?'biaxialFrame':name==='skew'?'skewPilotFrame':'enclosureFrame']={addEventListener(type,fn){this.load=fn;}};
vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-display.js','utf8'),{document:documents.main,window:{ExplorationHost:{mode:()=>active},addEventListener:(type,fn)=>events[type]=fn}});
const select=name=>{active=name;events['exploration-selected']();};
const load=name=>{const frame=frames[name==='biaxial'?'biaxialFrame':name==='skew'?'skewPilotFrame':'enclosureFrame'];documents[name]=documentFor(name);frame.contentDocument=documents[name];frame.load();};
documents.main.buttons.ascii.click();select('skew');load('skew');assert.equal(documents.skew.selected,'ascii');
documents.skew.buttons.hybrid.click();select('main');assert.equal(documents.main.selected,'hybrid');
select('enclosure');load('enclosure');assert.equal(documents.enclosure.selected,'hybrid');
documents.enclosure.buttons.tiles.click();select('skew');assert.equal(documents.skew.selected,'tiles');select('main');assert.equal(documents.main.selected,'tiles');
const before=documents.skew.buttons.ascii.paints;documents.main.buttons.ascii.click();assert.equal(documents.skew.buttons.ascii.paints,before);select('skew');assert.equal(documents.skew.selected,'ascii');
console.log('Shared drawing mode: all three sources, deferred iframe load, repeated switches and no hidden canvas repaint passed.');

// World preference travels with the player, including a runtime reset on new generation.
documents.skew.buttons.truth.click();select('enclosure');assert.equal(documents.enclosure.world,'truth');
documents.main.world='subjective';select('main');assert.equal(documents.main.world,'truth');
documents.skew.world='subjective';select('skew');assert.equal(documents.skew.world,'truth');
documents.skew.buttons.subjective.click();select('main');assert.equal(documents.main.world,'subjective');
// Keyboard switches are read after the runtime updates its buttons.
documents.main.world='truth';documents.main.events.keydown({key:'1'});select('enclosure');assert.equal(documents.enclosure.world,'truth');
documents.enclosure.world='subjective';documents.enclosure.events.keydown({key:'0'});select('skew');assert.equal(documents.skew.world,'subjective');
console.log('Shared world view: buttons, keyboard and generation resets preserve the preference across all three runtimes.');

select('biaxial');load('biaxial');assert.equal(documents.biaxial.selected,documents.skew.selected);documents.biaxial.buttons.ascii.click();documents.biaxial.buttons.truth.click();select('main');assert.equal(documents.main.selected,'ascii');assert.equal(documents.main.world,'truth');select('biaxial');assert.equal(documents.biaxial.world,'truth');
