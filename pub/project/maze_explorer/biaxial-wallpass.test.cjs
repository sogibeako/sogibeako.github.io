const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('./klein-biaxial.js'),E=require('./biaxial-exploration.js');
const els={},events={},win={addEventListener(){}},defaults={mode:'free',sx:'3',sy:'2',terrain:'prim',size:'24,20',seed:'wallpass',viewMode:'wide',memoryRadius:'10',loopThreshold:'3'};
const ctx=new Proxy({},{get:()=>()=>{}}),el=id=>els[id]??={value:defaults[id]??'',checked:id==='foldLoops',clientWidth:500,attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(){},getContext:()=>ctx};
vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{KleinBiaxial:K,BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:E,document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(n,f)=>events[n]=f},window:win,devicePixelRatio:1});
const a=win.BiaxialExplorationAdapter,w=K.maze(K.create('free',3,2,{width:24,height:20}),'prim','wallpass'),p={id:w.start,frame:[0,1,2,3]},d=[0,1,2,3].find(d=>!w.cells[K.step(w,p,d).id]);assert.notEqual(d,undefined);
const key=(extra={})=>({key:'W',shiftKey:true,target:{closest:()=>false},preventDefault(){},...extra});
a.autoMove(d);assert.equal(a.progress().steps,0);
events.keydown(key({repeat:true}));assert.equal(el('wallPass').attrs['aria-pressed'],'false');events.keydown(key({isComposing:true}));assert.equal(el('wallPass').attrs['aria-pressed'],'false');
events.keydown(key());assert.equal(el('wallPass').attrs['aria-pressed'],'true');assert.throws(()=>a.autoPlan(),/壁抜け/);a.autoMove(d);assert.equal(a.autoPosition(),K.step(w,p,d).id);assert.equal(a.progress().steps,1);
events.keydown(key());assert.equal(el('wallPass').attrs['aria-pressed'],'true');assert.match(el('wallPassStatus').textContent,/床へ/);a.autoMove((d+2)%4);assert.equal(a.autoPosition(),w.start);events.keydown(key());assert.equal(el('wallPass').attrs['aria-pressed'],'false');assert(a.autoPlan().length);
// Walk across boundaries through walls without accumulating loop experience.
events.keydown(key());for(let n=0;n<120;n++)a.autoMove(1);assert.match(el('loopStatus').textContent,/0 \/ 3周|周回路なし/);el('reset').onclick();assert.equal(el('wallPass').attrs['aria-pressed'],'false');assert.equal(a.progress().steps,0);
console.log('Wall-pass shortcut, blocked normal movement, wall exit guard, auto guard, seam travel, reset and repeat/composition guards passed.');
