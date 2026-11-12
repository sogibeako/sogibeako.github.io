/* Run: node --test tests.cjs */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('./core.js');
const {compile}=require('./formula.js');
const near=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const vector=(a,b,eps=1e-10)=>{assert.equal(a.length,b.length);a.forEach((v,i)=>near(v,b[i],eps));};
const energy=z=>z.reduce((s,c)=>s+c.re*c.re+c.im*c.im,0);
const mm=(a,b)=>[a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3]];

test('DFT: known sine coefficients, DC, normalization and inverse',()=>{
  const x=Array.from({length:16},(_,i)=>2+Math.sin(F.TAU*i/16)+.4*Math.sin(3*F.TAU*i/16)),z=F.dft(x);
  near(z[0].re,2);near(z[1].im,-.5);near(z[3].im,-.2);near(z[15].im,.5);near(z[13].im,.2);
  vector(F.idft(z),x);near(energy(z),4.58);near(energy(z),F.meanSquare(x));
});
test('Every supported sample count, including odd and prime, round trips and preserves energy',()=>{
  for(let n=4;n<=64;n++){
    const x=Array.from({length:n},(_,i)=>Math.sin(i*1.231)+Math.cos(i*.412)+i/100),z=F.dft(x);
    vector(F.idft(z),x);near(energy(z),F.meanSquare(x));
    z.forEach((c,k)=>{near(c.re,z[(n-k)%n].re);near(c.im,-z[(n-k)%n].im);});
  }
});
test('Circular shift changes phase only; inversion conjugates coefficients',()=>{
  const x=[.2,1,-.5,.1,.7,-.3,.1],z=F.dft(x),shift=F.dft([x.at(-1),...x.slice(0,-1)]),reverse=F.dft(x.map((_,i)=>x[F.mod(-i,x.length)]));
  z.forEach((c,k)=>{const a=-F.TAU*k/x.length;near(shift[k].re,c.re*Math.cos(a)-c.im*Math.sin(a));near(shift[k].im,c.re*Math.sin(a)+c.im*Math.cos(a));near(reverse[k].re,c.re);near(reverse[k].im,-c.im);});
});
test('Aliasing example and conjugate-pair lowpass have expected outcomes',()=>{
  const x=Array.from({length:16},(_,i)=>Math.sin(F.TAU*11*i/16));
  vector(x,Array.from({length:16},(_,i)=>-Math.sin(F.TAU*5*i/16)));
  const mix=Array.from({length:16},(_,i)=>Math.sin(F.TAU*i/16)+.4*Math.sin(3*F.TAU*i/16));
  vector(F.idft(F.lowpass(F.dft(mix),1)),Array.from({length:16},(_,i)=>Math.sin(F.TAU*i/16)));
});
test('Abelian transforms: independent character basis and inverse for both group laws',()=>{
  const x=[1,.3,-.7,.2];
  for(const group of ['z4','v4']){const z=F.abelian(x,group);vector(F.inverseAbelian(z,group),x);near(energy(z),F.meanSquare(x));}
  const z4=F.abelian(x,'z4'),dft=F.dft(x);z4.forEach((z,i)=>{near(z.re,dft[i].re);near(z.im,dft[i].im);});
  const walsh=F.abelian([1,-1,-1,1],'v4');vector(walsh.map(z=>z.re),[0,0,0,1]);vector(walsh.map(z=>z.im),[0,0,0,0]);
});
test('S3 multiplication: identity, inverses, associativity, representation and noncommutativity',()=>{
  for(let g=0;g<6;g++){
    assert.equal(F.mul(0,g),g);assert.equal(F.mul(g,0),g);assert.equal(F.mul(g,F.inv(g)),0);assert.equal(F.mul(F.inv(g),g),0);
    for(let h=0;h<6;h++){vector(mm(F.rho(g),F.rho(h)),F.rho(F.mul(g,h)));for(let k=0;k<6;k++)assert.equal(F.mul(F.mul(g,h),k),F.mul(g,F.mul(h,k)));}
  }
  assert.equal(F.mul(3,1),5);assert.equal(F.mul(1,3),4);assert.notEqual(F.mul(3,1),F.mul(1,3));
});
test('S3: all six delta functions round trip, Parseval with dimension weight, projection',()=>{
  const cases=[...Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>+(i===j))),[1,.2,-.5,.7,-.3,.1],[1,1,1,-1,-1,-1]];
  for(const x of cases){const z=F.s3Transform(x);vector(F.s3Inverse(z),x);near(F.meanSquare(x),z.trivial**2+z.sign**2+2*z.matrix.reduce((s,v)=>s+v*v,0));vector(F.s3Inverse(z,[true,false,false]),Array(6).fill(x.reduce((s,v)=>s+v,0)/6));}
  const delta=F.s3Transform([1,0,0,0,0,0]);near(delta.trivial,1/6);near(delta.sign,1/6);vector(delta.matrix,[1/6,0,0,1/6]);
});
test('S3 translation composes according to group multiplication and preserves energy',()=>{
  const x=[1,.2,-.5,.7,-.3,.1];
  for(let a=0;a<6;a++)for(let b=0;b<6;b++){vector(F.translate(F.translate(x,b),a),F.translate(x,F.mul(a,b)));near(F.meanSquare(F.translate(x,a)),F.meanSquare(x));}
});
test('Formula syntax: original tanh, assignments, comparisons, comments, functions and time',()=>{
  near(compile('tanh(3*(2*ph-1))')(.25),Math.tanh(-1.5));
  near(compile('a = 3 # amount\nx = 2*ph-1\ntanh(a*x)')(.25),Math.tanh(-1.5));
  near(compile('ph < 0.5 ? 1 : -1')(.25),1);near(compile('ph < 0.5 ? 1 : -1')(.75),-1);
  near(compile('-2^2')(0),-4);near(compile('2^-2')(0),.25);near(compile('2^3^2')(0),512);
  near(compile('0 < ph < 1 ? 4 : 0')(.5),4);near(compile('0 < ph < 1 ? 4 : 0')(1),0);
  near(compile('band(7,3) + (ph > 0 and ph < 1 ? 1 : 0)')(.5),4);
  near(compile('t*sr')(.5,220,16),8);near(compile('not(ph) ? 1 : 0')(0),1);
});
test('Parser rejects access, JavaScript, bad scope, unbounded values and excess input',()=>{
  for(const text of ['window.location','constructor(1)','ph.constructor','[1,2]','ph = 3\nph','__proto__ = 1\n1','a = b\na','1;2', '('.repeat(1000)+'1'+')'.repeat(1000)])assert.throws(()=>compile(text));
  assert.throws(()=>compile('1/0')(0));assert.throws(()=>compile('sqrt(-1)')(0));assert.throws(()=>compile('1000001')(0));
  assert.throws(()=>compile('sin('.repeat(400)+'ph'+')'.repeat(400)));
});
test('Scale ratios, cents, non-octave periods and negative keyboard steps',()=>{
  const scale=F.parseScale('1/1\n3/2\n3/1');assert.deepEqual(scale,{degrees:[1,1.5],period:3});near(F.frequency(scale,220,2),660);near(F.frequency(scale,220,-1),110);
  const equal=F.parseScale('100\n200\n1200');near(equal.degrees[1],2**(1/12));near(equal.period,2);
  for(const text of ['0/0','1/0','700\n200\n1200','1200\n1200','abc','0','-100\n1200','9999999'])assert.throws(()=>F.parseScale(text));
});
test('Audio coefficients: DC exclusion, even-N Nyquist, odd-N amplitude, band limit',()=>{
  const nyq=F.harmonics([1,-1,1,-1],220,44100);near(nyq.real[2],1);near(nyq.real[0],0);
  const sine=Array.from({length:9},(_,i)=>Math.sin(F.TAU*4*i/9)),h=F.harmonics(sine,220,44100);near(h.imag[4],1,1e-7);
  const limited=F.harmonics(sine,6000,44100);assert.equal(limited.max,3);
  const dc=F.harmonics([3,3,3,3],220,44100);for(const v of dc.real)near(v,0);
});
test('WAV output: headers, actual tone, peak bound, envelope, DC-only silence',()=>{
  const x=Array.from({length:16},(_,i)=>Math.sin(F.TAU*i/16));
  const b=F.wav(x,220,2,.1),view=new DataView(b);assert.equal(b.byteLength,44+44100*2*2);assert.equal(view.getUint32(24,true),44100);assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint16(34,true),16);
  assert.equal(Buffer.from(b).toString('ascii',0,4),'RIFF');assert.equal(Buffer.from(b).toString('ascii',8,12),'WAVE');
  assert.equal(view.getInt16(44,true),0);assert.equal(view.getInt16(b.byteLength-2,true),0);
  let peak=0,crossings=0,prev=0;
  for(let i=0;i<88200;i++){const v=view.getInt16(44+2*i,true);peak=Math.max(peak,Math.abs(v));if(i>=4410&&i<48510&&prev<=0&&v>0)crossings++;prev=v;}
  assert.ok(peak>3000&&peak<=3277);assert.equal(crossings,220);
  const silent=new DataView(F.wav([1,1,1,1],220,.1,.1));for(let i=44;i<silent.byteLength;i+=2)assert.equal(silent.getInt16(i,true),0);
});

test('Audio voice lifecycle: release while context is resuming cancels pending note',async()=>{
  const fs=require('node:fs'),vm=require('node:vm');let resolveResume,created=0;
  const sandbox={Fourier:F,console,setTimeout,clearTimeout};sandbox.globalThis=sandbox;
  sandbox.AudioContext=class {constructor(){this.sampleRate=44100;this.currentTime=0;this.destination={};}resume(){return new Promise(r=>{resolveResume=r;});}createOscillator(){created++;throw new Error('should not start');}};
  vm.runInNewContext(fs.readFileSync(require.resolve('./audio.js'),'utf8'),sandbox);
  const synth=new sandbox.LabSynth(),pending=synth.start('a',[0,1,0,-1],220);synth.stop('a');resolveResume();await pending;assert.equal(created,0);assert.equal(synth.voices.size,0);
});
