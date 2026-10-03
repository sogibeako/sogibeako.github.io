import { RingZ } from './rings/ring-z.js';
import { RingFpx } from './rings/ring-fpx.js';
import { Ideal } from './core/ideal.js';
import { parseIntegers } from './parser/parse-integer.js';
import { parsePolynomials } from './parser/parse-polynomial.js';
import * as Render from './ui/render.js';
import * as Explain from './ui/explain.js';

let currentRing = null;
let currentRingType = 'Z';

function getRing() {
  const type = document.getElementById('ring-type').value;
  if (type === 'Z') {
    currentRingType = 'Z';
    return new RingZ();
  } else if (type === 'Fp[x]') {
    currentRingType = 'Fp[x]';
    const p = document.getElementById('ring-p').value;
    const v = document.getElementById('ring-var').value || 'x';
    return new RingFpx(p, v);
  }
  throw new Error(`未対応の環: ${type}`);
}

function parseIdealGenerators(inputStr, ring) {
  if (ring.type === 'Z') {
    return parseIntegers(inputStr);
  } else if (ring.type === 'Fp[x]') {
    return parsePolynomials(inputStr, ring.p, ring.variable);
  }
  return [];
}

function getIdeals() {
  const ring = getRing();
  const strI = document.getElementById('ideal-i').value;
  const strJ = document.getElementById('ideal-j').value;
  
  const gensI = parseIdealGenerators(strI, ring);
  const gensJ = parseIdealGenerators(strJ, ring);
  
  const I = new Ideal(ring, gensI);
  const J = new Ideal(ring, gensJ);
  
  return { ring, I, J };
}

function handleNormalize() {
  try {
    const { ring, I } = getIdeals();
    const explanation = Explain.explainNormalization(I, ring.type);
    
    // Formatting for display
    let inputStr = document.getElementById('ideal-i').value;
    let inputTex = `(${inputStr.split(',').map(s => s.trim()).join(', ')})`;
    // F_p[x] parsing doesn't easily return the original tex, we just show original input text wrapped
    if(ring.type === 'Fp[x]') {
        // Very basic substitution for TeX, assuming input is like "x^2 + 1"
        inputTex = `(${inputStr.replace(/\^(\d+)/g, '^{$1}')})`;
    }

    const html = Render.buildResultBlock(
      `標準化: I = ${inputTex}`,
      `I = ${I.toTex()}`,
      explanation
    );
    Render.renderResult(html);
  } catch (e) {
    Render.renderError(e.message);
  }
}

function handleAdd() {
  try {
    const { ring, I, J } = getIdeals();
    const res = I.add(J);
    const explanation = Explain.explainAdd(I, J, res, ring.type);
    
    const html = Render.buildResultBlock(
      `和: I + J`,
      `${I.toTex()} + ${J.toTex()} = ${res.toTex()}`,
      explanation
    );
    Render.renderResult(html);
  } catch (e) {
    Render.renderError(e.message);
  }
}

function handleMultiply() {
  try {
    const { ring, I, J } = getIdeals();
    const res = I.multiply(J);
    const explanation = Explain.explainMultiply(I, J, res, ring.type);
    
    const html = Render.buildResultBlock(
      `積: I \\cdot J`,
      `${I.toTex()} \\cdot ${J.toTex()} = ${res.toTex()}`,
      explanation
    );
    Render.renderResult(html);
  } catch (e) {
    Render.renderError(e.message);
  }
}

function handleIntersect() {
  try {
    const { ring, I, J } = getIdeals();
    const res = I.intersect(J);
    const explanation = Explain.explainIntersect(I, J, res, ring.type);
    
    const html = Render.buildResultBlock(
      `共通部分: I \\cap J`,
      `${I.toTex()} \\cap ${J.toTex()} = ${res.toTex()}`,
      explanation
    );
    Render.renderResult(html);
  } catch (e) {
    Render.renderError(e.message);
  }
}

