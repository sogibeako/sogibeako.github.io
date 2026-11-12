/* Finite complex sequences and normalized Fourier transforms on explicit groups. */
(function(root){
  'use strict';
  const C=(re=0,im=0)=>({re,im});
  const add=(a,b)=>C(a.re+b.re,a.im+b.im);
  const mul=(a,b)=>C(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
  const conj=a=>C(a.re,-a.im);
  const abs2=a=>a.re*a.re+a.im*a.im;
  const mod=(a,n)=>(a%n+n)%n;
  const TAU=2*Math.PI;
  const realPattern='(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?';
  const realRE=new RegExp('^[+-]?'+realPattern+'$');
  const complexRE=new RegExp('^([+-]?'+realPattern+')([+-])('+realPattern+')?i$');
  function parseValue(token){
    let z;
    if(realRE.test(token))z=C(Number(token));
    else if(token==='i'||token==='+i')z=C(0,1);
    else if(token==='-i')z=C(0,-1);
    else if(token.endsWith('i')&&realRE.test(token.slice(0,-1)))z=C(0,Number(token.slice(0,-1)));
    else {const m=token.match(complexRE);if(m)z=C(Number(m[1]),(m[2]==='-'?-1:1)*Number(m[3]||1));}
    if(!z)throw new Error(`数値を読み取れません：${token.slice(0,40)}。例：0.5、-2、1+2i（複素数の中に空白は入れません）。`);
    if(!Number.isFinite(z.re)||!Number.isFinite(z.im)||Math.hypot(z.re,z.im)>1e6)throw new Error('値は有限で、絶対値100万以下にしてください。');
    return z;
  }
  function parseSequence(text){
    if(text.length>12000)throw new Error('入力は12000文字以内にしてください。');
    const clean=text.trim().replace(/−/g,'-').replace(/[，、]/g,',');
    if(!clean)throw new Error('数列を入力してください。');
    // Commas delimit fields; do not silently discard missing CSV entries.
    const chunks=clean.split(',');
    if(chunks.some(s=>!s.trim()))throw new Error('カンマの間に空の値があります。各位置に数値を入力してください。');
    const tokens=chunks.flatMap(s=>s.trim().split(/\s+/));
    if(tokens.length>64)throw new Error('この実験室では1〜64個の値を扱えます。');
    return tokens.map(parseValue);
  }
  function padSequence(x,n){
    if(!Number.isInteger(n)||n<x.length||n>64)throw new Error(`ゼロ埋め先は${x.length}〜64の整数にしてください。値を切り捨てる操作はしません。`);
    return [...x.map(z=>C(z.re,z.im)),...Array.from({length:n-x.length},()=>C())];
  }
  function factorizations(n,min=2){
    const out=[[n]];
    for(let d=min;d*d<=n;d++)if(n%d===0)for(const tail of factorizations(n/d,d))out.push([d,...tail]);
    return out;
  }
  function catalog(n){
    if(!Number.isInteger(n)||n<1||n>64)throw new Error('群の要素数は1〜64です。');
    const list=factorizations(n).map(factors=>{factors=factors.slice().reverse();return {id:'a:'+factors.join('x'),label:factors.map(d=>`ℤ/${d}ℤ`).join(' × '),factors,type:'abelian'};});
    if(n===6)list.push({id:'d:3',label:'S₃ ≅ D₃（三角形・6要素）',type:'dihedral',sides:3});
    if(n===8)list.push({id:'d:4',label:'D₄（正方形・8要素）',type:'dihedral',sides:4});
    return list;
  }
  function coords(i,factors){const a=Array(factors.length);for(let k=factors.length-1;k>=0;k--){a[k]=i%factors[k];i=Math.floor(i/factors[k]);}return a;}
  const index=(a,factors)=>a.reduce((s,v,k)=>s*factors[k]+mod(v,factors[k]),0);
  function abelianGroup(desc){
    const factors=desc.factors,n=factors.reduce((a,b)=>a*b,1),points=Array.from({length:n},(_,i)=>coords(i,factors));
    const label=a=>factors.length===1?String(a[0]):'('+a.join(',')+')';
    return {...desc,n,labels:points.map(label),
      description:`各座標をそれぞれ ${factors.join('、')} で割った余りで足します。右端の座標が先に進む順で、数列を割り当てます。`,
      mul:(a,b)=>index(points[a].map((v,i)=>v+points[b][i]),factors),inv:a=>index(points[a].map(v=>-v),factors),
      generators:factors.map((d,k)=>({index:index(factors.map((_,i)=>+(i===k)),factors),label:`第${k+1}座標を+1（mod ${d}）`})),
      irreps:points.map((freq,k)=>({label:`χ${label(freq)}`,d:1,
        description:k===0?'全点で1となる指標。係数は入力の平均です。':`χ${label(freq)}(g) = exp(2πi Σⱼ kⱼgⱼ/nⱼ)。成分の添字は ${label(freq)}。`,
        at:g=>{const phase=TAU*freq.reduce((s,v,j)=>s+v*points[g][j]/factors[j],0);return[C(Math.cos(phase),Math.sin(phase))];}}))};
  }
  function dihedralGroup(desc){
    const m=desc.sides,n=2*m;
    const labels=Array.from({length:n},(_,g)=>{const a=g%m,b=Math.floor(g/m);return(a===0?'':a===1?'r':`r^${a}`)+(b?'s':'')||'e';});
    const irreps=[];
    for(const er of m%2===0?[1,-1]:[1])for(const es of [1,-1])irreps.push({d:1,label:`χ(r=${er>0?'+1':'−1'},s=${es>0?'+1':'−1'})`,description:`r を ${er}、s を ${es} に写す1次元表現です。`,at:g=>[C(er**(g%m)*es**Math.floor(g/m))]});
    // For D3 and D4 there is exactly one 2D irrep, the geometric representation.
    irreps.push({d:2,label:'ρ（平面の動き）',description:`r は${360/m}°回転、s は diag(1,−1)。座標の取り方を固定した2×2の既約表現です。`,at:g=>{const a=TAU*(g%m)/m,c=Math.cos(a),s=Math.sin(a),sign=g>=m?-1:1;return[c,-s*sign,s,c*sign].map(v=>C(v));}});
    return {...desc,n,labels,irreps,description:`r は${360/m}°回転、s は鏡映。g=r^a s^b、sr=r⁻¹s。列挙順は回転 m=${m}個、次に鏡映 ${m}個です。`,
      mul:(g,h)=>mod(g%m+(g>=m?-1:1)*(h%m),m)+m*((g>=m)^(h>=m)),inv:g=>g>=m?g:mod(-g,m),
      generators:[{index:1,label:'r で移す（回転）'},{index:m,label:'s で移す（鏡映）'}]};
  }
  function makeGroup(id){
    if(id==='d:3'||id==='d:4')return dihedralGroup(catalog(id==='d:3'?6:8).find(g=>g.id===id));
    if(!/^a:\d+(x\d+)*$/.test(id))throw new Error('対応していない群です。');
    const factors=id.slice(2).split('x').map(Number),n=factors.reduce((a,b)=>a*b,1);
    const desc=catalog(n).find(g=>g.id===id);if(!desc)throw new Error('対応していない群です。');
    return abelianGroup(desc);
  }
  function transform(x,group){
    if(x.length!==group.n)throw new Error('入力の個数と群の要素数が一致していません。');
    return group.irreps.map(rep=>{
      const a=Array.from({length:rep.d**2},()=>C());
      x.forEach((v,g)=>{const matrix=rep.at(g);for(let i=0;i<rep.d;i++)for(let j=0;j<rep.d;j++){
        const z=mul(v,conj(matrix[j*rep.d+i])),k=i*rep.d+j;a[k].re+=z.re/group.n;a[k].im+=z.im/group.n;
      }});
      return a;
    });
  }
  function inverse(blocks,group){
    return group.labels.map((_,g)=>group.irreps.reduce((sum,rep,k)=>{
      const m=rep.at(g);for(let i=0;i<rep.d;i++)for(let j=0;j<rep.d;j++){const z=mul(blocks[k][i*rep.d+j],m[j*rep.d+i]);sum.re+=rep.d*z.re;sum.im+=rep.d*z.im;}return sum;
    },C()));
  }
  const energies=(blocks,group)=>blocks.map((block,k)=>group.irreps[k].d*block.reduce((s,z)=>s+abs2(z),0));
  const energy=x=>x.reduce((s,z)=>s+abs2(z),0)/x.length;
  const error=(a,b)=>Math.sqrt(a.reduce((s,z,i)=>s+(z.re-b[i].re)**2+(z.im-b[i].im)**2,0)/a.length);
  const translate=(x,group,h)=>x.map((_,g)=>({...x[group.mul(group.inv(h),g)]}));
  const api={C,add,mul,conj,abs2,parseValue,parseSequence,padSequence,catalog,makeGroup,transform,inverse,energies,energy,error,translate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GroupFourier=api;
})(globalThis);
