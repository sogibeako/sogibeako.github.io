const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let active='main';const events={},documents={},frames={};
function documentFor(name){const buttons={};for(const mode of ['tiles','ascii','hybrid']){const listeners=[];buttons[mode]={paints:0,getAttribute:()=>mode===(name==='main'?'tiles':'hybrid')?'true':'false',addEventListener:(type,fn)=>listeners.push(fn),click(){this.paints++;documents[name].selected=mode;listeners.forEach(fn=>fn());}};}return {buttons,selected:name==='main'?'tiles':'hybrid',getElementById:id=>buttons[id]||frames[id],querySelector:s=>buttons[s.match(/"(.*?)"/)[1]]};}
documents.main=documentFor('main');for(const name of ['skew','enclosure'])frames[name==='skew'?'skewPilotFrame':'enclosureFrame']={addEventListener(type,fn){this.load=fn;}};
vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-display.js','utf8'),{document:documents.main,window:{ExplorationHost:{mode:()=>active},addEventListener:(type,fn)=>events[type]=fn}});
const select=name=>{active=name;events['exploration-selected']();};
const load=name=>{const frame=frames[name==='skew'?'skewPilotFrame':'enclosureFrame'];documents[name]=documentFor(name);frame.contentDocument=documents[name];frame.load();};
documents.main.buttons.ascii.click();select('skew');load('skew');assert.equal(documents.skew.selected,'ascii');
documents.skew.buttons.hybrid.click();select('main');assert.equal(documents.main.selected,'hybrid');
select('enclosure');load('enclosure');assert.equal(documents.enclosure.selected,'hybrid');
documents.enclosure.buttons.tiles.click();select('skew');assert.equal(documents.skew.selected,'tiles');select('main');assert.equal(documents.main.selected,'tiles');
const before=documents.skew.buttons.ascii.paints;documents.main.buttons.ascii.click();assert.equal(documents.skew.buttons.ascii.paints,before);select('skew');assert.equal(documents.skew.selected,'ascii');
console.log('Shared drawing mode: all three sources, deferred iframe load, repeated switches and no hidden canvas repaint passed.');
