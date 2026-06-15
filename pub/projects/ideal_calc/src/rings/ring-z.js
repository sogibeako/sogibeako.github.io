import { Ring } from './ring.js';
import { normalizeBigInt, gcdBigInt, lcmBigInt } from '../core/integer.js';

export class RingZ extends Ring {
  constructor() {
    super({ type: "Z" });
  }

  getZero() { return 0n; }
  getUnit() { return 1n; }
  isZero(a) { return this.normalizeElement(a) === 0n; }
  isUnit(a) { return this.normalizeElement(a) === 1n; }

  normalizeElement(a) {
    return normalizeBigInt(a);
  }

  gcd(a, b) {
    return gcdBigInt(a, b);
  }

  lcm(a, b) {
    return lcmBigInt(a, b);
  }

  multiply(a, b) {
    return this.normalizeElement(BigInt(a) * BigInt(b));
  }

  factor(n) {
    n = this.normalizeElement(n);

    if (n === 0n) {
      return [{ prime: "0", exponent: 1, isZero: true }];
    }
    if (n === 1n) {
      return [];
    }

    const result = [];
    let d = 2n;

    // Simple trial division for v0.1
    // Number() conversion is safe for reasonably small inputs usually tested here
    // For large primes, this would be slow.
    while (d * d <= n) {
      let exponent = 0;
      while (n % d === 0n) {
        n /= d;
        exponent++;
      }
      if (exponent > 0) {
        result.push({ prime: d.toString(), exponent });
      }
      d++;
      
      // Safety break to prevent browser hang for huge numbers
      if (d > 10000000n) {
        if (n > 1n) {
          result.push({ prime: n.toString(), exponent: 1, isPartial: true });
          n = 1n;
        }
        break;
      }
    }

    if (n > 1n) {
      result.push({ prime: n.toString(), exponent: 1 });
    }

    return result;
  }

  formatElement(a) {
    return String(a);
  }
}
