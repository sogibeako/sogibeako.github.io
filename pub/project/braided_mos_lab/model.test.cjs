const assert=require('node:assert/strict');
const {pitches,permutation,balanced,frequency,rampValue}=require('./model.js');
const cases=[
 [0,240,0,[0,240,480,480,720,960,1200]],
 [1/12,200,100,[0,200,400,500,700,900,1100]],
 [1/7,1200/7,1200/7,Array.from({length:7},(_,i)=>i*1200/7)],
 [2/9,1200/9,2400/9,[0,1200/9,2400/9,4800/9,6000/9,7200/9,8400/9]],
 [.5,0,600,[0,0,0,600,600,600,600]],
 [1,-240,1200,[0,-240,-480,720,480,240,0]]
];
for(const [u,L,s,notes] of cases){const actual=pitches(u);assert.ok(Math.abs(actual.L-L)<1e-10);assert.ok(Math.abs(actual.s-s)<1e-10);[...notes,1200].forEach((p,i)=>assert.ok(Math.abs(actual.notes[i]-p)<1e-10));}
for(let i=0;i<=1000;i++){const m=pitches(i/1000);assert.ok(Math.abs(m.notes[7]-1200)<1e-9);m.notes.forEach(p=>assert.ok(frequency(p)>0));}
assert.deepEqual(permutation('0 3 1 5 2 6 4 7',8),[0,3,1,5,2,6,4,7]);
for(const invalid of ['0 3 1 5 2 6 4 8','0 0 1 2 3 4 5 6','0 1 2','0 1 2 3 4 5 6 7.0'])assert.throws(()=>permutation(invalid,8));
assert.ok(balanced('LsLLsLs'));assert.ok(!balanced('LLLLsss'));
assert.ok(Math.abs(pitches(.2,'LsLsLLs',1200*Math.log2(3)).notes[7]-1200*Math.log2(3))<1e-9);
assert.equal(pitches(.4,'LLLLLLLLLLLLLLs').notes.length,16);
assert.throws(()=>pitches(.1,'LLLL'));assert.throws(()=>pitches(NaN));
assert.equal(rampValue({from:100,to:400,start:0,end:2},1),200);
assert.equal(frequency(1200,220),440);
console.log('PASS: six specified states, 1001 sweep positions, permutations, non-octave, 16 voices, exponential glide.');
const {positionFromRatio}=require('./model.js');
for(const [text,expected] of [['1:0',0],['2:1',1/12],['1:1',1/7],['1:2',2/9],['0:1',.5],['-1:5',1],['２：１',1/12],['−1:5',1],['0.5:0.25',1/12],['2e100:1e100',1/12]]) {
 assert.ok(Math.abs(positionFromRatio(text)-expected)<1e-12,text);
}
for(const text of ['0:0','2','2:','NaN:1','Infinity:1','1e999:1','-2:5','-1:4','1:-1']) assert.throws(()=>positionFromRatio(text),text);
for(const word of ['LLsLLLs','LLsLsLs','Lss','LLLLLLLLLLLLLLs']) {
 for(let i=0;i<=1000;i++) {
  const u=i/1000,{L,s}=pitches(u,word,1200*Math.log2(3));
  assert.ok(Math.abs(positionFromRatio(`${L}:${s}`,word)-u)<1e-12);
 }
}
console.log('PASS: ratio input parsing, boundaries, invalid input and 4004 inverse mappings across four words.');
