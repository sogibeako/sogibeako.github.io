/* A small, bounded expression parser; never evaluates JavaScript. */
(function (root) {
  'use strict';
  const funcs = Object.freeze({
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    exp: Math.exp, log: Math.log, sqrt: Math.sqrt, abs: Math.abs, sign: Math.sign,
    floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max,
    tanh: Math.tanh, pow: Math.pow, step: x => +(x >= 0),
    i32: x => x | 0, u32: x => x >>> 0, band: (a,b) => a & b, bor: (a,b) => a | b,
    bxor: (a,b) => a ^ b, bnot: a => ~a, shl: (a,b) => a << b, shr: (a,b) => a >> b,
    ushr: (a,b) => a >>> b, rol: (a,b) => (a << b) | (a >>> (32-b)),
    ror: (a,b) => (a >>> b) | (a << (32-b)), and: (a,b) => !!a && !!b,
    or: (a,b) => !!a || !!b, not: a => !a,
  });
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  function expression(src, allowed) {
    const tokens = []; let pos = 0;
    while (pos < src.length) {
      if (/\s/.test(src[pos])) { pos++; continue; }
      const m = src.slice(pos).match(/^(?:(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z0-9_]*|<=|>=|==|!=|[+*/%^(),?:<>!-])/);
      if (!m) throw new Error(`使えない文字です: ${src[pos]}`);
      tokens.push(m[0]); pos += m[0].length;
    }
    if (tokens.length > 300) throw new Error('1つの式を短くしてください（最大300トークン）。');
    let index = 0;
    const peek = () => tokens[index];
    const take = () => tokens[index++];
    const expect = t => { if (take() !== t) throw new Error(`「${t}」が必要です。`); };
    function atom() {
      const t = take();
      if (t === '(') { const x = ternary(); expect(')'); return x; }
      if (t && /^(\d|\.)/.test(t)) { const n = Number(t); return () => n; }
      if (t && /^[A-Za-z_]/.test(t)) {
        if (peek() === '(') {
          if (!own(funcs,t)) throw new Error(`未対応の関数: ${t}`);
          take(); const args = [];
          if (peek() !== ')') { do { args.push(ternary()); if (peek() !== ',') break; take(); } while (true); }
          expect(')'); return scope => funcs[t](...args.map(f => f(scope)));
        }
        if (!allowed.has(t)) throw new Error(`未定義の変数: ${t}`);
        return scope => scope[t];
      }
      throw new Error('数値・変数・関数または括弧を確認してください。');
    }
    function power() { const a = atom(); if (peek() === '^') { take(); const b = unary(); return s => a(s) ** b(s); } return a; }
    function unary() {
      if (['+', '-', '!', 'not'].includes(peek()) && tokens[index + 1] !== '(') {
        const op = take(), a = unary(); return s => op === '-' ? -a(s) : op === '+' ? +a(s) : !a(s);
      }
      // Unary +/- must also work immediately before a parenthesized expression.
      if (peek() === '+' || peek() === '-') { const op = take(), a = unary(); return s => op === '-' ? -a(s) : +a(s); }
      return power();
    }
    function product() {
      let a = unary(); while (['*','/','%'].includes(peek())) {
        const op = take(), left = a, b = unary(); a = s => op === '*' ? left(s)*b(s) : op === '/' ? left(s)/b(s) : left(s)%b(s);
      } return a;
    }
    function sum() { let a = product(); while (['+','-'].includes(peek())) { const op=take(), left=a, b=product(); a=s=>op==='+'?left(s)+b(s):left(s)-b(s); } return a; }
    const comparisons = { '<': (a,b)=>a<b, '>': (a,b)=>a>b, '<=':(a,b)=>a<=b, '>=':(a,b)=>a>=b, '==':(a,b)=>a===b, '!=':(a,b)=>a!==b };
    function compare() {
      const args=[sum()], ops=[];
      while (own(comparisons,peek())) { ops.push(take()); args.push(sum()); }
      return ops.length ? s => { const values=args.map(f=>f(s)); return ops.every((op,i)=>comparisons[op](values[i],values[i+1])); } : args[0];
    }
    function conjunction() { let a=compare(); while(peek()==='and') {take(); const left=a,b=compare(); a=s=>!!left(s)&&!!b(s);} return a; }
    function disjunction() { let a=conjunction(); while(peek()==='or') {take(); const left=a,b=conjunction(); a=s=>!!left(s)||!!b(s);} return a; }
    function ternary() {const a=disjunction(); if(peek()==='?') {take();const b=ternary();expect(':');const c=ternary();return s=>a(s)?b(s):c(s);}return a;}
    const result = ternary();
    if (index !== tokens.length) throw new Error(`式を読み取れません: ${peek()}（掛け算は * で書きます）`);
    return result;
  }
  function compile(src) {
    if (!src.trim() || src.length > 6000) throw new Error('数式は1〜6000文字で入力してください。');
    const lines = src.split(/\r?\n/).map(s => s.split('#')[0].split('//')[0].trim()).filter(Boolean);
    if (lines.length > 60) throw new Error('数式は60行以内で入力してください。');
    const allowed = new Set(['ph','t','sr','pi','e']), assignments=[]; let output=null;
    lines.forEach((line,i) => {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*(.+)$/);
      if (m) {
        const name=m[1];
        if (allowed.has(name) || own(funcs,name) || ['__proto__','constructor','prototype','and','or','not'].includes(name)) throw new Error(`変数名を変更してください: ${name}`);
        assignments.push([name,expression(m[2],allowed)]); allowed.add(name);
      } else { if(i !== lines.length-1) throw new Error('出力式は最後の行に1つ書いてください。'); output=expression(line,allowed); }
    });
    if(!output) throw new Error('最後の行に出力式を書いてください。');
    return (ph,base=220,n=16) => {
      const s=Object.assign(Object.create(null),{ph,t:ph/base,sr:base*n,pi:Math.PI,e:Math.E});
      for(const [name,fn] of assignments) s[name]=fn(s);
      const v=Number(output(s));
      if(!Number.isFinite(v) || Math.abs(v)>1e6) throw new Error(`ph=${ph.toFixed(4)} で値が有限でないか、大きすぎます（絶対値100万まで）。`);
      return v;
    };
  }
  const api={compile};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Formula=api;
})(typeof globalThis!=='undefined'?globalThis:this);
