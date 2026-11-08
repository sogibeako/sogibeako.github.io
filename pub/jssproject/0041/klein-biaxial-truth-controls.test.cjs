const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('./klein-biaxial.js');
const els={},events={},defaults={mode:'free',sx:'3',sy:'2',terrain:'open',size:'24,20',seed:'display',viewMode:'wide',memoryRadius:'10'};let fills=0,text=[],players=[],layoutRefreshes=0;
const ctx=new Proxy({fillRect(x,y,w,h){fills++;if(this.fillStyle==="#fff5a9")players.push({x,y,w,h});},fill(){fills++;},fillText(t){text.push(t);if(t==="@")assert.equal(this.fillStyle,"#132a24");}},{get:(o,k)=>k in o?o[k]:()=>{}});
const el=id=>els[id]??={value:defaults[id]??'',clientWidth:800,checked:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(){},getContext:()=>ctx};
const buttons=['tiles','ascii','hybrid'].map(mode=>Object.assign(el(mode),{dataset:{render:mode}}));
const win={addEventListener(){}};
const arrows=[0,1,2,3].map(d=>({dataset:{dir:String(d)}}));
vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{KleinBiaxial:{...K,create(...args){const w=K.create(...args);w.cells=new Uint8Array(w.width*w.height).fill(1);w.start=w.width+1;return w;}},BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:require('./biaxial-exploration.js'),devicePixelRatio:1,document:{getElementById:el,querySelectorAll:s=>s==='[data-render]'?buttons:s==='[data-dir]'?arrows:[],addEventListener:(n,f)=>events[n]=f},window:win});

const adapter=win.BiaxialExplorationAdapter;
const press=k=>events.keydown({key:k,target:{closest:()=>false},preventDefault(){}});
press('ArrowLeft');press('ArrowLeft'); // Cross the reflected seam.
assert(el('status').textContent.includes('上下反転'));
el('truth').onclick();
let before=adapter.autoPosition();press('ArrowUp');assert.equal(adapter.autoPosition(),before-24);
before=adapter.autoPosition();arrows[2].onclick();assert.equal(adapter.autoPosition(),before+24);
const saved=JSON.parse(adapter.snapshot());assert.equal(saved.actions.at(-1),0,'physical down is saved as local up in reflected frame');
el('subjective').onclick();before=adapter.autoPosition();press('ArrowUp');assert.equal(adapter.autoPosition(),before+24,'subjective up still uses reflected frame');
el('truth').onclick();before=adapter.autoPosition();adapter.autoMove(0);assert.equal(adapter.autoPosition(),before+24,'solver actions remain local even in truth view');
const steps=adapter.progress().steps;press('.');assert.equal(adapter.progress().steps,steps+1);
console.log('Reflected seam: truth keyboard up, button down, local save actions, subjective up, solver and wait passed.');
