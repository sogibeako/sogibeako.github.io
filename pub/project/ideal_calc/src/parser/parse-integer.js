export function parseIntegers(str) {
  if (!str || str.trim() === '') return [];
  const parts = str.split(',').map(s => s.trim()).filter(s => s !== '');
  return parts.map(p => {
    try {
      return BigInt(p);
    } catch(e) {
      throw new Error(`無効な整数入力: "${p}"`);
    }
  });
}
