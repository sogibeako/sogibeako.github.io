const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('./klein-biaxial.js'),E=require('./biaxial-exploration.js');
(async()=>{
const els={},main={},ev={},loads={},defaults={mode:'free',sx:'3',sy:'2',terrain:'atelier-prim',size:'24,20',seed:'free-7vzobe5',viewMode:'wide',memoryRadius:'10',loopThreshold:'3',underpassCount:'4',underpassShape:'mixed',ruleMode:'plain'};
const ctx=new Proxy({},{get:()=>()=>{}}),el=id=>els[id]??={value:defaults[id]??'',checked:id==='foldLoops',clientWidth:500,getContext:()=>ctx,focus(){},setAttribute(){}};
const child={addEventListener(){}};vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{KleinBiaxial:K,BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:E,devicePixelRatio:1,window:child,document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}}});
const a=child.BiaxialExplorationAdapter,seen=new Set();
for(let n=0;n<5000;n++){const path=a.autoExplore(seen);if(!path?.length)break;a.autoMove(path[0]);}
assert.match(el('status').textContent,/地図完成（壁も表示）/);
const saved=a.snapshot(),status=el('status').textContent;
el('reset').onclick();assert(!el('status').textContent.includes('地図完成'));
a.apply(a.prepare(saved));assert.equal(el('status').textContent,status);
console.log('Actual UI: full exploration completes chart, reset clears completion, JSON replay restores sight count and completed chart.');
})().catch(e=>{console.error(e);process.exitCode=1;});
