// ============================================================
//  RegSum Lab — Math Engine (engine.js)
//  All computation: parsing, sequence generation, model detection,
//  regularization methods, ensemble, diagnostics.
// ============================================================

"use strict";

// ---- Bernoulli Numbers & Polynomials ----
const BERNOULLI = [1, -1 / 2, 1 / 6, 0, -1 / 30, 0, 1 / 42, 0, -1 / 30, 0, 5 / 66];

function bernoulliPoly(k, x) {
    // B_k(x) via explicit expansion: B_k(x) = sum_{j=0}^{k} C(k,j) B_j x^{k-j}
    let val = 0;
    let binom = 1;
    for (let j = 0; j <= k; j++) {
        if (j > 0) binom = binom * (k - j + 1) / j;
        val += binom * (BERNOULLI[j] || 0) * Math.pow(x, k - j);
    }
    return val;
}

function hurwitzZetaNeg(k, a) {
    // ζ(-k, a) = -B_{k+1}(a) / (k+1)
    return -bernoulliPoly(k + 1, a) / (k + 1);
}

// ---- Input Parser ----
const ALLOWED_FUNCTIONS = ['floor', 'ceil', 'round', 'sqrt', 'log', 'sin', 'cos', 'tan', 'abs', 'pow', 'min', 'max'];
const ALLOWED_CONSTANTS = { pi: Math.PI, e: Math.E, PI: Math.PI, E: Math.E };

function parseExpression(exprStr, paramNames = []) {
    const sanitized = exprStr.replace(/\*\*/g, '**');
    // Check for disallowed identifiers
    const identPattern = /[a-zA-Z_]\w*/g;
    let match;
    const allowed = new Set([...ALLOWED_FUNCTIONS, ...Object.keys(ALLOWED_CONSTANTS), 'n', 'Math', ...paramNames]);
    const identifiers = [];
    while ((match = identPattern.exec(sanitized)) !== null) {
        identifiers.push(match[0]);
    }
    for (const id of identifiers) {
        if (!allowed.has(id)) throw new Error(`Unknown identifier: "${id}". Add it as a parameter or check spelling.`);
    }
    // Build function body — replace ^ with ** for power, wrap Math functions
    let body = sanitized;
    // Replace standalone ^ with ** (but not inside **)
    body = body.replace(/\^/g, '**');
    // Wrap math functions
    for (const fn of ALLOWED_FUNCTIONS) {
        body = body.replace(new RegExp('\\b' + fn + '\\b', 'g'), 'Math.' + fn);
    }
    // Replace constants
    for (const [name, val] of Object.entries(ALLOWED_CONSTANTS)) {
        body = body.replace(new RegExp('\\b' + name + '\\b', 'g'), String(val));
    }
    // Handle == for ternary conditions
    body = body.replace(/==/g, '===');
    try {
        const fn = new Function('n', ...paramNames, 'return ' + body);
        // Test it
        fn(1, ...paramNames.map(() => 0));
        return fn;
    } catch (e) {
        throw new Error(`Expression parse error: ${e.message}`);
    }
}

function parseParams(paramStr) {
    const params = {};
    if (!paramStr || !paramStr.trim()) return params;
    const parts = paramStr.split(',');
    for (const part of parts) {
        const [name, valStr] = part.split('=').map(s => s.trim());
        if (name && valStr !== undefined) {
            params[name] = parseFloat(valStr);
            if (isNaN(params[name])) throw new Error(`Invalid parameter value: ${name} = ${valStr}`);
        }
    }
    return params;
}

// ---- Sequence Engine ----
function generateSequence(exprFn, params, Nmax) {
    const paramNames = Object.keys(params);
    const paramVals = Object.values(params);
    const seq = new Float64Array(Nmax);
    for (let i = 0; i < Nmax; i++) {
        seq[i] = exprFn(i + 1, ...paramVals);
    }
    return seq;
}

