const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('./klein-biaxial.js'),E=require('./biaxial-exploration.js');
(async()=>{
const els={},main={},ev={},loads={},defaults={mode:'free',sx:'3',sy:'2',terrain:'atelier-prim',size:'24,20',seed:'free-7vzobe5',viewMode:'wide',memoryRadius:'10',loopThreshold:'3',underpassCount:'4',underpassShape:'mixed',ruleMode:'warp'};
let curves=0;const ctx=new Proxy({},{get:(_,name)=>name==='quadraticCurveTo'?()=>curves++:()=>{}}),el=id=>els[id]??={value:defaults[id]??'',checked:id==='foldLoops',clientWidth:500,getContext:()=>ctx,focus(){},setAttribute(){}};
const child={addEventListener(){}};vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{KleinBiaxial:K,BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:E,devicePixelRatio:1,window:child,document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}}});
assert.equal(curves,0);const a=child.BiaxialExplorationAdapter;assert(a.autoTargets().size>0);assert.match(el('status').textContent,/アンダーパス [1-4] \/ 4か所/);let callback=null;
const m=id=>main[id]??={value:id==='autoWalkSpeed'?'250':'explore',addEventListener(n,f){loads[id]=f;}};
m('biaxialFrame').contentWindow=child;m('biaxialFrame').contentDocument={addEventListener(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-autowalk.js','utf8'),{document:{getElementById:m,addEventListener:(n,f)=>ev[n]=f},window:{ExplorationHost:{mode:()=> 'biaxial',autoAdvance:async()=>false},addEventListener(){}},setTimeout:f=>(callback=f,1),clearTimeout:()=>callback=null});
const key=k=>({type:'keydown',key:k,shiftKey:true,target:{closest:()=>false},preventDefault(){},stopImmediatePropagation(){}});
ev.keydown(key('W'));assert.equal(el('wallPass').textContent,'壁抜け ON · Shift+W');ev.keydown(key('W'));assert.equal(el('wallPass').textContent,'壁抜け OFF · Shift+W');
ev.keydown(key('A'));assert(m('autoWalkStart').disabled);ev.keydown(key('+'));assert.equal(m('autoWalkSpeed').value,'80');
for(let n=0;callback&&n<3000;n++){const f=callback;callback=null;await f();}
assert(a.progress().exit);assert.match(el('status').textContent,/双方向ワープ/);assert.match(el('status').textContent,/数字を照合/);assert.equal(a.autoWarpPending(),0);assert(curves>0);assert.match(el('status').textContent,/ワープ矢印 2 \/ 2本/);assert.equal(a.autoLoopPending(),0);assert(m('autoWalkProgress').textContent.includes('未訪問 0'));assert.equal(callback,null);
curves=0;el('reset').onclick();assert.equal(curves,0);assert.match(el('status').textContent,/ワープ矢印 0 \/ 2本/);ev.keydown(key('G'));for(let n=0;callback&&n<3000;n++){const f=callback;callback=null;await f();}assert(a.progress().exit);assert(m('autoWalkProgress').textContent.includes('出口優先'));
console.log('Actual free runtime + shared UI: Shift+A full-floor/learning/exit, Shift+G exit and speed shortcut passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
