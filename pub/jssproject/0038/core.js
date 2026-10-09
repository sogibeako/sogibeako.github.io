(function (root) {
  'use strict';
  const abs = x => x < 0n ? -x : x;
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; }
  function fraction(p, d) {
    if (!d) throw Error('分母は 0 にできません。');
    if (d < 0n) { p = -p; d = -d; }
    const g = gcd(p, d); return { p: p / g, d: d / g };
  }
  function parse(text) {
    text = text.trim();
    if (text.length > 300) throw Error('入力は 300 文字以内にしてください。');
    if (/^[+-]?\d+\s*\/\s*[+-]?\d+$/.test(text)) {
      const [p, d] = text.split('/').map(x => BigInt(x.trim())); return fraction(p, d);
    }
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) throw Error('有理数を 1/7、0.125、-3/2 のように入力してください。');
    const negative = text[0] === '-'; text = text.replace(/^[+-]/, '');
    const [whole, tail = ''] = text.split('.');
    return fraction(BigInt((whole || '0') + tail) * (negative ? -1n : 1n), 10n ** BigInt(tail.length));
  }
  function integer(value, min, max, label) {
    if (!/^[+-]?\d+$/.test(String(value).trim())) throw Error(label + 'は整数で指定してください。');
    const v = BigInt(value);
    if (v < BigInt(min) || v > BigInt(max)) throw Error(`${label}は ${min}〜${max} で指定してください。`);
    return v;
  }
  function sequence(kind, a = '2', b = '1', list = '2,3,4') {
    let q, period = null, label;
    if (kind === 'constant') { const base = integer(a, 2, 1000000, '基数'); q = () => base; period = 1; label = `qₙ = ${base}`; }
    else if (kind === 'factorial') { q = n => BigInt(n + 1); label = 'qₙ = n + 1'; }
    else if (kind === 'primes') {
      const primes = [2n];
      q = n => {
        while (primes.length < n) {
          let candidate = primes[primes.length - 1] + 1n;
          for (;; candidate++) {
            let prime = true;
            for (const divisor of primes) {
              if (divisor * divisor > candidate) break;
              if (candidate % divisor === 0n) { prime = false; break; }
            }
            if (prime) { primes.push(candidate); break; }
          }
        }
        return primes[n - 1];
      };
      label = 'qₙ = pₙ（n 番目の素数）';
    }
    else if (kind === 'exponential') { const base = integer(a, 2, 100, '底'); q = n => base ** BigInt(n); label = `qₙ = ${base}ⁿ`; }
    else if (kind === 'linear') {
      const slope = integer(a, 0, 10000, '係数 A'), offset = integer(b, -9998, 10000, '定数 B');
      if (slope + offset < 2n) throw Error('第 1 桁の基数 A + B を 2 以上にしてください。');
      q = n => slope * BigInt(n) + offset; if (!slope) period = 1; label = `qₙ = ${slope}n + (${offset})`;
    } else if (kind === 'power') {
      const power = parse(a);
      if (power.p < power.d || power.p > 8n * power.d || power.d > 100n) throw Error('指数 k は 1〜8、分母 100 以下の有理数で指定してください。');
      q = n => nthRoot(BigInt(n) ** power.p, power.d) + 1n;
      label = `qₙ = ⌊n^(${format(power.p, power.d)})⌋ + 1`;
    }
    else if (kind === 'cycle') {
      if (list.length > 1500) throw Error('基数列が長すぎます。');
      const bases = list.trim().split(/[,、\s]+/).map(x => integer(x, 2, 1000000, '各基数'));
      if (bases.length > 100) throw Error('基数列は 100 個以内にしてください。');
      q = n => bases[(n - 1) % bases.length]; period = bases.length; label = `qₙ = (${bases.join(', ')}) の繰り返し`;
    } else throw Error('基数の種類を選択してください。');
    return { q, period, label };
  }
  function expand(value, seq, count) {
    count = Number(integer(count, 1, 100, '表示桁数'));
    const { p, d } = value, magnitude = abs(p), whole = magnitude / d;
    let r = magnitude % d, product = 1n, sum = 0n, repeat = null;
    const rows = [], seen = new Map();
    for (let n = 1; n <= count && r; n++) {
      if (seq.period && repeat === null) {
        const key = `${(n - 1) % seq.period}:${r}`;
        if (seen.has(key)) repeat = { start: seen.get(key), length: n - 1 - seen.get(key) };
        else seen.set(key, n - 1);
      }
      const q = seq.q(n), before = r, digit = (r * q) / d;
      r = (r * q) % d; product *= q; sum = sum * q + digit;
      rows.push({ n, q, digit, product, sum, before, r });
    }
    return { value, whole, negative: p < 0n, rows, repeat, remainder: r, product, sum, terminated: r === 0n };
  }
  function format(p, d) { const v = fraction(p, d); return v.d === 1n ? String(v.p) : `${v.p}/${v.d}`; }
  // Integer root: comparison uses only BigInt, so both the floor and perfect
  // power detection remain exact even at a digit boundary.
  function nthRoot(x, degree) {
    if (x < 0n || degree < 1n) throw Error('根の指定が不正です。');
    if (x < 2n || degree === 1n) return x;
    let low = 0n, high = 1n << ((BigInt(x.toString(2).length) + degree - 1n) / degree);
    while (high - low > 1n) {
      const mid = (low + high) / 2n;
      if (mid ** degree <= x) low = mid; else high = mid;
    }
    return high ** degree <= x ? high : low;
  }
  const constantCache = new Map();
  function constantInterval(name) {
    if (constantCache.has(name)) return constantCache.get(name);
    const scale = 10n ** 240n, guard = 10n ** 20n, work = scale * guard;
    let low, high;
    if (name === 'phi') {
      const root = nthRoot(5n * scale * scale, 2n);
      const lower = (scale + root) / 2n;
      const interval = { lower, upper: lower + 1n, scale };
      constantCache.set(name, interval); return interval;
    }
    if (name === 'e') {
      // e = sum 1/n!. Each floored term loses less than one work unit;
      // after the first term smaller than one unit, the full tail is < 2.
      let factorial = 1n, sum = 0n, terms = 0n;
      for (let n = 0n; ; n++) {
        if (n) factorial *= n;
        const term = work / factorial;
        if (!term) break;
        sum += term; terms++;
      }
      low = sum; high = sum + terms + 2n;
    } else {
      // Machin: pi = 16 atan(1/5) - 4 atan(1/239).
      // The alternating-series tail is bounded by the first omitted term.
      const atan = m => {
        let power = m, lo = 0n, hi = 0n;
        for (let k = 0n; ; k++) {
          const term = work / ((2n * k + 1n) * power);
          if (!term) return { lo: lo - 1n, hi: hi + 1n };
          if (k % 2n === 0n) { lo += term; hi += term + 1n; }
          else { lo -= term + 1n; hi -= term; }
          power *= m * m;
        }
      };
      const a = atan(5n), b = atan(239n);
      low = 16n * a.lo - 4n * b.hi;
      high = 16n * a.hi - 4n * b.lo;
    }
    const lower = low / guard;
    if (high / guard !== lower) throw Error('定数の上下限が一致せず、この精度で確定できません。');
    const interval = { lower, upper: lower + 1n, scale };
    constantCache.set(name, interval); return interval;
  }
  function atomicExpression(text) {
    text = text.trim().replace(/−/g, '-');
    if (text.length > 300) throw Error('入力は 300 文字以内にしてください。');
    const constant = /^([+-]?)\s*(e|pi|π|phi|φ|ϕ)$/i.exec(text);
    if (constant) {
      const name = { 'π': 'pi', 'φ': 'phi', 'ϕ': 'phi' }[constant[2].toLowerCase()] || constant[2].toLowerCase();
      return { exact: false, ...constantInterval(name), negative: constant[1] === '-', source: text };
    }
    const unwrap = x => x.startsWith('(') && x.endsWith(')') ? x.slice(1, -1).trim() : x;
    let base, exponent;
    const square = /^(-?)(?:sqrt|√)\s*\(([^()]+)\)$/.exec(text);
    const outerNegative = !!square && square[1] === '-';
    if (square) { base = parse(square[2]); exponent = parse('1/2'); }
    else if (/^√\s*[\d.]+$/.test(text)) { base = parse(text.slice(1)); exponent = parse('1/2'); }
    else if (text.includes('^')) {
      const parts = text.split('^');
      if (parts.length !== 2) throw Error('べき乗は (3/2)^(2/3) のように指定してください。');
      base = parse(unwrap(parts[0].trim())); exponent = parse(unwrap(parts[1].trim()));
    } else return { exact: true, value: parse(text), source: text };
    return rationalPower(base, exponent, text, outerNegative);
  }
  function rationalPower(base, exponent, source = '', outerNegative = false) {
    if (abs(exponent.p) > 100n || exponent.d > 100n) throw Error('指数は約分後の分子の絶対値・分母を 100 以下にしてください。');
    if (BigInt(abs(base.p).toString(2).length + base.d.toString(2).length) * abs(exponent.p) > 160000n) throw Error('計算が大きすぎます。式や指数を小さくしてください。');
    if (base.p < 0n && exponent.d % 2n === 0n) throw Error('負の数の偶数乗根は実数になりません。');
    if (!base.p && exponent.p <= 0n) throw Error('0 の 0 乗・負の数乗は扱えません。');
    const negative = outerNegative || (base.p < 0n && abs(exponent.p) % 2n === 1n);
    let p = abs(base.p) ** abs(exponent.p), d = base.d ** abs(exponent.p);
    if (exponent.p < 0n) [p, d] = [d, p];
    const rp = nthRoot(p, exponent.d), rd = nthRoot(d, exponent.d);
    if (rp ** exponent.d === p && rd ** exponent.d === d) return { exact: true, value: fraction(negative ? -rp : rp, rd), source };
    // Enclose the magnitude between two rational bounds, 240 decimals apart.
    const scale = 10n ** 240n;
    const lower = nthRoot(p * scale ** exponent.d / d, exponent.d);
    return { exact: false, lower, upper: lower + 1n, scale, negative, source };
  }
  function expression(text) {
    text = text.trim().replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    if (!text || text.length > 300) throw Error('式は 1〜300 文字で入力してください。');
    const tokens = text.match(/\d+(?:\.\d*)?|\.\d+|[a-zA-Z]+|[πφϕ√()+\-*/^]|\S/g) || [];
    let pos = 0;
    const scale = 10n ** 240n, zero = {p:0n,d:1n}, one = {p:1n,d:1n};
    const cmp = (a,b) => a.p*b.d-b.p*a.d;
    const neg = a => ({p:-a.p,d:a.d});
    const add = (a,b) => fraction(a.p*b.d+b.p*a.d,a.d*b.d);
    const mul = (a,b) => fraction(a.p*b.p,a.d*b.d);
    const floor = (p,d) => p/d - (p<0n && p%d ? 1n : 0n);
    const rounded = a => ({lo:{p:floor(a.lo.p*scale,a.lo.d),d:scale},hi:{p:-floor(-a.hi.p*scale,a.hi.d),d:scale}});
    const exact = a => cmp(a.lo,a.hi) === 0n;
    const spansZero = a => a.lo.p<=0n && a.hi.p>=0n;
    const wrap = result => result.exact ? {lo:result.value,hi:result.value} : result.negative
      ? {lo:{p:-result.upper,d:result.scale},hi:{p:-result.lower,d:result.scale}}
      : {lo:{p:result.lower,d:result.scale},hi:{p:result.upper,d:result.scale}};
    const bounded = a => {
      if (a.lo.p.toString().length > 10000 || a.lo.d.toString().length > 10000 || a.hi.p.toString().length > 10000 || a.hi.d.toString().length > 10000) throw Error('計算が大きすぎます。式を小さくしてください。');
      return exact(a) ? a : rounded(a);
    };
    function binary(op,a,b) {
      if (op === '+') return bounded({lo:add(a.lo,b.lo),hi:add(a.hi,b.hi)});
      if (op === '-') {
        if (a.key === b.key) return {lo:zero,hi:zero};
        return bounded({lo:add(a.lo,neg(b.hi)),hi:add(a.hi,neg(b.lo))});
      }
      if (op === '/') {
        if (spansZero(b)) throw Error(exact(b) ? '0 で割ることはできません。' : '分母の区間が 0 を含むため、この精度では割り算できません。');
        if (a.key === b.key) return {lo:one,hi:one};
        b = {lo:fraction(b.hi.d,b.hi.p),hi:fraction(b.lo.d,b.lo.p)};
      }
      if (op === '*' || op === '/') {
        const values=[mul(a.lo,b.lo),mul(a.lo,b.hi),mul(a.hi,b.lo),mul(a.hi,b.hi)].sort((x,y)=>cmp(x,y)<0n?-1:cmp(x,y)>0n?1:0);
        return bounded({lo:values[0],hi:values[3]});
      }
      if (!exact(b)) throw Error('指数は有理数になる式で指定してください（例 2、1/2、1+1/3）。');
      const exponent=fraction(b.lo.p,b.lo.d);
      if (spansZero(a) && exponent.p<=0n) throw Error('0 を含む底の 0 乗・負の数乗は計算できません。');
      if (a.lo.p<0n && exponent.d%2n===0n) throw Error('負の数の偶数乗根は実数になりません。');
      const l=wrap(rationalPower(a.lo,exponent)), h=wrap(rationalPower(a.hi,exponent));
      const lowers=[l.lo,h.lo], uppers=[l.hi,h.hi];
      if (spansZero(a) && exponent.p>0n) lowers.push(zero);
      return bounded({lo:lowers.reduce((x,y)=>cmp(x,y)<0n?x:y),hi:uppers.reduce((x,y)=>cmp(x,y)>0n?x:y)});
    }
    function combine(op,a,b) { return {...binary(op,a,b),key:`(${a.key}${op}${b.key})`}; }
    function primary() {
      const token=tokens[pos++];
      if (token === '(') {
        const a=sum(); if (tokens[pos++]!==')') throw Error('閉じ括弧 ) が必要です。'); return a;
      }
      if (token==='√' || token?.toLowerCase()==='sqrt') {
        const a=primary(); return combine('^',a,{lo:{p:1n,d:2n},hi:{p:1n,d:2n},key:'1/2'});
      }
      if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+|e|pi|π|phi|φ|ϕ)$/i.test(token)) throw Error('数・定数・括弧を入力してください。掛け算には * を使います。');
      const a=wrap(atomicExpression(token)); return {...a,key:token.toLowerCase()};
    }
    function power() { const a=primary(); if(tokens[pos]==='^') {pos++; return combine('^',a,unary());} return a; }
    function unary() {
      if(tokens[pos]==='+' || tokens[pos]==='-') { const sign=tokens[pos++], a=unary(); return sign==='+'?a:{lo:neg(a.hi),hi:neg(a.lo),key:`(-${a.key})`}; }
      return power();
    }
    function product() { let a=unary(); while(tokens[pos]==='*'||tokens[pos]==='/') {const op=tokens[pos++];a=combine(op,a,unary());} return a; }
    function sum() { let a=product(); while(tokens[pos]==='+'||tokens[pos]==='-') {const op=tokens[pos++];a=combine(op,a,product());} return a; }
    const result=sum();
    if(pos!==tokens.length) throw Error('式を読み取れません。括弧と演算子を確認してください。');
    if(exact(result)) return {exact:true,value:fraction(result.lo.p,result.lo.d),source:text};
    if(result.lo.p<0n && result.hi.p>0n) throw Error('結果が 0 に近く、この精度では符号を確定できません。式を整理してください。');
    const negative=result.hi.p<=0n;
    const magnitude=rounded(negative?{lo:neg(result.hi),hi:neg(result.lo)}:result);
    return {exact:false,lower:magnitude.lo.p,upper:magnitude.hi.p,scale,negative,source:text};
  }
  function expandExpression(input, seq, count) {
    if (input.exact) return { ...expand(input.value, seq, count), source: input.source };
    count = Number(integer(count, 1, 100, '表示桁数'));
    const d = input.scale, whole = input.lower / d;
    if (input.upper / d !== whole) throw Error('整数部分をこの精度で確定できません。');
    let lo = input.lower % d, hi = input.upper - whole * d, sum = 0n, product = 1n;
    const rows = [];
    for (let n = 1; n <= count; n++) {
      const q = seq.q(n), digit = lo * q / d;
      if (hi * q / d !== digit) break;
      lo = lo * q - digit * d; hi = hi * q - digit * d;
      product *= q; sum = sum * q + digit;
      rows.push({ n, q, digit, product, sum, r: lo, rUpper: hi });
    }
    return { approximate: true, source: input.source, value: { p: input.lower * (input.negative ? -1n : 1n), d }, whole, negative: input.negative, rows, sum, product, remainder: lo, remainderUpper: hi, terminated: false, repeat: null, precisionLimited: rows.length < count };
  }
  function reverse(text, seq, wholeText = '0', negative = false) {
    if (text.length > 25000) throw Error('桁の入力が長すぎます。');
    if (/[,、]\s*[,、]|^[\s]*[,、]|[,、][\s]*$/.test(text)) throw Error('カンマの間に各桁の数字を入力してください。');
    const entries = text.trim() ? text.trim().split(/[,、\s]+/) : [];
    if (entries.length > 100) throw Error('桁は 100 個以内にしてください。');
    if (!/^\d{1,300}$/.test(wholeText.trim())) throw Error('整数部分は 0 以上の整数（300 桁以内）で指定してください。');
    let sum = 0n, product = 1n;
    const rows = entries.map((entry, i) => {
      if (!/^\d+$/.test(entry)) throw Error(`第 ${i + 1} 桁は 0 以上の整数で指定してください。`);
      const digit = BigInt(entry), q = seq.q(i + 1);
      if (digit >= q) throw Error(`第 ${i + 1} 桁は 0〜${q - 1n} で指定してください。`);
      product *= q; sum = sum * q + digit;
      return { n: i + 1, q, digit, product, sum };
    });
    const value = fraction((BigInt(wholeText) * product + sum) * (negative ? -1n : 1n), product);
    return { value, rows, sum, product };
  }
  function decimal(value, places = 24) {
    const scale = 10n ** BigInt(places), magnitude = abs(value.p);
    const tail = ((magnitude % value.d) * scale / value.d).toString().padStart(places, '0');
    return `${value.p < 0n ? '-' : ''}${magnitude / value.d}.${tail}${magnitude * scale % value.d ? '…' : ''}`;
  }
  // Outward rounding for compact, still rigorous, positive interval labels.
  function scientific(p, d, up = false) {
    if (p === 0n) return '0';
    let e = p.toString().length - d.toString().length;
    if (e >= 0 ? p < d * 10n ** BigInt(e) : p * 10n ** BigInt(-e) < d) e--;
    const shift = 7 - e;
    const numerator = shift >= 0 ? p * 10n ** BigInt(shift) : p;
    const denominator = shift >= 0 ? d : d * 10n ** BigInt(-shift);
    const rounded = numerator / denominator + (up && numerator % denominator ? 1n : 0n);
    return `${rounded / 10000000n}.${(rounded % 10000000n).toString().padStart(7, '0')} × 10^${e}`;
  }
  const api = { parse, sequence, expand, fraction, format, nthRoot, expression, expandExpression, reverse, decimal, scientific };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Cantor = api;
})(globalThis);