// ---- Linear Algebra Helpers ----
function leastSquares(A, b) {
    // Solve A^T A x = A^T b  via normal equations
    const m = A.length, n = A[0].length;
    const AtA = Array.from({ length: n }, () => new Float64Array(n));
    const Atb = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let s = 0;
            for (let k = 0; k < m; k++) s += A[k][i] * A[k][j];
            AtA[i][j] = s; AtA[j][i] = s;
        }
        let s = 0;
        for (let k = 0; k < m; k++) s += A[k][i] * b[k];
        Atb[i] = s;
    }

    // Regularize slightly (Tikhonov) if severely ill-conditioned
    // Since condition numbers for expCutoff can reach 1e6 - 1e9, 
    // a tiny regularization helps stabilize the Cholesky/Gauss solver.
    const maxDiag = Math.max(...AtA.map((row, i) => row[i]));
    const lambda = maxDiag * 1e-12;
    for (let i = 0; i < n; i++) AtA[i][i] += lambda;

    return gaussSolve(AtA, Atb);
}

function gaussSolve(A, b) {
    const n = A.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
        }
        [M[col], M[maxRow]] = [M[maxRow], M[col]];
        if (Math.abs(M[col][col]) < 1e-15) continue;
        for (let row = col + 1; row < n; row++) {
            const f = M[row][col] / M[col][col];
            for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j];
        }
    }
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let s = M[i][n];
        for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
        x[i] = Math.abs(M[i][i]) > 1e-15 ? s / M[i][i] : 0;
    }
    return x;
}

function matrixConditionNumber(A) {
    // Approximate via ratio of max/min diagonal of R in QR (simplified)
    const m = A.length, n = A[0].length;
    const AtA = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let s = 0;
            for (let k = 0; k < m; k++) s += A[k][i] * A[k][j];
            AtA[i][j] = s; AtA[j][i] = s;
        }
    }
    let maxD = 0, minD = Infinity;
    for (let i = 0; i < n; i++) {
        const d = Math.abs(AtA[i][i]);
        if (d > maxD) maxD = d;
        if (d < minD) minD = d;
    }
    return minD > 0 ? Math.sqrt(maxD / minD) : Infinity;
}

