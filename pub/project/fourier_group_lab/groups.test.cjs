const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('./groups.js'),F=require('./core.js');
const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const same=(a,b,eps=1e-9)=>{assert.equal(a.length,b.length);a.forEach((z,i)=>{near(z.re,b[i].re,eps);near(z.im,b[i].im,eps);});};
function mm(a,b,d){return Array.from({length:d*d},(_,k)=>{const i=Math.floor(k/d),j=k%d;let s=G.C();for(let t=0;t<d;t++)s=G.add(s,G.mul(a[i*d+t],b[t*d+j]));return s;});}
function adj(a,d){return Array.from({length:d*d},(_,k)=>G.conj(a[k%d*d+Math.floor(k/d)]));}
test('Sequence parser preserves complex values, exponents, separators and zeros',()=>{
  same(G.parseSequence('1, -0.5\n2e-3 1+2i, -i, .4-2e-2i, 0'),[G.C(1),G.C(-.5),G.C(.002),G.C(1,2),G.C(0,-1),G.C(.4,-.02),G.C()]);
  same(G.parseSequence('−1，+i、-3e+2i'),[G.C(-1),G.C(0,1),G.C(0,-300)]);
  for(const text of ['',',1','1,,2','1, ','1 + 2i','NaN','Infinity','1e999','1000001','1000000+1i','[1,2]','0x10','alert(1)',Array(65).fill('0').join(',')])assert.throws(()=>G.parseSequence(text),text);
});
test('Zero padding is explicit, preserves values, rejects truncation and invalid size',()=>{
  const x=G.parseSequence('1+i,2');same(G.padSequence(x,4),[G.C(1,1),G.C(2),G.C(),G.C()]);assert.equal(x.length,2);
  for(const n of [1,3.5,65,NaN])assert.throws(()=>G.padSequence(x,n));
});
test('Catalog includes requested groups and bounds the supported universe',()=>{
  assert.deepEqual(G.catalog(8).map(g=>g.id),['a:8','a:4x2','a:2x2x2','d:4']);
  assert.deepEqual(G.catalog(6).map(g=>g.id),['a:6','a:3x2','d:3']);assert.deepEqual(G.catalog(7).map(g=>g.id),['a:7']);
  for(const n of [0,65,4.5,NaN])assert.throws(()=>G.catalog(n));for(const id of ['d:5','a:2x4','a:0','a:999','bad'])assert.throws(()=>G.makeGroup(id));
});
test('All catalog groups for N=1..64 preserve complex input and Parseval',()=>{
  for(let n=1;n<=64;n++)for(const desc of G.catalog(n)){
    const group=G.makeGroup(desc.id),x=Array.from({length:n},(_,i)=>G.C(Math.sin(i*1.23)+i/17,Math.cos(i*.812)-i/11));
    assert.equal(group.irreps.reduce((s,r)=>s+r.d*r.d,0),n);
    const blocks=G.transform(x,group);same(G.inverse(blocks,group),x);near(G.energies(blocks,group).reduce((a,b)=>a+b,0),G.energy(x));
    for(const h of group.generators){const moved=G.translate(x,group,h.index);near(G.energy(moved),G.energy(x));const energies=G.energies(G.transform(moved,group),group);G.energies(blocks,group).forEach((e,k)=>near(e,energies[k]));}
  }
});
test('General cyclic transform agrees with original DFT, including odd sizes',()=>{
  for(const n of [1,4,7,16,31,64]){const x=Array.from({length:n},(_,i)=>Math.sin(i*.742));same(G.transform(x.map(v=>G.C(v)),G.makeGroup('a:'+n)).map(b=>b[0]),F.dft(x));}
  const x=G.parseSequence('1,i,-1,-i');same(G.transform(x,G.makeGroup('a:4')).map(b=>b[0]),[G.C(),G.C(1),G.C(),G.C()]);
});
test('D3 general matrix transform agrees with existing S3 experiment',()=>{
  const x=[1,.2,-.5,.7,-.3,.1],z=F.s3Transform(x),blocks=G.transform(x.map(v=>G.C(v)),G.makeGroup('d:3'));
  near(blocks[0][0].re,z.trivial);near(blocks[1][0].re,z.sign);same(blocks[2],z.matrix.map(v=>G.C(v)));
});
test('D4 group laws, noncommutativity, unitary representations and matrix homomorphisms',()=>{
  const g=G.makeGroup('d:4'),id=[G.C(1),G.C(),G.C(),G.C(1)];
  assert.notEqual(g.mul(1,4),g.mul(4,1));assert.equal(g.mul(4,1),7);assert.equal(g.mul(1,4),5);
  for(let a=0;a<8;a++){
    assert.equal(g.mul(0,a),a);assert.equal(g.mul(a,0),a);assert.equal(g.mul(a,g.inv(a)),0);assert.equal(g.mul(g.inv(a),a),0);
    for(const r of g.irreps)same(mm(r.at(a),adj(r.at(a),r.d),r.d),r.d===1?[G.C(1)]:id);
    for(let b=0;b<8;b++){for(const r of g.irreps)same(mm(r.at(a),r.at(b),r.d),r.at(g.mul(a,b)));for(let c=0;c<8;c++)assert.equal(g.mul(g.mul(a,b),c),g.mul(a,g.mul(b,c)));}
  }
});
test('D4 independent basis deltas and known constant/sign coefficients',()=>{
  const group=G.makeGroup('d:4');
  for(let p=0;p<8;p++)for(const unit of [G.C(1),G.C(0,1)]){const x=Array.from({length:8},(_,i)=>i===p?unit:G.C());same(G.inverse(G.transform(x,group),group),x);}
  const delta=G.transform([G.C(1),...Array.from({length:7},()=>G.C())],group);for(let i=0;i<4;i++)same(delta[i],[G.C(1/8)]);same(delta[4],[G.C(1/8),G.C(),G.C(),G.C(1/8)]);
  for(let k=0;k<4;k++){const x=group.labels.map((_,i)=>group.irreps[k].at(i)[0]),z=G.transform(x,group);z.forEach((block,j)=>same(block,block.map((_,i)=>G.C(j===k&&i===0?1:0))));}
});
test('D4 translation obeys Fourier block right multiplication by rho(h)*',()=>{
  const group=G.makeGroup('d:4'),x=Array.from({length:8},(_,i)=>G.C(i/10,Math.sin(i))),z=G.transform(x,group);
  for(let h=0;h<8;h++){const moved=G.transform(G.translate(x,group,h),group);group.irreps.forEach((r,k)=>same(moved[k],mm(z[k],adj(r.at(h),r.d),r.d)));}
});
test('Product-group coordinate order, inverses, and input-size mismatch',()=>{
  const group=G.makeGroup('a:4x2');assert.deepEqual(group.labels.slice(0,4),['(0,0)','(0,1)','(1,0)','(1,1)']);
  for(let i=0;i<8;i++)assert.equal(group.mul(i,group.inv(i)),0);
  assert.throws(()=>G.transform([G.C()],group));
});
