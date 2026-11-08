const assert=require('node:assert/strict'),S=require('./connection-space.js'),P=require('./crossing-autowalk.js');let cases=0;
for(const growth of ['dfs','prim','growing','hunt','kruskal','frontier'])for(const wallStyle of ['dense','grid']){
 const s=S.create('crossingMaze',{growth,wallStyle,width:23,height:25,seed:'auto-'+growth,stairPlacement:'random',floorUnderpasses:3,underpassShape:'mixed'}),targets=P.targets(s),seen=new Set([s.id]);let stairs=0;
 while(seen.size<targets.size){const path=P.route(s,id=>!seen.has(id));assert(path?.length);for(const d of path){assert(S.move(s,d));if(s.last.kind==='stairs')stairs++;seen.add(s.id);}}
 for(const d of P.route(s,id=>id===s.world.exit))assert(S.move(s,d));assert.equal(s.id,s.world.exit);assert(stairs>0);for(const p of s.world.passages){assert(seen.has(p.vertical));assert(seen.has(p.horizontal));}cases++;
}
console.log(cases+' two-floor mazes: all floors, both underpass lanes, stairs and exit reached.');
const fs=require('node:fs'),vm=require('node:vm'),elements={},listeners={};let pending=null;
const el=id=>elements[id]??={value:id==='crossAutoSpeed'?'250':'',checked:false,focus(){},getContext(){return {};},setAttribute(){},addEventListener(){}};
const context=vm.createContext({GraphWands:require('./graph-wands.js'),CrossingSave:require('./crossing-save.js'),GraphWandControls:{attach:()=>({busy:()=>false,state:()=>({}),projectile:()=>null})},ConnectionSpace:S,CrossingAutowalk:P,document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(n,f,c)=>{if(c)listeners[n]=f;}},window:{addEventListener(){}},setTimeout:(fn,delay)=>(pending={fn,delay},1),clearTimeout:()=>pending=null});
vm.runInContext(fs.readFileSync(__dirname+'/connections-lab.js','utf8').replace("window.addEventListener('resize',draw);draw();",""),context);
vm.runInContext("draw=()=>{};state=S.create('crossingMaze',{width:15,height:15,seed:'ui',floorUnderpasses:2});truth=true",context);
const key=k=>({key:k,shiftKey:true,target:{closest:()=>false},preventDefault(){},stopImmediatePropagation(){}});el('spaceMode').value='crossingMaze';listeners.keydown(key('A'));listeners.keydown(key('+'));assert.equal(el('crossAutoSpeed').value,'80');
for(let n=0;pending&&pending.delay!==700&&n<10000;n++){const f=pending.fn;pending=null;f();}
assert(pending&&pending.delay===700);assert.equal(vm.runInContext('state.id===state.world.exit',context),true);assert.match(el('crossAutoStatus').textContent,/出口/);
const previous=vm.runInContext('state',context),next=pending.fn;pending=null;next();assert.notEqual(vm.runInContext('state',context),previous);assert.equal(vm.runInContext('journey.number',context),2);assert(pending);el('crossAutoStop').onclick();assert.equal(pending,null);listeners.keydown(key('G'));assert(pending);listeners.keydown(key('Escape'));assert.equal(pending,null);
console.log('Actual lab handlers: Shift+A reaches exit in truth view, speed shortcut, stop and Shift+G passed.');

// The shared host uses the same state/movement, retaining visited floors across stops.
context.window.CrossingEmbedded=true;listeners.keydown(key('A'));assert.equal(pending,null);
const a=context.window.CrossingExplorationAdapter,known=new Set(),targets=a.autoTargets();
for(let n=0;n<10000;n++){const path=a.autoExplore(known);if(!path?.length)break;for(const d of path)a.autoMove(d);}
a.autoExplore(known);assert.equal(known.size,targets.size);
for(const d of a.autoPlan())a.autoMove(d);assert(a.progress().exit);
console.log('Embedded adapter: child shortcut suppressed; all floor IDs retained, legal exploration and exit route passed.');