// ---- Special Functions ----
function logGamma(z) {
    const p = [
        676.5203681218851, -1259.1392167224028, 771.32342877765313,
        -176.61502916214059, 12.507343278686905, -0.13857109526572012,
        9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
    const t = z + p.length - 0.5;
    return Math.log(Math.sqrt(2 * Math.PI)) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function riemannZetaNeg(s) {
    if (s >= 0) return NaN;
    const z = 1 - s;
    let sumZeta = 0;
    for (let n = 1; n <= 100000; n++) sumZeta += 1 / Math.pow(n, z);
    const gammaVal = Math.exp(logGamma(z));
    return Math.pow(2, s) * Math.pow(Math.PI, s - 1) * Math.sin(Math.PI * s / 2) * gammaVal * sumZeta;
}

// ---- Extended Skeleton Fitter ----
function fitExtendedSkeleton(seq) {
    const N = seq.length;
    let start = Math.max(10, Math.floor(N * 0.1));
    const end = Math.min(N, 2048);

    // Fallback if N is small
    if (start >= end) start = Math.max(1, Math.floor(end / 2));

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    let count = 0;

    for (let i = start; i < end; i++) {
        const val = Math.abs(seq[i]);
        if (val < 1e-10) continue;
        const x = Math.log(i + 1);
        const y = Math.log(val);
        sumX += x; sumY += y; sumX2 += x * x; sumXY += x * y;
        count++;
    }
    if (count < 10) return null;

    const slope = (count * sumXY - sumX * sumY) / (count * sumX2 - sumX * sumX + 1e-30);

    const meanY = sumY / count;
    const meanX = sumX / count;
    const log_c = meanY - slope * meanX;
    const c_abs = Math.exp(log_c);

    let sign = 1;
    for (let i = start; i < end; i++) {
        if (Math.abs(seq[i]) >= 1e-10) {
            sign = seq[i] > 0 ? 1 : -1;
            break;
        }
    }
    const c = c_abs * sign;

    let totalRSS = 0;
    for (let i = 0; i < N; i++) {
        const pred = c * Math.pow(i + 1, slope);
        totalRSS += (seq[i] - pred) ** 2;
    }
    const rmsRes = Math.sqrt(totalRSS / N);
    const isNonInteger = Math.abs(slope - Math.round(slope)) > 0.05;

    // We relax the rmsRes check for power laws since N=4096 can accumulate noise
    if (rmsRes < 1e-2 && isNonInteger) {
        return {
            type: 'extended', exponent: slope, coefficient: c, rms: rmsRes,
            confidence: rmsRes < 1e-5 ? 'good' : 'uncertain'
        };
    }
    return null;
}

// ---- Quasi-Polynomial Fitter ----
function fitQuasiPolynomial(seq, mMax = 12, dMax = 4, Nfit = null) {
    const N = seq.length;
    Nfit = Nfit || Math.min(N, 2048);
    const data = seq.slice(0, Nfit);
    let bestAIC = Infinity, bestModel = null;

    for (let m = 1; m <= mMax; m++) {
        for (let d = 0; d <= dMax; d++) {
            const numParams = m * (d + 1);
            if (numParams > Nfit / 4) continue; // prevent overfitting

            // Build per-residue-class polynomial fit
            const coeffs = Array.from({ length: m }, () => new Float64Array(d + 1));
            let totalRSS = 0;
            let valid = true;

            for (let r = 0; r < m; r++) {
                const indices = [];
                const vals = [];
                for (let i = r; i < Nfit; i += m) {
                    indices.push(i + 1); // n = i+1
                    vals.push(data[i]);
                }
                if (indices.length < d + 2) { valid = false; break; }

                // Build Vandermonde: each row is [1, n, n^2, ..., n^d]
                const A = indices.map(n => {
                    const row = new Float64Array(d + 1);
                    let p = 1;
                    for (let k = 0; k <= d; k++) { row[k] = p; p *= n; }
                    return row;
                });

                const c = leastSquares(A, vals);
                for (let k = 0; k <= d; k++) coeffs[r][k] = c[k];

                // RSS
                for (let j = 0; j < indices.length; j++) {
                    let pred = 0, p = 1;
                    for (let k = 0; k <= d; k++) { pred += c[k] * p; p *= indices[j]; }
                    totalRSS += (vals[j] - pred) ** 2;
                }
            }

            if (!valid) continue;
            const rmsRes = Math.sqrt(totalRSS / Nfit);
            const aic = Nfit * Math.log(totalRSS / Nfit + 1e-300) + 2 * numParams;

            // Prefer simpler models: add small penalty for complexity
            const adjustedAIC = aic + 0.5 * (m - 1 + d);

            if (adjustedAIC < bestAIC - 0.01) {
                bestAIC = adjustedAIC;
                bestModel = { type: 'quasiPolynomial', period: m, degree: d, coefficients: coeffs.map(r => Array.from(r)), rms: rmsRes };
            }
        }
    }

    if (!bestModel || bestModel.rms > 1e-6) {
        // Check if still usable with lower confidence
        if (bestModel && bestModel.rms <= 1e-2) {
            return { ...bestModel, confidence: 'uncertain' };
        }
        return null;
    }
    return { ...bestModel, confidence: bestModel.rms < 1e-10 ? 'good' : 'uncertain' };
}

function evaluateSkeleton(model, N) {
    const skeleton = new Float64Array(N);
    if (model.type === 'extended') {
        const c = model.coefficient;
        const alpha = model.exponent;
        for (let i = 0; i < N; i++) skeleton[i] = c * Math.pow(i + 1, alpha);
        return skeleton;
    }
    for (let i = 0; i < N; i++) {
        const n = i + 1;
        const r = n % model.period;
        const c = model.coefficients[r];
        let val = 0, p = 1;
        for (let k = 0; k <= model.degree; k++) { val += c[k] * p; p *= n; }
        skeleton[i] = val;
    }
    return skeleton;
}

function computeResidual(seq, skeleton) {
    const res = new Float64Array(seq.length);
    for (let i = 0; i < seq.length; i++) res[i] = seq[i] - skeleton[i];
    return res;
}

function rms(arr) {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i] * arr[i];
    return Math.sqrt(s / arr.length);
}

// ---- Hurwitz Regularization ----
function hurwitzRegularize(model) {
    if (!model) return { method: 'hurwitz', status: 'not_applicable', value: null, stability: null, notes: ['No quasi-polynomial skeleton detected'], details: {} };

    if (model.type === 'extended') {
        const alpha = model.exponent;
        const c = model.coefficient;
        if (alpha <= -1) {
            return { method: 'hurwitz', status: 'not_applicable', value: null, stability: null, notes: ['Exponent <= -1, direct summation converges'], details: {} };
        }
        let value = c * riemannZetaNeg(-alpha);
        return {
            method: 'hurwitz',
            status: 'success',
            value: value,
            stability: 'exact-ish',
            notes: [`Extended skeleton (n^${alpha.toFixed(3)}) via functional equation`],
            details: { alpha, coefficient: c }
        };
    }

    const m = model.period;
    const d = model.degree;
    if (d + 1 > BERNOULLI.length - 1) {
        return { method: 'hurwitz', status: 'failed', value: null, stability: null, notes: ['Degree too high for Bernoulli table'], details: {} };
    }

    let total = 0;
    const residueBreakdown = [];

    for (let r = 0; r < m; r++) {
        let contribution = 0;
        const c = model.coefficients[r];

        for (let k = 0; k <= d; k++) {
            if (Math.abs(c[k]) < 1e-15) continue;
            // Sum_{n≡r (mod m), n>=1} n^k
            // = m^k * ζ(-k, r/m)     when r > 0
            // = m^k * ζ(-k, 1)       when r = 0 (since n=m,2m,3m,... → n/m = 1,2,3,... → ζ(-k,1)=ζ(-k))
            const a = r === 0 ? 1 : r / m;
            const zetaVal = hurwitzZetaNeg(k, a);
            contribution += c[k] * Math.pow(m, k) * zetaVal;
        }
        residueBreakdown.push({ residue: r, contribution });
        total += contribution;
    }

    return {
        method: 'hurwitz',
        status: 'success',
        value: total,
        stability: 'exact-ish',
        notes: [`Quasi-polynomial (m=${m}, d=${d})`],
        details: { residueBreakdown, period: m, degree: d }
    };
}

// ---- Exponential Cutoff Regularization ----
function expCutoffRegularize(seq, model, opts = {}) {
    const N = seq.length;
    const defaultEpsMin = Math.max(0.001, 25 / N);
    const epsMin = opts.epsMin || defaultEpsMin;
    const epsMax = opts.epsMax || 0.5;
    const samples = opts.samples || 60;
    const d = model ? model.degree : 2; // fallback degree guess

    // Generate ε grid (geometric)
    const epsGrid = [];
    const ratio = Math.pow(epsMax / epsMin, 1 / (samples - 1));
    for (let i = 0; i < samples; i++) epsGrid.push(epsMin * Math.pow(ratio, i));

    // Compute S(ε) for each ε
    const sEps = epsGrid.map(eps => {
        let s = 0;
        for (let i = 0; i < N; i++) s += seq[i] * Math.exp(-eps * (i + 1));
        return s;
    });

    // Build basis functions
    let basisLabels, basisFns;
    if (model && model.type === 'extended') {
        const alpha = model.exponent;
        basisLabels = [`eps^-(${(alpha + 1).toFixed(2)})`, `eps^-${alpha.toFixed(2)}`, 'eps^-1', 'log(eps)', '1', 'eps'];
        basisFns = [
            eps => Math.pow(eps, -(alpha + 1)),
            eps => Math.pow(eps, -alpha),
            eps => Math.pow(eps, -1),
            eps => Math.log(eps),
            eps => 1,
            eps => eps
        ];
    } else if (model) {
        // {1/ε^(d+1), ..., 1/ε, 1, ε}
        basisLabels = [];
        basisFns = [];
        for (let p = d + 1; p >= 1; p--) {
            basisLabels.push(`eps^-${p}`);
            const pp = p;
            basisFns.push(eps => Math.pow(eps, -pp));
        }
        basisLabels.push('1');
        basisFns.push(eps => 1);
        basisLabels.push('eps');
        basisFns.push(eps => eps);
    } else {
        basisLabels = ['eps^-3', 'eps^-2', 'eps^-1', 'log(eps)', '1', 'eps'];
        basisFns = [eps => eps ** -3, eps => eps ** -2, eps => eps ** -1, eps => Math.log(eps), eps => 1, eps => eps];
    }

    // Build design matrix
    const A = epsGrid.map(eps => basisFns.map(fn => fn(eps)));

    const condNum = matrixConditionNumber(A);
    const coeffs = leastSquares(A, sEps);

    // Extract c₀ (the coefficient of basis function "1")
    const c0Index = basisLabels.indexOf('1');
    const c0 = coeffs[c0Index];

    // Compute fit residuals
    const fitted = epsGrid.map((eps, i) => {
        let v = 0;
        for (let j = 0; j < basisFns.length; j++) v += coeffs[j] * basisFns[j](eps);
        return v;
    });
    const fitResiduals = sEps.map((s, i) => s - fitted[i]);
    const fitRMS = rms(fitResiduals);

    // Stability: refit with halved/doubled ε range
    const halfGrid = epsGrid.filter(e => e >= epsMin * 1.5 && e <= epsMax * 0.7);
    let stabilityScore = 1.0;
    if (halfGrid.length > basisFns.length + 2) {
        const A2 = halfGrid.map(eps => basisFns.map(fn => fn(eps)));
        const sEps2 = halfGrid.map(eps => { let s = 0; for (let i = 0; i < N; i++) s += seq[i] * Math.exp(-eps * (i + 1)); return s; });
        const c2 = leastSquares(A2, sEps2);
        const c0_2 = c2[c0Index];
        const relDiff = Math.abs(c0 - c0_2) / (Math.abs(c0) + 1e-15);
        stabilityScore = Math.max(0, 1 - relDiff * 10);
    }

    // Divergent terms
    const divergentTerms = [];
    for (let j = 0; j < basisLabels.length; j++) {
        if (basisLabels[j] !== '1' && basisLabels[j] !== 'eps') {
            divergentTerms.push({ basis: basisLabels[j], coeff: coeffs[j] });
        }
    }

    // Curve data for plotting
    const curve = epsGrid.map((eps, i) => ({ eps, sEps: sEps[i], fitted: fitted[i] }));

    const warnings = [];
    if (condNum > 1e8) warnings.push(`Fit condition number is high (${condNum.toExponential(2)}). Result may be unstable.`);
    if (fitRMS > 0.1) warnings.push('Fit residual is large. Consider adjusting basis or ε range.');

    return {
        method: 'expCutoff',
        status: 'success',
        value: c0,
        stability: Math.round(stabilityScore * 100) / 100,
        notes: warnings.length > 0 ? warnings : ['stable'],
        details: { divergentTerms, fitError: fitRMS, conditionNumber: condNum, stabilityScore, curve }
    };
}

// ---- Cesàro Regularization ----
function cesaroRegularize(seq) {
    const N = seq.length;
    // Compute partial sums S_k
    const partialSums = new Float64Array(N);
    partialSums[0] = seq[0];
    for (let i = 1; i < N; i++) partialSums[i] = partialSums[i - 1] + seq[i];

    // Compute Cesàro means C_N = (1/N) Σ_{k=1}^{N} S_k
    const cesaro = new Float64Array(N);
    let cumSum = 0;
    for (let i = 0; i < N; i++) {
        cumSum += partialSums[i];
        cesaro[i] = cumSum / (i + 1);
    }

    // Convergence check on tail 10%
    const tailStart = Math.floor(N * 0.9);
    const tail = cesaro.slice(tailStart);
    let tailMean = 0;
    for (let i = 0; i < tail.length; i++) tailMean += tail[i];
    tailMean /= tail.length;

    let tailStd = 0;
    for (let i = 0; i < tail.length; i++) tailStd += (tail[i] - tailMean) ** 2;
    tailStd = Math.sqrt(tailStd / tail.length);

    // Check for linear trend in tail (polynomial divergence)
    const tailN = tail.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < tailN; i++) {
        sumX += i; sumY += tail[i]; sumXY += i * tail[i]; sumX2 += i * i;
    }
    const slope = (tailN * sumXY - sumX * sumY) / (tailN * sumX2 - sumX * sumX + 1e-30);
    const relSlope = Math.abs(slope * tailN) / (Math.abs(tailMean) + 1e-15);

    if (relSlope > 0.01 || tailStd / (Math.abs(tailMean) + 1e-15) > 0.05) {
        return {
            method: 'cesaro', status: 'not_applicable', value: null, stability: null,
            notes: ['Cesàro mean does not converge (polynomial divergence)'],
            details: { cesaro: Array.from(cesaro.slice(0, 500)), tailStd, slope }
        };
    }

    const stabilityScore = Math.max(0, Math.min(1, 1 - tailStd / (Math.abs(tailMean) + 1e-15) * 20));

    return {
        method: 'cesaro', status: 'success', value: tailMean,
        stability: Math.round(stabilityScore * 100) / 100,
        notes: ['Converged'],
        details: { cesaro: Array.from(cesaro.slice(0, 500)), tailStd, tailMean }
    };
}

