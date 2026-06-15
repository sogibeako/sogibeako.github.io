const fs = require('fs');
const engineCode = fs.readFileSync('engine.js', 'utf8');
eval(engineCode);

const Nmax = 4096;
const seq = new Float64Array(Nmax);
for (let i = 0; i < Nmax; i++) seq[i] = Math.pow(i + 1, 1.5);

const model = fitExtendedSkeleton(seq);
console.log("Model:", model);

const expC = expCutoffRegularize(seq, model);
console.log("ExpC:", expC);
