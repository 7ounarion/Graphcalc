import { it, expect } from 'vitest';
import { Fraction as F } from './fraction';
import { det2, det3, det2Exact, det3Exact, apply2, apply3, lerpFromIdentity } from './matrix';
import type { ExactMat2, ExactMat3, Mat2, Mat3 } from './matrix';
it('computes exact 2x2 and 3x3 determinants', () => {
  expect(det2Exact([[F.of(1,2),F.of(1,3)],[F.of(1,4),F.of(1,5)]]).toString()).toBe('1/60');
  expect(det3Exact([[F.of(1,2),F.of(0),F.of(0)],[F.of(0),F.of(1,3),F.of(0)],[F.of(0),F.of(0),F.of(1,4)]]).toString()).toBe('1/24');
  expect(det3Exact([[F.of(1),F.of(2),F.of(3)],[F.of(2),F.of(4),F.of(6)],[F.of(7),F.of(8),F.of(9)]]).toString()).toBe('0');
});
it('matches independent Leibniz expansion on 60 deterministic rational matrices (v1)', () => {
  let seed = 5;
  const rand = (n: number) => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed%n; };
  const permutations = (values: number[]): number[][] => values.length === 0 ? [[]] : values.flatMap((v,i) => permutations(values.filter((_,j) => j !== i)).map(p => [v,...p]));
  for (const n of [2,3]) for (let trial = 0; trial < 30; trial++) {
    const a = Array.from({length:n},() => Array.from({length:n},() => F.of(rand(11)-5,rand(5)+1)));
    let expected = F.of(0);
    for (const perm of permutations(Array.from({length:n},(_,i) => i))) {
      let term = F.of(1), inversions = 0;
      for (let i = 0; i < n; i++) {
        term = term.mul(a[i]![perm[i]!]!);
        for (let j = i+1; j < n; j++) if (perm[i]! > perm[j]!) inversions++;
      }
      expected = expected.add(inversions%2 ? term.neg() : term);
    }
    const actual = n === 2 ? det2Exact(a as ExactMat2) : det3Exact(a as ExactMat3);
    expect(actual.toString()).toBe(expected.toString());
    const floats = a.map(r => r.map(v => v.toNumber()));
    expect(n === 2 ? det2(floats as Mat2) : det3(floats as Mat3)).toBeCloseTo(expected.toNumber(),9);
  }
});
it('acts on column vectors and interpolates from identity', () => {
  expect(apply2([[3,0],[1,11]],[1,0])).toEqual([3,1]);
  expect(apply3([[1,2,3],[4,5,6],[7,8,9]],[1,2,3])).toEqual([14,32,50]);
  const a: Mat2 = [[2,1],[0,2]];
  expect(lerpFromIdentity(a,0)).toEqual([[1,0],[0,1]]);
  expect(lerpFromIdentity(a,1)).toEqual(a);
  expect(lerpFromIdentity(a,.5)).toEqual([[1.5,.5],[0,1.5]]);
  expect(lerpFromIdentity([[2,0,0],[0,2,0],[0,0,2]],.5)).toEqual([[1.5,0,0],[0,1.5,0],[0,0,1.5]]);
});
