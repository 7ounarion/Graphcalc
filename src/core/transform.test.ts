import { it, expect } from 'vitest';
import { rotate, move, transformPoint, transformTriangle } from './transform';
import type { Vec2 } from './matrix';
it.each([[90,[-1,2]],[-90,[1,-2]],[360,[2,1]]] as [number,Vec2][])('matches v1 rotation %s', (angle,expected) => {
  rotate([2,1],angle).forEach((v,i) => expect(v).toBeCloseTo(expected[i]!,9));
});
it('matches v1 center and translation order', () => {
  expect(move([1,0],90,2,0)[0]).toBeCloseTo(2,9);
  expect(move([1,0],90,2,0,[0,0],true)[1]).toBeCloseTo(3,9);
  expect(rotate([2,1],90,[1,1])[1]).toBeCloseTo(2,9);
  const s = {x:2,y:1,angle:90,cx:1,cy:1,dx:2,dy:3,first:true};
  expect(transformPoint([2,1],s)[0]).toBeCloseTo(-2,9);
  expect(transformPoint([2,1],s)[1]).toBeCloseTo(4,9);
  const triangle = transformTriangle(s);
  expect(triangle.base).toEqual([[2,1],[4,1],[2,2.5],[2,1]]);
  expect(triangle.result).toEqual(triangle.base.map(p => transformPoint(p,s)));
  expect(triangle.result[3]).toEqual(triangle.result[0]);
});
