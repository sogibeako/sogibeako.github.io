// Test script for RegSum Lab math engine
// Run: node test.js

// Inline the engine for Node.js testing
const fs = require('fs');
eval(fs.readFileSync('./engine.js', 'utf8'));

function assert(cond, msg) {
    if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; }
    else console.log('PASS:', msg);
}
function near(a, b, tol, msg) {
    const diff = Math.abs(a - b);
    if (diff > tol) { console.error(`FAIL: ${msg} — got ${a}, expected ${b}, diff=${diff.toExponential(3)}`); process.exitCode = 1; }
    else console.log(`PASS: ${msg} — got ${a} (diff=${diff.toExponential(3)})`);
}

console.log('=== Bernoulli Tests ===');
near(BERNOULLI[0], 1, 1e-15, 'B_0 = 1');
near(BERNOULLI[1], -0.5, 1e-15, 'B_1 = -1/2');
near(BERNOULLI[2], 1 / 6, 1e-15, 'B_2 = 1/6');

console.log('\n=== Bernoulli Polynomial Tests ===');
near(bernoulliPoly(0, 0.5), 1, 1e-14, 'B_0(0.5) = 1');
near(bernoulliPoly(1, 0), -0.5, 1e-14, 'B_1(0) = -1/2');
near(bernoulliPoly(1, 1), 0.5, 1e-14, 'B_1(1) = 1/2');
near(bernoulliPoly(2, 0), 1 / 6, 1e-14, 'B_2(0) = 1/6');

console.log('\n=== Hurwitz ζ(-k,a) Tests ===');
// ζ(0) = -1/2
near(hurwitzZetaNeg(0, 1), -0.5, 1e-14, 'ζ(0,1) = ζ(0) = -1/2');
// ζ(-1) = -1/12
near(hurwitzZetaNeg(1, 1), -1 / 12, 1e-14, 'ζ(-1,1) = ζ(-1) = -1/12');
// ζ(-2) = 0
near(hurwitzZetaNeg(2, 1), 0, 1e-14, 'ζ(-2,1) = ζ(-2) = 0');
// ζ(-3) = 1/120
near(hurwitzZetaNeg(3, 1), 1 / 120, 1e-14, 'ζ(-3,1) = ζ(-3) = 1/120');

console.log('\n=== T001: a_n = 1, expected Reg = -1/2 ===');
const r1 = runFullAnalysis('1', '', 4096);
const h1 = r1.results.find(r => r.method === 'hurwitz');
near(h1.value, -0.5, 1e-10, 'T001 Hurwitz = -0.5');
assert(h1.status === 'success', 'T001 Hurwitz status = success');
const e1 = r1.results.find(r => r.method === 'expCutoff');
near(e1.value, -0.5, 1e-2, 'T001 ExpCutoff ≈ -0.5');

console.log('\n=== T002: a_n = n, expected Reg = -1/12 ===');
const r2 = runFullAnalysis('n', '', 4096);
const h2 = r2.results.find(r => r.method === 'hurwitz');
near(h2.value, -1 / 12, 1e-10, 'T002 Hurwitz = -1/12');
const e2 = r2.results.find(r => r.method === 'expCutoff');
near(e2.value, -1 / 12, 1e-2, 'T002 ExpCutoff ≈ -1/12');

console.log('\n=== T003: a_n = n^2, expected Reg = 0 ===');
const r3 = runFullAnalysis('n**2', '', 4096);
const h3 = r3.results.find(r => r.method === 'hurwitz');
near(h3.value, 0, 1e-10, 'T003 Hurwitz = 0');
const e3 = r3.results.find(r => r.method === 'expCutoff');
near(e3.value, 0, 5e-2, 'T003 ExpCutoff ≈ 0');

console.log('\n=== T201: a_n = 1+n, expected Reg = -7/12 ===');
const r201 = runFullAnalysis('1+n', '', 4096);
const h201 = r201.results.find(r => r.method === 'hurwitz');
near(h201.value, -7 / 12, 1e-10, 'T201 Hurwitz(1+n) = -7/12');

console.log('\n=== T202: a_n = 3*n, expected Reg = -1/4 ===');
const r202 = runFullAnalysis('3*n', '', 4096);
const h202 = r202.results.find(r => r.method === 'hurwitz');
near(h202.value, -1 / 4, 1e-10, 'T202 Hurwitz(3n) = -1/4');

console.log('\n=== T703: a_n = (-1)^n, Hurwitz & Cesàro ===');
const r703 = runFullAnalysis('(-1)**n', '', 4096);
const h703 = r703.results.find(r => r.method === 'hurwitz');
console.log('  Hurwitz status:', h703.status, 'value:', h703.value);
const c703 = r703.results.find(r => r.method === 'cesaro');
console.log('  Cesàro status:', c703.status, 'value:', c703.value);
const a703 = r703.results.find(r => r.method === 'abel');
console.log('  Abel status:', a703.status, 'value:', a703.value);

console.log('\n=== T401: a_n = floor(sqrt(n)), Hurwitz not_applicable ===');
const r401 = runFullAnalysis('floor(sqrt(n))', '', 4096);
const h401 = r401.results.find(r => r.method === 'hurwitz');
assert(h401.status === 'not_applicable', 'T401 Hurwitz = not_applicable');
const e401 = r401.results.find(r => r.method === 'expCutoff');
assert(e401.status === 'success', 'T401 ExpCutoff = success');
console.log('  ExpCutoff value:', e401.value);

console.log('\n=== T301: a_n = 1 + 0.001*sin(n), expected ≈ -0.5 ===');
const r301 = runFullAnalysis('1 + 0.001*sin(n)', '', 4096);
const h301 = r301.results.find(r => r.method === 'hurwitz');
console.log('  Hurwitz status:', h301.status, 'value:', h301.value);
if (h301.status === 'success') near(h301.value, -0.5, 0.1, 'T301 Hurwitz ≈ -0.5');

console.log('\n=== Ensemble Agreement ===');
console.log('T001 ensemble:', r1.ensemble);
console.log('T002 ensemble:', r2.ensemble);

console.log('\n=== All T001 methods ===');
r1.results.forEach(r => console.log(`  ${r.method}: status=${r.status}, value=${r.value}, stability=${r.stability}`));

console.log('\n=== Done ===');
