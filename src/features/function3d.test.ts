import { describe, expect, it } from 'vitest';
import { sampleSurface } from '../core';
import { surfaceGeometry } from './function3d';

describe('3D yüzey geometrisi', () => {
  it.each([1, -1])('kutup yakınındaki uç yükseklikleri kadraj ve ağda sınırlar (%s)', sign => {
    const samples = sampleSurface((x, y) => sign / (x * x + y * y), -1, 1, 81);
    const geometry = surfaceGeometry(samples);
    expect(geometry.userData.clipped).toBe(true);
    const bounds = geometry.boundingBox!;
    expect(Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z))).toBeLessThan(50);
    expect(bounds.max.z - bounds.min.z).toBeGreaterThan(10);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      expect(positions.getZ(i)).toBeGreaterThanOrEqual(bounds.min.z);
      expect(positions.getZ(i)).toBeLessThanOrEqual(bounds.max.z);
    }
    expect(samples.mask[40]![40]).toBe(false);
    expect(Math.abs(samples.grid[40]![41]![2])).toBeGreaterThan(1000);
    geometry.dispose();
  });
  it('iki üçgeni pozitif z yönünde indeksler', () => {
    const geometry = surfaceGeometry(sampleSurface(() => 2, -1, 1, 2));
    expect(geometry.index!.count).toBe(6);
    const normals = geometry.getAttribute('normal');
    for (let i = 0; i < normals.count; i++) expect(normals.getZ(i)).toBeCloseTo(1);
    expect(geometry.boundingBox!.min.toArray()).toEqual([-1, -1, 2]);
    expect(geometry.boundingBox!.max.toArray()).toEqual([1, 1, 2]);
    expect(geometry.userData.clipped).toBe(false);
    geometry.dispose();
  });
  it('maskelenmiş ve sonlu olmayan noktaları üçgenlere katmaz', () => {
    const samples = sampleSurface((x, y) => x === 10 && y === 10 ? NaN : 7, 10, 12, 2);
    const geometry = surfaceGeometry(samples);
    expect(geometry.index!.count).toBe(3);
    expect(geometry.getAttribute('position').count).toBe(3);
    expect(geometry.boundingBox!.min.toArray()).toEqual([10, 10, 7]);
    expect([...geometry.getAttribute('position').array].every(Number.isFinite)).toBe(true);
    samples.mask[1]![1] = false;
    const empty = surfaceGeometry(samples);
    expect(empty.index!.count).toBe(0);
    expect(empty.boundingBox!.isEmpty()).toBe(true);
    geometry.dispose(); empty.dispose();
  });
  it('1/x yüzeyinde tanımsız sütunun üzerinden üçgen bağlamaz', () => {
    const geometry = surfaceGeometry(sampleSurface(x => 1 / x, -1, 1, 5));
    const positions = geometry.getAttribute('position');
    const indices = geometry.index!;
    for (let i = 0; i < indices.count; i += 3) {
      const xs = [0, 1, 2].map(offset => positions.getX(indices.getX(i + offset)));
      expect(xs.every(x => x < 0) || xs.every(x => x > 0)).toBe(true);
    }
    geometry.dispose();
  });
  it('boş örnekler ve GPU sınırını aşan sayılar sonlu tamponlar üretir', () => {
    for (const samples of [{ grid: [], mask: [] }, sampleSurface(() => 1e100, -1, 1, 2)]) {
      const geometry = surfaceGeometry(samples);
      expect(geometry.index!.count).toBe(0);
      expect(geometry.boundingBox!.isEmpty()).toBe(true);
      geometry.dispose();
    }
  });
});