function handleFactor() {
  try {
    const { ring, I } = getIdeals();
    const factors = I.factor();
    
    // Add tex string to factors for rendering
    factors.forEach(f => {
      if(ring.type === 'Z') {
         f.tex = f.prime;
      } else {
         f.tex = ring.formatTex(f.prime);
      }
    });

    const factorTex = Render.buildFactorizationTex(factors, ring.type);
    const explanation = Explain.explainFactor(I, factors, ring.type);
    
    const html = Render.buildResultBlock(
      `素イデアル分解: I`,
      `I = ${I.toTex()} = ${factorTex}`,
      explanation
    );
    Render.renderResult(html);
  } catch (e) {
    Render.renderError(e.message);
  }
}

// UI Toggles
function updateUIForRing() {
  const type = document.getElementById('ring-type').value;
  const fpxFields = document.querySelectorAll('.fpx-only');
  const presetsZ = document.getElementById('presets-z');
  const presetsFpx = document.getElementById('presets-fpx');
  
  if (type === 'Fp[x]') {
    fpxFields.forEach(el => el.style.display = 'flex');
    if (presetsZ) presetsZ.style.display = 'none';
    if (presetsFpx) presetsFpx.style.display = 'flex';
  } else {
    fpxFields.forEach(el => el.style.display = 'none');
    if (presetsZ) presetsZ.style.display = 'flex';
    if (presetsFpx) presetsFpx.style.display = 'none';
  }
}

// Global scope for presets
window.loadPreset = function(key) {
  const ringTypeSel = document.getElementById('ring-type');
  
  if (key === 'Z_12_18') {
    ringTypeSel.value = 'Z';
    document.getElementById('ideal-i').value = '12';
    document.getElementById('ideal-j').value = '18';
  } else if (key === 'Z_60') {
    ringTypeSel.value = 'Z';
    document.getElementById('ideal-i').value = '60';
    document.getElementById('ideal-j').value = '84';
  } else if (key === 'Z_coprime') {
    ringTypeSel.value = 'Z';
    document.getElementById('ideal-i').value = '14';
    document.getElementById('ideal-j').value = '15';
  } else if (key === 'Fp_x21_x1') {
    ringTypeSel.value = 'Fp[x]';
    document.getElementById('ring-p').value = '5';
    document.getElementById('ring-var').value = 'x';
    document.getElementById('ideal-i').value = 'x^2 + 1';
    document.getElementById('ideal-j').value = 'x + 1';
  } else if (key === 'Fp_factor') {
    ringTypeSel.value = 'Fp[x]';
    document.getElementById('ring-p').value = '2';
    document.getElementById('ring-var').value = 'x';
    document.getElementById('ideal-i').value = 'x^4 + x';
    document.getElementById('ideal-j').value = 'x^2 + 1';
  } else if (key === 'Fp_intersect') {
    ringTypeSel.value = 'Fp[x]';
    document.getElementById('ring-p').value = '3';
    document.getElementById('ring-var').value = 'x';
    document.getElementById('ideal-i').value = 'x^2 - 1';
    document.getElementById('ideal-j').value = 'x^2 + x';
  }
  updateUIForRing();
  
  // Flash effect
  const card = document.querySelectorAll('.card')[1];
  card.style.borderColor = 'var(--accent2)';
  setTimeout(() => card.style.borderColor = 'var(--border)', 300);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ring-type').addEventListener('change', updateUIForRing);
  
  document.getElementById('btn-normalize').addEventListener('click', handleNormalize);
  document.getElementById('btn-add').addEventListener('click', handleAdd);
  document.getElementById('btn-mul').addEventListener('click', handleMultiply);
  document.getElementById('btn-intersect').addEventListener('click', handleIntersect);
  document.getElementById('btn-factor').addEventListener('click', handleFactor);
  
  updateUIForRing();
});
