import { it, expect } from 'vitest';
import { conic, curve } from './conic';
import type { ConicKind } from './conic';
import { rotate } from './transform';
it.each(['Çember','Elips','Parabol','Hiperbol'] as ConicKind[])('satisfies the v1 equation and sampling for %s', kind => {
  const paths = curve(kind,3,2);
  expect(paths.length).toBe(kind === 'Hiperbol' ? 2 : 1);
  expect(paths[0]?.length).toBe(kind === 'Hiperbol' ? 481 : 721);
  for (const branch of paths) branch.forEach(([x,y],i) => {
    if (i%29 !== 0) return;
    const residual = kind === 'Çember' ? x*x+y*y-9 : kind === 'Elips' ? x*x/9+y*y/4-1 : kind === 'Parabol' ? x*x-12*y : x*x/9-y*y/4-1;
    expect(Math.abs(residual)).toBeLessThan(1e-9);
  });
  const shifted = curve(kind,3,2,2,-3,37);
  paths.forEach((branch,j) => branch.forEach((point,i) => {
    const q = rotate(point,37);
    expect(shifted[j]![i]![0]).toBeCloseTo(q[0]+2,9);
    expect(shifted[j]![i]![1]).toBeCloseTo(q[1]-3,9);
  }));
});
it('returns v1 foci, auxiliary lines and rotated coordinates', () => {
  const parabola = conic({kind:'Parabol',a:-2,b:2,h:1,k:2,angle:90});
  expect(parabola.foci[0]![0]).toBeCloseTo(3,9); expect(parabola.foci[0]![1]).toBeCloseTo(2,9);
  expect(parabola.directrices[0]![0][0]).toBeCloseTo(-1,9);
  expect(curve('Parabol',-2)[0]![0]).toEqual([-8,-8]);
  expect(conic({kind:'Elips',a:2,b:3,h:0,k:0,angle:0}).foci).toEqual([[0,-Math.sqrt(5)],[0,Math.sqrt(5)]]);
  const hyperbola = conic({kind:'Hiperbol',a:3,b:2,h:0,k:0,angle:0});
  expect(hyperbola.foci).toEqual([[-Math.hypot(3,2),0],[Math.hypot(3,2),0]]);
  expect(hyperbola.asymptotes).toEqual([[[-15,10],[15,-10]],[[-15,-10],[15,10]]]);
  expect(hyperbola.equation).toContain('\\frac{u^2}{9}-\\frac{v^2}{4}=1');
  expect(hyperbola.equation).toContain('u=(x-');
  expect(conic({kind:'Çember',a:3,b:2,h:1,k:2,angle:70}).foci).toEqual([[1,2]]);
});
it.each([[0,2],[-1,2],[1,0],[1,-1],[NaN,2],[Infinity,2]])('rejects invalid conic a=%s b=%s', (a,b) => expect(() => curve('Elips',a,b)).toThrow());
it('formats all equation parameters without floating-point noise or exponents', () => {
  const result = conic({kind:'Elips',a:0.1,b:0.3,h:1e-7,k:-1.234567,angle:12.34567});
  expect(result.equation.startsWith('\\frac{u^2}{0.01}+\\frac{v^2}{0.09}=1')).toBe(true);
  expect(result.equation).toContain('x-(0.0000001)');
  expect(result.equation).toContain('y-(-1.2346)');
  expect(result.equation).toContain('(12.346\\pi/180)');
});
