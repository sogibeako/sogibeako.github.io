// monzo.js - 素数、Monzo関係のユーティリティ

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

window.JI_MONZO = {
    PRIMES,
    
    getPrimeLimitLength: function(limitStr) {
        const limit = parseInt(limitStr, 10);
        let idx = PRIMES.indexOf(limit);
        if(idx === -1) {
            for(let i=0; i<PRIMES.length; i++){
                if(PRIMES[i] > limit) return i;
            }
            return PRIMES.length;
        }
        return idx + 1; // 5-limit (idx=2) -> return 3, meaning [2,3,5]
    },

    primeFactorize: function(n) {
        if(!Number.isInteger(n) || n < 1) return null;
        let counts = {};
        let temp = n;
        for(let prime of PRIMES) {
            if(prime * prime > temp) {
                if(temp > 1) {
                    counts[temp] = (counts[temp] || 0) + 1;
                }
                break;
            }
            while(temp % prime === 0) {
                counts[prime] = (counts[prime] || 0) + 1;
                temp /= prime;
            }
        }
        return counts;
    },

    ratioToMonzo: function(num, den, limitLength) {
        let numFactors = this.primeFactorize(num);
        let denFactors = this.primeFactorize(den);
        if(!numFactors) return { error: `分子 ${num} の素因数分解に失敗しました。` };
        if(!denFactors) return { error: `分母 ${den} の素因数分解に失敗しました。` };

        let monzo = new Array(limitLength).fill(0);
        
        for(let p in numFactors) {
            let pNum = parseInt(p, 10);
            let idx = PRIMES.indexOf(pNum);
            if(idx === -1 || idx >= limitLength) return { error: `素数 ${pNum} は現在の制限外です。` };
            monzo[idx] += numFactors[p];
        }
        for(let p in denFactors) {
            let pNum = parseInt(p, 10);
            let idx = PRIMES.indexOf(pNum);
            if(idx === -1 || idx >= limitLength) return { error: `素数 ${pNum} は現在の制限外です。` };
            monzo[idx] -= denFactors[p];
        }
        
        return { monzo: monzo };
    },

    monzoToRatio: function(monzo) {
        let num = 1;
        let den = 1;
        for(let i=0; i<monzo.length; i++) {
            let exp = monzo[i];
            if(exp > 0) num *= Math.pow(PRIMES[i], exp);
            else if(exp < 0) den *= Math.pow(PRIMES[i], -exp);
        }
        return { num, den, ratioValue: num/den };
    },

    monzoToString: function(monzo) {
        return "[" + monzo.join(" ") + ">";
    },

    getReduced: function(monzo) {
        // [2, 3, 5...] -> [3, 5...]
        return monzo.slice(1);
    },

    reducedToMonzo: function(reduced, totalLength) {
        let mon = [0, ...reduced];
        while(mon.length < totalLength) mon.push(0);
        return mon;
    }
};