// ---- Abel Regularization ----
function abelRegularize(seq) {
    const N = seq.length;
    const numPoints = 50;
    const xMin = 0.5, xMax = 1 - 1 / N;

    // Generate x grid (linear near 1)
    const xGrid = [];
    for (let i = 0; i < numPoints; i++) {
        xGrid.push(xMin + (xMax - xMin) * i / (numPoints - 1));
    }

    // Compute A(x) = Σ a_n x^n
    const aX = xGrid.map(x => {
        let s = 0, xn = x;
        for (let i = 0; i < N; i++) { s += seq[i] * xn; xn *= x; }
        return s;
    });

    // Extrapolate to x=1 using polynomial fit in (1-x)
    // Use points near x=1 for extrapolation
    const extN = Math.min(20, numPoints);
    const extX = xGrid.slice(-extN);
    const extY = aX.slice(-extN);

    // Fit: A(x) ≈ c₀ + c₁(1-x) + c₂(1-x)² + c₃(1-x)³
    const fitDeg = 3;
    const A = extX.map(x => {
        const u = 1 - x;
        const row = [];
        let p = 1;
        for (let k = 0; k <= fitDeg; k++) { row.push(p); p *= u; }
        return row;
    });

    const coeffs = leastSquares(A, extY);
    const abelValue = coeffs[0]; // c₀ = A(1)

    // Stability: try different fit degrees
    let stable = true;
    const altValues = [];
    for (const deg of [2, 4]) {
        const Am = extX.map(x => {
            const u = 1 - x;
            const row = [];
            let p = 1;
            for (let k = 0; k <= deg; k++) { row.push(p); p *= u; }
            return row;
        });
        const c = leastSquares(Am, extY);
        altValues.push(c[0]);
    }

    const maxDev = Math.max(...altValues.map(v => Math.abs(v - abelValue)));
    const relDev = maxDev / (Math.abs(abelValue) + 1e-15);
    const stabilityScore = Math.max(0, Math.min(1, 1 - relDev * 5));

    const curve = xGrid.map((x, i) => ({ x, aX: aX[i] }));

    return {
        method: 'abel', status: 'success', value: abelValue,
        stability: Math.round(stabilityScore * 100) / 100,
        notes: [relDev < 0.01 ? 'stable extrapolation' : 'moderate extrapolation uncertainty'],
        details: { curve, extrapolationDegree: fitDeg, maxDeviation: maxDev }
    };
}

