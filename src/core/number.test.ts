import { it, expect } from 'vitest';
import { parseNumber } from './number';
it.each([['90',90],['-45',-45],['−45',-45],['360',360],['1/3',1/3],['0,5',.5],['0.5',.5],[' 2 ',2],['+2',2],['-10000',-10000],['10000',10000]] as const)('accepts %s', (text,value) => {
  const result = parseNumber(text); expect(result.ok).toBe(true);
  if (result.ok) { expect(result.value).toBe(value); expect(result.exact?.toNumber()).toBe(value); }
});
it.each(['','-','1/',',','1/0','abc','10001','-10001','NaN','Infinity','1e999','10000000000000000000000000000000000000000','10000000000000000000000000000000000000001/1'])('rejects %s safely', text => {
  const result = parseNumber(text); expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
});
it('retains exact input fractions', () => {
  const result = parseNumber('0,1'); if (!result.ok) throw new Error(result.error);
  expect(result.exact?.toString()).toBe('1/10');
});
it.each([['1e3',1000,'1000'],['2.5e-3',0.0025,'1/400'],['-1E2',-100,'-100'],
  ['2,5e-3',0.0025,'1/400'],['1e+4',10000,'10000'],['1/-3',-1/3,'-1/3'],['1/+3',1/3,'1/3']] as const)(
  'accepts %s and preserves its exact fraction', (text,value,exact) => {
    const result = parseNumber(text);
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.value).toBe(value); expect(result.exact?.toString()).toBe(exact); }
  });
it.each(['1e5','-1E5','1.00001e4','1e','1e+','e3','1e2e3','1e1.5','1e99999999999999999999'])(
  'rejects out-of-range or malformed scientific input %s', text => expect(parseNumber(text).ok).toBe(false));
it.each(['1e-310','-1.25e-310','2.5e-320'])('preserves representable tiny scientific value %s', text => {
  const result = parseNumber(text);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.value).toBe(Number(text));
});
