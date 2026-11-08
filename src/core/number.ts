import { Fraction } from './fraction';
export type ParseResult = { ok: true; value: number; exact: Fraction | null } | { ok: false; error: string };
export function parseNumber(text: string): ParseResult {
  try {
    const exact = Fraction.parse(text), value = exact.toNumber();
    if (!Number.isFinite(value) || exact.numerator > 10000n*exact.denominator || exact.numerator < -10000n*exact.denominator)
      return { ok: false, error: 'Sayı -10000 ile 10000 arasında olmalı.' };
    return { ok: true, value, exact };
  } catch { return { ok: false, error: 'Geçerli bir sayı gir; payda sıfır olamaz.' }; }
}
