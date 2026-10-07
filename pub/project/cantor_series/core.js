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
    else if (kind === 'exponential') { const base = integer(a, 2, 100, '底'); q = n => base ** BigInt(n); label = `qₙ = ${base}ⁿ`; }
    else if (kind === 'linear') {
      const slope = integer(a, 0, 10000, '係数 A'), offset = integer(b, -9998, 10000, '定数 B');
      if (slope + offset < 2n) throw Error('第 1 桁の基数 A + B を 2 以上にしてください。');
      q = n => slope * BigInt(n) + offset; if (!slope) period = 1; label = `qₙ = ${slope}n + (${offset})`;
    } else if (kind === 'power') { const power = integer(a, 1, 8, '指数 k'); q = n => BigInt(n) ** power + 1n; label = `qₙ = n^${power} + 1`; }
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
  const api = { parse, sequence, expand, fraction, format };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Cantor = api;
})(globalThis);
