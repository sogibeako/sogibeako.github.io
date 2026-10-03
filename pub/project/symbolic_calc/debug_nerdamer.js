const nerdamer = require('nerdamer');
require('nerdamer/all');

function testFT(expr, tV, wV) {
    const w = wV;
    try {
        const inv = '1/(' + expr + ')';
        const d2 = nerdamer('diff(diff(' + inv + ',' + tV + '),' + tV + ')').toString();
        console.log("d2:", d2);
        if (!d2.includes(tV) && d2 !== '0') {
            const C = nerdamer('2/(' + d2 + ')').toString();
            console.log("C:", C);
            const K = nerdamer('simplify((' + inv + ') - (' + d2 + '/2)*' + tV + '^2)').toString();
            console.log("K:", K);
            if (!K.includes(tV)) {
                const aSq = nerdamer('simplify((' + C + ')*(' + K + '))').toString();
                console.log("aSq:", aSq);
                const a = nerdamer('sqrt(' + aSq + ')').toString();
                console.log("a:", a);
                return true;
            }
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
    return false;
}

function testMT(expr, xV, sV) {
    try {
        const d1 = nerdamer('diff(' + expr + ',' + xV + ')').toString();
        const invD1 = '1/(' + d1 + ')';
        const d2 = nerdamer('diff(' + invD1 + ',' + xV + ')').toString();
        console.log("d1:", d1, "invD1:", invD1, "d2:", d2);
        if (!d2.includes(xV) && d2 !== '0') {
            const K = nerdamer('simplify((' + invD1 + ') - (' + d2 + ')*' + xV + ')').toString();
            console.log("K:", K);
            if (!K.includes(xV)) {
                // Check if f(0) == 0
                const f0 = nerdamer(expr).sub(xV, '0').toString();
                console.log("f0:", f0);
                if (f0 === '0') {
                    const C = nerdamer('1/(' + K + ')').toString();
                    const a = nerdamer('simplify((' + d2 + ')/(' + K + '))').toString();
                    console.log("C:", C, "a:", a);
                    return true;
                }
            }
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
    return false;
}

console.log("FT test:");
testFT('1/(t^2+1)', 't', 's');
console.log("\nMT test:");
testMT('log(1+x)', 'x', 's');
console.log("\nMT test 2:");
testMT('2*log(1+3*x)', 'x', 's');

