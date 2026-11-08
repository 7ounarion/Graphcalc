/** Five significant digits, expanded decimal notation, without trailing fractional zeros. */
export function formatNumber(x: number): string {
  if (!Number.isFinite(x)) return String(x);
  if (x === 0) return '0';
  const [mantissa = '', exponent = '0'] = x.toExponential(4).split('e');
  const negative = mantissa.startsWith('-');
  const digits = mantissa.replace('-', '').replace('.', '');
  const point = 1 + Number(exponent);
  let result = point <= 0 ? `0.${'0'.repeat(-point)}${digits}`
    : point >= digits.length ? digits + '0'.repeat(point-digits.length)
    : `${digits.slice(0,point)}.${digits.slice(point)}`;
  if (result.includes('.')) result = result.replace(/0+$/, '').replace(/\.$/, '');
  return (negative ? '-' : '') + result;
}
