const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../js/hypercomplex-cli.js');
const { calculate, parseOperands, run } = globalThis.HypercomplexCli;
const basis = (n, i) => Array.from({ length: n }, (_, j) => Number(i === j));
const op = (name, ...values) => calculate(name, values, values[0].length);
const neg = a => a.map(x => -x);
function close(a, b) {
    assert.equal(a.length, b.length);
    a.forEach((value, i) => assert.ok(Math.abs(value - b[i]) < 1e-10, `${a} != ${b}`));
}

test('Hamilton multiplication and noncommutativity', () => {
    const [one, i, j, k] = [0,1,2,3].map(index => basis(4, index));
    close(op('mul', i, j), k);
    close(op('mul', j, k), i);
    close(op('mul', k, i), j);
    close(op('mul', j, i), neg(k));
    for (const unit of [i,j,k]) close(op('mul', unit, unit), neg(one));
    close(op('mul', [1,2,3,4], [5,6,7,8]), [-60,12,30,24]);
});

test('octonion basis convention and nonassociativity', () => {
    const e = Array.from({length:8}, (_, i) => basis(8, i));
    for (let i = 1; i < 8; i++) {
        close(op('mul', e[i], e[i]), neg(e[0]));
        for (let j = i + 1; j < 8; j++) close(op('mul', e[i], e[j]), neg(op('mul', e[j], e[i])));
    }
    close(op('mul', e[1], e[4]), e[5]);
    close(op('mul', e[2], e[4]), e[6]);
    close(op('mul', e[3], e[4]), e[7]);
    close(op('mul', op('mul', e[1], e[2]), e[4]), e[7]);
    close(op('mul', e[1], op('mul', e[2], e[4])), neg(e[7]));
});

test('norm, conjugation, inverse and right division identities', () => {
    for (const n of [4,8]) {
        const a = Array.from({length:n}, (_, i) => i - 3);
        const b = Array.from({length:n}, (_, i) => 2 * i + 1);
        close(op('sub', op('add', a, b), b), a);
        close(op('mul', a, op('conj', a)), basis(n, 0).map(x => x * op('norm', a) ** 2));
        close(op('mul', a, op('inv', a)), basis(n, 0));
        close(op('mul', op('inv', a), a), basis(n, 0));
        close(op('mul', op('div', a, b), b), a);
        close(op('conj', op('mul', a, b)), op('mul', op('conj', b), op('conj', a)));
        close([op('norm', op('mul', a, b))], [op('norm', a) * op('norm', b)]);
        close(op('mul', a, op('mul', a, b)), op('mul', op('mul', a, a), b));
    }
    assert.equal(op('norm', [1e200,0,0,0]), 1e200);
    assert.equal(op('inv', [1e200,0,0,0])[0], 1e-200);
});

test('input validation and errors', () => {
    assert.deepEqual(parseOperands('[1, 2,3,4] [5,6,7,8]', 4), [[1,2,3,4],[5,6,7,8]]);
    for (const input of ['[]', '[1,2,3]', '[1,2,3,4,5]', '[null,0,0,0]', '["1",0,0,0]', '[1e999,0,0,0]', '[1,2,3,4] junk']) {
        assert.throws(() => parseOperands(input, 4));
    }
    assert.throws(() => op('inv', [0,0,0,0]), /0/);
    assert.throws(() => op('div', [1,0,0,0], [0,0,0,0]), /0/);
    assert.throws(() => op('mul', [1,0,0,0]));
    assert.throws(() => op('toString', [1,0,0,0]));
    assert.throws(() => op('mul', [1e308,0,0,0], [1e308,0,0,0]), /範囲/);
});

test('CLI output, help and character messages', () => {
    const lines = [], messages = [];
    const print = (...args) => lines.push(args);
    const say = (...args) => messages.push(args);
    run(4, ['mul', '[0,1,0,0]', '[0,0,1,0]'], print, say);
    assert.match(lines.at(-1)[0], /\[0, 0, 0, 1\]/);
    assert.equal(messages.at(-1)[1], 'happy');
    run(8, ['help'], print, say);
    assert.ok(lines.some(([text]) => text.includes('右除算')));
    run(4, ['inv', '[0,0,0,0]'], print, say);
    assert.equal(lines.at(-1)[1], 'danger');
    assert.equal(messages.at(-1)[1], 'thinking');
});
