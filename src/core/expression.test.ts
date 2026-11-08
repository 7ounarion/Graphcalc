import { it, expect } from 'vitest';
import { compile } from './expression';
function evaluate(text: string, ...args: number[]): number {
  const result = compile(text,['x','y']); if (!result.ok) throw new Error(result.error); return result.fn(...args);
}
it.each([['2^3^2',512],['-2^2',-4],['(-2)^2',4],['2^-2',.25],['2**3**2',512],['1+2*3-4/2',5],['sin(pi/2)+x^2',10],['(x^2-y^2)/4',1.25],['cos(π)+e-e',-1],['+2--3',5]] as const)('evaluates %s with correct precedence', (text,value) => expect(evaluate(text,3,2)).toBeCloseTo(value,9));
it.each(['alert(1)','constructor','__proto__','x.y','x[0]','__import__("os")','x.__class__','[x]','open(x)','sin(x,y)','sin()','sin','x(1)','2x','1;2','true','"x"','1e7','(1+2','1+',''])('rejects forbidden or malformed %s', text => expect(compile(text,['x']).ok).toBe(false));
it.each(['2**1000','sqrt(x)','1/0','log(0)','(-1)^0.5','exp(1000)'])('rejects invalid domain or excessive result: %s', text => expect(() => evaluate(text,-1)).toThrow());
it('implements all v1 allowed functions with radians', () => {
  const names = ['sin','cos','tan','asin','acos','atan','sqrt','exp','log','log10','sinh','cosh','tanh','abs'] as const;
  for (const name of names) expect(evaluate(`${name}(x)`,.5)).toBeCloseTo(Math[name](.5),9);
});
it('supports both variable lists and disallows prototype names even as variables', () => {
  expect(compile('y',['x']).ok).toBe(false);
  expect(compile('constructor',['constructor']).ok).toBe(false);
  expect(compile('__proto__',['__proto__']).ok).toBe(false);
  expect(compile('1+'.repeat(121)+'1').ok).toBe(false);
  expect(compile('1+'.repeat(60)+'1').ok).toBe(false);
  expect(() => evaluate('x')).toThrow();
});
