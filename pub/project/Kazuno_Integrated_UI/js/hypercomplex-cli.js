(function (root) {
    'use strict';

    const operations = { add: 2, sub: 2, mul: 2, div: 2, conj: 1, norm: 1, inv: 1 };
    const names = { add: '和', sub: '差', mul: '積', div: '商', conj: '共役', norm: 'ノルム', inv: '逆元' };
    const conjugate = a => a.map((value, i) => i === 0 ? value : -value);
    const add = (a, b) => a.map((value, i) => value + b[i]);
    const subtract = (a, b) => a.map((value, i) => value - b[i]);

    // Cayley-Dickson: (a,b)(c,d) = (ac - conj(d)b, da + b conj(c)).
    // Basis: 1,i,j,k,l,il,jl,kl. See Oregon State's Geometry of the Octonions:
    // https://sites.science.oregonstate.edu/coursewikis/GO/book/go/cd.html
    function multiply(x, y) {
        if (x.length === 1) return [x[0] * y[0]];
        const half = x.length / 2;
        const a = x.slice(0, half), b = x.slice(half);
        const c = y.slice(0, half), d = y.slice(half);
        return subtract(multiply(a, c), multiply(conjugate(d), b))
            .concat(add(multiply(d, a), multiply(b, conjugate(c))));
    }

    function inverse(a) {
        const scale = Math.max(...a.map(Math.abs));
        if (scale === 0) throw new Error('0の逆元は存在しません。0で割ることもできません。');
        const normalized = a.map(value => value / scale);
        const squaredNorm = normalized.reduce((sum, value) => sum + value * value, 0);
        return conjugate(normalized).map(value => (value / squaredNorm) / scale);
    }

    function parseOperands(source, dimension) {
        const operands = [];
        let rest = source.trim();
        while (rest) {
            const match = rest.match(/^\[[^\[\]]*\](?=\s|$)/);
            if (!match) throw new Error('数を [1,2,3,4] の形式で入力し、2つの数は空白で区切ってください。');
            let values;
            try { values = JSON.parse(match[0]); }
            catch (_) { throw new Error('数値とカンマの書き方を確認してください。'); }
            if (values.length !== dimension || !values.every(Number.isFinite)) {
                throw new Error(`成分は${dimension}個の有限な実数で指定してください。`);
            }
            operands.push(values);
            rest = rest.slice(match[0].length).trim();
        }
        return operands;
    }

    function calculate(operation, operands, dimension) {
        if (![4, 8].includes(dimension)) throw new Error('四元数または八元数を指定してください。');
        if (!Object.hasOwn(operations, operation)) throw new Error('help で操作一覧を確認してください。');
        if (operands.length !== operations[operation]) throw new Error(`この操作には${operations[operation]}個の数が必要です。`);
        if (!operands.every(a => Array.isArray(a) && a.length === dimension && a.every(Number.isFinite))) {
            throw new Error(`成分は${dimension}個の有限な実数で指定してください。`);
        }
        const [a, b] = operands;
        let result;
        switch (operation) {
            case 'add': result = add(a, b); break;
            case 'sub': result = subtract(a, b); break;
            case 'mul': result = multiply(a, b); break;
            case 'div': result = multiply(a, inverse(b)); break;
            case 'conj': result = conjugate(a); break;
            case 'norm': result = Math.hypot(...a); break;
            case 'inv': result = inverse(a); break;
        }
        if (!(Array.isArray(result) ? result : [result]).every(Number.isFinite)) {
            throw new Error('結果が数値の範囲を超えました。入力の大きさを確認してください。');
        }
        return result;
    }

    function run(dimension, args, print, say = (text, expression) => root.say?.(text, expression)) {
        const command = dimension === 4 ? 'quat' : 'oct';
        const label = dimension === 4 ? '四元数' : '八元数';
        const operation = (args[0] || 'help').toLowerCase();
        if (operation === 'help') {
            const a = dimension === 4 ? '[1,2,3,4]' : '[1,2,3,4,5,6,7,8]';
            const b = dimension === 4 ? '[0,1,0,0]' : '[0,1,0,0,0,0,0,0]';
            print(`${label}: ${dimension === 4 ? '[実部,i,j,k]' : '[実部,i,j,k,l,il,jl,kl] (= [実部,e1,e2,e3,e4,e5,e6,e7])'}`, 'info');
            for (const op of Object.keys(operations)) {
                print(`${command} ${op} ${a}${operations[op] === 2 ? ' ' + b : ''} : ${names[op]}`, 'muted');
            }
            print('mul A B は A*B、div A B は A*inv(B)（右除算）。掛ける順序で結果が変わります。', 'muted');
            print('実数成分をカンマで区切ります。結果は数値近似で、有効数字12桁を表示します。', 'muted');
            if (dimension === 8) {
                print('八元数では (A*B)*C と A*(B*C) が異なる場合があります。各積を別々に計算してください。', 'muted');
                print('基底の約束: ij=k, il=e5, jl=e6, kl=e7。A=a+b*l に対し (a,b)(c,d)=(ac-conj(d)b, da+b*conj(c))。', 'muted');
            }
            say(`${label}の入力例を並べたよ！ 掛け算の順序にも注目してみてね。`, 'happy');
            return;
        }
        try {
            const result = calculate(operation, parseOperands(args.slice(1).join(' '), dimension), dimension);
            const format = value => String(Number(value.toPrecision(12)));
            print(`${label}の${names[operation]}: ${Array.isArray(result) ? '[' + result.map(format).join(', ') + ']' : format(result)}`, 'success');
            say(`${label}の${names[operation]}が求まったよ！ 結果をCLIに出しておいたよ。`, 'happy');
        } catch (error) {
            print(`${label}エラー: ${error.message}`, 'danger');
            say('今回は計算できなかったみたい。CLIに出した理由を一緒に確認しよう。', 'thinking');
        }
    }

    root.HypercomplexCli = { run, parseOperands, calculate };
})(globalThis);
