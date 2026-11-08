const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const lib = require('../js/ml-matrix-6.15.1.js');
require('../js/matrix-cli.js');
const { parseMatrices, calculate } = globalThis.MatrixCli;
const calc = (op, text) => calculate(op, parseMatrices(text), lib);

function close(actual, expected, tolerance = 1e-10) {
    assert.equal(actual.length, expected.length);
    actual.forEach((row, i) => {
        assert.equal(row.length, expected[i].length);
        row.forEach((v, j) => assert.ok(Math.abs(v - expected[i][j]) <= tolerance, `${v} != ${expected[i][j]}`));
    });
}

test('addition, rectangular multiplication and inverse', () => {
    close(calc('add', '[[1, 2], [3,4]] [[5,6],[7,8]]').rows, [[6,8],[10,12]]);
    close(calc('mul', '[[1,2,3],[4,5,6]] [[1],[2],[3]]').rows, [[14],[32]]);
    close(calc('inv', '[[1,2],[3,4]]').rows, [[-2,1],[1.5,-0.5]]);
    close(calc('inv', '[[1e-100]]').rows, [[1e100]], 1e86);
});

test('real, repeated and complex eigenvalues', () => {
    assert.deepEqual(calc('eig', '[[2,0],[0,2]]').eigenvalues, [{real:2,imaginary:0},{real:2,imaginary:0}]);
    const complex = calc('eig', '[[0,-1],[1,0]]').eigenvalues;
    assert.deepEqual(complex.map(v => v.real), [0,0]);
    assert.deepEqual(complex.map(v => v.imaginary).sort(), [-1,1]);
    const real = calc('eig', '[[1,2],[0,3]]').eigenvalues.map(v => v.real).sort();
    close([real], [[1,3]]);
});

test('pseudoinverse satisfies all four Moore-Penrose conditions', () => {
    for (const rows of [[[1,2,3],[2,4,6]], [[1,2],[3,4],[5,6]], [[0,0,0],[0,0,0]]]) {
        const a = new lib.Matrix(rows);
        const p = new lib.Matrix(calculate('pinv', [rows], lib).rows);
        const ap = a.mmul(p);
        const pa = p.mmul(a);
        close(ap.mmul(a).to2DArray(), rows);
        close(pa.mmul(p).to2DArray(), p.to2DArray());
        close(ap.to2DArray(), ap.transpose().to2DArray());
        close(pa.to2DArray(), pa.transpose().to2DArray());
    }
});

test('invalid input, dimensions, singularity and overflow report errors', () => {
    for (const input of ['[]', '[[1],[2,3]]', '[[null]]', '[["1"]]', '[[1e999]]', '[[1]', '[[1]] junk', '[1,2]']) {
        assert.throws(() => parseMatrices(input));
    }
    assert.throws(() => calc('inv', '[[1,2],[2,4]]'), /pinv/);
    assert.throws(() => calc('eig', '[[1,2]]'), /正方/);
    assert.throws(() => calc('add', '[[1]] [[1,2]]'));
    assert.throws(() => calc('mul', '[[1,2]] [[1,2]]'));
    assert.throws(() => calc('add', '[[1]]'));
    assert.throws(() => calc('mul', '[[1e308]] [[1e308]]'), /範囲/);
    assert.throws(() => parseMatrices(JSON.stringify([Array(65).fill(1)])));
});

test('CLI help is lazy; first operation loads once, output and errors are printable', async () => {
    let loads = 0;
    const output = [];
    const context = vm.createContext({ document: {
        createElement: () => ({ remove() {} }),
        head: { appendChild(script) { loads++; context.mlMatrix = lib; script.onload(); } }
    } });
    vm.runInContext(fs.readFileSync(require.resolve('../js/matrix-cli.js'), 'utf8'), context);
    const print = (text, type) => output.push({text, type});
    await context.MatrixCli.run([], print);
    assert.equal(loads, 0);
    await context.MatrixCli.run(['eig', '[[0,-1],[1,0]]'], print);
    assert.ok(output.some(v => v.text.includes('+ 1i')));
    assert.ok(output.some(v => v.text.includes('- 1i')));
    await context.MatrixCli.run(['inv', '[[1,2],[2,4]]'], print);
    assert.equal(loads, 1);
    assert.equal(output.at(-1).type, 'danger');
});
