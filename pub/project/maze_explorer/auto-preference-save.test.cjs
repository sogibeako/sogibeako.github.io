const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),B=require('./exploration-bundle.js');
(async()=>{
 const prefs={render:'hybrid',threshold:3,folding:true,foldDisplay:'continuous'},course={enabled:false,completed:0,steps:0};
 const elements={},events={};let schedules=0;
 const el=id=>elements[id]??={value:id==='autoWalkMode'?'explore':'250',options:[{value:'250'}],append(o){this.options.push(o);},addEventListener(){}};
 const window={addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/exploration-autowalk.js','utf8'),{window,document:{getElementById:el,createElement:()=>({}),addEventListener:(n,f)=>events[n]=f},setTimeout(){schedules++;},clearTimeout(){}});
 const P=window.ExplorationAutoPreference;
 for(const mode of ['explore','exit','stroll'])for(const speed of [1,37,60000]){
  const text=B.encode('main','skew','main',course,undefined,{...prefs,auto:{mode,speed}}),d=B.unpack(text);assert.deepEqual(d.preferences.auto,{mode,speed});
  P.restore(d.preferences.auto);assert.equal(el('autoWalkMode').value,mode);assert.equal(el('autoWalkSpeed').value,String(speed));assert.equal(JSON.stringify(P.snapshot()),JSON.stringify({mode,speed}));
 }
 assert.equal(schedules,0);assert.equal(el('autoWalkSpeed').options.filter(o=>o.value==='37').length,1);
 for(const auto of [{mode:'bad',speed:37},{mode:'explore',speed:0},{mode:'exit',speed:60001},{mode:'stroll',speed:2.5},{mode:'explore',speed:'37'}]){
  const before=JSON.stringify(P.snapshot());assert.throws(()=>P.restore(auto));assert.equal(JSON.stringify(P.snapshot()),before);assert.throws(()=>B.validatePreferences({...prefs,auto}));
 }
 assert.equal(B.validatePreferences(prefs).auto,undefined);
 const current={...prefs,auto:{mode:'exit',speed:37}},incoming={...prefs,auto:{mode:'stroll',speed:23}};let fail=true;
 const stub={apply(){}},adapters={main:stub,skew:stub,preferences:{apply(p){P.restore(p.auto);if(fail){fail=false;throw Error('apply error');}}}};
 assert.throws(()=>B.apply({main:0,skew:0,preferences:incoming},adapters,{main:0,skew:0,preferences:current}),/元の探索/);assert.equal(P.snapshot().speed,37);assert.equal(P.snapshot().mode,'exit');
 console.log('Shared auto preferences: 9 round trips, custom ms, stopped restore, no duplicate options, invalid input, legacy omission and rollback passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
