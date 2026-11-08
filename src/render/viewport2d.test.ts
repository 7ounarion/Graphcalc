import { expect, it } from 'vitest';
import { fitCamera, pointBounds, screenToWorld, worldToScreen } from './viewport2d';
it('preserves equal scale and round trips translated screen coordinates',() => {
  const c = {x:3,y:-2,scale:37}, p: [number,number] = [-4,6];
  const pixel = worldToScreen(p,c,800,450), result = screenToWorld(pixel,c,800,450);
  expect(result[0]).toBeCloseTo(p[0]); expect(result[1]).toBeCloseTo(p[1]);
  expect(worldToScreen([4,-2],c,800,450)[0]-400).toBe(37);
  expect(225-worldToScreen([3,-1],c,800,450)[1]).toBe(37);
});
it('fits the tall matrix image with padding in landscape and narrow views',() => {
  const points: [number,number][] = [[0,0],[3,1],[3,12],[0,11],[1,1]];
  for (const [w,h] of [[700,450],[350,230]]) {
    const camera = fitCamera(pointBounds(points),w!,h!);
    for (const p of points) { const [x,y] = worldToScreen(p,camera,w!,h!); expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(w!); expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(h!); }
  }
});
it('provides finite fit for coincident and empty geometry',() => {
  expect(Object.values(fitCamera(pointBounds([[2,2]]),800,450)).every(Number.isFinite)).toBe(true);
  expect(pointBounds([])).toEqual({minX:-5,maxX:5,minY:-5,maxY:5});
});
