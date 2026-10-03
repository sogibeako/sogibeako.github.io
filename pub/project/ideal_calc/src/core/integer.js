export function normalizeBigInt(a) {
  const bigA = BigInt(a);
  return bigA < 0n ? -bigA : bigA;
}

export function gcdBigInt(a, b) {
  let x = normalizeBigInt(a);
  let y = normalizeBigInt(b);

  while (y !== 0n) {
    let temp = y;
    y = x % y;
    x = temp;
  }
  return x;
}

export function lcmBigInt(a, b) {
  let x = normalizeBigInt(a);
  let y = normalizeBigInt(b);
  if (x === 0n || y === 0n) return 0n;
  return (x / gcdBigInt(x, y)) * y;
}
