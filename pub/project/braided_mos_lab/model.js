/* Pure model: identifiers are never sorted, merged or octave-wrapped. */
(function(root) {
  'use strict';
  function pitches(u, word = 'LLsLLLs', period = 1200) {
    const a = [...word].filter(c => c === 'L').length, b = word.length - a;
    if (!/^[Ls]{2,15}$/.test(word) || !a || !b || !Number.isFinite(period) || period <= 0 || !Number.isFinite(u) || u < 0 || u > 1) throw Error('Invalid scale');
    const L = period * (1 - b * u) / a, s = period * u;
    const notes = [0];
    for (const c of word) notes.push(notes.at(-1) + (c === 'L' ? L : s));
    return {L, s, notes};
  }
  function permutation(text, n) {
    const tokens = text.trim().split(/[\s,]+/);
    if (tokens.length !== n || tokens.some(t => !/^\d+$/.test(t))) throw Error(`0〜${n-1}を一度ずつ入力してください。`);
    const ids = tokens.map(Number);
    if (new Set(ids).size !== n || ids.some(i => i < 0 || i >= n)) throw Error(`0〜${n-1}を一度ずつ入力してください。`);
    return ids;
  }
  function balanced(word) {
    for(let size=1; size<word.length; size++) {
      const counts = [...word].map((_,i) => [...(word+word).slice(i,i+size)].filter(c=>c==='L').length);
      if(Math.max(...counts)-Math.min(...counts)>1) return false;
    }
    return true;
  }
  function positionFromRatio(text, word='LLsLLLs') {
    pitches(0,word); // Validate the current step word.
    const normalized=text.normalize('NFKC').replace(/−/g,'-').trim();
    const number='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
    const match=normalized.match(new RegExp(`^(${number})\\s*:\\s*(${number})$`));
    if(!match)throw Error('「2:1」のように、2つの数値をコロンで区切って入力してください。');
    let L=Number(match[1]),s=Number(match[2]);
    const magnitude=Math.max(Math.abs(L),Math.abs(s));
    if(!Number.isFinite(magnitude)||magnitude===0)throw Error('有限の数値を指定してください。0:0 は指定できません。');
    L/=magnitude;s/=magnitude;
    const a=[...word].filter(c=>c==='L').length,b=word.length-a,total=a*L+b*s;
    if(total===0)throw Error(`${a}L + ${b}s = 0 となる比率は、固定周期に正規化できません。`);
    const u=s/total;
    if(!Number.isFinite(u)||u < -1e-12||u > 1+1e-12)throw Error('この比率は現在の音階の u=0〜1 の範囲外です。');
    return Math.max(0,Math.min(1,u));
  }
  const frequency = (cent, ref=261.6255653005986) => ref * 2 ** (cent / 1200);
  const rampValue = (r,t) => r.from * (r.to/r.from) ** Math.max(0,Math.min(1,(t-r.start)/Math.max(1e-9,r.end-r.start)));
  const api = {pitches, permutation, balanced, positionFromRatio, frequency, rampValue};
  if(typeof module !== 'undefined') module.exports=api; else root.MOS=api;
})(globalThis);
