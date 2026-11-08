import { describe, it, expect } from 'vitest';
import { Fraction as F } from './fraction';
describe('Fraction', () => {
  it('converts large exact ratios without Infinity divided by Infinity', () => {
    const n = 10n**400n;
    expect(F.of(n+1n,2n*n+3n).toNumber()).toBe(0.5);
  });
  it.each([['1e3','1000'],['2.5e-3','1/400'],['-1E2','-100'],['2,5e-3','1/400'],['.125E+2','25/2']] as const)(
    'converts scientific notation %s to an exact fraction', (text,expected) => expect(F.parse(text).toString()).toBe(expected));
  it('normalizes signs, zero and gcd', () => {
    expect(F.of(6,-8).toString()).toBe('-3/4');
    expect(F.of(0,-42).toString()).toBe('0');
    expect(F.of(0,5).denominator).toBe(1n);
    expect(F.of(-9,-3).toString()).toBe('3');
    expect(() => F.of(1,0)).toThrow();
  });
  it('preserves exact decimal values and large integers', () => {
    expect(F.parse(' −0,125 ').toString()).toBe('-1/8');
    expect(F.parse('.5').toString()).toBe('1/2');
    expect(F.parse('+2/-6').toString()).toBe('-1/3');
    expect(F.parse('9007199254740993').toString()).toBe('9007199254740993');
  });
  it('performs rational arithmetic without changing operands', () => {
    const a = F.of(1,3), b = F.of(1,6);
    expect(a.add(b).toString()).toBe('1/2'); expect(a.sub(b).toString()).toBe('1/6');
    expect(a.mul(b).toString()).toBe('1/18'); expect(a.div(b).toString()).toBe('2');
    expect(a.neg().toString()).toBe('-1/3'); expect(a.toString()).toBe('1/3');
    expect(() => a.div(F.of(0))).toThrow();
  });
  it('formats and classifies', () => {
    expect(F.of(-3,4).toLatex()).toBe('-\\frac{3}{4}'); expect(F.of(2).toLatex()).toBe('2');
    expect(F.of(3,4).toNumber()).toBe(.75);
    expect([F.of(-1).sign(),F.of(0).sign(),F.of(1).sign()]).toEqual([-1,0,1]);
    expect(F.of(0).isZero()).toBe(true);
  });
  it.each(['','-','1/','1/0',',','NaN','Infinity','1/2/3','1.2.3'])('rejects %s', text => expect(() => F.parse(text)).toThrow());
});
