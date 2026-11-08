import { describe, expect, it } from 'vitest';
import { Box3, Vector3 } from 'three';
import { Fraction } from '../core';
import type { ExactMat3 } from '../core';
import { cubeVertices, matrixRank } from './det3d';

describe('3D determinant geometrisi', () => {
  it('sütun vektörlerinden sekiz köşe ve sığdırma kutusu üretir', () => {
    const vertices = cubeVertices([[3, 0, -2], [1, 11, 0], [0, 0, -4]]);
    expect(vertices).toHaveLength(8);
    expect(vertices[7]).toEqual([1, 12, -4]);
    const bounds = new Box3().setFromPoints(vertices.map(point => new Vector3(...point)));
    expect(bounds.min.toArray()).toEqual([-2, 0, -4]);
    expect(bounds.max.toArray()).toEqual([3, 12, 0]);
  });
  it.each([
    [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], 3],
    [[[1, 0, 0], [0, 1, 0], [0, 0, 0]], 2],
    [[[1, 2, 3], [2, 4, 6], [0, 0, 0]], 1],
    [[[0, 0, 0], [0, 0, 0], [0, 0, 0]], 0],
  ])('boyut kaybını kesin aritmetik ile sınıflandırır', (matrix, rank) => {
    expect(matrixRank(matrix.map(row => row.map(value => Fraction.of(value))) as ExactMat3)).toBe(rank);
  });
  it('çok küçük kesin determinantı tekil saymaz', () => {
    const small = Fraction.parse('0.000000000000000001');
    const zero = Fraction.of(0);
    expect(matrixRank([[small, zero, zero], [zero, small, zero], [zero, zero, small]])).toBe(3);
  });
});
