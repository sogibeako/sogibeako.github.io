// parser.js - 入力テキストからの音程列抽出解析

window.JI_PARSER = {
    parseInput: function(text, limitLength) {
        let rawTokens = text.split(/[\n, \t]+/).filter(t => t.trim() !== "");
        let parsedList = [];
        let errors = [];

        let monzoBuffer = [];
        let inMonzo = false;

        for(let i=0; i<rawTokens.length; i++) {
            let token = rawTokens[i];
            
            if(!inMonzo && token.startsWith("[")) {
                inMonzo = true;
                monzoBuffer = [];
                let s = token.substring(1);
                if(s !== "") {
                    // もし "[ -1 1 >" ではなく "[-1 1>" のように繋がっていたら
                    // ">" が含まれるかチェックする
                    if(s.includes(">") || s.includes("]")) {
                        s = s.replace(/>/g, "").replace(/\]/g, "");
                        if(s !== "") monzoBuffer.push(s);
                        this._flushMonzo(monzoBuffer, limitLength, parsedList, errors, `[${token}`);
                        inMonzo = false;
                        continue;
                    } else {
                        monzoBuffer.push(s);
                    }
                }
            } else if(inMonzo) {
                if(token.includes(">") || token.includes("]")) {
                    let s = token.replace(/>/g, "").replace(/\]/g, "");
                    if(s !== "") monzoBuffer.push(s);
                    this._flushMonzo(monzoBuffer, limitLength, parsedList, errors, `[${monzoBuffer.join(" ")}>`);
                    inMonzo = false;
                } else {
                    monzoBuffer.push(token);
                }
            } else {
                // Not in monzo -> frac or int
                if(token.includes("/")) {
                    let parts = token.split("/");
                    if(parts.length === 2) {
                        let num = parseInt(parts[0], 10);
                        let den = parseInt(parts[1], 10);
                        if(isNaN(num) || isNaN(den) || den === 0 || num < 0 || den < 0) {
                            errors.push(`分数パースエラー: ${token}`);
                        } else {
                            let mRes = window.JI_MONZO.ratioToMonzo(num, den, limitLength);
                            if(mRes.error) {
                                errors.push(`[${token}] ${mRes.error}`);
                            } else {
                                parsedList.push(this.createIntervalObj(num, den, mRes.monzo, token));
                            }
                        }
                    } else {
                        errors.push(`未解釈トークン: ${token}`);
                    }
                } else {
                    let num = parseFloat(token); // check if pure int
                    if(Number.isInteger(num) && num > 0) {
                        let mRes = window.JI_MONZO.ratioToMonzo(num, 1, limitLength);
                        if(mRes.error) {
                            errors.push(`[${token}] ${mRes.error}`);
                        } else {
                            parsedList.push(this.createIntervalObj(num, 1, mRes.monzo, token.toString()));
                        }
                    } else {
                        errors.push(`未解釈トークン(整数として不正): ${token}`);
                    }
                }
            }
        }
        
        if(inMonzo) {
            errors.push(`Monzoが閉じられていません`);
        }
        
        return { list: parsedList, errors: errors };
    },

    _flushMonzo: function(monzoBuffer, limitLength, parsedList, errors, sourceText) {
        let monzoArr = [];
        for(let m of monzoBuffer) {
            let num = parseInt(m, 10);
            if(isNaN(num)) {
                errors.push(`Monzo値エラー: '${m}' in ${sourceText}`);
                return;
            }
            monzoArr.push(num);
        }
        
        if(monzoArr.length > limitLength) {
             errors.push(`Monzo指定がlimitを超えています: ${sourceText}`);
        } else {
             while(monzoArr.length < limitLength) monzoArr.push(0);
             let rData = window.JI_MONZO.monzoToRatio(monzoArr);
             // Ensure it's simplified
             let gcd = function(a, b) { return b ? gcd(b, a%b) : a; };
             let g = gcd(rData.num, rData.den);
             rData.num /= g;
             rData.den /= g;

             // if precision lost or massive, it might be Infinity? But user won't enter that huge.
             parsedList.push(this.createIntervalObj(rData.num, rData.den, monzoArr, sourceText));
        }
    },

    createIntervalObj: function(num, den, monzo, sourceText) {
        // 約分
        let gcd = function(a, b) { return b ? gcd(b, a%b) : a; };
        let g = gcd(num, den);
        num /= g;
        den /= g;

        let rv = num / den;
        let cents = 1200 * Math.log2(rv);
        let norm = window.JI_NORMALIZE.normalizeRatio(num, den);
        let nMonzoRes = window.JI_NORMALIZE.normalizeMonzo(monzo);
        let nCents = 1200 * Math.log2(norm.ratioValue);
        
        return {
            id: Math.random().toString(36).substring(2, 9),
            sourceText: sourceText,
            ratioNumerator: num,
            ratioDenominator: den,
            monzo: monzo,
            reducedMonzo: window.JI_MONZO.getReduced(monzo),
            ratioValue: rv,
            normalizedRatioValue: norm.ratioValue,
            normalizedNumerator: norm.num,
            normalizedDenominator: norm.den,
            normalizedMonzo: nMonzoRes.monzo,
            normalizedText: `${norm.num}/${norm.den}`,
            cents: cents,
            normalizedCents: nCents
        };
    }
};
