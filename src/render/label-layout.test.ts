import { describe, expect, it } from 'vitest';
import { layoutLabels } from './label-layout';
import type { LabelAnchor } from './label-layout';

const anchor: LabelAnchor = { x: 200, y: 160, width: 28, height: 24, direction: { x: 1, y: 0 } };

describe('3D screen-space label layout', () => {
  it('separates six coincident axis and vector labels', () => {
    const placements = layoutLabels(Array.from({ length: 6 }, () => anchor), [], 400, 320);
    expect(placements.every(Boolean)).toBe(true);
    placements.forEach((point, index) => {
      for (const other of placements.slice(index + 1)) {
        expect(Math.abs(point!.x - other!.x) >= 38 || Math.abs(point!.y - other!.y) >= 34).toBe(true);
      }
    });
  });

  it('keeps labels clear of projected arrow shafts and end-on tips', () => {
    const arrows = [
      { start: { x: 0, y: 160 }, end: { x: 400, y: 160 } },
      { start: { x: 224, y: 184 }, end: { x: 224, y: 184 } },
    ];
    const [point] = layoutLabels([anchor], arrows, 400, 320);
    expect(point).toBeTruthy();
    expect(Math.abs(point!.y - 160)).toBeGreaterThanOrEqual(17);
    expect(Math.abs(point!.x - 224) > 19 || Math.abs(point!.y - 184) > 17).toBe(true);
  });

  it('uses the projected direction and keeps edge labels inside the viewport', () => {
    expect(layoutLabels([anchor], [], 400, 320)[0]).toEqual({ x: 224, y: 160 });
    const [point] = layoutLabels([{ ...anchor, x: 398 }], [], 400, 320);
    expect(point!.x).toBeLessThanOrEqual(377);
  });

  it('hides clipped anchors or labels without enough room', () => {
    expect(layoutLabels([{ ...anchor, x: -Infinity }], [], 400, 320)).toEqual([null]);
    expect(layoutLabels([{ ...anchor, x: 10, y: 10 }], [], 20, 20)).toEqual([null]);
  });
});
