const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('./klein-biaxial.js');
const els={},events={},defaults={mode:'free',sx:'3',sy:'2',terrain:'prim',size:'24,20',seed:'display',viewMode:'wide',memoryRadius:'10'};let fills=0,text=[],players=[],layoutRefreshes=0;
const ctx=new Proxy({fillRect(x,y,w,h){fills++;if(this.fillStyle==="#fff5a9")players.push({x,y,w,h});},fill(){fills++;},fillText(t){text.push(t);if(t==="@")assert.equal(this.fillStyle,"#132a24");}},{get:(o,k)=>k in o?o[k]:()=>{}});
const el=id=>els[id]??={value:defaults[id]??'',clientWidth:800,checked:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(){},getContext:()=>ctx};
const buttons=['tiles','ascii','hybrid'].map(mode=>Object.assign(el(mode),{dataset:{render:mode}}));
vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{KleinBiaxial:K,BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:require('./biaxial-exploration.js'),devicePixelRatio:1,document:{getElementById:el,querySelectorAll:s=>s==='[data-render]'?buttons:[],addEventListener:(n,f)=>events[n]=f},window:{addEventListener(){},parent:{MazeConsoleLayout:{refresh(){layoutRefreshes++;assert.notEqual(el('subjectivePanel').hidden,el('truthPanel').hidden,'visibility changes before host layout refresh');}}}}});
const status=el('status').textContent;
for(const mode of ['tiles','ascii','hybrid']){fills=0;text=[];players=[];el(mode).onclick();assert.equal(el(mode).attrs['aria-pressed'],'true');assert.equal(players[0].w,23,'same 24px cell as plane, with 1px gutter');assert.equal(el('status').textContent,status);if(mode==='ascii'){assert.equal(fills,2);assert(text.includes('#'));}else{assert(fills>0);assert.equal(text.includes('#'),mode==='hybrid');}}
el('truth').onclick();assert(el('subjectivePanel').hidden);assert(!el('truthPanel').hidden);assert.equal(el('truth').attrs['aria-pressed'],'true');
events.keydown({key:'0',target:{closest:()=>false},preventDefault(){}});assert(!el('subjectivePanel').hidden);assert(el('truthPanel').hidden);assert.equal(el('status').textContent,status);
console.log('All three drawing styles, world buttons, keyboard and unchanged memory passed.');

const initialRefreshes=layoutRefreshes;
for(let i=0;i<5;i++){el('truth').onclick();el('subjective').onclick();}
assert.equal(layoutRefreshes,initialRefreshes+10);
assert.equal(el('status').textContent,status);
console.log('Embedded world switches refresh the common layout on every round trip without changing exploration state.');
