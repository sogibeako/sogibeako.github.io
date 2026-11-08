const {test}=require('node:test');
const assert=require('node:assert/strict');
const scores=require('./scores.js');
const run={dead:true,score:1234,floor:2,turn:40};
test('names are strictly ASCII alphanumeric, one through ten characters',()=>{for(const name of ['A','abc123','0123456789'])assert(scores.validName(name));for(const name of ['','abcdefghijk','名前','a b','<script>','ＡＢＣ','abc\n'])assert(!scores.validName(name));assert.throws(()=>scores.register([],'bad name',run));assert.throws(()=>scores.register([],'Alice',{...run,dead:false}));});
test('ranking keeps ten descending scores and favors earlier entries on ties',()=>{const entries=Array.from({length:12},(_,i)=>({name:'P'+i,score:i*100,floor:1,turn:i}));const list=scores.normalize(entries);assert.equal(list.length,10);assert.equal(list[0].score,1100);assert.equal(list[9].score,200);assert(!scores.qualifies(list,200));assert(scores.qualifies(list,201));const next=scores.register(list,'Alice',run);assert.equal(next[0].name,'Alice');assert.equal(next.length,10);assert.equal(scores.normalize([{...run,name:'First'},{...run,name:'Second'}])[0].name,'First');});
test('stored scores survive JSON roundtrip and malformed rows are excluded',()=>{const saved=scores.register([],'Hero9',run);assert.deepEqual(scores.normalize(JSON.parse(JSON.stringify(saved))),saved);assert.deepEqual(scores.normalize({invalid:true}),[]);assert.deepEqual(scores.normalize([null,{...run,name:'<b>'},{...run,name:'A',score:-1},{...run,name:'B',floor:NaN}]),[]);});

test('debug runs cannot be registered',()=>{assert.throws(()=>scores.register([],'Test',{...run,debug:true}),/デバッグ/);});
