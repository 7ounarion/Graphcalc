import { it, expect } from 'vitest';
import { sampleCurve, sampleSurface } from './sampling';
import { compile } from './expression';
it.each([100,101,720,721])('separates 1/x branches with %s samples including off-grid poles', n => {
  const result = compile('1/x',['x']); if (!result.ok) throw new Error(result.error);
  const paths = sampleCurve(result.fn,-1,1,n);
  expect(paths.length).toBeGreaterThanOrEqual(2);
  for (const path of paths) {
    expect(path.every(([x,y]) => Number.isFinite(y) && x !== 0)).toBe(true);
    expect(path.some(([x]) => x < 0) && path.some(([x]) => x > 0)).toBe(false);
  }
});
it('does not produce negative-domain sqrt lines', () => {
  const result = compile('sqrt(x)',['x']); if (!result.ok) throw new Error(result.error);
  const paths = sampleCurve(result.fn,-1,1,101);
  expect(paths.length).toBe(1); expect(paths.flat().every(([x,y]) => x >= 0 && y >= 0)).toBe(true);
  expect(sampleCurve(() => NaN,-1,1,11)).toEqual([]);
});
it('keeps smooth lines intact, and separates gaps and large jumps', () => {
  expect(sampleCurve(x => 1e6*x,-1,1,101)).toHaveLength(1);
  expect(sampleCurve(x => x < 0 ? -1e6 : 1e6,-1,1,100).length).toBeGreaterThanOrEqual(2);
  expect(sampleCurve(x => Math.abs(x) < .2 ? NaN : x,-1,1,101)).toHaveLength(2);
});
it.each([
  ['x^10', (x: number) => x**10, -5, 5, 721],
  ['exp(x)', Math.exp, 0, 20, 721],
  ['x^6', (x: number) => x**6, -10, 10, 721],
  ['1e6*x', (x: number) => 1e6*x, -1, 1, 100],
] as const)('keeps all samples of steep continuous %s in one path', (_name, fn, lo, hi, n) => {
  const paths = sampleCurve(fn,lo,hi,n);
  expect(paths).toHaveLength(1);
  expect(paths[0]).toHaveLength(n);
});
it.each([100,101,720,721])('separates every tan pole with %s samples', n => {
  const paths = sampleCurve(Math.tan,-5,5,n);
  const poles = [-3*Math.PI/2,-Math.PI/2,Math.PI/2,3*Math.PI/2];
  expect(paths).toHaveLength(5);
  expect(paths.flat()).toHaveLength(n);
  for (const path of paths) for (const pole of poles) {
    expect(path.some(([x]) => x < pole) && path.some(([x]) => x > pole)).toBe(false);
  }
});
it('keeps each side of an even-order pole intact', () => {
  const paths = sampleCurve(x => 1/x**2,-1,1,721);
  expect(paths).toHaveLength(2);
  expect(paths.flat()).toHaveLength(720);
});
it('separates every tan pole over a wide interval', () => {
  const paths = sampleCurve(Math.tan,-20,20,721);
  const poles = Array.from({length: 12}, (_, i) => Math.PI/2+(i-6)*Math.PI);
  expect(paths).toHaveLength(poles.length+1);
  expect(paths.flat()).toHaveLength(721);
  for (const path of paths) for (const pole of poles) {
    expect(path.some(([x]) => x < pole) && path.some(([x]) => x > pole)).toBe(false);
  }
});
it.each([100,101])('separates an asymmetric even-order pole with %s samples', n => {
  const paths = sampleCurve(x => 1/x**2,-1,2,n);
  expect(paths).toHaveLength(2);
  for (const path of paths) {
    expect(path.every(([, y]) => Number.isFinite(y))).toBe(true);
    expect(path.some(([x]) => x < 0) && path.some(([x]) => x > 0)).toBe(false);
  }
});
it('returns surface grid and finite mask, catching domain errors', () => {
  const {grid,mask} = sampleSurface((x,y) => Math.sqrt(x)+y,-1,1,3);
  expect(grid).toHaveLength(3); expect(grid[0]).toHaveLength(3);
  expect(mask).toEqual([[false,true,true],[false,true,true],[false,true,true]]);
  expect(grid[2]![2]).toEqual([1,1,2]);
  expect(sampleSurface(() => { throw new Error(); },0,1,2).mask).toEqual([[false,false],[false,false]]);
});
it('rejects invalid sampling bounds and counts', () => {
  for (const [lo,hi,n] of [[1,1,10],[1,-1,10],[NaN,1,10],[0,1,1],[0,1,2.5],[0,1,2001]]) {
    expect(() => sampleCurve(x => x,lo!,hi!,n!)).toThrow();
    expect(() => sampleSurface(x => x,lo!,hi!,n!)).toThrow();
  }
});
