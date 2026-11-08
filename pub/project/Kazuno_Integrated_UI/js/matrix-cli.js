(function (root) {
    'use strict';

    const help = [
        'matrix add [[1,2],[3,4]] [[5,6],[7,8]]  : 和',
        'matrix mul [[1,2],[3,4]] [[5],[6]]      : 行列積',
        'matrix eig [[0,-1],[1,0]]             : 固有値 (複素数にも対応)',
        'matrix inv [[1,2],[3,4]]              : 逆行列',
        'matrix pinv [[1,2,3],[2,4,6]]         : Moore-Penrose 疑似逆行列',
        '各行を [] で囲み、数値をカンマで区切ります。空白も使用できます。',
        '実数の行列、最大64行×64列。結果は数値近似で、有効数字12桁を表示します。',
        'inv / eig は正方行列、add は同じ形、mul は左の列数と右の行数が必要です。'
    ];
    let loading;

    function loadLibrary() {
        if (root.mlMatrix) return Promise.resolve(root.mlMatrix);
        if (!loading) {
            loading = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'js/ml-matrix-6.15.1.js';
                script.onload = () => root.mlMatrix ? resolve(root.mlMatrix) : fail();
                function fail() {
                    script.remove();
                    loading = null;
                    reject(new Error('行列ライブラリを読み込めません。js/ml-matrix-6.15.1.js の配置を確認してください。'));
                }
                script.onerror = fail;
                document.head.appendChild(script);
            });
        }
        return loading;
    }

    function parseMatrices(source) {
        // Wrap adjacent JSON arrays in one JSON array, preserving whitespace inside rows.
        const parts = [];
        let depth = 0;
        let start = -1;
        for (let i = 0; i < source.length; i++) {
            const ch = source[i];
            if (ch === '[') {
                if (depth++ === 0) start = i;
            } else if (ch === ']') {
                if (--depth < 0) throw new Error('角括弧 [] の対応を確認してください。');
                if (depth === 0) parts.push(source.slice(start, i + 1));
            } else if (depth === 0 && !/\s/.test(ch)) {
                throw new Error('行列は [[1,2],[3,4]] の形式で、空白で区切って入力してください。');
            }
        }
        if (depth !== 0) throw new Error('角括弧 [] の対応を確認してください。');
        let matrices;
        try { matrices = JSON.parse('[' + parts.join(',') + ']'); }
        catch (_) { throw new Error('行列の数値・カンマ・角括弧を確認してください。'); }
        for (const rows of matrices) {
            const cols = Array.isArray(rows[0]) ? rows[0].length : 0;
            if (!rows.length || !cols || rows.length > 64 || cols > 64 ||
                !rows.every(row => Array.isArray(row) && row.length === cols && row.every(Number.isFinite))) {
                throw new Error('行列は1～64行・1～64列の実数で指定し、各行の列数を揃えてください。');
            }
        }
        return matrices;
    }

    function calculate(operation, arrays, lib) {
        const binary = operation === 'add' || operation === 'mul';
        if (!['add', 'mul', 'eig', 'inv', 'pinv'].includes(operation)) throw new Error('matrix help でコマンド一覧を確認してください。');
        if (arrays.length !== (binary ? 2 : 1)) throw new Error(`この操作には行列が${binary ? 2 : 1}個必要です。`);
        const a = new lib.Matrix(arrays[0]);
        let result;
        if (binary) {
            const b = new lib.Matrix(arrays[1]);
            if (operation === 'add') {
                if (a.rows !== b.rows || a.columns !== b.columns) throw new Error('和を求める行列の行数・列数を揃えてください。');
                result = a.add(b);
            } else {
                if (a.columns !== b.rows) throw new Error('左の行列の列数と、右の行列の行数を揃えてください。');
                result = a.mmul(b);
            }
        } else {
            if (operation !== 'pinv' && !a.isSquare()) throw new Error('この操作には正方行列が必要です。');
            const scale = a.norm('max') || 1;
            const normalized = a.clone().div(scale);
            if (operation === 'eig') {
                const eig = new lib.EigenvalueDecomposition(normalized);
                const values = eig.realEigenvalues.map((real, i) => ({real: real * scale, imaginary: eig.imaginaryEigenvalues[i] * scale}));
                if (!values.every(v => Number.isFinite(v.real) && Number.isFinite(v.imaginary))) throw new Error('数値計算が収束しませんでした。');
                return { eigenvalues: values };
            }
            if (operation === 'inv') {
                const svd = new lib.SingularValueDecomposition(normalized);
                if (svd.rank < a.rows) throw new Error('逆行列が存在しないか、数値精度の限界です。matrix pinv をお試しください。');
                result = lib.inverse(normalized).div(scale);
            } else {
                result = lib.pseudoInverse(normalized).div(scale);
            }
        }
        const rows = result.to2DArray();
        if (!rows.every(row => row.every(Number.isFinite))) throw new Error('結果が数値の範囲を超えました。入力の桁数を小さくしてください。');
        return { rows };
    }

    function formatNumber(value) {
        return String(Number(value.toPrecision(12)));
    }

    async function run(args, print, say = (text, expression) => root.say?.(text, expression)) {
        const operation = (args[0] || 'help').toLowerCase();
        if (operation === 'help') {
            help.forEach(line => print(line, 'muted'));
            say('行列の計算も任せてね！ 入力例を並べておいたよ。', 'happy');
            return;
        }
        try {
            const arrays = parseMatrices(args.slice(1).join(' '));
            const result = calculate(operation, arrays, await loadLibrary());
            if (result.eigenvalues) {
                result.eigenvalues.forEach((value, i) => {
                    const imaginary = value.imaginary;
                    print(`lambda${i + 1} = ${formatNumber(value.real)}${imaginary ? ` ${imaginary < 0 ? '-' : '+'} ${formatNumber(Math.abs(imaginary))}i` : ''}`, 'success');
                });
            } else {
                print(`${result.rows.length} x ${result.rows[0].length}`, 'muted');
                result.rows.forEach(row => print(`[${row.map(formatNumber).join(', ')}]`, 'success'));
            }
            const messages = {
                add: '行列の和を求めたよ！ 同じ位置の数どうしを足した結果だね。',
                mul: '行列の積を求めたよ！ 行と列を組み合わせて計算したんだ。',
                eig: result.eigenvalues?.some(value => value.imaginary !== 0)
                    ? '固有値が求まったよ！ 今回は複素数の固有値も含まれているね。'
                    : '固有値が求まったよ！ 結果をCLIに並べておいたよ。',
                inv: '逆行列が求まったよ！ 元の行列と掛けると単位行列になるんだ。',
                pinv: '疑似逆行列が求まったよ！ 正方行列でなくても計算できるんだね。'
            };
            say(messages[operation], 'happy');
        } catch (error) {
            print(`行列エラー: ${error.message}`, 'danger');
            say('今回は計算できなかったみたい。CLIに理由を出したから、一緒に確認しよう。', 'thinking');
        }
    }

    root.MatrixCli = { run, parseMatrices, calculate };
})(globalThis);
