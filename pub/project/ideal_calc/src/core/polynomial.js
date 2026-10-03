import { mod } from './finite-field.js';

// 多項式は係数の配列として表現する。 [a0, a1, a2, ...] -> a0 + a1*x + a2*x^2 + ...
// 空配列 [] は 0 を表す。

export function trim(coeffs) {
  let c = [...coeffs];
  while (c.length > 0 && c[c.length - 1] === 0) {
    c.pop();
  }
  return c;
}

export function isZero(coeffs) {
  return trim(coeffs).length === 0;
}

export function degree(coeffs) {
  return trim(coeffs).length - 1;
}

export function modInverse(a, p) {
  a = mod(a, p);
  for (let i = 1; i < p; i++) {
    if (mod(a * i, p) === 1) return i;
  }
  return 1; // Fallback, shouldn't happen for prime p and a != 0
}

export function add(A, B, p) {
  const len = Math.max(A.length, B.length);
  const result = new Array(len).fill(0);
  for (let i = 0; i < len; i++) {
    const a = A[i] || 0;
    const b = B[i] || 0;
    result[i] = mod(a + b, p);
  }
  return trim(result);
}

export function sub(A, B, p) {
  const len = Math.max(A.length, B.length);
  const result = new Array(len).fill(0);
  for (let i = 0; i < len; i++) {
    const a = A[i] || 0;
    const b = B[i] || 0;
    result[i] = mod(a - b, p);
  }
  return trim(result);
}

export function mul(A, B, p) {
  if (isZero(A) || isZero(B)) return [];
  const result = new Array(A.length + B.length - 1).fill(0);
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B.length; j++) {
      result[i + j] = mod(result[i + j] + A[i] * B[j], p);
    }
  }
  return trim(result);
}

export function divmod(A, B, p) {
  let a = trim(A);
  let b = trim(B);

  if (isZero(b)) throw new Error("Division by zero polynomial");
  if (degree(a) < degree(b)) return { q: [], r: a };

  let q = new Array(degree(a) - degree(b) + 1).fill(0);
  let r = [...a];

  const leadB = b[b.length - 1];
  const invLeadB = modInverse(leadB, p);

  while (degree(r) >= degree(b)) {
    const degDiff = degree(r) - degree(b);
    const leadR = r[r.length - 1];
    const termC = mod(leadR * invLeadB, p);

    q[degDiff] = termC;

    const termPoly = new Array(degDiff + 1).fill(0);
    termPoly[degDiff] = termC;

    const subtractPoly = mul(b, termPoly, p);
    r = sub(r, subtractPoly, p);
  }

  return { q: trim(q), r: trim(r) };
}

export function monic(A, p) {
  let a = trim(A);
  if (isZero(a)) return [];
  const leadA = a[a.length - 1];
  if (leadA === 1) return a;

  const invLeadA = modInverse(leadA, p);
  return trim(a.map(c => mod(c * invLeadA, p)));
}

export function gcd(A, B, p) {
  let a = trim(A);
  let b = trim(B);

  while (!isZero(b)) {
    const { r } = divmod(a, b, p);
    a = b;
    b = r;
  }
  return monic(a, p);
}

export function evalPoly(A, x, p) {
  let a = trim(A);
  let result = 0;
  let currentX = 1; // x^0
  for (let i = 0; i < a.length; i++) {
    result = mod(result + a[i] * currentX, p);
    currentX = mod(currentX * x, p);
  }
  return result;
}
