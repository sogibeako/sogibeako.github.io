/**
 * Kazuno UI - 安全な数式評価パーサー (再帰下降構文解析)
 * eval() を使わず、入力された数式文字列をトークンに分解して安全に評価します。
 * モジュロ、比較演算子、論理演算子、ビット演算子、および各種数学関数をサポートします。
 */

(function() {
    // グローバルな計算履歴用
    if (!window.CalculatorParser) {
        window.CalculatorParser = {
            lastResult: 0
        };
    }

    function tokenize(code) {
        const tokens = [];
        // 正規表現で数値(16進数/2進数/8進数/10進数)、識別子(関数、定数、変数)、マルチ文字演算子、シングル文字演算子に分解
        const regex = /\s*(?:(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?)|([a-zA-Z_][a-zA-Z0-9_\$]*)|(==|!=|<=|>=|<<|>>|&&|\|\||\*\*)|([\+\-\*\/\%\^\(\)\<\>\&\|\~\!\,]))/gi;
        let match;
        let lastIndex = 0;
        
        while ((match = regex.exec(code)) !== null) {
            if (match.index > lastIndex) {
                const invalid = code.substring(lastIndex, match.index).trim();
                if (invalid) {
                    throw new Error(`無効な文字が含まれています: "${invalid}"`);
                }
            }
            if (match[1] !== undefined) {
                const valStr = match[1];
                let val;
                if (valStr.startsWith('0x') || valStr.startsWith('0X')) {
                    val = parseInt(valStr.slice(2), 16);
                } else if (valStr.startsWith('0b') || valStr.startsWith('0B')) {
                    val = parseInt(valStr.slice(2), 2);
                } else if (valStr.startsWith('0o') || valStr.startsWith('0O')) {
                    val = parseInt(valStr.slice(2), 8);
                } else {
                    val = parseFloat(valStr);
                }
                tokens.push({ type: 'NUMBER', value: val, raw: valStr });
            } else if (match[2] !== undefined) {
                const id = match[2];
                const lower = id.toLowerCase();
                if (lower === 'pi') {
                    tokens.push({ type: 'CONST', value: Math.PI, name: id });
                } else if (lower === 'e') {
                    tokens.push({ type: 'CONST', value: Math.E, name: id });
                } else if (lower === 'ans' || lower === '_') {
                    tokens.push({ type: 'CONST', value: window.CalculatorParser.lastResult || 0, name: id });
                } else if (['sqrt', 'sin', 'cos', 'tan', 'abs', 'log10', 'log', 'exp', 'ceil', 'floor', 'round', 'max', 'min', 'pow', 'asin', 'acos', 'atan2', 'atan', 'and', 'or', 'xor', 'not', 'shl', 'shr'].includes(lower)) {
                    tokens.push({ type: 'FUNC', value: lower });
                } else {
                    tokens.push({ type: 'IDENTIFIER', value: id });
                }
            } else if (match[3] !== undefined || match[4] !== undefined) {
                const op = match[3] || match[4];
                tokens.push({ type: 'OP', value: op });
            }
            lastIndex = regex.lastIndex;
        }
        
        if (lastIndex < code.length) {
            const invalid = code.substring(lastIndex).trim();
            if (invalid) {
                throw new Error(`無効な文字が含まれています: "${invalid}"`);
            }
        }
        return tokens;
    }

    class Evaluator {
        constructor(tokens, variables = {}, isProgrammerMode = false) {
            this.tokens = tokens;
            this.index = 0;
            this.variables = variables;
            this.isProgrammerMode = isProgrammerMode;
        }

        peek() {
            return this.tokens[this.index];
        }

        consume(expectedValue) {
            const token = this.peek();
            if (!token) {
                throw new Error("予期せぬ数式の終端です。");
            }
            if (expectedValue !== undefined) {
                if (token.value !== expectedValue) {
                    throw new Error(`予期せぬ文字です: "${token.value}"。 "${expectedValue}" が必要です。`);
                }
            }
            this.index++;
            return token;
        }

        parse() {
            const value = this.logicalOr();
            if (this.index < this.tokens.length) {
                throw new Error(`数式の解析を途中で中断しました。無効な文法です: "${this.peek().value}"`);
            }
            return value;
        }

        // Logical OR: ||
        logicalOr() {
            let val = this.logicalAnd();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && next.value === '||') {
                    this.consume();
                    const right = this.logicalAnd();
                    val = (val !== 0 || right !== 0) ? 1 : 0;
                } else {
                    break;
                }
            }
            return val;
        }

        // Logical AND: &&
        logicalAnd() {
            let val = this.bitwiseOr();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && next.value === '&&') {
                    this.consume();
                    const right = this.bitwiseOr();
                    val = (val !== 0 && right !== 0) ? 1 : 0;
                } else {
                    break;
                }
            }
            return val;
        }

        // Bitwise OR: |
        bitwiseOr() {
            let val = this.bitwiseXor();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && next.value === '|') {
                    this.consume();
                    const right = this.bitwiseXor();
                    val = val | right;
                } else {
                    break;
                }
            }
            return val;
        }

        // Bitwise XOR: ^ (only in programmer mode)
        bitwiseXor() {
            let val = this.bitwiseAnd();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && next.value === '^' && this.isProgrammerMode) {
                    this.consume();
                    const right = this.bitwiseAnd();
                    val = val ^ right;
                } else {
                    break;
                }
            }
            return val;
        }

        // Bitwise AND: &
        bitwiseAnd() {
            let val = this.equality();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && next.value === '&') {
                    this.consume();
                    const right = this.equality();
                    val = val & right;
                } else {
                    break;
                }
            }
            return val;
        }

        // Equality: ==, !=
        equality() {
            let val = this.relational();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && (next.value === '==' || next.value === '!=')) {
                    const op = this.consume().value;
                    const right = this.relational();
                    if (op === '==') {
                        val = (val === right) ? 1 : 0;
                    } else {
                        val = (val !== right) ? 1 : 0;
                    }
                } else {
                    break;
                }
            }
            return val;
        }

        // Relational: <, >, <=, >=
        relational() {
            let val = this.shift();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && (next.value === '<' || next.value === '>' || next.value === '<=' || next.value === '>=')) {
                    const op = this.consume().value;
                    const right = this.shift();
                    if (op === '<') val = (val < right) ? 1 : 0;
                    else if (op === '>') val = (val > right) ? 1 : 0;
                    else if (op === '<=') val = (val <= right) ? 1 : 0;
                    else if (op === '>=') val = (val >= right) ? 1 : 0;
                } else {
                    break;
                }
            }
            return val;
        }

        // Shift: <<, >>
        shift() {
            let val = this.additive();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && (next.value === '<<' || next.value === '>>')) {
                    const op = this.consume().value;
                    const right = this.additive();
                    if (op === '<<') val = val << right;
                    else val = val >> right;
                } else {
                    break;
                }
            }
            return val;
        }

        // Additive: +, -
        additive() {
            let val = this.multiplicative();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && (next.value === '+' || next.value === '-')) {
                    const op = this.consume().value;
                    const right = this.multiplicative();
                    if (op === '+') {
                        val += right;
                    } else {
                        val -= right;
                    }
                } else {
                    break;
                }
            }
            return val;
        }

        // Multiplicative: *, /, %
        multiplicative() {
            let val = this.exponentiation();
            while (true) {
                const next = this.peek();
                if (next && next.type === 'OP' && (next.value === '*' || next.value === '/' || next.value === '%')) {
                    const op = this.consume().value;
                    const right = this.exponentiation();
                    if (op === '*') {
                        val *= right;
                    } else if (op === '/') {
                        if (right === 0) throw new Error("ゼロによる除算はできません。");
                        val /= right;
                    } else {
                        if (right === 0) throw new Error("ゼロによる除算（余り）はできません。");
                        val %= right;
                    }
                } else {
                    break;
                }
            }
            return val;
        }

        // Exponentiation: ** (all modes) or ^ (only in math mode)
        exponentiation() {
            let val = this.unary();
            const next = this.peek();
            if (next && next.type === 'OP' && (next.value === '**' || (next.value === '^' && !this.isProgrammerMode))) {
                this.consume();
                const right = this.exponentiation();
                val = Math.pow(val, right);
            }
            return val;
        }

        // Unary: -, +, !, ~
        unary() {
            const token = this.peek();
            if (token && token.type === 'OP') {
                if (token.value === '-') {
                    this.consume();
                    return -this.unary();
                }
                if (token.value === '+') {
                    this.consume();
                    return this.unary();
                }
                if (token.value === '!') {
                    this.consume();
                    return this.unary() === 0 ? 1 : 0;
                }
                if (token.value === '~') {
                    this.consume();
                    return ~this.unary();
                }
            }
            return this.primary();
        }

        // Primary: Number, Constant, Identifier, Func, Parentheses
        primary() {
            const token = this.peek();
            if (!token) {
                throw new Error("予期せぬ数式の終端です。");
            }

            if (token.type === 'NUMBER' || token.type === 'CONST') {
                return this.consume().value;
            }

            if (token.type === 'IDENTIFIER') {
                const id = this.consume().value;
                if (this.variables.hasOwnProperty(id)) {
                    return this.variables[id];
                }
                // 大文字小文字を区別せずチェック
                const lowerId = id.toLowerCase();
                if (this.variables.hasOwnProperty(lowerId)) {
                    return this.variables[lowerId];
                }
                throw new Error(`未定義の変数です: "${id}"`);
            }

            if (token.type === 'OP' && token.value === '(') {
                this.consume('(');
                const val = this.logicalOr();
                this.consume(')');
                return val;
            }

            if (token.type === 'FUNC') {
                const func = this.consume().value;
                this.consume('(');
                const args = [];
                args.push(this.logicalOr());
                while (this.peek() && this.peek().type === 'OP' && this.peek().value === ',') {
                    this.consume(',');
                    args.push(this.logicalOr());
                }
                this.consume(')');

                switch (func) {
                    case 'sqrt':
                        if (args[0] < 0) throw new Error("負の数に対する平方根は計算できません。");
                        return Math.sqrt(args[0]);
                    case 'sin': return Math.sin(args[0]);
                    case 'cos': return Math.cos(args[0]);
                    case 'tan': return Math.tan(args[0]);
                    case 'abs': return Math.abs(args[0]);
                    case 'log': return Math.log(args[0]);
                    case 'log10': return Math.log10(args[0]);
                    case 'exp': return Math.exp(args[0]);
                    case 'ceil': return Math.ceil(args[0]);
                    case 'floor': return Math.floor(args[0]);
                    case 'round': return Math.round(args[0]);
                    case 'asin': return Math.asin(args[0]);
                    case 'acos': return Math.acos(args[0]);
                    case 'atan': return Math.atan(args[0]);
                    case 'pow':
                        if (args.length < 2) throw new Error("pow 関数には2つの引数が必要です。");
                        return Math.pow(args[0], args[1]);
                    case 'max':
                        if (args.length < 2) throw new Error("max 関数には少なくとも2つの引数が必要です。");
                        return Math.max(...args);
                    case 'min':
                        if (args.length < 2) throw new Error("min 関数には少なくとも2つの引数が必要です。");
                        return Math.min(...args);
                    case 'atan2':
                        if (args.length < 2) throw new Error("atan2 関数には2つの引数が必要です。");
                        return Math.atan2(args[0], args[1]);
                    // ビット演算用の補助関数
                    case 'and':
                        if (args.length < 2) throw new Error("and 関数には2つの引数が必要です。");
                        return args[0] & args[1];
                    case 'or':
                        if (args.length < 2) throw new Error("or 関数には2つの引数が必要です。");
                        return args[0] | args[1];
                    case 'xor':
                        if (args.length < 2) throw new Error("xor 関数には2つの引数が必要です。");
                        return args[0] ^ args[1];
                    case 'not':
                        return ~args[0];
                    case 'shl':
                        if (args.length < 2) throw new Error("shl 関数には2つの引数が必要です。");
                        return args[0] << args[1];
                    case 'shr':
                        if (args.length < 2) throw new Error("shr 関数には2つの引数が必要です。");
                        return args[0] >> args[1];
                    default:
                        throw new Error(`未定義の関数です: ${func}`);
                }
            }

            throw new Error(`解釈不能なトークンです: "${token.value}"`);
        }
    }

    /**
     * 数式を評価する
     * @param {string} expressionStr 
     * @param {object} variables 変数環境
     * @param {boolean|null} isProgrammerMode プログラマーモードフラグ (nullの場合は自動判定)
     */
    function evaluate(expressionStr, variables = {}, isProgrammerMode = null) {
        const cleaned = expressionStr.replace(/\s+/g, '');
        if (cleaned === '') return 0;
        
        // 括弧の対応をチェック
        let parens = 0;
        for (let i = 0; i < cleaned.length; i++) {
            if (cleaned[i] === '(') parens++;
            if (cleaned[i] === ')') parens--;
            if (parens < 0) {
                throw new Error("括弧の対応が正しくありません。先に閉じ括弧が来ています。");
            }
        }
        if (parens !== 0) {
            throw new Error("閉じられていない括弧があります。");
        }

        // プログラマーモードの自動判定 (0x, 0b, 0o, &, |, ~, <<, >> 等が含まれる場合)
        if (isProgrammerMode === null) {
            isProgrammerMode = /0[xboXBO]|[&|~]|<<|>>/.test(expressionStr);
        }

        const tokens = tokenize(expressionStr);
        if (tokens.length === 0) return 0;
        
        const evaluator = new Evaluator(tokens, variables, isProgrammerMode);
        const result = evaluator.parse();
        
        // 直近の計算結果をグローバル保存
        window.CalculatorParser.lastResult = result;
        
        return result;
    }

    // グローバルに登録
    window.CalculatorParser = {
        evaluate: evaluate,
        tokenize: tokenize,
        lastResult: 0
    };
})();

