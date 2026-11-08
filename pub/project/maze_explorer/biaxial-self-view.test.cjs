const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('./klein-biaxial.js');
const els={},events={},defaults={mode:'free',sx:'-5',sy:'-1',terrain:'open',size:'12,10',viewMode:'wide',memoryRadius:'10'};
let expected=0,seenCopies=0,drawn=[],yellow=0;
const contexts={};
function context(id){return contexts[id]??=new Proxy({fillRect(){if(id==='view'&&this.fillStyle==='#fff5a9')yellow++;},fillText(t){if(id==='view'&&t==='@')drawn.push(this.fillStyle);}},{get:(o,k)=>k in o?o[k]:()=>{}});}
const el=id=>els[id]??={value:defaults[id]??'',clientWidth:800,checked:false,setAttribute(){},focus(){},getContext:()=>context(id)};
const buttons=['tiles','ascii','hybrid'].map(mode=>Object.assign(el(mode),{dataset:{render:mode}}));
const tracked={...K,nearby(w,p,isWall,r){const view=K.nearby(w,p,isWall,r);expected=[...view.values()].filter(t=>!t.wall&&t.id===p.id).length;return view;}};
vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{KleinBiaxial:tracked,BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:require('./biaxial-exploration.js'),devicePixelRatio:1,document:{getElementById:el,querySelectorAll:s=>s==='[data-render]'?buttons:[],addEventListener:(n,f)=>events[n]=f},window:{addEventListener(){}}});
for(let i=0;i<40;i++){
 events.keydown({key:i===0?'ArrowUp':'ArrowRight',target:{closest:()=>false},preventDefault(){}});
 for(const mode of ['tiles','ascii','hybrid']){drawn=[];yellow=0;el(mode).onclick();assert.equal(drawn.length,expected,'only currently visible self copies, never stale memory');assert.equal(yellow,1,'only current position is yellow');assert.equal(drawn.filter(c=>c==='#132a24').length,1);if(expected>1)seenCopies++;}
}
assert(seenCopies>0);console.log('120 rendering checks: visible self copies, no memory ghosts, single yellow current position; '+seenCopies+' views contain copies.');
