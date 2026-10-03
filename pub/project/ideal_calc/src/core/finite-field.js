export function mod(a, p) {
  // JavaScript's % operator can return negative numbers, so we handle it:
  return ((Number(a) % Number(p)) + Number(p)) % Number(p);
}