// ---- Window Regularization ----
function windowRegularize(seq) {
    const N = seq.length;

    function hannWindow(t) { return t <= 0 ? 0 : t >= 1 ? 0 : 0.5 * (1 - Math.cos(2 * Math.PI * t)); }
    function blackmanWindow(t) {
        if (t <= 0 || t >= 1) return 0;
        return 0.42 - 0.5 * Math.cos(2 * Math.PI * t) + 0.08 * Math.cos(4 * Math.PI * t);
    }

    const windows = [
        { name: 'Hann', fn: hannWindow },
        { name: 'Blackman', fn: blackmanWindow }
    ];

    // Compute windowed sums at multiple N values
    const Nvals = [];
    for (let k = 6; k <= Math.log2(N); k += 0.5) Nvals.push(Math.round(2 ** k));
    if (Nvals[Nvals.length - 1] !== N) Nvals.push(N);

    const windowResults = windows.map(w => {
        const sums = Nvals.map(Nw => {
            let s = 0;
            for (let i = 0; i < Math.min(Nw, N); i++) {
                s += seq[i] * w.fn((i + 1) / Nw);
            }
            return { N: Nw, sum: s };
        });

        // Extrapolate: fit S_N^w = c₀ + c₁/N + c₂/N²
        const fitA = sums.map(s => [1, 1 / s.N, 1 / (s.N * s.N)]);
        const fitB = sums.map(s => s.sum);
        const coeffs = leastSquares(fitA, fitB);

        return { window: w.name, value: coeffs[0], sums };
    });

    const values = windowResults.map(r => r.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const maxDev = Math.max(...values.map(v => Math.abs(v - mean)));
    const relDev = maxDev / (Math.abs(mean) + 1e-15);
    const stabilityScore = Math.max(0, Math.min(1, 1 - relDev * 5));

    return {
        method: 'window', status: 'success', value: mean,
        stability: Math.round(stabilityScore * 100) / 100,
        notes: [relDev < 0.01 ? 'stable across windows' : 'mild window dependence'],
        details: { windowResults }
    };
}

// ---- Ensemble Builder ----
function buildEnsemble(results) {
    const successful = results.filter(r => r.status === 'success' && r.value !== null);
    if (successful.length === 0) {
        return { mean: null, median: null, maxDeviation: null, agreement: null };
    }

    const vals = successful.map(r => r.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    // Use exact-ish value as reference if available
    const exactish = successful.find(r => r.stability === 'exact-ish');
    const ref = exactish ? exactish.value : median;
    const maxDev = Math.max(...vals.map(v => Math.abs(v - ref)));

    let agreement;
    if (maxDev < 1e-4) agreement = 'high';
    else if (maxDev < 1e-2) agreement = 'moderate';
    else if (maxDev < 1) agreement = 'low';
    else agreement = 'split';

    return { mean, median, maxDeviation: maxDev, agreement };
}

// ---- Diagnostics Engine ----
function generateDiagnostics(results, model, Nmax) {
    const diags = [];

    // Check condition numbers
    for (const r of results) {
        if (r.details && r.details.conditionNumber > 1e8) {
            diags.push(`⚠ ${r.method}: Fit condition number is high (${r.details.conditionNumber.toExponential(2)}). Result may be unstable.`);
        }
    }

    // Skeleton confidence
    if (model && model.confidence === 'uncertain') {
        diags.push('⚠ Skeleton estimate is uncertain. Consider manual specification.');
    }
    if (!model) {
        diags.push('ℹ No quasi-polynomial skeleton detected. Hurwitz method is not applicable.');
    }

    // Inter-method disagreement
    const successful = results.filter(r => r.status === 'success' && r.value !== null);
    if (successful.length >= 2) {
        const vals = successful.map(r => r.value);
        const maxSpread = Math.max(...vals) - Math.min(...vals);
        if (maxSpread > 1e-2) {
            diags.push(`⚠ Methods disagree significantly (spread = ${maxSpread.toExponential(3)}). Check individual results.`);
        }
    }

    // Nmax warning
    if (Nmax <= 128) {
        diags.push(`⚠ Nmax=${Nmax} may be too small for reliable estimation.`);
    }

    return diags;
}

// ---- Presets ----
const PRESETS = [
    { name: 'Constant 1', expr: '1', params: '', desc: 'ζ(0) = −1/2' },
    { name: 'Natural numbers', expr: 'n', params: '', desc: 'ζ(−1) = −1/12' },
    { name: 'Square numbers', expr: 'n^2', params: '', desc: 'ζ(−2) = 0' },
    { name: 'Fractional Power', expr: 'n^1.5', params: '', desc: 'ζ(−1.5) ≈ −0.02548' },
    { name: 'Alternating', expr: '(-1)^n', params: '', desc: 'η(0) = −1/2' },
    { name: 'Residue mod 2', expr: '(n % 2 == 0) ? 1 : 0', params: '', desc: 'Residue class test' },
    { name: 'Perturbed sum', expr: 'n + 0.001*sin(n)', params: '', desc: 'Skeleton + residual' },
    { name: 'Non-polynomial', expr: 'floor(sqrt(n))', params: '', desc: 'Non quasi-polynomial' },
];

// ---- Full Analysis Runner ----
function runFullAnalysis(exprStr, paramStr, Nmax) {
    // Parse
    const params = parseParams(paramStr);
    const paramNames = Object.keys(params);
    const exprFn = parseExpression(exprStr, paramNames);

    // Step 1: Generate sequence
    const sequence = generateSequence(exprFn, params, Nmax);

    // Step 2: Model detection
    let model = fitQuasiPolynomial(sequence);
    if (!model || model.rms > 1e-2) {
        const extModel = fitExtendedSkeleton(sequence);
        if (extModel && (!model || extModel.rms < model.rms)) {
            model = extModel;
        }
    }

    let skeleton = null, residual = null, residualRMS = null;
    if (model) {
        skeleton = evaluateSkeleton(model, Nmax);
        residual = computeResidual(sequence, skeleton);
        residualRMS = rms(residual);
    }

    // Step 3: Run regularization methods
    const results = [];

    // Hurwitz
    results.push(hurwitzRegularize(model));

    // Exp Cutoff
    results.push(expCutoffRegularize(sequence, model));

    // Cesàro
    results.push(cesaroRegularize(sequence));

    // Abel
    results.push(abelRegularize(sequence));

    // Window
    results.push(windowRegularize(sequence));

    // Step 4: Ensemble
    const ensemble = buildEnsemble(results);

    // Step 5: Diagnostics
    const diagnostics = generateDiagnostics(results, model, Nmax);

    return {
        input: { expression: exprStr, params, Nmax },
        sequence: Array.from(sequence),
        modelDetection: {
            type: model ? model.type : 'none',
            confidence: model ? model.confidence : 'poor',
            period: model?.period,
            degree: model?.degree,
            exponent: model?.exponent,
            coefficients: model?.coefficients || (model?.coefficient ? [model.coefficient] : null),
            skeleton: skeleton ? Array.from(skeleton) : null,
            residual: residual ? Array.from(residual) : null,
            residualRMS,
            notes: model ? (model.type === 'extended' ? [`exponent=${model.exponent.toFixed(3)}, c=${model.coefficient.toFixed(3)}, RMS=${model.rms.toExponential(2)}`] : [`period=${model.period}, degree=${model.degree}, RMS=${model.rms.toExponential(2)}`]) : ['No skeleton detected']
        },
        results,
        ensemble,
        diagnostics,
        meta: { version: '1.0.0', generatedAt: new Date().toISOString() }
    };
}
