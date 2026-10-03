import { Ring } from './ring.js';
import * as Poly from '../core/polynomial.js';

export class RingFpx extends Ring {
  constructor(p, variable = 'x') {
    super({ type: "Fp[x]" });
    this.p = Number(p);
    this.variable = variable;
  }

  getZero() { return []; }
  getUnit() { return [1]; }
  
  isZero(a) { return Poly.isZero(a); }
  isUnit(a) { 
    a = Poly.trim(a);
    return a.length === 1 && a[0] !== 0; 
  }

  normalizeElement(a) {
    return Poly.monic(a, this.p);
  }

  gcd(a, b) {
    return Poly.gcd(a, b, this.p);
  }

  lcm(a, b) {
    if (Poly.isZero(a) || Poly.isZero(b)) return [];
    let prod = Poly.mul(a, b, this.p);
    let g = Poly.gcd(a, b, this.p);
    let { q } = Poly.divmod(prod, g, this.p);
    return Poly.monic(q, this.p);
  }

  multiply(a, b) {
    return Poly.monic(Poly.mul(a, b, this.p), this.p);
  }

  factor(a) {
    a = this.normalizeElement(a);
    
    if (Poly.isZero(a)) {
      return [{ prime: [], exponent: 1, isZero: true }];
    }
    if (this.isUnit(a)) {
      return [];
    }

    const result = [];
    let currentPoly = [...a];

    // Method A: Find linear factors (x - k)
    for (let k = 0; k < this.p; k++) {
      let rootVal = Poly.evalPoly(currentPoly, k, this.p);
      if (rootVal === 0) {
        let linearFactor = [this.p - k === this.p ? 0 : this.p - k, 1]; // (x - k) mod p is x + (p-k)
        linearFactor = Poly.monic(linearFactor, this.p);
        
        let exponent = 0;
        while (true) {
          let rootCheck = Poly.evalPoly(currentPoly, k, this.p);
          if (rootCheck !== 0) break;
          
          let { q, r } = Poly.divmod(currentPoly, linearFactor, this.p);
          if (!Poly.isZero(r)) break; // shouldn't happen based on eval
          
          currentPoly = q;
          exponent++;
        }
        
        if (exponent > 0) {
          result.push({ prime: linearFactor, exponent });
        }
      }
    }

    // Method B: Remaining low degree polynomials (degree 2 or 3) with no linear factors are irreducible
    if (Poly.degree(currentPoly) > 0) {
        // For degree 2 or 3, if no linear roots, it is irreducible
        if (Poly.degree(currentPoly) <= 3) {
             result.push({ prime: currentPoly, exponent: 1 });
        } else {
             // For degree >= 4, it might be reducible into degree 2 factors.
             // We do a naive fallback: just treat it as an un-factored chunk for v0.1.
             // (Ideally we would do Berlekamp or Cantor-Zassenhaus here)
             result.push({ prime: currentPoly, exponent: 1, isPartial: true });
        }
    }

    return result;
  }

  formatElement(a) {
    if (Poly.isZero(a)) return "0";
    let terms = [];
    for (let i = a.length - 1; i >= 0; i--) {
      let c = a[i];
      if (c !== 0) {
        let termStr = "";
        
        // Handling coefficient
        if (c !== 1 || i === 0) {
          termStr += c;
        }
        
        // Handling variable and power
        if (i > 0) {
          termStr += this.variable;
          if (i > 1) {
            termStr += "^" + i;
          }
        }
        terms.push(termStr);
      }
    }
    
    // Join with " + "
    return terms.join(" + ");
  }

  formatTex(a) {
    if (Poly.isZero(a)) return "0";
    let terms = [];
    for (let i = a.length - 1; i >= 0; i--) {
      let c = a[i];
      if (c !== 0) {
        let termStr = "";
        
        if (c !== 1 || i === 0) {
          termStr += c;
        }
        
        if (i > 0) {
          termStr += this.variable;
          if (i > 1) {
            termStr += "^{" + i + "}";
          }
        }
        terms.push(termStr);
      }
    }
    return terms.join(" + ");
  }
}
