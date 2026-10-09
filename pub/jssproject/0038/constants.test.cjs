const assert = require('node:assert/strict');
const C = require('./core.js');
const decimal = C.sequence('constant', '10');
const cases = [
  ['e', 2n, '71828182845904523536028747135266249775724709369995'],
  ['pi', 3n, '14159265358979323846264338327950288419716939937510'],
  ['phi', 1n, '61803398874989484820458683436563811772030917980576'],
];
for (const [name, whole, digits] of cases) {
  const input = C.expression(name);
  const result = C.expandExpression(input, decimal, digits.length);
  assert.equal(result.whole, whole);
  assert.equal(result.rows.map(r => r.digit).join(''), digits);
  assert.equal(input.upper - input.lower, 1n);
  assert.equal(input.scale, 10n ** 240n);
  assert.equal(result.terminated, false);
  assert.equal(result.repeat, null);
  assert.equal(C.expression('-' + name).negative, true);
  assert.equal(C.expression('-' + name).lower, input.lower);
  assert.equal(C.expandExpression(input, C.sequence('exponential','100'),100).precisionLimited, true);
}
for (const [alias, name] of [['π','pi'],['PI','pi'],['φ','phi'],['ϕ','phi'],['PHI','phi'],['E','e']]) {
  assert.equal(C.expression(alias).lower, C.expression(name).lower);
}
assert.equal(C.expression(' −π ').negative, true);
assert.equal(C.expression('+phi').negative, false);
// Independent rational bounds for e from a factorial partial sum and its tail.
let factorial=1n, numerator=1n;
for (let n=1n;n<=200n;n++) { factorial*=n; numerator=numerator*n+1n; }
const e=C.expression('e');
assert.ok(numerator*e.scale > e.lower*factorial);
assert.ok((numerator*200n+1n)*e.scale < e.upper*factorial*200n);
// The positive root of x^2-x-1 lies strictly between the phi bounds.
const phi=C.expression('phi');
assert.ok(phi.lower**2n-phi.lower*phi.scale-phi.scale**2n < 0n);
assert.ok(phi.upper**2n-phi.upper*phi.scale-phi.scale**2n > 0n);
console.log('Passed: e/pi/phi digits, aliases, signs, certified e/phi bounds, precision stopping.');
