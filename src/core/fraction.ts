/** Immutable, normalized rational arithmetic. */
export class Fraction {
  readonly numerator: bigint;
  readonly denominator: bigint;
  private constructor(n: bigint, d: bigint) {
    if (d === 0n) throw new Error('Payda sıfır olamaz.');
    if (d < 0n) { n = -n; d = -d; }
    let a = n < 0n ? -n : n, b = d;
    while (b) [a, b] = [b, a % b];
    this.numerator = n / a; this.denominator = d / a;
    Object.freeze(this);
  }
  static of(n: bigint | number, d: bigint | number = 1n): Fraction {
    return new Fraction(BigInt(n), BigInt(d));
  }
  static parse(text: string): Fraction {
    const s = text.trim().replace(/−/g, '-').replace(',', '.');
    if (s.length > 40) throw new Error('Sayı en fazla 40 karakter olabilir.');
    if (/^[+-]?\d+\/[+-]?\d+$/.test(s)) {
      const [n, d] = s.split('/');
      return Fraction.of(BigInt(n!), BigInt(d!));
    }
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s)) throw new Error('Geçerli bir sayı gir.');
    const [mantissa = '', exponent = '0'] = s.split(/[eE]/);
    const negative = mantissa.startsWith('-');
    const unsigned = mantissa.replace(/^[+-]/, '');
    const [whole, decimal = ''] = unsigned.split('.');
    const power = BigInt(exponent) - BigInt(decimal.length);
    // Bound allocation for short inputs containing enormous exponents.
    if (power > 10000n || power < -10000n) throw new Error('Üs sınırı aşıldı.');
    const numerator = BigInt((whole || '0') + decimal) * (negative ? -1n : 1n);
    return power >= 0n ? Fraction.of(numerator * 10n ** power) : Fraction.of(numerator, 10n ** -power);
  }
  add(b: Fraction): Fraction { return Fraction.of(this.numerator*b.denominator+b.numerator*this.denominator, this.denominator*b.denominator); }
  sub(b: Fraction): Fraction { return this.add(b.neg()); }
  mul(b: Fraction): Fraction { return Fraction.of(this.numerator*b.numerator, this.denominator*b.denominator); }
  div(b: Fraction): Fraction { return Fraction.of(this.numerator*b.denominator, this.denominator*b.numerator); }
  neg(): Fraction { return Fraction.of(-this.numerator, this.denominator); }
  isZero(): boolean { return this.numerator === 0n; }
  sign(): -1 | 0 | 1 { return this.numerator < 0n ? -1 : this.numerator > 0n ? 1 : 0; }
  toNumber(): number {
    const n = Number(this.numerator), d = Number(this.denominator);
    if (Number.isFinite(n) && Number.isFinite(d)) return n/d;
    // Scale both integers before division so a huge denominator does not turn
    // a representable tiny scientific input into zero (or Infinity/Infinity).
    const ns = (this.numerator < 0n ? -this.numerator : this.numerator).toString();
    const ds = this.denominator.toString();
    const ratio = Number(`0.${ns.slice(0,17)}`) / Number(`0.${ds.slice(0,17)}`);
    return this.sign() * Number(`${ratio}e${ns.length-ds.length}`);
  }
  toString(): string { return this.denominator === 1n ? `${this.numerator}` : `${this.numerator}/${this.denominator}`; }
  toLatex(): string { return this.denominator === 1n ? `${this.numerator}` : `${this.sign() < 0 ? '-' : ''}\\frac{${this.numerator < 0n ? -this.numerator : this.numerator}}{${this.denominator}}`; }
}
