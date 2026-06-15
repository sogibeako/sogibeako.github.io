const fs = require('fs');

// Create a pseudo-DOM for testing
const JSDOM = require('jsdom').JSDOM;
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Float64Array = Float64Array;
global.Math = Math;

const engineCode = fs.readFileSync('engine.js', 'utf8');
eval(engineCode);

const Nmax = 4096;
const seq = new Float64Array(Nmax);
for (let i = 0; i < Nmax; i++) seq[i] = Math.pow(i + 1, 1.5);

const model = fitExtendedSkeleton(seq);
console.log("Model:", model);

if (model) {
    const hurwitz = hurwitzRegularize(model);
    console.log("Hurwitz:", hurwitz);

    const expC = expCutoffRegularize(seq, model);
    console.log("ExpCutoff:", expC);
}
