import { mod } from '../core/finite-field.js';

export function parsePolynomials(str, p, variable = 'x') {
  if (!str || str.trim() === '') return [];
  const parts = str.split(',').map(s => s.trim()).filter(s => s !== '');
  return parts.map(part => parseSinglePolynomial(part, p, variable));
}

function parseSinglePolynomial(str, p, variable) {
  // Simple parser: assumes form like "x^2 + 2x + 1" or "-x^3 + 5"
  // Remove all spaces
  let s = str.replace(/\s+/g, '');
  if (s === '') return [0];
  if (s === '0') return []; // Empty array represents zero
  
  // To handle leading negative signs properly when splitting by + or -
  s = s.replace(/\-/g, '+-');
  if (s.startsWith('+-')) {
      s = '-' + s.substring(2);
  } else if (s.startsWith('+')) {
      s = s.substring(1);
  }

  const terms = s.split('+').filter(t => t !== '');
  
  let maxDegree = 0;
  let termData = [];

  for (let term of terms) {
    let coeff = 1;
    let deg = 0;

    let varIndex = term.indexOf(variable);
    
    if (varIndex === -1) {
      // It's a constant
      coeff = parseInt(term, 10);
      deg = 0;
    } else {
      // Has variable
      let coeffPart = term.substring(0, varIndex);
      if (coeffPart === '') coeff = 1;
      else if (coeffPart === '-') coeff = -1;
      else coeff = parseInt(coeffPart, 10);

      let powIndex = term.indexOf('^');
      if (powIndex === -1) {
        deg = 1; // x
      } else {
        deg = parseInt(term.substring(powIndex + 1), 10); // x^n
      }
    }

    if (isNaN(coeff)) coeff = 1; // Fallback
    if (isNaN(deg)) deg = 0;

    maxDegree = Math.max(maxDegree, deg);
    termData.push({ coeff, deg });
  }

  let coeffs = new Array(maxDegree + 1).fill(0);
  for (let { coeff, deg } of termData) {
    coeffs[deg] = mod(coeffs[deg] + coeff, p);
  }

  // trim zeros
  while(coeffs.length > 0 && coeffs[coeffs.length - 1] === 0) {
      coeffs.pop();
  }

  return coeffs;
}
