const assert = require('node:assert/strict');
const C = require('./core.js');
const decimal = C.sequence('constant', '10');
const sqrt2 = C.expression('sqrt(2)');
assert.equal(sqrt2.exact, false);
assert.ok(sqrt2.lower ** 2n < 2n * sqrt2.scale ** 2n);
assert.ok(sqrt2.upper ** 2n > 2n * sqrt2.scale ** 2n);
const expanded = C.expandExpression(sqrt2, decimal, 50);
assert.equal(expanded.whole, 1n);
assert.equal(expanded.rows.map(r => r.digit).join(''), '41421356237309504880168872420969807856967187537694');
assert.equal(expanded.terminated, false);
assert.equal(expanded.repeat, null);
assert.deepEqual(C.expression('(16/81)^(3/4)').value, {p:8n,d:27n});
assert.deepEqual(C.expression('2^(-3)').value, {p:1n,d:8n});
assert.deepEqual(C.expression('(-8)^(1/3)').value, {p:-2n,d:1n});
assert.deepEqual(C.expression('sqrt(0)').value, {p:0n,d:1n});
assert.deepEqual(C.expression('-sqrt(4)').value, {p:-2n,d:1n});
assert.equal(C.expandExpression(C.expression('-sqrt(2)'), decimal, 20).negative,true);
assert.equal(C.expression('√2').lower,sqrt2.lower);
for (const expression of ['(-2)^(1/2)', '0^(-1)', '0^0', '2^(1/101)', '2^101', 'alert(1)', '2^2^2', 'pi']) assert.throws(() => C.expression(expression));
const limited = C.expandExpression(sqrt2,C.sequence('exponential','100'),100);
assert.equal(limited.precisionLimited,true);
assert.ok(limited.rows.length > 0 && limited.rows.length < 100);
// Every accepted prefix brackets sqrt(2), independently of the evaluator.
for (const row of limited.rows) {
  const lower = expanded.whole * row.product + row.sum;
  assert.ok(lower ** 2n < 2n * row.product ** 2n);
  assert.ok((lower + 1n) ** 2n > 2n * row.product ** 2n);
}
const k = C.sequence('power','3/2');
assert.deepEqual([1,2,3,4,5,9].map(n=>k.q(n)),[2n,3n,6n,9n,12n,28n]);
assert.throws(()=>C.sequence('power','1/2'));
assert.throws(()=>C.reverse('0,3',C.sequence('factorial')));
assert.throws(()=>C.reverse('-1',decimal));
assert.throws(()=>C.reverse('1,,2',decimal));
assert.throws(()=>C.reverse('1',decimal,'-1'));
assert.equal(C.format(...Object.values(C.reverse('0,0,3,2,0,6',C.sequence('factorial')).value)), '1/7');
assert.deepEqual(C.reverse('5',decimal,'1',true).value,{p:-3n,d:2n});
assert.deepEqual(C.reverse('',decimal,'2').value,{p:2n,d:1n});
assert.equal(C.decimal({p:1n,d:3n},4),'0.3333…');
assert.equal(C.scientific(1n,3n),'3.3333333 × 10^-1');
assert.equal(C.scientific(1n,3n,true),'3.3333334 × 10^-1');
assert.equal(C.scientific(1n,10n**40n),'1.0000000 × 10^-40');
for (const kind of ['factorial','constant','power','cycle','exponential']) {
  const seq=C.sequence(kind,'2','1','2,3');
  for(let p=-12;p<=12;p++) {
    const result=C.expand(C.parse(`${p}/11`),seq,20);
    const reverse=C.reverse(result.rows.map(r=>r.digit).join(','),seq,String(result.whole),result.negative);
    const delta=result.value.p*reverse.value.d-reverse.value.p*result.value.d;
    assert.equal((delta<0n?-delta:delta)*result.product,result.remainder*reverse.value.d);
  }
}
console.log('Passed: certified irrational digits, exact powers, precision stopping, rational base exponents, reverse conversions, invalid input.');
