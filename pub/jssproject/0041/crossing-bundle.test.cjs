const assert=require('node:assert/strict'),B=require('./exploration-bundle.js'),S=require('./connection-space.js'),C=require('./crossing-save.js'),P=require('./crossing-autowalk.js');
(async()=>{
 const s=S.create('crossingMaze',{width:16,height:16,seed:'bundle',floorUnderpasses:2,underpassShape:'mixed'});const book={charts:[],active:-1};const observe=()=>S.observeWalkingMap(s,book,S.nearestView(s));observe();for(const d of P.route(s,id=>S.groundSheet(s.world,id)===1)){S.move(s,d);observe();}
 const saved=C.snapshot(s,{number:2,steps:50},{truth:false,render:'ascii'}),current={};let fail=false,commits=0;
 const adapters=Object.fromEntries(['main','skew','enclosure','klein','biaxial'].map(k=>[k,{prepare:JSON.parse,apply:v=>{current[k]=v;commits++;}}]));
 adapters.crossing={prepare:C.prepare,apply:v=>{current.crossing=v;if(fail){fail=false;throw Error('render failed');}commits++;}};
 const text=B.encode('{}','{}','crossing',undefined,'{}',undefined,'{}',undefined,saved),ready=await B.prepare(text,adapters);assert.equal(B.unpack(text).version,5);assert(!('biaxial' in ready));assert.equal(commits,0);assert.deepEqual(ready.crossing.state,s);B.apply(ready,adapters,ready);
 const before={...current},bad=JSON.parse(text);bad.crossing='{}';await assert.rejects(B.prepare(JSON.stringify(bad),adapters));assert.deepEqual(current,before);
 fail=true;assert.throws(()=>B.apply(ready,adapters,before),/元の探索へ/);assert.deepEqual(current,before);
 const old=B.encode('{}','{}','main',undefined,'{}',undefined,'{}','{}');B.apply(await B.prepare(old,adapters),adapters,ready);assert.equal(current.crossing,before.crossing);
 for(const patch of [{crossing:null},{active:'biaxial'},{biaxial:4}])assert.throws(()=>B.unpack(JSON.stringify({...JSON.parse(text),...patch})));
 console.log('Real crossing bundle: v5 without unused free-connection, exact replay, corrupt-data no commit, rollback and legacy preservation passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
