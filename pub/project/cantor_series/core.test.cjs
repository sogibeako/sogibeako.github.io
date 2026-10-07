const assert = require('node:assert/strict');
const C = require('./core.js');
const run = (x, kind, a, b, list, count = 24) => C.expand(C.parse(x), C.sequence(kind, a, b, list), count);
assert.deepEqual(C.parse('0.125'), {p:1n,d:8n});
assert.deepEqual(C.parse('3/-6'), {p:-1n,d:2n});
assert.throws(() => C.parse('1/0'));
assert.throws(() => C.parse('1e3'));
assert.throws(() => C.sequence('linear', '1', '-1'));
assert.throws(() => C.sequence('cycle', '2', '1', '2,1'));
assert.equal(run('1/7','factorial').terminated, true);
assert.deepEqual(run('1/7','factorial').rows.map(r=>r.digit), [0n,0n,3n,2n,0n,6n]);
assert.deepEqual(run('1/7','constant','10').repeat, {start:0,length:6});
assert.deepEqual(run('1/6','constant','10').repeat, {start:1,length:1});
assert.equal(run('5/8','exponential','2').terminated,true);
assert.equal(run('5/8','exponential','2').product,8n);
assert.equal(run('-3/2','constant','10').negative,true);
assert.equal(run('3','factorial').rows.length,0);
assert.equal(run('0','factorial').terminated,true);
// Exact reconstruction and digit bounds across different bases and signs.
let cases = 0;
for (const kind of ['constant','factorial','exponential','linear','power','cycle']) {
  for (let p=-15;p<=15;p++) for (let d=1;d<=23;d++) {
    const result = run(`${p}/${d}`, kind, '2', '1', '2,3,5');
    const magnitude = result.value.p < 0n ? -result.value.p : result.value.p;
    assert.equal(magnitude * result.product, result.whole * result.value.d * result.product + result.sum * result.value.d + result.remainder);
    for (const row of result.rows) assert.ok(row.digit >= 0n && row.digit < row.q);
    cases++;
  }
}
const large = run('123456789012345678901/999999999999999999999','exponential','100',undefined,undefined,100);
assert.equal(large.rows.length,100);
assert.equal(large.product,100n**5050n);
console.log(`Passed: known expansions, validation, large integers, ${cases} exact reconstruction cases.`);
